from fastapi import APIRouter, Depends, Response, Cookie, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.redis import get_redis
from app.core.security import create_access_token, create_refresh_token
from app.core.config import settings
from app.schemas.user import UserRegister, UserLogin, TokenResponse, UserResponse
from app.services.auth import register_user, login_user, refresh_access_token, logout_user

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE = "refresh_token"
COOKIE_MAX_AGE = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(
    body: UserRegister,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    user = await register_user(db, body.email, body.password, body.username)

    refresh_token = create_refresh_token(str(user.id))
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=refresh_token,
        httponly=True,
        secure=settings.ENVIRONMENT != "development",
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
    )
    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    body: UserLogin,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    user = await login_user(db, body.email, body.password)

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))

    response.set_cookie(
        key=REFRESH_COOKIE,
        value=refresh_token,
        httponly=True,
        secure=settings.ENVIRONMENT != "development",
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
    )
    return TokenResponse(access_token=access_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
    redis=Depends(get_redis),
):
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )
    access_token = await refresh_access_token(redis, refresh_token)
    return TokenResponse(access_token=access_token)


@router.post("/logout")
async def logout(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
    redis=Depends(get_redis),
):
    if refresh_token:
        await logout_user(redis, refresh_token)

    response.delete_cookie(REFRESH_COOKIE)
    return {"detail": "Logged out"}
