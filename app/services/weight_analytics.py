"""
Weight analytics service.
All math lives here — routers just call these functions.
"""
from __future__ import annotations

import math
import statistics
from datetime import date, timedelta
from typing import Optional

# ─── CONSTANTS ────────────────────────────────────────────────────────────────

BMI_CATEGORIES = [
    (0,    18.5, "Дефицит массы тела",   "blue",    "WHO 2000"),
    (18.5, 25.0, "Нормальная масса",     "green",   "WHO 2000"),
    (25.0, 30.0, "Избыточная масса",     "yellow",  "WHO 2000"),
    (30.0, 35.0, "Ожирение I степени",   "orange",  "WHO 2000"),
    (35.0, 40.0, "Ожирение II степени",  "red",     "WHO 2000"),
    (40.0, 999,  "Ожирение III степени", "darkred", "WHO 2000"),
]

SAFE_LOSS_MIN_KG_WEEK     = 0.25
SAFE_LOSS_MAX_KG_WEEK     = 1.0
SAFE_LOSS_OPTIMAL_KG_WEEK = 0.5
PLATEAU_DAYS              = 14
MIN_LOGS_FOR_FORECAST     = 5
WHTR_RISK_THRESHOLD       = 0.5
WHR_RISK_MALE             = 0.9
WHR_RISK_FEMALE           = 0.85

# ─── BMI ──────────────────────────────────────────────────────────────────────

def calc_bmi(weight_kg: float, height_cm: float) -> float:
    h = height_cm / 100
    return round(weight_kg / (h * h), 1)


def get_bmi_category(bmi: float) -> dict:
    for lo, hi, name, color, source in BMI_CATEGORIES:
        if lo <= bmi < hi:
            return {"name": name, "color": color, "source": source, "range": f"{lo}–{hi}"}
    return {"name": "Ожирение III степени", "color": "darkred", "source": "WHO 2000", "range": "40+"}


def bmi_normal_weight_range(height_cm: float) -> dict:
    h = height_cm / 100
    return {"min_kg": round(18.5 * h * h, 1), "max_kg": round(24.9 * h * h, 1)}


# ─── IDEAL WEIGHT ─────────────────────────────────────────────────────────────

def calc_ideal_weight(height_cm: float, gender: str) -> dict:
    """Devine 1974, Robinson 1983, Miller 1983."""
    h_inches = height_cm / 2.54
    extra = max(0, h_inches - 60)
    if gender == "male":
        devine, robinson, miller = 50.0 + 2.3 * extra, 52.0 + 1.9 * extra, 56.2 + 1.41 * extra
    else:
        devine, robinson, miller = 45.5 + 2.3 * extra, 49.0 + 1.7 * extra, 53.1 + 1.36 * extra
    vals = [devine, robinson, miller]
    return {
        "devine_kg":   round(devine, 1),
        "robinson_kg": round(robinson, 1),
        "miller_kg":   round(miller, 1),
        "mean_kg":     round(statistics.mean(vals), 1),
        "min_kg":      round(min(vals), 1),
        "max_kg":      round(max(vals), 1),
        "sources":     ["Devine 1974", "Robinson 1983", "Miller 1983"],
    }


# ─── LINEAR REGRESSION ────────────────────────────────────────────────────────

def linear_regression(xs: list, ys: list) -> tuple:
    n = len(xs)
    if n < 2:
        return 0.0, ys[0] if ys else 0.0
    mx, my = sum(xs) / n, sum(ys) / n
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    den = sum((x - mx) ** 2 for x in xs)
    slope = num / den if den else 0.0
    return slope, my - slope * mx


# ─── FORECAST ─────────────────────────────────────────────────────────────────

