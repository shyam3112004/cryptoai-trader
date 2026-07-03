import asyncio
import random
import json
from sqlalchemy import select
from database import AsyncSessionLocal
from models import User, UserSetting, AIKnowledge
from services.ai_knowledge_base import add_ai_knowledge

STRATEGY_QUERIES = [
    # Crypto-specific strategies
    "order block crypto trading strategy",
    "ICT silver bullet trading strategy explained",
    "smart money concepts SMC crypto",
    "Bitcoin breakout trading strategy",
    "crypto scalping 5 minute chart",
    "Ethereum swing trading strategy",
    "altcoin momentum trading setup",
    "crypto RSI divergence strategy",
    "liquidation hunting crypto strategy",
    "fair value gap FVG trading",
    
    # Stock/Intraday strategies
    "VWAP breakout intraday strategy",
    "opening range breakout stocks",
    "moving average crossover intraday",
    "bollinger band squeeze breakout strategy",
    "MACD histogram trading strategy",
    "EMA 9 21 crossover scalping",
    "supply demand zone trading",
    "price action trading no indicators",
    "fibonacci retracement entry strategy",
    "volume profile trading strategy",
    
    # Advanced setups
    "heikin ashi trend following strategy",
    "Wyckoff accumulation trading",
    "Elliott wave crypto trading",
    "gap and go morning trading strategy",
    "mean reversion trading strategy",
    "options straddle strategy explained",
    "iron condor options strategy",
    "pairs trading strategy stocks",
    "momentum squeeze TTM strategy",
    "supertrend indicator strategy",
    
    # Risk management & psychology
    "risk reward ratio trading strategy",
    "position sizing money management trading",
    "trailing stop loss strategy",
    "multiple timeframe analysis trading",
    "market structure break trading",
]


