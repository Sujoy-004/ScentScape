"""T2.3: Authentication API endpoints.

Provides user registration, login, token refresh, and logout functionality.
"""

import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
)
from app.auth.dependencies import get_current_user_id
from app.database import get_session
from app.models.models import User, RefreshToken
from app.schemas.schemas import (
    UserRegister,
    UserLogin,
    TokenResponse,
    RefreshTokenRequest,
    UserProfile,
)
from sqlalchemy import select


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


def _utc_now_naive() -> datetime:
    # DB columns are TIMESTAMP WITHOUT TIME ZONE.
    return datetime.utcnow()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Register a new user account.
    
    Args:
        user_data: Email, password, opt_in_training flag
        session: Database session
        
    Returns:
        Access token, refresh token, and expiration info
        
    Raises:
        HTTPException: 409 if email already exists
    """
    # Check if user already exists
    stmt = select(User).where(User.email == user_data.email)
    result = await session.execute(stmt)
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        logger.warning(f"Registration failed: email already exists: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        is_active=True,
        opt_in_training=user_data.opt_in_training,
    )
    
    session.add(new_user)
    await session.flush()  # Get the ID before commit
    user_id = new_user.id
    
    # Create refresh token in database
    refresh_token = create_refresh_token(user_id)
    refresh_token_obj = RefreshToken(
        user_id=user_id,
        token=refresh_token,
        expires_at=_utc_now_naive() + timedelta(days=7),
    )
    session.add(refresh_token_obj)
    
    await session.commit()
    logger.info(f"User registered: {user_data.email} (ID: {user_id})")
    
    # Generate tokens
    access_token = create_access_token(user_id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 30 * 60,  # 30 minutes in seconds
    }


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Login with email and password.
    
    Args:
        credentials: Email and password
        session: Database session
        
    Returns:
        Access token, refresh token, and expiration info
        
    Raises:
        HTTPException: 401 if credentials invalid
    """
    # Find user by email
    stmt = select(User).where(User.email == credentials.email)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        logger.warning(f"Login failed: invalid credentials for {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    if not user.is_active:
        logger.warning(f"Login failed: inactive user {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    
    # Create tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    
    # Store refresh token in database
    refresh_token_obj = RefreshToken(
        user_id=user.id,
        token=refresh_token,
        expires_at=_utc_now_naive() + timedelta(days=7),
    )
    session.add(refresh_token_obj)
    await session.commit()
    
    logger.info(f"User logged in: {credentials.email} (ID: {user.id})")
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 30 * 60,  # 30 minutes in seconds
    }


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Refresh access token using a valid refresh token.
    
    Args:
        request: Refresh token
        session: Database session
        
    Returns:
        New access token, same refresh token, expiration info
        
    Raises:
        HTTPException: 401 if refresh token invalid or expired
    """
    # Verify refresh token exists and is not revoked
    stmt = select(RefreshToken).where(
        RefreshToken.token == request.refresh_token,
        RefreshToken.revoked_at == None,
        RefreshToken.expires_at > _utc_now_naive(),
    )
    result = await session.execute(stmt)
    token_obj = result.scalar_one_or_none()
    
    if not token_obj:
        logger.warning("Refresh failed: invalid or expired refresh token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    
    # Create new access token (same user, same refresh token)
    user_id = token_obj.user_id
    access_token = create_access_token(user_id)
    
    logger.info(f"Token refreshed for user: {user_id}")
    
    return {
        "access_token": access_token,
        "refresh_token": request.refresh_token,
        "token_type": "bearer",
        "expires_in": 30 * 60,
    }


@router.post("/logout", response_model=dict)
async def logout(
    user_id: int = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Logout by revoking all refresh tokens for this user.
    
    Args:
        user_id: Current user ID
        session: Database session
        
    Returns:
        Success message
    """
    # Revoke all active refresh tokens for this user
    stmt = select(RefreshToken).where(
        RefreshToken.user_id == user_id,
        RefreshToken.revoked_at == None,
    )
    result = await session.execute(stmt)
    tokens = result.scalars().all()
    
    for token in tokens:
        token.revoked_at = _utc_now_naive()
    
    await session.commit()
    logger.info(f"User logged out: {user_id}")
    
    return {"status": "logged_out", "message": "All sessions revoked"}


@router.get("/me", response_model=UserProfile)
async def get_current_user(
    user_id: int = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
) -> UserProfile:
    """Get current authenticated user's profile.
    
    Args:
        user_id: Current user ID
        session: Database session
        
    Returns:
        User profile
        
    Raises:
        HTTPException: 404 if user not found (should not happen if token valid)
    """
    stmt = select(User).where(User.id == user_id)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return UserProfile.model_validate(user)



