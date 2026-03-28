"""Seed script — run after migrations to populate initial data."""
import asyncio
from app.core.database import AsyncSessionLocal
from app.services.streak import seed_achievements


async def main():
    async with AsyncSessionLocal() as db:
        await seed_achievements(db)
    print("Achievements seeded successfully")


if __name__ == "__main__":
    asyncio.run(main())