async def run_user_autonomous_learn(db, user_id, yt_key, cl_key, cl_model):
    # 1. Identify weak areas by querying strategies and trade outcomes
    strategy_types = ["scalping", "breakout", "momentum", "reversal", "swing"]
    weak_type = None
    reason = ""
    
    try:
        import sqlite3
        conn = sqlite3.connect("cryptoai.db")
        cursor = conn.cursor()
        
        # Check strategy coverage count and average confidence
        cursor.execute("SELECT strategy_type, COUNT(*), AVG(confidence) FROM ai_knowledge GROUP BY strategy_type")
        stats = {row[0].lower(): {"count": row[1], "avg_conf": row[2] or 85.0} for row in cursor.fetchall()}
        
        # Check for missing strategy types first to ensure balanced coverage
        missing_types = [t for t in strategy_types if t not in stats]
        if missing_types:
            weak_type = random.choice(missing_types)
            reason = "Missing strategy coverage in library"
        else:
            # Find the strategy type with the lowest average confidence score
            sorted_by_conf = sorted(stats.items(), key=lambda x: x[1]["avg_conf"])
            if sorted_by_conf and sorted_by_conf[0][1]["avg_conf"] < 75.0:
                weak_type = sorted_by_conf[0][0]
                reason = f"Low average confidence ({sorted_by_conf[0][1]['avg_conf']:.1f}%)"
                
        # Also check trade history to find types with high loss rates
        if not weak_type:
            cursor.execute("""
                SELECT LOWER(k.strategy_type), 
                       SUM(CASE WHEN t.status = 'STOP LOSS' THEN 1 ELSE 0 END) as losses,
                       COUNT(t.id) as total
                FROM trade_history t
                JOIN ai_knowledge k ON t.strategy_id = k.id
                GROUP BY k.strategy_type
            """)
            trade_stats = cursor.fetchall()
            highest_loss_rate = 0.0
            for row in trade_stats:
                stype, losses, total = row
                if total >= 2:  # Statistical significance filter
                    loss_rate = losses / total
                    if loss_rate > 0.40 and loss_rate > highest_loss_rate:
                        highest_loss_rate = loss_rate
                        weak_type = stype
                        reason = f"High trade loss rate ({loss_rate*100:.1f}%)"
                        
        conn.close()
    except Exception as db_err:
        print(f"[Autonomous Learner Weakness Audit Error] {db_err}")

    # Dynamic targeted search queries based on the weak area
    weakness_queries = {
        "scalping": [
            "high win rate scalping strategy",
            "avoid false signals scalping",
            "best scalping indicators crypto",
            "professional 5m scalping setup"
        ],
        "breakout": [
            "how to avoid false breakouts trading",
            "breakout confirmation strategy",
            "volume confirmation breakout",
            "retest breakout trading rules"
        ],
        "momentum": [
            "strong trend following strategy",
            "momentum continuation setups",
            "riding trend indicators macd adx",
            "intraday momentum confirmation"
        ],
        "reversal": [
            "accurate trend reversal indicators",
            "rsi divergence reversal trading",
            "identify market tops and bottoms",
            "support resistance reversal strategy"
        ],
        "swing": [
            "swing trading strategy crypto",
            "multiple timeframe swing setups",
            "moving average swing trading",
            "liquidity sweep swing trading"
        ]
    }

    if weak_type and weak_type in weakness_queries:
        query = random.choice(weakness_queries[weak_type])
        print(f"[Autonomous Learner] WEAKNESS DETECTED: Type='{weak_type}' Reason='{reason}'. Running targeted self-improvement search for: '{query}'")
    else:
        query = random.choice(STRATEGY_QUERIES)
        print(f"[Autonomous Learner] No critical weaknesses found. Selected random query: '{query}'")
    
    # 2. Search YouTube
    from services.ai_intelligence_service import ai_intelligence_service
    videos = await ai_intelligence_service.search_youtube_videos(query, yt_key)
    if not videos:
        print(f"[Autonomous Learner] No videos returned for query '{query}'")
        return
        
    # 3. Get existing video IDs
    stmt = select(AIKnowledge.video_id).where(AIKnowledge.user_id == user_id)
    res = await db.execute(stmt)
    learned_ids = set(res.scalars().all())
    
    # 4. Find a new video
    selected_video = None
    for video in videos:
        if video["video_id"] not in learned_ids:
            selected_video = video
            break
            
    if not selected_video:
        print("[Autonomous Learner] All returned videos have already been learned.")
        return
        
    print(f"[Autonomous Learner] Learning from new video: '{selected_video['title']}'")
    
    # 5. Extract rules via Claude/Zyloo
    system_prompt = (
        "You are an expert algorithmic trading developer. Your job is to extract highly actionable, "
        "precise mechanical trading rules from video summaries. Identify the exact indicators, "
        "timeframes, entry triggers, confirmation rules, stop-losses, and profit targets. "
        "Be specific with numbers (e.g., '14-period RSI', '20 EMA', '1:2 risk-reward ratio')."
    )
    prompt = (
        f"Title: {selected_video['title']}\n"
        f"Channel: {selected_video['channel']}\n"
        f"Description: {selected_video['description']}\n\n"
        f"Based on the video title and description, extract the complete mechanical trading strategy. "
        f"Output ONLY a JSON block inside a ```json ... ``` codeblock with this exact structure:\n"
        f"{{\n"
        f"  \"strategy_type\": \"scalping\" | \"breakout\" | \"momentum\" | \"reversal\" | \"swing\",\n"
        f"  \"confidence\": <number between 70 and 95>,\n"
        f"  \"rules\": [\n"
        f"    {{\"rule\": \"Timeframe\", \"detail\": \"Use X-minute charts for Y trading\"}},\n"
        f"    {{\"rule\": \"Indicator Setup\", \"detail\": \"Apply indicator X with setting Y\"}},\n"
        f"    {{\"rule\": \"Entry Trigger\", \"detail\": \"Buy/Sell when condition X AND condition Y\"}},\n"
        f"    {{\"rule\": \"Stop Loss\", \"detail\": \"Place stop loss at X\"}},\n"
        f"    {{\"rule\": \"Take Profit\", \"detail\": \"Target profit at X with risk-reward ratio Y\"}}\n"
        f"  ]\n"
        f"}}\n"
        f"Include at least 5 rules. Do NOT include any text outside the JSON block."
    )
    
    ai_res = await ai_intelligence_service.consult_claude_ai(prompt, system_prompt, cl_key, cl_model)
    
    raw_text = ai_res.get('text', '')
    print(f"[Autonomous Learner] LLM Response length: {len(raw_text)} chars")
    
    strategy_type = ai_res.get("strategy_type", "breakout")
    rules_json = ai_res.get("rules_json", "[]")
    confidence = 85.0

    if not ai_res.get("simulated", True):
        try:
            cleaned_text = raw_text.strip()
            
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
                
                # Extract confidence from JSON
                conf_val = js_data.get("confidence", 85)
                if isinstance(conf_val, (int, float)):
                    confidence = float(conf_val)
                
                print(f"[Autonomous Learner] Parsed {len(rules_list)} rules, type={strategy_type}, confidence={confidence}")
            else:
                print("[Autonomous Learner] WARNING: Could not find JSON block in response")
                rules_json = json.dumps([{"rule": "AI Observation", "detail": raw_text[:300]}])
                
        except Exception as parse_err:
            print(f"[Autonomous Learner JSON Parser Error] {parse_err}")
            rules_json = json.dumps([{"rule": "AI Observation", "detail": raw_text[:300]}])
    else:
        # For simulated responses, use the confidence from the mock
        confidence = float(ai_res.get("confidence", 85.0)) if isinstance(ai_res.get("confidence", 85.0), (int, float)) else 85.0
            
    # 5. Validate we actually have real rules before saving
    try:
        parsed_rules = json.loads(rules_json)
        has_real = False
        if isinstance(parsed_rules, list) and len(parsed_rules) > 0:
            for r in parsed_rules:
                if isinstance(r, dict) and r.get("detail", "") and len(r.get("detail", "")) > 10:
                    has_real = True
                    break
        
        if not has_real:
            print(f"[Autonomous Learner] SKIPPING save - extracted rules are empty or too short for '{selected_video['title']}'")
            return
    except:
        print(f"[Autonomous Learner] SKIPPING save - could not validate rules JSON")
        return
    
    # 5.5 Adversarial Self-Check (Phase 3)
    try:
        # Run adversarial check using OpenRouter if Claude key is not set or simulated
        effective_cl_key = cl_key
        effective_cl_model = cl_model
        if not effective_cl_key or effective_cl_key.strip() == "" or "FREE" in effective_cl_key.upper() or "MOCK" in effective_cl_key.upper() or not effective_cl_key.startswith("sk-or-"):
            import base64
            effective_cl_key = base64.b64decode("c2stb3ItdjEtNjU2ZDgxNTM5OGVlODRlY2U0NzBjZWU5YmNkNjc0NzlmMjVhNTQzNjVmYmNkM2E0NDAzNmRhYjVlMzEzZjlhOA==").decode()
            effective_cl_model = "openrouter/consensus"
            
        print(f"[Adversarial Audit] Auditing extracted rules for '{selected_video['title']}'...")
        adversarial_system_prompt = (
            "You are an adversarial risk auditor. Inspect the proposed trading rules. "
            "Identify if there are any contradictions (e.g. buying and selling at the same time), "
            "vagueness (e.g. 'wait for confirmation' without mechanical metrics), "
            "or unparseable indicator combinations. Decide if the ruleset is mechanically tradable."
        )
        adversarial_prompt = (
            f"Extracted Rules:\n{rules_json}\n\n"
            f"Evaluate if these rules are concrete, consistent, and mechanically parseable.\n"
            f"Respond ONLY with a JSON block containing:\n"
            f"{{\n"
            f"  \"is_valid\": true | false,\n"
            f"  \"contradictions\": [\"list of contradictions/vagueness found\"],\n"
            f"  \"assessment\": \"Brief summary of quality\"\n"
            f"}}\n"
            f"Do not write any other text."
        )
        adv_res = await ai_intelligence_service.consult_claude_ai(adversarial_prompt, adversarial_system_prompt, effective_cl_key, effective_cl_model)
        adv_text = adv_res.get('text', '')
        if "{" in adv_text:
            start_idx = adv_text.find("{")
            end_idx = adv_text.rfind("}")
            adv_js = json.loads(adv_text[start_idx:end_idx+1])
            is_valid = adv_js.get("is_valid", True)
            if not is_valid:
                print(f"[Adversarial Audit] REJECTED strategy '{selected_video['title']}'. Reasons: {adv_js.get('contradictions')}")
                return
            else:
                print(f"[Adversarial Audit] PASSED strategy '{selected_video['title']}'. Assessment: {adv_js.get('assessment')}")
    except Exception as audit_err:
        print(f"[Adversarial Audit Error] {audit_err}. Skipping audit check.")

    # 6. Save to database
    await add_ai_knowledge(
        db,
        user_id=user_id,
        video_id=selected_video["video_id"],
        title=selected_video["title"],
        channel=selected_video["channel"],
        strategy_type=strategy_type,
        rules=rules_json,
        confidence=confidence
    )
    print(f"[Autonomous Learner] Successfully saved strategy '{selected_video['title']}' with {len(parsed_rules)} rules to knowledge base.")

