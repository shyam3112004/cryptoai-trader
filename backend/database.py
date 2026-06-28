from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from config import settings

# Setup Async DB Engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True
)

# Setup Sessionmaker for Async Sessions
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    class_=AsyncSession
)

# Declarative base class for SQLAlchemy ORM models
Base = declarative_base()

# Dependency injector to get database session for routes
async def get_db_session():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
