import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    whatsapp_number = Column(String, nullable=True)
    callmebot_apikey = Column(String, nullable=True)
    telegram_bot_token = Column(String, nullable=True)
    telegram_chat_id = Column(String, nullable=True)
    active_mode = Column(String, default="demo") # demo or real
    failed_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    settings = relationship("UserSetting", back_populates="user", uselist=False, cascade="all, delete-orphan")
    trades = relationship("TradeHistory", back_populates="user", cascade="all, delete-orphan")

class UserSetting(Base):
    __tablename__ = "user_settings"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    max_open_positions = Column(Integer, default=3)
    stop_loss_limit = Column(Float, default=2.0)
    profit_target = Column(String, default="1.5X")
    daily_profit_target = Column(Float, default=0.0) # 0 = disabled
    daily_loss_limit = Column(Float, default=0.0) # 0 = disabled
    enable_trailing_stop = Column(Boolean, default=False)
    auto_start_on_login = Column(Boolean, default=False)
    enable_whatsapp = Column(Boolean, default=True)
    enable_telegram = Column(Boolean, default=False)
    broker_gateway = Column(String, nullable=True)
    broker_api_key = Column(String, nullable=True)
    broker_api_secret = Column(String, nullable=True)
    trade_pacing = Column(String, default="rapid")
    trade_investment_usd = Column(Float, default=100.0)
    trade_investment_inr = Column(Float, default=10000.0)

    # Relationship back to User
    user = relationship("User", back_populates="settings")

class TradeHistory(Base):
    __tablename__ = "trade_history"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    pair = Column(String, nullable=False)
    type = Column(String, nullable=False) # LONG or SHORT
    leverage = Column(String, nullable=False)
    profit = Column(String, nullable=False) # e.g. +$245.00
    return_pct = Column(String, nullable=False) # e.g. +2.45%
    status = Column(String, nullable=False) # TARGET HIT, STOP LOSS, MANUAL
    entry_price = Column(Float, nullable=True)
    exit_price = Column(Float, nullable=True)

    # Relationship back to User
    user = relationship("User", back_populates="trades")