def calc_forecast(logs: list, target_weight_kg: float) -> dict | None:
    if len(logs) < MIN_LOGS_FOR_FORECAST:
        return None
    sorted_logs = sorted(logs, key=lambda l: l.logged_at)
    base_date = sorted_logs[0].logged_at.date()
    xs = [(l.logged_at.date() - base_date).days for l in sorted_logs]
    ys = [l.weight_kg for l in sorted_logs]
    slope, _ = linear_regression(xs, ys)
    current = ys[-1]
    kg_per_week = slope * 7

    if slope >= 0 or current <= target_weight_kg:
        return {
            "possible": False,
            "reason": "Цель уже достигнута" if current <= target_weight_kg else "Нет прогресса",
            "kg_per_week": round(kg_per_week, 2),
        }

    def days_to_goal(mult: float):
        adj = slope * mult
        if adj >= 0:
            return None
        return max(0, int((target_weight_kg - current) / adj))

    today = date.today()

    def goal_date(days):
        return (today + timedelta(days=days)).isoformat() if days is not None else None

    dr, do, dp = days_to_goal(1.0), days_to_goal(1.2), days_to_goal(0.8)
    return {
        "possible":    True,
        "kg_per_week": round(kg_per_week, 2),
        "rate_status": _rate_status(abs(kg_per_week)),
        "realistic":   {"days": dr, "date": goal_date(dr)},
        "optimistic":  {"days": do, "date": goal_date(do)},
        "pessimistic": {"days": dp, "date": goal_date(dp)},
        "source":      "Linear regression on weight logs",
    }


def _rate_status(kg_per_week: float) -> dict:
    if kg_per_week < SAFE_LOSS_MIN_KG_WEEK:
        return {"code": "slow",    "label": "Медленный темп",   "color": "blue",  "source": "WHO"}
    if kg_per_week <= SAFE_LOSS_MAX_KG_WEEK:
        return {"code": "optimal", "label": "Оптимальный темп", "color": "green", "source": "AHA / WHO"}
    return     {"code": "fast",    "label": "Слишком быстро",   "color": "red",   "source": "AHA"}


# ─── CHART DATA ────────────────────────────────────────────────────────────────

def calc_sma(values: list, window: int) -> list:
    result = []
    for i, v in enumerate(values):
        if i < window - 1:
            result.append(None)
        else:
            result.append(round(sum(values[i - window + 1: i + 1]) / window, 2))
    return result


def build_chart_data(logs: list, milestones: list = None) -> list:
    if not logs:
        return []
    sl = sorted(logs, key=lambda l: l.logged_at)
    dates   = [l.logged_at.date().isoformat() for l in sl]
    weights = [l.weight_kg for l in sl]
    sma7    = calc_sma(weights, 7)
    sma14   = calc_sma(weights, 14)
    ms_map  = {}
    if milestones:
        for m in milestones:
            if m.get("achieved") and m.get("achieved_date"):
                ms_map[m["achieved_date"]] = m["label"]
    return [
        {"date": dates[i], "weight": weights[i], "sma7": sma7[i], "sma14": sma14[i], "milestone": ms_map.get(dates[i])}
        for i in range(len(dates))
    ]


# ─── EXTENDED STATS ───────────────────────────────────────────────────────────

def calc_extended_stats(logs: list, target_weight_kg: float | None) -> dict:
    if not logs:
        return {}
    sl      = sorted(logs, key=lambda l: l.logged_at)
    weights = [l.weight_kg for l in sl]
    dates   = [l.logged_at.date() for l in sl]
    current, start = weights[-1], weights[0]
    today   = date.today()

    wk  = [l.weight_kg for l in sl if l.logged_at.date() >= today - timedelta(days=7)]
    mo  = [l.weight_kg for l in sl if l.logged_at.date() >= today - timedelta(days=30)]
    dw  = round(wk[-1] - wk[0], 2)  if len(wk)  >= 2 else None
    dm  = round(mo[-1] - mo[0], 2)  if len(mo)  >= 2 else None

    xs = [(d - dates[0]).days for d in dates]
    slope, _ = linear_regression(xs, weights) if len(sl) >= 2 else (0, 0)

    day_ch = [abs(weights[i] - weights[i-1]) for i in range(1, len(weights))]
    volatility = round(statistics.mean(day_ch), 2) if day_ch else 0

    recent = [l for l in sl if l.logged_at.date() >= today - timedelta(days=PLATEAU_DAYS)]
    on_plateau = False
    if len(recent) >= 3:
        rw = [l.weight_kg for l in recent]
        on_plateau = (max(rw) - min(rw)) < 0.5

    goal_pct = None
    if target_weight_kg and start and current:
        total = start - target_weight_kg
        if total > 0:
            goal_pct = round(min(100, max(0, (start - current) / total * 100)), 1)

    return {
        "current_weight_kg":  current,
        "start_weight_kg":    start,
        "target_weight_kg":   target_weight_kg,
        "min_weight_kg":      round(min(weights), 2),
        "max_weight_kg":      round(max(weights), 2),
        "avg_weight_kg":      round(statistics.mean(weights), 2),
        "delta_total_kg":     round(current - start, 2),
        "delta_week_kg":      dw,
        "delta_month_kg":     dm,
        "kg_per_week":        round(slope * 7, 3),
        "volatility_kg":      volatility,
        "on_plateau":         on_plateau,
        "plateau_days":       PLATEAU_DAYS,
        "goal_progress_pct":  goal_pct,
        "weighing_streak":    _weighing_streak(dates),
        "total_logs":         len(logs),
        "predicted_goal_date": None,
    }