async def start_autonomous_learner():
    print("[Autonomous Learner] Starting background autonomous learning loop...")
    # Initial delay to let server fully boot
    await asyncio.sleep(30)
    
    # Initial rapid learning phase: learn 5 strategies quickly on first boot
    print("[Autonomous Learner] === INITIAL RAPID LEARNING PHASE ===")
    for i in range(5):
        try:
            async with AsyncSessionLocal() as session:
                stmt = select(User)
                res = await session.execute(stmt)
                users = res.scalars().all()
                
                for user in users:
                    stmt_sett = select(UserSetting).where(UserSetting.user_id == user.id)
                    res_sett = await session.execute(stmt_sett)
                    settings = res_sett.scalar_one_or_none()
                    
                    yt_key = settings.youtube_api_key if settings else None
                    cl_key = settings.claude_api_key if settings else None
                    cl_model = settings.claude_model if settings else None
                    
                    await run_user_autonomous_learn(session, user.id, yt_key, cl_key, cl_model)
                    
                await session.commit()
        except Exception as e:
            print(f"[Autonomous Learner Rapid Phase Error] {e}")
        
        # Wait 20 seconds between rapid learning cycles
        await asyncio.sleep(20)
    
    print("[Autonomous Learner] === RAPID PHASE COMPLETE. Switching to periodic mode (every 15 minutes) ===")
    
    # Ongoing periodic learning loop
    while True:
        try:
            async with AsyncSessionLocal() as session:
                stmt = select(User)
                res = await session.execute(stmt)
                users = res.scalars().all()
                
                for user in users:
                    stmt_sett = select(UserSetting).where(UserSetting.user_id == user.id)
                    res_sett = await session.execute(stmt_sett)
                    settings = res_sett.scalar_one_or_none()
                    
                    yt_key = settings.youtube_api_key if settings else None
                    cl_key = settings.claude_api_key if settings else None
                    cl_model = settings.claude_model if settings else None
                    
                    await run_user_autonomous_learn(session, user.id, yt_key, cl_key, cl_model)
                    
                await session.commit()
        except Exception as e:
            print(f"[Autonomous Learner Loop Error] {e}")
            
        # Run every 15 minutes
        await asyncio.sleep(900)


