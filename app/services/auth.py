import uuid
from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models.user import User, UserProfile


async def register_user(db: AsyncSession, email: str, password: str, username: str | None) -> User:
    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=email,
        password_hash=hash_password(password),
        username=username,
    )
    db.add(user)
    await db.flush()

    profile = UserProfile(user_id=user.id)
    db.add(profile)
    await db.commit()
    await db.refresh(user)
    return user


async def login_user(db: AsyncSession, email: str, password: str) -> User:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    return user


async def get_current_user(db: AsyncSession, token: str) -> User:
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise ValueError("Wrong token type")
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return user


async def refresh_access_token(redis, refresh_token: str) -> str:
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError("Wrong token type")
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    is_blacklisted = await redis.get(f"blacklist:{refresh_token}")
    if is_blacklisted:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
        )

    return create_access_token(user_id)


async def logout_user(redis, refresh_token: str) -> None:
    try:
        payload = decode_token(refresh_token)
        exp = payload.get("exp", 0)
    except Exception:
        return

    import time
    ttl = max(int(exp - time.time()), 0)
    if ttl > 0:
        await redis.setex(f"blacklist:{refresh_token}", ttl, "1")