def _weighing_streak(dates: list) -> int:
    if not dates:
        return 0
    sd = sorted(set(dates), reverse=True)
    today = date.today()
    streak, expected = 0, today
    for d in sd:
        if d == expected:
            streak += 1
            expected -= timedelta(days=1)
        else:
            break
    return streak


# ─── MILESTONES ───────────────────────────────────────────────────────────────

def build_milestones(start_weight_kg, current_weight_kg, target_weight_kg,
                     height_cm, gender, logs, forecast) -> list:
    ms = []
    sl = sorted(logs, key=lambda l: l.logged_at)

    def first_reached(target_w):
        for l in sl:
            if l.weight_kg <= target_w:
                return l.logged_at.date().isoformat()
        return None

    def forecast_date_for(goal_w):
        if not forecast or not forecast.get("possible"):
            return None
        rate = abs(forecast.get("kg_per_week", 0))
        if rate <= 0:
            return None
        remaining = current_weight_kg - goal_w
        if remaining <= 0:
            return None
        days = int(remaining / rate * 7)
        return (date.today() + timedelta(days=days)).isoformat()

    for kg in [1, 3, 5, 10, 15, 20]:
        goal_w = round(start_weight_kg - kg, 1)
        if goal_w < (target_weight_kg or 0) - 1:
            continue
        achieved = current_weight_kg <= goal_w
        ms.append({
            "code": f"minus_{kg}kg", "label": f"−{kg} кг",
            "description": f"Сбросить {kg} кг от стартового веса",
            "target_weight": goal_w, "achieved": achieved,
            "achieved_date": first_reached(goal_w) if achieved else None,
            "forecast_date": forecast_date_for(goal_w) if not achieved else None,
            "source": "Relative to start weight",
        })

    if height_cm:
        bmi_r = bmi_normal_weight_range(height_cm)
        bt = bmi_r["max_kg"]
        if start_weight_kg > bt:
            achieved = current_weight_kg <= bt
            ms.append({
                "code": "bmi_normal", "label": "Нормальный ИМТ",
                "description": f"Достичь ИМТ < 25 ({bt} кг)",
                "target_weight": bt, "achieved": achieved,
                "achieved_date": first_reached(bt) if achieved else None,
                "forecast_date": forecast_date_for(bt) if not achieved else None,
                "source": "WHO BMI classification",
            })

    if height_cm and gender:
        ideal = calc_ideal_weight(height_cm, gender)
        it = ideal["mean_kg"]
        if start_weight_kg > it:
            achieved = current_weight_kg <= it
            ms.append({
                "code": "ideal_weight", "label": "Идеальный вес",
                "description": f"Достичь {it} кг по формулам",
                "target_weight": it, "achieved": achieved,
                "achieved_date": first_reached(it) if achieved else None,
                "forecast_date": forecast_date_for(it) if not achieved else None,
                "source": "Devine / Robinson / Miller",
            })

    if target_weight_kg:
        achieved = current_weight_kg <= target_weight_kg
        ms.append({
            "code": "user_goal", "label": "Моя цель",
            "description": f"Достичь {target_weight_kg} кг",
            "target_weight": target_weight_kg, "achieved": achieved,
            "achieved_date": first_reached(target_weight_kg) if achieved else None,
            "forecast_date": (forecast or {}).get("realistic", {}).get("date") if not achieved else None,
            "source": "User defined",
        })

    return ms