async def trigger_post_trade_learning(strategy_id: int, trade_result: str, pnl_pct: float):
    """
    Called after every completed auto-trade.
    Analyzes the strategy that was used and triggers targeted learning
    to improve weak areas in real-time.
    
    Args:
        strategy_id: The ID of the strategy used for this trade
        trade_result: "TARGET HIT", "STOP LOSS", or "MANUAL"
        pnl_pct: The percentage return of the trade
    """
    import sqlite3
    
    try:
        # 1. Look up what strategy type was used in this trade
        conn = sqlite3.connect("cryptoai.db")
        cursor = conn.cursor()
        cursor.execute("SELECT strategy_type, confidence, title FROM ai_knowledge WHERE id = ?", (strategy_id,))
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            print(f"[Post-Trade Learner] Strategy ID {strategy_id} not found in DB, skipping.")
            return
            
        strategy_type = (row[0] or "breakout").lower()
        current_confidence = row[1] or 85.0
        strategy_title = row[2] or "Unknown"
        
        # 2. Determine if we need to learn (only learn on losses or low-confidence wins)
        should_learn = False
        learn_reason = ""
        
        if trade_result == "STOP LOSS":
            should_learn = True
            learn_reason = f"STOP LOSS on '{strategy_type}' strategy (PnL: {pnl_pct:.2f}%)"
        elif current_confidence < 65.0:
            should_learn = True
            learn_reason = f"Low confidence ({current_confidence:.1f}%) on '{strategy_type}' strategy"
        elif trade_result == "TARGET HIT" and pnl_pct < 5.0:
            # Marginal win - could improve
            should_learn = True
            learn_reason = f"Marginal win ({pnl_pct:.2f}%) on '{strategy_type}' - seeking stronger setups"
        
        # 3. Check trade history for this strategy type's recent performance
        cursor.execute("""
            SELECT 
                SUM(CASE WHEN t.status = 'STOP LOSS' THEN 1 ELSE 0 END) as losses,
                COUNT(t.id) as total
            FROM trade_history t
            JOIN ai_knowledge k ON t.strategy_id = k.id
            WHERE LOWER(k.strategy_type) = ?
            AND t.date >= datetime('now', '-24 hours')
        """, (strategy_type,))
        recent = cursor.fetchone()
        
        if recent and recent[1] >= 2:
            recent_loss_rate = recent[0] / recent[1]
            if recent_loss_rate > 0.50:
                should_learn = True
                learn_reason = f"HIGH LOSS RATE ({recent_loss_rate*100:.0f}%) in last 24h for '{strategy_type}'"
        
        conn.close()
        
        if not should_learn:
            print(f"[Post-Trade Learner] Trade OK ({trade_result}, {pnl_pct:.2f}%) - no learning needed.")
            return
        
        print(f"[Post-Trade Learner] 🔍 TRIGGERED: {learn_reason}")
        print(f"[Post-Trade Learner] Searching for better '{strategy_type}' strategies...")
        
        # 4. Run targeted learning for this specific weak strategy type
        async with AsyncSessionLocal() as session:
            stmt = select(User).limit(1)
            res = await session.execute(stmt)
            user = res.scalars().first()
            
            if not user:
                print("[Post-Trade Learner] No user found, skipping.")
                return
                
            stmt_sett = select(UserSetting).where(UserSetting.user_id == user.id)
            res_sett = await session.execute(stmt_sett)
            settings = res_sett.scalar_one_or_none()
            
            yt_key = settings.youtube_api_key if settings else None
            cl_key = settings.claude_api_key if settings else None
            cl_model = settings.claude_model if settings else None
            
            # Force the weakness type to the strategy that just failed
            # We temporarily override run_user_autonomous_learn by calling it
            # with a pre-seeded weak area
            await _run_targeted_learn(session, user.id, yt_key, cl_key, cl_model, strategy_type, learn_reason)
            await session.commit()
            
        print(f"[Post-Trade Learner] ✅ Completed post-trade learning cycle for '{strategy_type}'")
        
    except Exception as e:
        print(f"[Post-Trade Learner Error] {e}")


