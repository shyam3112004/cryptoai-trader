import os
import secrets
from dotenv import load_dotenv

# Load local .env file if it exists
load_dotenv()

class Settings:
    PROJECT_NAME: str = "CryptoAI Trader API"
    PROJECT_VERSION: str = "3.0"
    
    # Database config
    # Default to zero-config SQLite to avoid Postgres connection errors if no server is running
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite+aiosqlite:///./cryptoai.db"
    )
    
    # JWT security config
    SECRET_KEY: str = os.getenv("SECRET_KEY", "cryptoai_default_secret_key_change_in_production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24

    # Twilio configurations
    TWILIO_ACCOUNT_SID: str | None = os.getenv("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN: str | None = os.getenv("TWILIO_AUTH_TOKEN")
    TWILIO_FROM_NUMBER: str = os.getenv("TWILIO_FROM_NUMBER", "whatsapp:+14155238886")

    # AI Intelligence configurations
    YOUTUBE_API_KEY: str | None = os.getenv("YOUTUBE_API_KEY")
    CLAUDE_API_KEY: str | None = os.getenv("CLAUDE_API_KEY")
    CLAUDE_MODEL: str = os.getenv("CLAUDE_MODEL", "openrouter/free")
    CLAUDE_DAILY_BUDGET_USD: float = float(os.getenv("CLAUDE_DAILY_BUDGET_USD", "5.0"))
    AI_CONSULTATION_MODE: str = os.getenv("AI_CONSULTATION_MODE", "anomaly") # anomaly, every_trade, manual

settings = Settings()