# ─── WEEKLY SUMMARY ───────────────────────────────────────────────────────────

def calc_weekly_summary(logs: list) -> dict:
    today = date.today()
    ws = today - timedelta(days=today.weekday())
    lws = ws - timedelta(days=7)

    def stats(wl):
        if not wl:
            return {"avg": None, "min": None, "max": None, "count": 0, "best_day": None}
        wts = [l.weight_kg for l in wl]
        best = min(wl, key=lambda l: l.weight_kg)
        return {
            "avg": round(statistics.mean(wts), 2), "min": round(min(wts), 2),
            "max": round(max(wts), 2), "count": len(wl),
            "best_day": best.logged_at.date().isoformat(),
        }

    this_w = [l for l in logs if l.logged_at.date() >= ws]
    last_w = [l for l in logs if lws <= l.logged_at.date() < ws]
    t, p   = stats(this_w), stats(last_w)
    delta  = round(t["avg"] - p["avg"], 2) if t["avg"] and p["avg"] else None

    return {"this_week": t, "last_week": p, "delta_vs_last_week": delta, "week_start": ws.isoformat()}


# ─── RECOMMENDATIONS ──────────────────────────────────────────────────────────

def build_recommendations(stats: dict, bmi: float | None) -> list:
    recs = []
    kpw = stats.get("kg_per_week", 0)
    plateau = stats.get("on_plateau", False)

    if plateau:
        recs.append({"code": "plateau", "level": "warning", "title": "Плато",
            "text": "Вес не меняется больше 2 недель. Попробуй скорректировать питание или добавить нагрузку.",
            "source": "Mayo Clinic"})

    if kpw < 0 and abs(kpw) > SAFE_LOSS_MAX_KG_WEEK:
        recs.append({"code": "too_fast", "level": "danger", "title": "Слишком быстрое снижение",
            "text": f"Ты теряешь {abs(kpw):.2f} кг/нед — выше нормы 1 кг/нед. Риск потери мышц и нутриентов.",
            "source": "AHA Guidelines; WHO 2000"})
    elif kpw < 0 and abs(kpw) < SAFE_LOSS_MIN_KG_WEEK:
        recs.append({"code": "too_slow", "level": "info", "title": "Медленный темп",
            "text": f"Темп {abs(kpw):.2f} кг/нед очень низкий. Оптимально — 0.5–1 кг/нед.",
            "source": "WHO"})
    elif kpw < 0:
        recs.append({"code": "optimal", "level": "success", "title": "Оптимальный темп",
            "text": f"Темп {abs(kpw):.2f} кг/нед — отлично! Продолжай.",
            "source": "WHO / AHA"})

    if bmi and bmi >= 30:
        recs.append({"code": "bmi_high", "level": "warning", "title": "Высокий ИМТ",
            "text": "ИМТ выше 30 — ожирение по ВОЗ. Рекомендуется снизить до 18.5–24.9.",
            "source": "WHO BMI classification 2000"})

    if not recs:
        recs.append({"code": "on_track", "level": "success", "title": "Всё идёт хорошо",
            "text": "Продолжай вести дневник — регулярность важнее скорости.", "source": ""})

    return recs


# ─── BODY RATIOS ─────────────────────────────────────────────────────────────

def calc_body_ratios(waist_cm, hip_cm, height_cm, gender) -> dict:
    result = {}
    if waist_cm and height_cm:
        whtr = round(waist_cm / height_cm, 3)
        result["whtr"] = {
            "value": whtr, "threshold": WHTR_RISK_THRESHOLD,
            "risk": whtr > WHTR_RISK_THRESHOLD,
            "label": "Высокий кардиориск" if whtr > WHTR_RISK_THRESHOLD else "Норма",
            "source": "Ashwell & Hsieh 2005",
        }
    if waist_cm and hip_cm and gender:
        whr = round(waist_cm / hip_cm, 3)
        thr = WHR_RISK_MALE if gender == "male" else WHR_RISK_FEMALE
        result["whr"] = {
            "value": whr, "threshold": thr, "risk": whr > thr,
            "label": "Высокий риск" if whr > thr else "Норма",
            "source": "WHO 2008",
        }
    return result