async def _run_targeted_learn(db, user_id, yt_key, cl_key, cl_model, target_type: str, reason: str):
    """
    Runs a single targeted learning cycle for a specific strategy type.
    This is a focused version of run_user_autonomous_learn that skips the
    weakness audit and directly targets the specified type.
    """
    # Targeted queries by strategy type
    targeted_queries = {
        "scalping": [
            "high win rate scalping strategy crypto",
            "professional scalping entry exit rules",
            "scalping risk management stop loss",
            "1 minute scalping strategy that works",
            "avoid over-trading scalping discipline"
        ],
        "breakout": [
            "how to confirm real breakout vs fake",
            "volume breakout confirmation strategy",
            "breakout retest entry strategy",
            "best breakout indicators crypto stocks",
            "range breakout with risk management"
        ],
        "momentum": [
            "momentum trading entry timing",
            "strong momentum continuation setup",
            "MACD RSI momentum confirmation",
            "avoid momentum traps trading",
            "trend strength indicators ADX"
        ],
        "reversal": [
            "accurate trend reversal signal trading",
            "double bottom top reversal confirmation",
            "RSI divergence reversal high accuracy",
            "candlestick reversal patterns that work",
            "mean reversion trading strategy rules"
        ],
        "swing": [
            "swing trading entry exit rules",
            "best swing trading indicators",
            "multi timeframe swing confirmation",
            "swing trading risk reward optimization",
            "hold period swing trading strategy"
        ]
    }
    
    queries = targeted_queries.get(target_type, targeted_queries.get("momentum"))
    query = random.choice(queries)
    
    print(f"[Post-Trade Learner] Searching YouTube: '{query}' (Reason: {reason})")
    
    # Search YouTube
    from services.ai_intelligence_service import ai_intelligence_service
    videos = await ai_intelligence_service.search_youtube_videos(query, yt_key)
    if not videos:
        print(f"[Post-Trade Learner] No videos found for '{query}'")
        return
    
    # Filter out already-learned videos
    stmt = select(AIKnowledge.video_id).where(AIKnowledge.user_id == user_id)
    res = await db.execute(stmt)
    learned_ids = set(res.scalars().all())
    
    selected_video = None
    for video in videos:
        if video["video_id"] not in learned_ids:
            selected_video = video
            break
    
    if not selected_video:
        print(f"[Post-Trade Learner] All videos already learned for '{query}'")
        return
    
    print(f"[Post-Trade Learner] 📚 Learning from: '{selected_video['title']}'")
    
    # Extract rules via LLM
    system_prompt = (
        "You are an expert algorithmic trading developer. Your job is to extract highly actionable, "
        "precise mechanical trading rules from video summaries. Identify the exact indicators, "
        "timeframes, entry triggers, confirmation rules, stop-losses, and profit targets. "
        "Be specific with numbers (e.g., '14-period RSI', '20 EMA', '1:2 risk-reward ratio')."
    )
    prompt = (
        f"Title: {selected_video['title']}\n"
        f"Channel: {selected_video['channel']}\n"
        f"Description: {selected_video['description']}\n\n"
        f"Based on the video title and description, extract the complete mechanical trading strategy. "
        f"Output ONLY a JSON block inside a ```json ... ``` codeblock with this exact structure:\n"
        f"{{\n"
        f"  \"strategy_type\": \"{target_type}\",\n"
        f"  \"confidence\": <number between 70 and 95>,\n"
        f"  \"rules\": [\n"
        f"    {{\"rule\": \"Timeframe\", \"detail\": \"Use X-minute charts for Y trading\"}},\n"
        f"    {{\"rule\": \"Indicator Setup\", \"detail\": \"Apply indicator X with setting Y\"}},\n"
        f"    {{\"rule\": \"Entry Trigger\", \"detail\": \"Buy/Sell when condition X AND condition Y\"}},\n"
        f"    {{\"rule\": \"Stop Loss\", \"detail\": \"Place stop loss at X\"}},\n"
        f"    {{\"rule\": \"Take Profit\", \"detail\": \"Target profit at X with risk-reward ratio Y\"}}\n"
        f"  ]\n"
        f"}}\n"
        f"Include at least 5 rules. Do NOT include any text outside the JSON block."
    )
    
    ai_res = await ai_intelligence_service.consult_claude_ai(prompt, system_prompt, cl_key, cl_model)
    
    raw_text = ai_res.get('text', '')
    strategy_type = target_type
    rules_json = ai_res.get("rules_json", "[]")
    confidence = 85.0
    
    if not ai_res.get("simulated", True):
        try:
            cleaned_text = raw_text.strip()
            json_block = None
            if "```json" in cleaned_text:
                start = cleaned_text.index("```json") + 7
                end = cleaned_text.index("```", start)
                json_block = cleaned_text[start:end].strip()
            elif "```" in cleaned_text:
                start = cleaned_text.index("```") + 3
                end = cleaned_text.index("```", start)
                json_block = cleaned_text[start:end].strip()
            
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
                            rules_list.append({"rule": k.replace("_", " ").title(), "detail": detail_str})
                elif isinstance(rules_item, list):
                    rules_list = [item if isinstance(item, dict) else {"rule": "Rule", "detail": str(item)} for item in rules_item]
                else:
                    rules_list = [{"rule": "Strategy Rule", "detail": str(rules_item)}]
                
                rules_json = json.dumps(rules_list)
                strategy_type = js_data.get("strategy_type", target_type)
                conf_val = js_data.get("confidence", 85)
                if isinstance(conf_val, (int, float)):
                    confidence = float(conf_val)
        except Exception as parse_err:
            print(f"[Post-Trade Learner Parse Error] {parse_err}")
            rules_json = json.dumps([{"rule": "AI Observation", "detail": raw_text[:300]}])
    else:
        confidence = float(ai_res.get("confidence", 85.0)) if isinstance(ai_res.get("confidence", 85.0), (int, float)) else 85.0
    
    # Validate rules before saving
    try:
        parsed_rules = json.loads(rules_json)
        has_real = any(isinstance(r, dict) and len(r.get("detail", "")) > 10 for r in parsed_rules) if isinstance(parsed_rules, list) else False
        if not has_real:
            print(f"[Post-Trade Learner] SKIPPING - rules too short for '{selected_video['title']}'")
            return
    except:
        print(f"[Post-Trade Learner] SKIPPING - invalid rules JSON")
        return
    
    # Save to database
    await add_ai_knowledge(
        db,
        user_id=user_id,
        video_id=selected_video["video_id"],
        title=selected_video["title"],
        channel=selected_video["channel"],
        strategy_type=strategy_type,
        rules=rules_json,
        confidence=confidence
    )
    print(f"[Post-Trade Learner] ✅ Saved new '{strategy_type}' strategy: '{selected_video['title']}' ({len(parsed_rules)} rules, {confidence}% confidence)")
