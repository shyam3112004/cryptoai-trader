import json
import math
import random
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from pydantic import BaseModel

from database import get_db_session
from models import User, UserSetting, AIKnowledge, AIConsultation, TradeHistory
from routers.signals import get_demo_candles, predict_consensus
from routers.auth import get_current_user
from services.ai_intelligence_service import ai_intelligence_service
from services.ai_knowledge_base import (
    add_ai_knowledge,
    get_all_ai_knowledge,
    add_ai_consultation,
    get_ai_consultations,
    add_learning_session,
    get_ai_summary_stats
)

router = APIRouter(prefix="/ai", tags=["AI intelligence & Learning"])

# Request/Response schemas
class AISettingsUpdateRequest(BaseModel):
    youtube_api_key: str | None = None
    claude_api_key: str | None = None
    claude_model: str | None = None
    ai_consultation_mode: str | None = None
    ai_daily_budget: float | None = None
    ai_candle_interval: str | None = None

class AIConsultRequest(BaseModel):
    symbol: str
    issue_type: str = "manual" # manual, anomaly, check
    error_context: str | None = None

class AILearnRequest(BaseModel):
    query: str

class AISpecificLearnRequest(BaseModel):
    video_id: str
    title: str
    channel: str
    description: str

class AIDiagnoseRequest(BaseModel):
    symbol: str
    error_context: str

@router.get("/settings")
async def get_ai_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    stmt = select(UserSetting).where(UserSetting.user_id == current_user.id)
    res = await db.execute(stmt)
    settings = res.scalar_one_or_none()
    
    if not settings:
        settings = UserSetting(user_id=current_user.id)
        db.add(settings)
        await db.flush()
        
    return {
        "youtube_api_key": settings.youtube_api_key or "",
        "claude_api_key": settings.claude_api_key or "",
        "claude_model": settings.claude_model or "claude-3-5-sonnet-20241022",
        "ai_consultation_mode": settings.ai_consultation_mode or "anomaly",
        "ai_daily_budget": settings.ai_daily_budget or 5.0,
        "ai_candle_interval": settings.ai_candle_interval or "30s"
    }

