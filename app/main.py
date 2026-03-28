import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import auth, users, weight, activity, food, streak

logger = structlog.get_logger()

app = FastAPI(
    title="HabitBot API",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(weight.router, prefix="/api")
app.include_router(activity.router, prefix="/api")
app.include_router(food.router, prefix="/api")
app.include_router(streak.router, prefix="/api")


@app.on_event("startup")
async def startup():
    logger.info("Starting HabitBot API", environment=settings.ENVIRONMENT)
    from app.core.database import AsyncSessionLocal
    from app.services.streak import seed_achievements
    async with AsyncSessionLocal() as db:
        await seed_achievements(db)
    logger.info("Achievements seeded")


@app.on_event("shutdown")
async def shutdown():
    logger.info("Shutting down HabitBot API")


@app.get("/api/health")
async def health():
    return {"status": "ok", "environment": settings.ENVIRONMENT}