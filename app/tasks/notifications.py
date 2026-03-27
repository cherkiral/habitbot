from app.tasks.celery_app import celery_app


@celery_app.task
def check_streaks():
    pass


@celery_app.task
def send_weekly_reports():
    pass


@celery_app.task
def send_telegram_notification(user_id: str, message: str):
    pass
