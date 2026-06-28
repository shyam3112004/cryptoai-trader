import math
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from config import settings
from database import get_db_session
from models import User, UserSetting

router = APIRouter(prefix="/auth", tags=["Authentication"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

class SignUpRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    whatsapp_number: str | None = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    mode: str
    whatsapp_number: str | None = None
    callmebot_apikey: str | None = None
    telegram_bot_token: str | None = None
    telegram_chat_id: str | None = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

@router.post("/register", response_model=TokenResponse)
async def register(request: SignUpRequest, db: AsyncSession = Depends(get_db_session)):
    email_key = request.email.lower()
    
    # Check if email exists in DB
    result = await db.execute(select(User).filter(User.email == email_key))
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )

    # Hash password & create user
    hashed_pw = hash_password(request.password)
    new_user = User(
        full_name=request.full_name,
        email=request.email.lower(),
        password_hash=hashed_pw,
        whatsapp_number=request.whatsapp_number,
        active_mode="demo"
    )
    
    db.add(new_user)
    await db.flush() # Flush to populate user ID

    # Create default user settings
    default_settings = UserSetting(
        user_id=new_user.id,
        max_open_positions=3,
        stop_loss_limit=2.0,
        profit_target="1.5X",
        enable_whatsapp=True
    )
    db.add(default_settings)
    await db.commit()

    # Generate token
    token = create_access_token({"sub": new_user.id, "email": new_user.email})
    
    return TokenResponse(
        access_token=token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_HOURS * 3600,
        user=UserResponse(
            id=new_user.id,
            name=new_user.full_name,
            email=new_user.email,
            mode=new_user.active_mode,
            whatsapp_number=new_user.whatsapp_number
        )
    )

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db_session)):
    email_key = request.email.lower()
    
    # Query user from DB
    result = await db.execute(select(User).filter(User.email == email_key))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found with this email."
        )

    # Lockout check
    now = datetime.utcnow()
    if user.locked_until and now < user.locked_until:
        minutes_left = math.ceil((user.locked_until - now).total_seconds() / 60)
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account locked. Try again in {minutes_left} minute(s)."
        )

    # Verify password
    if not verify_password(request.password, user.password_hash):
        user.failed_attempts += 1
        remaining = 3 - user.failed_attempts # Locked after 3 attempts
        
        if remaining <= 0:
            user.locked_until = datetime.utcnow() + timedelta(minutes=5) # 5 minutes lock
            user.failed_attempts = 0
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Too many failed attempts. Account locked for 5 minutes."
            )
        
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Incorrect password. {remaining} attempts remaining."
        )

    # Reset attempts on success
    user.failed_attempts = 0
    user.locked_until = None
    await db.commit()

    # Generate token
    expire = timedelta(days=30) if request.remember_me else timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS)
    token = create_access_token({"sub": user.id, "email": user.email}, expire)

    return TokenResponse(
        access_token=token,
        expires_in=int(expire.total_seconds()),
        user=UserResponse(
            id=user.id,
            name=user.full_name,
            email=user.email,
            mode=user.active_mode,
            whatsapp_number=user.whatsapp_number,
            callmebot_apikey=user.callmebot_apikey,
            telegram_bot_token=user.telegram_bot_token,
            telegram_chat_id=user.telegram_chat_id
        )
    )

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db_session)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        # Check if database is completely empty
        any_user_res = await db.execute(select(User).limit(1))
        any_user = any_user_res.scalars().first()
        if not any_user:
            email = payload.get("email") or "test@test.com"
            user = User(
                id=user_id,
                full_name="Test User",
                email=email,
                password_hash=hash_password("password"),
                active_mode="demo"
            )
            db.add(user)
            await db.flush()
            
            default_settings = UserSetting(
                user_id=user.id,
                max_open_positions=3,
                stop_loss_limit=2.0,
                profit_target="1.5X",
                enable_whatsapp=True
            )
            db.add(default_settings)
            await db.commit()
            print(f"Auto-created default user profile for {email} from active JWT token.")
        else:
            raise credentials_exception
        
    return user

class SettingsUpdateRequest(BaseModel):
    broker_gateway: str | None = None
    broker_api_key: str | None = None
    broker_api_secret: str | None = None
    max_open_positions: int | None = None
    stop_loss_limit: float | None = None
    profit_target: str | None = None
    trade_pacing: str | None = None
    enable_whatsapp: bool | None = None
    whatsapp_number: str | None = None
    callmebot_apikey: str | None = None
    telegram_bot_token: str | None = None
    telegram_chat_id: str | None = None
    enable_telegram: bool | None = None

@router.post("/settings")
async def update_settings(
    request: SettingsUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    # Ensure settings entry exists
    result = await db.execute(select(UserSetting).filter(UserSetting.user_id == current_user.id))
    user_settings = result.scalars().first()
    
    if not user_settings:
        user_settings = UserSetting(user_id=current_user.id)
        db.add(user_settings)
        await db.flush()
        
    if request.broker_gateway is not None:
        user_settings.broker_gateway = request.broker_gateway
    if request.broker_api_key is not None:
        user_settings.broker_api_key = request.broker_api_key
    if request.broker_api_secret is not None:
        user_settings.broker_api_secret = request.broker_api_secret
    if request.max_open_positions is not None:
        user_settings.max_open_positions = request.max_open_positions
    if request.stop_loss_limit is not None:
        user_settings.stop_loss_limit = request.stop_loss_limit
    if request.profit_target is not None:
        user_settings.profit_target = request.profit_target
    if request.enable_whatsapp is not None:
        user_settings.enable_whatsapp = request.enable_whatsapp
    if request.whatsapp_number is not None:
        current_user.whatsapp_number = request.whatsapp_number
    if request.callmebot_apikey is not None:
        current_user.callmebot_apikey = request.callmebot_apikey
    if request.telegram_bot_token is not None:
        current_user.telegram_bot_token = request.telegram_bot_token
    if request.telegram_chat_id is not None:
        current_user.telegram_chat_id = request.telegram_chat_id
    if request.enable_telegram is not None:
        user_settings.enable_telegram = request.enable_telegram
    if request.trade_pacing is not None:
        user_settings.trade_pacing = request.trade_pacing
        
    await db.commit()
    return {"status": "success", "message": "Settings updated successfully"}

