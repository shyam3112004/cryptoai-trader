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

import hashlib

def hash_password(password: str) -> str:
    try:
        return pwd_context.hash(password)
    except Exception as e:
        print(f"[Auth] Warning: Passlib bcrypt failed ({e}). Using sha256 fallback.")
        return "sha256$" + hashlib.sha256((password + "cryptoai_salt").encode('utf-8')).hexdigest()

def verify_password(plain: str, hashed: str) -> bool:
    try:
        if hashed.startswith("sha256$"):
            expected = "sha256$" + hashlib.sha256((plain + "cryptoai_salt").encode('utf-8')).hexdigest()
            return hashed == expected
        return pwd_context.verify(plain, hashed)
    except Exception:
        expected = "sha256$" + hashlib.sha256((plain + "cryptoai_salt").encode('utf-8')).hexdigest()
        return hashed == expected

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

@router.post("/register", response_model=TokenResponse)
async def register(request: SignUpRequest, db: AsyncSession = Depends(get_db_session)):
    try:
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
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Auth] Registration unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
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
    active_mode: str | None = None
    daily_profit_target: float | None = None
    daily_loss_limit: float | None = None
    enable_trailing_stop: bool | None = None
    auto_start_on_login: bool | None = None
    trade_investment_usd: float | None = None
    trade_investment_inr: float | None = None
    trade_shares: float | None = None
    trade_direction: str | None = None
    leverage: int | None = None
    use_algorithms: bool | None = None

class SettingsResponse(BaseModel):
    broker_gateway: str | None = None
    broker_api_key: str | None = None
    broker_api_secret: str | None = None
    max_open_positions: int = 3
    stop_loss_limit: float = 2.0
    profit_target: str = "1.5X"
    trade_pacing: str = "rapid"
    enable_whatsapp: bool = True
    enable_telegram: bool = False
    whatsapp_number: str | None = None
    callmebot_apikey: str | None = None
    telegram_bot_token: str | None = None
    telegram_chat_id: str | None = None
    active_mode: str = "demo"
    daily_profit_target: float = 0.0
    daily_loss_limit: float = 0.0
    enable_trailing_stop: bool = False
    auto_start_on_login: bool = False
    trade_investment_usd: float = 100.0
    trade_investment_inr: float = 10000.0
    trade_shares: float = 1.0
    trade_direction: str = "BOTH"
    leverage: int = 10
    use_algorithms: bool = True

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
    if request.active_mode is not None:
        current_user.active_mode = request.active_mode
    if request.daily_profit_target is not None:
        user_settings.daily_profit_target = request.daily_profit_target
    if request.daily_loss_limit is not None:
        user_settings.daily_loss_limit = request.daily_loss_limit
    if request.enable_trailing_stop is not None:
        user_settings.enable_trailing_stop = request.enable_trailing_stop
    if request.auto_start_on_login is not None:
        user_settings.auto_start_on_login = request.auto_start_on_login
    if request.trade_investment_usd is not None:
        user_settings.trade_investment_usd = request.trade_investment_usd
    if request.trade_investment_inr is not None:
        user_settings.trade_investment_inr = request.trade_investment_inr
    if request.trade_shares is not None:
        user_settings.trade_shares = request.trade_shares
    if request.trade_direction is not None:
        user_settings.trade_direction = request.trade_direction
    if request.leverage is not None:
        user_settings.leverage = request.leverage
    if request.use_algorithms is not None:
        user_settings.use_algorithms = request.use_algorithms
        
    await db.commit()
    return {"status": "success", "message": "Settings updated successfully"}

@router.post("/settings/update") # alias or keep original route below
@router.get("/settings", response_model=SettingsResponse)
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    result = await db.execute(select(UserSetting).filter(UserSetting.user_id == current_user.id))
    user_settings = result.scalars().first()
    
    if not user_settings:
        user_settings = UserSetting(user_id=current_user.id)
        db.add(user_settings)
        await db.commit()
        await db.refresh(user_settings)
        
    return SettingsResponse(
        broker_gateway=user_settings.broker_gateway,
        broker_api_key=user_settings.broker_api_key,
        broker_api_secret=user_settings.broker_api_secret,
        max_open_positions=user_settings.max_open_positions,
        stop_loss_limit=user_settings.stop_loss_limit,
        profit_target=user_settings.profit_target,
        trade_pacing=user_settings.trade_pacing,
        enable_whatsapp=user_settings.enable_whatsapp,
        enable_telegram=user_settings.enable_telegram,
        whatsapp_number=current_user.whatsapp_number,
        callmebot_apikey=current_user.callmebot_apikey,
        telegram_bot_token=current_user.telegram_bot_token,
        telegram_chat_id=current_user.telegram_chat_id,
        active_mode=current_user.active_mode or "demo",
        daily_profit_target=user_settings.daily_profit_target or 0.0,
        daily_loss_limit=user_settings.daily_loss_limit or 0.0,
        enable_trailing_stop=bool(user_settings.enable_trailing_stop),
        auto_start_on_login=bool(user_settings.auto_start_on_login),
        trade_investment_usd=user_settings.trade_investment_usd or 100.0,
        trade_investment_inr=user_settings.trade_investment_inr or 10000.0,
        trade_shares=user_settings.trade_shares or 1.0,
        trade_direction=user_settings.trade_direction or "BOTH",
        leverage=user_settings.leverage or 10,
        use_algorithms=user_settings.use_algorithms if user_settings.use_algorithms is not None else True
    )

