import asyncio
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, signals
from database import engine, Base
import models # Make sure models are registered on Base metadata

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create database tables on server startup
    try:
        from sqlalchemy import text
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
            migrations = [
                "ALTER TABLE user_settings ADD COLUMN trade_pacing VARCHAR DEFAULT 'rapid'",
                "ALTER TABLE users ADD COLUMN callmebot_apikey VARCHAR",
                "ALTER TABLE users ADD COLUMN telegram_bot_token VARCHAR",
                "ALTER TABLE users ADD COLUMN telegram_chat_id VARCHAR",
                "ALTER TABLE user_settings ADD COLUMN enable_telegram BOOLEAN DEFAULT 0",
                "ALTER TABLE user_settings ADD COLUMN broker_gateway VARCHAR",
                "ALTER TABLE user_settings ADD COLUMN broker_api_key VARCHAR",
                "ALTER TABLE user_settings ADD COLUMN broker_api_secret VARCHAR"
            ]
            for sql in migrations:
                try:
                    await conn.execute(text(sql))
                except Exception:
                    pass # Already exists
            
            # Wipe any legacy Alpaca settings from user settings for safety and privacy
            try:
                await conn.execute(text("UPDATE user_settings SET broker_gateway = '', broker_api_key = '', broker_api_secret = '' WHERE broker_gateway LIKE '%Alpaca%';"))
            except Exception:
                pass
    except Exception as e:
        print(f"Database initialization failed: {e}")
        
    # Start unified background task to simulate live ticks for all active connections
    simulator_task = asyncio.create_task(signals.simulate_live_ticks())
    
    yield
    
    # Cancel background tasks on shutdown
    simulator_task.cancel()

app = FastAPI(
    title="CryptoAI Trader API",
    description="Backend API services for CryptoAI Auto Trading Terminal",
    version="3.0",
    lifespan=lifespan
)

# CORS configurations for React Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Mount Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(signals.router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "online", "service": "CryptoAI Trader Engine", "version": "3.0"}

# Mount static directory for production deployment (Hugging Face Spaces)
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Exclude API endpoints
        if full_path.startswith("api/"):
            return None
        file_path = os.path.join(static_dir, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(static_dir, "index.html"))
else:
    @app.get("/")
    def read_root():
        return {"status": "online", "service": "CryptoAI Trader Engine", "version": "3.0"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)

