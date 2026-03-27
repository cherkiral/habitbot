from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "habitbot",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.notifications"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "check-streaks-midnight": {
            "task": "app.tasks.notifications.check_streaks",
            "schedule": 86400.0,
        },
        "send-weekly-reports": {
            "task": "app.tasks.notifications.send_weekly_reports",
            "schedule": 604800.0,
        },
    },
)
