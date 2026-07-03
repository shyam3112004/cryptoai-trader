import os
import sys
import json
import pytest
import asyncio
from datetime import datetime, timedelta

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from models import Base, User, UserSetting, AIKnowledge, TradeHistory
from services.strategy_matcher import parse_rule_condition, evaluate_strategy, parse_sl_tp_ratios
from routers.ai import run_simulation

# Create in-memory test database
test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
AsyncTestSessionLocal = sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

# Monkeypatch the engine and session local in the routers BEFORE importing or calling them
import routers.signals
import routers.ai
routers.signals.engine = test_engine
routers.signals.AsyncSessionLocal = AsyncTestSessionLocal
routers.ai.engine = test_engine
routers.ai.AsyncSessionLocal = AsyncTestSessionLocal

async def init_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

@pytest.mark.asyncio
async def test_rule_parser():
    await init_db()
    # Test BB conditions
    rule_bb_long = {"rule": "BB Buy Trigger", "detail": "price touches lower band"}
    indicators = {"price": 100.0, "BB_lower": 101.0, "BB_upper": 105.0}
    assert evaluate_strategy([rule_bb_long], indicators) == "BUY"

    rule_bb_short = {"rule": "BB Sell Trigger", "detail": "price touches upper band"}
    assert evaluate_strategy([rule_bb_short], indicators) == "HOLD"

    # Test MACD conditions
    rule_macd = {"rule": "MACD Trigger", "detail": "macd crosses above"}
    indicators_macd = {"MACD_hist": 0.5}
    assert evaluate_strategy([rule_macd], indicators_macd) == "BUY"

    # Test unparseable condition
    rule_unparseable = {"rule": "Unknown Trigger", "detail": "unknown_ind > 10"}
    assert evaluate_strategy([rule_unparseable], indicators) == "HOLD"

@pytest.mark.asyncio
async def test_parse_sl_tp_ratios():
    rules = [
        {"rule": "BB Trigger", "detail": "price touches lower band"},
        {"rule": "Stop Loss setup", "detail": "stop loss at 1.5%"},
        {"rule": "Take Profit setup", "detail": "take profit at 3.0%"}
    ]
    sl, tp = parse_sl_tp_ratios(rules)
    assert sl == 0.015
    assert tp == 0.03

@pytest.mark.asyncio
async def test_run_simulation():
    # Generate mock candles representing trending regime
    candles = []
    base_price = 100.0
    for i in range(150):
        # Trending up
        close_p = base_price + i * 0.2
        candles.append({
            "close": close_p,
            "open": close_p - 0.1,
            "high": close_p + 0.2,
            "low": close_p - 0.2,
            "volume": 1000
        })

    rules_list = [
        {"rule": "BB Trigger", "detail": "price touches lower band"}
    ]

    # Run simulation
    res = run_simulation(candles, rules_list, 0.02, 0.04, leverage=1.0)
    assert res["total_trades"] >= 0
    assert res["max_drawdown"] >= 0.0

@pytest.mark.asyncio
async def test_drift_detection_and_demotion():
    await init_db()
    async with AsyncTestSessionLocal() as session:
        # Create a mock user
        user = User(full_name="test_user", email="test@test.com", password_hash="hash")
        session.add(user)
        await session.commit()
        await session.refresh(user)

        # Create a mock LIVE_APPROVED strategy
        strat = AIKnowledge(
            user_id=user.id,
            title="Drifting Strategy",
            strategy_type="BB",
            rules=json.dumps([{"rule": "BB Trigger", "detail": "price touches lower band"}]),
            confidence=90.0,
            status="LIVE_APPROVED",
            backtest_win_rate=65.0
        )
        session.add(strat)
        await session.commit()
        await session.refresh(strat)

        # Add 5 losing trades to simulate drift
        for _ in range(5):
            trade = TradeHistory(
                user_id=user.id,
                strategy_id=strat.id,
                pair="BTCUSDT",
                type="LONG",
                leverage="10X",
                profit="-$50.00",
                return_pct="-5.00%",
                status="STOP LOSS",
                date=datetime.utcnow()
            )
            session.add(trade)
        await session.commit()

        # Trigger the confidence update & drift detection check
        from routers.signals import update_strategy_confidence_and_detect_drift
        await update_strategy_confidence_and_detect_drift(strat.id, -5.0)

        # Retrieve the strategy using a clean session to avoid cache / lazy load issues
        async with AsyncTestSessionLocal() as session2:
            from sqlalchemy import select
            res = await session2.execute(select(AIKnowledge).where(AIKnowledge.id == strat.id))
            strat_new = res.scalars().first()
            assert strat_new.status == "PAPER_VALIDATED"
            assert "Performance drift detected" in strat_new.status_history

print("Gating and safety test suite ready.")
