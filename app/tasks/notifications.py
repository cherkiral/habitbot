from app.tasks.celery_app import celery_app


@celery_app.task
def check_streaks():
    import asyncio
    from app.core.database import AsyncSessionLocal
    from app.models.user import User
    from sqlalchemy import select

    async def _run():
        async with AsyncSessionLocal() as db:
            users = (await db.execute(select(User).where(User.is_active == True))).scalars().all()
            from app.services.streak import check_and_award_achievements
            for user in users:
                await check_and_award_achievements(db, user.id)

    asyncio.run(_run())


@celery_app.task
def send_weekly_reports():
    pass


@celery_app.task
def send_telegram_notification(user_id: str, message: str):
    pass