@router.put("/settings")
async def update_ai_settings(
    req: AISettingsUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    stmt = select(UserSetting).where(UserSetting.user_id == current_user.id)
    res = await db.execute(stmt)
    settings = res.scalar_one_or_none()
    
    if not settings:
        settings = UserSetting(user_id=current_user.id)
        db.add(settings)
        await db.flush()
        
    if req.youtube_api_key is not None:
        settings.youtube_api_key = req.youtube_api_key
    if req.claude_api_key is not None:
        settings.claude_api_key = req.claude_api_key
    if req.claude_model is not None:
        settings.claude_model = req.claude_model
    if req.ai_consultation_mode is not None:
        settings.ai_consultation_mode = req.ai_consultation_mode
    if req.ai_daily_budget is not None:
        settings.ai_daily_budget = req.ai_daily_budget
    if req.ai_candle_interval is not None:
        settings.ai_candle_interval = req.ai_candle_interval
        
    await db.commit()
    return {"message": "AI settings updated successfully"}


@router.get("/status")
async def get_ai_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    stmt = select(UserSetting).where(UserSetting.user_id == current_user.id)
    res = await db.execute(stmt)
    settings = res.scalar_one_or_none()
    
    yt_key = settings.youtube_api_key if settings else None
    cl_key = settings.claude_api_key if settings else None
    
    # Calculate summary stats from DB
    stats = await get_ai_summary_stats(db, current_user.id)
    
    return {
        "youtube_connected": bool(yt_key and yt_key.strip() != "" and "FREE" not in yt_key),
        "claude_connected": bool(cl_key and cl_key.strip() != "" and "FREE" not in cl_key),
        "youtube_api_status": "Active" if (yt_key and "FREE" not in yt_key) else "Demo (Curated Feeds)",
        "claude_api_status": "Active" if (cl_key and "FREE" not in cl_key) else "Demo (Simulated Intelligence)",
        "budget_limit_usd": settings.ai_daily_budget if settings else 5.0,
        **stats
    }

@router.get("/youtube/search")
async def search_youtube(
    q: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    stmt = select(UserSetting).where(UserSetting.user_id == current_user.id)
    res = await db.execute(stmt)
    settings = res.scalar_one_or_none()
    
    yt_key = settings.youtube_api_key if settings else None
    videos = await ai_intelligence_service.search_youtube_videos(q, yt_key)
    return videos

@router.post("/youtube/learn")
async def learn_from_video(
    req: AISpecificLearnRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    stmt = select(UserSetting).where(UserSetting.user_id == current_user.id)
    res = await db.execute(stmt)
    settings = res.scalar_one_or_none()
    
    cl_key = settings.claude_api_key if settings else None
    
    # Call Claude to extract rules from the title + description
    system_prompt = (
        "You are an expert algorithmic trading developer. Your job is to extract highly actionable, "
        "precise mechanical trading rules from video summaries. Identify the triggers, confirmation rules, "
        "stop-losses, and profit targets."
    )
    prompt = (
        f"Title: {req.title}\n"
        f"Channel: {req.channel}\n"
        f"Description: {req.description}\n\n"
        f"Please analyze this strategy and output a JSON block inside a ```json ... ``` codeblock. "
        f"The JSON must have the following structure:\n"
        f"{{\n"
        f"  \"strategy_type\": \"scalping\" | \"breakout\" | \"momentum\" | \"reversal\",\n"
        f"  \"confidence\": 85,\n"
        f"  \"rules\": [\n"
        f"    {{\"rule\": \"Rule Title\", \"detail\": \"Exact mechanical details\"}}\n"
        f"  ]\n"
        f"}}\n"
        f"Do not write any introductory or concluding text. Output ONLY the JSON block."
    )
    
    ai_res = await ai_intelligence_service.consult_claude_ai(prompt, system_prompt, cl_key, settings.claude_model if settings else None)
    
    print(f"[AI Learn Router] Raw LLM Response: {ai_res.get('text')}")
    
    strategy_type = ai_res.get("strategy_type", "breakout")
    rules_json = ai_res.get("rules_json", "[]")

    
    if not ai_res.get("simulated", True):
        # Parse Claude's raw response to extract JSON structure
        try:
            cleaned_text = ai_res["text"].strip()
            
            # Try to extract JSON from ```json ... ``` codeblock first
            json_block = None
            if "```json" in cleaned_text:
                start = cleaned_text.index("```json") + 7
                end = cleaned_text.index("```", start)
                json_block = cleaned_text[start:end].strip()
            elif "```" in cleaned_text:
                start = cleaned_text.index("```") + 3
                end = cleaned_text.index("```", start)
                json_block = cleaned_text[start:end].strip()
            
            # Fallback: find outermost { ... }
            if not json_block:
                start_idx = cleaned_text.find("{")
                end_idx = cleaned_text.rfind("}")
                if start_idx != -1 and end_idx != -1:
                    json_block = cleaned_text[start_idx:end_idx+1]
            
            if json_block:
                js_data = json.loads(json_block)
                rules_item = js_data.get("rules", js_data)
                
                if isinstance(rules_item, dict):
                    rules_list = []
                    for k, v in rules_item.items():
                        if k not in ["strategy_type", "confidence"]:
                            detail_str = json.dumps(v) if isinstance(v, (dict, list)) else str(v)
                            rule_title = k.replace("_", " ").title()
                            rules_list.append({"rule": rule_title, "detail": detail_str})
                elif isinstance(rules_item, list):
                    rules_list = []
                    for item in rules_item:
                        if isinstance(item, dict):
                            rules_list.append(item)
                        else:
                            rules_list.append({"rule": "Rule", "detail": str(item)})
                else:
                    rules_list = [{"rule": "Strategy Rule", "detail": str(rules_item)}]
                    
                rules_json = json.dumps(rules_list)
                strategy_type = js_data.get("strategy_type", strategy_type)
                
                # Extract confidence from response
                conf_val = js_data.get("confidence", 85)
                if isinstance(conf_val, (int, float)):
                    confidence = float(conf_val)
                else:
                    confidence = 85.0
            else:
                confidence = 85.0
                rules_json = json.dumps([{"rule": "AI Observation", "detail": cleaned_text[:300]}])
        except Exception as parse_err:
            print(f"[LLM JSON Parser Error] {parse_err}")
            confidence = 85.0
            rules_json = json.dumps([{"rule": "AI Observation", "detail": ai_res["text"][:300]}])
    else:
        confidence = float(ai_res.get("confidence", 85.0)) if isinstance(ai_res.get("confidence", 85.0), (int, float)) else 85.0

    # Save to knowledge base
    knowledge = await add_ai_knowledge(
        db,
        user_id=current_user.id,
        video_id=req.video_id,
        title=req.title,
        channel=req.channel,
        strategy_type=strategy_type,
        rules=rules_json,
        confidence=confidence
    )
    
    # Log session
    await add_learning_session(db, current_user.id, req.title, 1, 1)
    await db.commit()
    
    return {
        "success": True,
        "strategy_type": strategy_type,
        "rules": json.loads(rules_json),
        "explanation": ai_res["text"]
    }

@router.post("/consult")
async def consult_ai(
    req: AIConsultRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    # Check if budget exhausted
    stats = await get_ai_summary_stats(db, current_user.id)
    stmt = select(UserSetting).where(UserSetting.user_id == current_user.id)
    res = await db.execute(stmt)
    settings = res.scalar_one_or_none()
    budget_limit = settings.ai_daily_budget if settings else 5.0
    
    if stats["today_cost_usd"] >= budget_limit and settings and settings.claude_api_key and "FREE" not in settings.claude_api_key:
        raise HTTPException(
            status_code=400,
            detail=f"Daily AI budget of ${budget_limit:.2f} reached. Increase the budget in settings to continue."
        )

    # 1. Fetch candles
    candles = get_demo_candles(req.symbol)
    if not candles:
        raise HTTPException(status_code=404, detail=f"No price data available for {req.symbol}")
        
    latest_price = candles[-1]["close"]
    
    # Run the technical models consensus
    action, confidence, buy_votes, sell_votes, indicators, _ = predict_consensus(req.symbol, candles)
    
    # 2. Fetch public news
    news_items = await ai_intelligence_service.fetch_news_feed(req.symbol)
    news_text = "\n".join([f"- {n['title']} (Source: {n['source']})" for n in news_items])
    
    # Build Prompt
    system_prompt = (
        "You are 'Antigravity AI Trader Advisor', an advanced LLM trading specialist. "
        "Given the technical indicators, current consensus signals, and news feed, "
        "provide a critical trade diagnosis. Advise whether the user should BUY, SELL, or HOLD/EXIT. "
        "Use bullet points and be very concise."
    )
    prompt = (
        f"Asset: {req.symbol}\n"
        f"Current Price: {latest_price}\n"
        f"Consensus Signal: {action} (Confidence: {confidence}%)\n"
        f"Consensus Votes: BUY={buy_votes}, SELL={sell_votes}\n"
        f"Indicators: RSI={indicators.get('RSI')}, EMA9={indicators.get('EMA_9')}, EMA21={indicators.get('EMA_21')}, VWAP={indicators.get('VWAP')}, ATR={indicators.get('ATR')}\n"
        f"Recent News:\n{news_text}\n"
        f"Issue context: {req.issue_type} - {req.error_context or 'Normal live advisory check'}\n"
    )
    
    cl_key = settings.claude_api_key if settings else None
    ai_res = await ai_intelligence_service.consult_claude_ai(prompt, system_prompt, cl_key, settings.claude_model if settings else None)
    
    # Parse AI recommendation
    ai_recommendation = ai_res.get("recommendation", "HOLD")
    if not ai_res.get("simulated", True):
        # Deduce from text
        upper_text = ai_res["text"].upper()
        if "BUY" in upper_text:
            ai_recommendation = "BUY"
        elif "SELL" in upper_text or "SHORT" in upper_text:
            ai_recommendation = "SELL"
        elif "EXIT" in upper_text or "CLOSE" in upper_text:
            ai_recommendation = "EXIT"
            
    # Add to consultation log
    await add_ai_consultation(
        db,
        user_id=current_user.id,
        symbol=req.symbol,
        issue_type=req.issue_type,
        prompt_summary=f"Technical indicators and news for {req.symbol}",
        response_summary=ai_res["text"][:400],
        recommendation=ai_recommendation,
        tokens_used=ai_res.get("tokens_used", 0),
        estimated_cost=ai_res.get("cost", 0.0)
    )
    
    await db.commit()
    
    return {
        "success": True,
        "recommendation": ai_recommendation,
        "response": ai_res["text"],
        "simulated": ai_res.get("simulated", True),
        "news": news_items
    }

@router.get("/knowledge")
async def get_knowledge(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    knowledge = await get_all_ai_knowledge(db, current_user.id)
    return [
        {
            "id": k.id,
            "title": k.title,
            "channel": k.channel,
            "video_id": k.video_id,
            "strategy_type": k.strategy_type,
            "rules": json.loads(k.rules),
            "date": k.date.isoformat(),
            "confidence": k.confidence,
            "status": getattr(k, 'status', 'LEARNED') or 'LEARNED',
            "status_history": json.loads(getattr(k, 'status_history', '[]') or '[]'),
            "backtest_win_rate": getattr(k, 'backtest_win_rate', None),
            "backtest_sortino": getattr(k, 'backtest_sortino', None),
            "backtest_drawdown": getattr(k, 'backtest_drawdown', None),
            "regimes_data": json.loads(getattr(k, 'regimes_data', '{}') or '{}')
        }
        for k in knowledge
    ]

@router.get("/consultations")
async def get_consultations_log(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    consults = await get_ai_consultations(db, current_user.id)
    return [
        {
            "id": c.id,
            "symbol": c.symbol,
            "issue_type": c.issue_type,
            "recommendation": c.recommendation,
            "response": c.response_summary,
            "prompt": c.prompt_summary,
            "date": c.date.isoformat(),
            "cost": c.estimated_cost
        }
        for c in consults
    ]

@router.post("/diagnose")
async def diagnose_error(
    req: AIDiagnoseRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    stmt = select(UserSetting).where(UserSetting.user_id == current_user.id)
    res = await db.execute(stmt)
    settings = res.scalar_one_or_none()
    
    system_prompt = (
        "You are an AI Trading Systems Consultant. The bot experienced an error during trading. "
        "Review the logs, diagnose what happened, and suggest exact fixes."
    )
    prompt = (
        f"Asset: {req.symbol}\n"
        f"Error/Issue Context: {req.error_context}\n"
        f"Please diagnose the issue and suggest corrective actions."
    )
    
    cl_key = settings.claude_api_key if settings else None
    ai_res = await ai_intelligence_service.consult_claude_ai(prompt, system_prompt, cl_key, settings.claude_model if settings else None)
    
    # Save consultation
    await add_ai_consultation(
        db,
        user_id=current_user.id,
        symbol=req.symbol,
        issue_type="anomaly",
        prompt_summary=f"Error Diagnosis: {req.error_context[:100]}",
        response_summary=ai_res["text"][:400],
        recommendation="HOLD",
        tokens_used=ai_res.get("tokens_used", 0),
        estimated_cost=ai_res.get("cost", 0.0)
    )
    await db.commit()
    
    return {
        "success": True,
        "diagnosis": ai_res["text"]
    }

@router.get("/market-context/{symbol:path}")
async def get_market_context(
    symbol: str,
    current_user: User = Depends(get_current_user)
):
    # Fetch news feed
    news = await ai_intelligence_service.fetch_news_feed(symbol)
    return {
        "symbol": symbol,
        "timestamp": datetime.utcnow().isoformat(),
        "news": news
    }

class AIBacktestRequest(BaseModel):
    strategy_id: int
    symbol: str = "BTC/USDT"
    mode: str = "demo"

class PromoteStrategyRequest(BaseModel):
    strategy_id: int
    target_status: str # "PAPER_VALIDATED" or "LIVE_APPROVED"

# Helper to segment candles into regimes
def get_regime_slices(candles, window_size=150):
    n = len(candles)
    if n < window_size:
        return candles, candles, candles # fallback
        
    trending_start = 0
    max_trend = -1.0
    
    ranging_start = 0
    min_range_score = 999999.0
    
    high_vol_start = 0
    max_vol = -1.0
    
    for i in range(0, n - window_size + 1):
        slice_c = candles[i : i + window_size]
        
        # Trend calculation
        c_start = slice_c[0]["close"]
        c_end = slice_c[-1]["close"]
        trend = abs(c_end - c_start) / c_start if c_start > 0 else 0.0
        
        # Volatility calculation
        closes = [c["close"] for c in slice_c]
        returns = []
        for j in range(1, len(closes)):
            if closes[j-1] > 0:
                returns.append(math.log(closes[j] / closes[j-1]))
        mean_ret = sum(returns) / len(returns) if returns else 0.0
        vol = math.sqrt(sum((r - mean_ret)**2 for r in returns) / len(returns)) if returns else 0.0
        
        # 1. Trending: Maximize absolute trend
        if trend > max_trend:
            max_trend = trend
            trending_start = i
            
        # 2. High Volatility: Maximize standard deviation of returns
        if vol > max_vol:
            max_vol = vol
            high_vol_start = i
            
        # 3. Ranging: Minimize both trend and volatility
        range_score = trend + vol
        if range_score < min_range_score:
            min_range_score = range_score
            ranging_start = i
            
    trending_slice = candles[trending_start : trending_start + window_size]
    ranging_slice = candles[ranging_start : ranging_start + window_size]
    high_vol_slice = candles[high_vol_start : high_vol_start + window_size]
    
    return trending_slice, ranging_slice, high_vol_slice

# Helper to run walk-forward simulation
def run_simulation(slice_candles, rules_list, sl_pct, tp_pct, leverage):
    from services.strategy_matcher import evaluate_strategy
    from routers.signals import compute_all_indicators, calculate_atr
    
    trades = []
    active_trade = None
    
    # We need at least 30 candles to compute indicators
    for i in range(30, len(slice_candles) - 1):
        hist_candles = slice_candles[:i+1]
        
        if active_trade:
            entry_price = active_trade["entry_price"]
            curr_close = slice_candles[i]["close"]
            gross_pnl_pct = (curr_close - entry_price) / entry_price
            
            target_hit = curr_close >= (entry_price * (1.0 + tp_pct))
            stop_hit = curr_close <= (entry_price * (1.0 - sl_pct))
            
            if target_hit or stop_hit:
                # Fee & slippage model (0.1% execution fee, 0.2% round-trip)
                net_return_pct = gross_pnl_pct - 0.002
                leveraged_return = net_return_pct * leverage * 100.0
                
                active_trade["exit_price"] = curr_close
                active_trade["exit_time"] = i
                active_trade["return_pct"] = leveraged_return
                active_trade["status"] = "WIN" if leveraged_return >= 0.0 else "LOSS"
                trades.append(active_trade)
                active_trade = None
            continue
            
        # Compute indicators
        ema9_list, ema21_list, rsi_list, macd_hist_list, vwap_list, bb_bands_list, avg_vol = compute_all_indicators(hist_candles)
        atr = calculate_atr(hist_candles)
        
        indicators = {
            "RSI": rsi_list[-1],
            "EMA_9": ema9_list[-1],
            "EMA_21": ema21_list[-1],
            "VWAP": vwap_list[-1],
            "ATR": f"{round((atr / slice_candles[i]['close']) * 100.0, 2)}%" if slice_candles[i]["close"] > 0 else "2.1%",
            "MACD_hist": round(macd_hist_list[-1], 4),
            "BB_upper": round(bb_bands_list[-1][0], 2),
            "BB_middle": round(bb_bands_list[-1][1], 2),
            "BB_lower": round(bb_bands_list[-1][2], 2),
            "close": slice_candles[i]["close"]
        }
        
        decision = evaluate_strategy(rules_list, indicators)
        if decision == "BUY":
            active_trade = {
                "entry_price": slice_candles[i]["close"],
                "entry_time": i,
                "status": "OPEN"
            }
            
    # Close any open trade at the end
    if active_trade:
        curr_close = slice_candles[-1]["close"]
        gross_pnl_pct = (curr_close - active_trade["entry_price"]) / active_trade["entry_price"]
        net_return_pct = gross_pnl_pct - 0.002
        leveraged_return = net_return_pct * leverage * 100.0
        
        active_trade["exit_price"] = curr_close
        active_trade["exit_time"] = len(slice_candles) - 1
        active_trade["return_pct"] = leveraged_return
        active_trade["status"] = "WIN" if leveraged_return >= 0.0 else "LOSS"
        trades.append(active_trade)
        
    total_trades = len(trades)
    winning_trades = sum(1 for t in trades if t["status"] == "WIN")
    win_rate = (winning_trades / total_trades * 100.0) if total_trades > 0 else 0.0
    net_pnl = sum(t["return_pct"] for t in trades)
    
    # Max Drawdown
    equity = 100.0
    peak = 100.0
    max_dd = 0.0
    for t in trades:
        equity = equity * (1.0 + t["return_pct"] / 100.0)
        peak = max(peak, equity)
        dd = (peak - equity) / peak * 100.0
        max_dd = max(max_dd, dd)
        
    # Sortino Ratio
    returns_list = [t["return_pct"] for t in trades]
    mean_ret = sum(returns_list) / len(returns_list) if returns_list else 0.0
    neg_returns = [r for r in returns_list if r < 0]
    downside_deviation = math.sqrt(sum(r**2 for r in neg_returns) / len(returns_list)) if returns_list and neg_returns else 0.0001
    sortino = mean_ret / downside_deviation if downside_deviation > 0.0001 else 0.0
    
    return {
        "trades": trades,
        "total_trades": total_trades,
        "win_rate": win_rate,
        "net_pnl_pct": net_pnl,
        "max_drawdown": max_dd,
        "sortino": sortino
    }

@router.post("/backtest")
async def backtest_strategy(
    req: AIBacktestRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    from models import AIKnowledge
    from services.strategy_matcher import parse_sl_tp_ratios
    from routers.signals import get_demo_candles, get_chart_data
    from datetime import datetime
    
    # 1. Fetch strategy rules
    strat = await db.get(AIKnowledge, req.strategy_id)
    if not strat:
        return {"success": False, "error": "Strategy not found."}
        
    try:
        rules_list = json.loads(strat.rules)
    except Exception:
        return {"success": False, "error": "Strategy has malformed or empty rules."}
        
    # 2. Get candle data (request 1000 candles for statistically robust backtesting)
    if req.mode == "demo":
        candles = get_demo_candles(req.symbol, num_candles=1000)
    else:
        res = await get_chart_data(req.symbol, timeframe="15m", limit=1000)
        candles = res.get("candles", [])
        
    if len(candles) < 200:
        return {
            "success": False, 
            "error": f"Insufficient candle data for backtesting (got {len(candles)}, requires >= 200 candles to slice regimes)."
        }
        
    # Get user settings to apply custom leverage
    stmt_set = select(UserSetting).where(UserSetting.user_id == current_user.id)
    res_set = await db.execute(stmt_set)
    user_setting = res_set.scalar_one_or_none()
    leverage = user_setting.leverage if user_setting else 10
    
    # Extract custom SL/TP ratios
    custom_sl, custom_tp = parse_sl_tp_ratios(rules_list)
    sl_pct = custom_sl if custom_sl is not None else 0.02
    tp_pct = custom_tp if custom_tp is not None else 0.03
    
    # 3. Slice candles into regimes (Trending, Ranging, High-Volatility)
    trending_slice, ranging_slice, high_vol_slice = get_regime_slices(candles, window_size=150)
    
    # 4. Run walk-forward simulations
    full_res = run_simulation(candles, rules_list, sl_pct, tp_pct, leverage)
    trend_res = run_simulation(trending_slice, rules_list, sl_pct, tp_pct, leverage)
    range_res = run_simulation(ranging_slice, rules_list, sl_pct, tp_pct, leverage)
    vol_res = run_simulation(high_vol_slice, rules_list, sl_pct, tp_pct, leverage)
    
    total_trades = full_res["total_trades"]
    win_rate = full_res["win_rate"]
    net_pnl = full_res["net_pnl_pct"]
    max_dd = full_res["max_drawdown"]
    sortino = full_res["sortino"]
    
    # 5. Evaluate promotion/gating criteria (Phase 1 & Phase 2)
    promotion_issues = []
    
    # Validation 1: Sample size
    if total_trades < 30:
        promotion_issues.append(f"Insufficient trades: got {total_trades} completed trades, need >= 30.")
        
    # Validation 2: Profitability & Win Rate
    if net_pnl <= 0:
        promotion_issues.append(f"Strategy is net-unprofitable (Net Return: {net_pnl:.2f}%).")
    if win_rate < 50.0:
        promotion_issues.append(f"Strategy win rate too low ({win_rate:.2f}%, need >= 50.0%).")
        
    # Validation 3: Cross-source agreement
    stmt_agree = select(func.count(AIKnowledge.video_id.distinct())).where(
        AIKnowledge.strategy_type == strat.strategy_type,
        AIKnowledge.user_id == current_user.id
    )
    distinct_sources = await db.scalar(stmt_agree) or 0
    if distinct_sources < 2:
        promotion_issues.append(f"No cross-source agreement: found only {distinct_sources} video source for type '{strat.strategy_type}', need >= 2.")
        
    # Validation 4: Regime check
    if trend_res["net_pnl_pct"] <= 0 or range_res["net_pnl_pct"] <= 0 or vol_res["net_pnl_pct"] <= 0:
        promotion_issues.append(
            f"Regime failure: Net returns must be positive in all regimes. "
            f"Trending: {trend_res['net_pnl_pct']:.2f}%, Ranging: {range_res['net_pnl_pct']:.2f}%, Volatile: {vol_res['net_pnl_pct']:.2f}%."
        )

    promoted = len(promotion_issues) == 0
    old_status = getattr(strat, 'status', 'LEARNED') or 'LEARNED'
    
    if promoted:
        # Commit status transition
        strat.status = "BACKTESTED"
        history = json.loads(getattr(strat, 'status_history', '[]') or '[]')
        history.append({
            "timestamp": datetime.utcnow().isoformat(),
            "from_status": old_status,
            "to_status": "BACKTESTED",
            "reason": f"Passed backtest on {req.symbol} (trades: {total_trades}, win rate: {win_rate:.2f}%, sortino: {sortino:.2f}, drawdown: {max_dd:.2f}%)."
        })
        strat.status_history = json.dumps(history)
        strat.backtest_win_rate = win_rate
        strat.backtest_sortino = sortino
        strat.backtest_drawdown = max_dd
        strat.regimes_data = json.dumps({
            "trending": {"trades": trend_res["total_trades"], "win_rate": trend_res["win_rate"], "pnl": trend_res["net_pnl_pct"], "sortino": trend_res["sortino"], "drawdown": trend_res["max_drawdown"]},
            "ranging": {"trades": range_res["total_trades"], "win_rate": range_res["win_rate"], "pnl": range_res["net_pnl_pct"], "sortino": range_res["sortino"], "drawdown": range_res["max_drawdown"]},
            "high_volatility": {"trades": vol_res["total_trades"], "win_rate": vol_res["win_rate"], "pnl": vol_res["net_pnl_pct"], "sortino": vol_res["sortino"], "drawdown": vol_res["max_drawdown"]}
        })
        strat.confidence = round(max(60.0, min(95.0, win_rate)), 1)
        await db.commit()
    else:
        # Record failed validation in history log but do not change state
        history = json.loads(getattr(strat, 'status_history', '[]') or '[]')
        history.append({
            "timestamp": datetime.utcnow().isoformat(),
            "from_status": old_status,
            "to_status": old_status,
            "reason": f"Failed backtest validation. Issues: {', '.join(promotion_issues)}"
        })
        strat.status_history = json.dumps(history)
        strat.backtest_win_rate = win_rate
        strat.backtest_sortino = sortino
        strat.backtest_drawdown = max_dd
        strat.regimes_data = json.dumps({
            "trending": {"trades": trend_res["total_trades"], "win_rate": trend_res["win_rate"], "pnl": trend_res["net_pnl_pct"], "sortino": trend_res["sortino"], "drawdown": trend_res["max_drawdown"]},
            "ranging": {"trades": range_res["total_trades"], "win_rate": range_res["win_rate"], "pnl": range_res["net_pnl_pct"], "sortino": range_res["sortino"], "drawdown": range_res["max_drawdown"]},
            "high_volatility": {"trades": vol_res["total_trades"], "win_rate": vol_res["win_rate"], "pnl": vol_res["net_pnl_pct"], "sortino": vol_res["sortino"], "drawdown": vol_res["max_drawdown"]}
        })
        await db.commit()
        
    return {
        "success": True,
        "promoted": promoted,
        "promotion_errors": promotion_issues,
        "strategy_title": strat.title,
        "total_trades": total_trades,
        "winning_trades": sum(1 for t in full_res["trades"] if t["status"] == "WIN"),
        "win_rate": round(win_rate, 2),
        "net_pnl_pct": round(net_pnl, 2),
        "sortino": round(sortino, 2),
        "max_drawdown": round(max_dd, 2),
        "confidence": strat.confidence,
        "regimes": {
            "trending": trend_res,
            "ranging": range_res,
            "high_volatility": vol_res
        },
        "trades": [
            {
                "id": tIdx + 1,
                "entry_price": round(t["entry_price"], 2),
                "exit_price": round(t["exit_price"], 2),
                "return_pct": round(t["return_pct"], 2),
                "status": t["status"]
            }
            for tIdx, t in enumerate(full_res["trades"])
        ]
    }

@router.post("/promote")
async def promote_strategy(
    req: PromoteStrategyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    from models import AIKnowledge, TradeHistory
    from datetime import datetime
    
    # 1. Fetch strategy rules
    strat = await db.get(AIKnowledge, req.strategy_id)
    if not strat:
        raise HTTPException(status_code=404, detail="Strategy not found.")
        
    current_status = getattr(strat, 'status', 'LEARNED') or 'LEARNED'
    
    # Validation gates
    if req.target_status == "PAPER_VALIDATED":
        if current_status != "BACKTESTED":
            raise HTTPException(status_code=400, detail="Strategy must be BACKTESTED before promoting to PAPER_VALIDATED.")
            
        # Check Completed trades in TradeHistory (demo mode)
        stmt_trades = select(TradeHistory).where(
            TradeHistory.strategy_id == req.strategy_id,
            TradeHistory.status != "OPEN"
        )
        res_trades = await db.execute(stmt_trades)
        trades = res_trades.scalars().all()
        
        if len(trades) < 10:
            raise HTTPException(
                status_code=400,
                detail=f"Validation failed: Strategy has only completed {len(trades)} paper trades, need >= 10."
            )
            
        # Calculate win rate
        wins = 0
        for t in trades:
            # Parse positive returns, e.g. +2.45%
            ret_str = t.return_pct.replace("%", "").strip()
            try:
                ret_val = float(ret_str)
                if ret_val >= 0:
                    wins += 1
            except ValueError:
                pass
                
        win_rate = (wins / len(trades)) * 100.0
        if win_rate < 55.0:
            raise HTTPException(
                status_code=400,
                detail=f"Validation failed: Strategy paper win rate is {win_rate:.2f}%, need >= 55%."
            )
            
    elif req.target_status == "LIVE_APPROVED":
        if current_status != "PAPER_VALIDATED":
            raise HTTPException(status_code=400, detail="Strategy must be PAPER_VALIDATED before promoting to LIVE_APPROVED.")
            
        # Check Completed trades in TradeHistory
        stmt_trades = select(TradeHistory).where(
            TradeHistory.strategy_id == req.strategy_id,
            TradeHistory.status != "OPEN"
        )
        res_trades = await db.execute(stmt_trades)
        trades = res_trades.scalars().all()
        
        if len(trades) < 15:
            raise HTTPException(
                status_code=400,
                detail=f"Validation failed: Strategy has only completed {len(trades)} paper trades, need >= 15."
            )
            
        # Calculate win rate and drift vs backtest
        wins = 0
        for t in trades:
            ret_str = t.return_pct.replace("%", "").strip()
            try:
                ret_val = float(ret_str)
                if ret_val >= 0:
                    wins += 1
            except ValueError:
                pass
                
        live_win_rate = (wins / len(trades)) * 100.0
        backtest_win_rate = getattr(strat, 'backtest_win_rate', 0.0) or 0.0
        
        drift = abs(backtest_win_rate - live_win_rate)
        if drift > 15.0:
            raise HTTPException(
                status_code=400,
                detail=f"Validation failed: Strategy has high performance drift ({drift:.2f} points, max 15 allowed). Backtest: {backtest_win_rate:.2f}%, Live: {live_win_rate:.2f}%."
            )
            
    else:
        raise HTTPException(status_code=400, detail=f"Invalid target status: '{req.target_status}'")
        
    # Promote status
    strat.status = req.target_status
    history = json.loads(getattr(strat, 'status_history', '[]') or '[]')
    history.append({
        "timestamp": datetime.utcnow().isoformat(),
        "from_status": current_status,
        "to_status": req.target_status,
        "reason": f"Manually promoted after meeting all stage requirements."
    })
    strat.status_history = json.dumps(history)
    await db.commit()
    
    return {
        "success": True,
        "new_status": req.target_status,
        "strategy_title": strat.title
    }
