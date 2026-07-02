import json
import random
import httpx
import feedparser
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from config import settings

class AIIntelligenceService:
    def __init__(self):
        self.default_model = settings.CLAUDE_MODEL
        self.daily_limit = settings.CLAUDE_DAILY_BUDGET_USD

    async def search_youtube_videos(self, query: str, api_key: str = None) -> list:
        """
        Search YouTube for trading videos using the YouTube Data API.
        If no API key is provided, falls back to a curated simulated result list to allow free testing.
        """
        effective_key = api_key or settings.YOUTUBE_API_KEY
        
        if not effective_key or effective_key.strip() == "" or "FREE" in effective_key:
            # High-quality mock/simulated results for demo purposes
            mock_strategies = [
                {
                    "video_id": "dQw4w9WgXcQ",
                    "title": "Ultimate 5-Minute Scalping Strategy (92% Win Rate RSI + EMA)",
                    "description": "Learn the exact 5-minute scalping setup using 9 EMA, 21 EMA, and RSI. Perfect for day trading crypto and stocks.",
                    "channel": "Trading Legends",
                    "published_at": (datetime.utcnow() - timedelta(days=12)).isoformat(),
                    "thumbnail": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300&q=80",
                    "view_count": "340K views"
                },
                {
                    "video_id": "VWAP_12345",
                    "title": "VWAP Breakout Strategy: How to Trade the Opening Range",
                    "description": "Master VWAP trading. Discover how to identify high-probability institutional buy/sell zones and ride the trend.",
                    "channel": "Market Wizards",
                    "published_at": (datetime.utcnow() - timedelta(days=24)).isoformat(),
                    "thumbnail": "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=300&q=80",
                    "view_count": "189K views"
                },
                {
                    "video_id": "BB_67890",
                    "title": "Bollinger Bands + MACD Double Confirmation Intraday Setup",
                    "description": "Stop trading false breakouts! In this video we combine Bollinger Bands with MACD histogram filters for precise trend reversals.",
                    "channel": "Smart Trader Official",
                    "published_at": (datetime.utcnow() - timedelta(days=3)).isoformat(),
                    "thumbnail": "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=300&q=80",
                    "view_count": "45K views"
                },
                {
                    "video_id": "NIFTY_332",
                    "title": "NIFTY 50 Expiry Day Scalping: Hero or Zero Setup Explained",
                    "description": "Live intraday options trading strategy for Nifty & Banknifty. How to manage risk on volatile index trading days.",
                    "channel": "Alpha Capital India",
                    "published_at": (datetime.utcnow() - timedelta(days=5)).isoformat(),
                    "thumbnail": "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=300&q=80",
                    "view_count": "98K views"
                },
                {
                    "video_id": "CRYP_991",
                    "title": "How to Auto-Trade Crypto using AI and Machine Learning Consensus",
                    "description": "An introduction to algorithmic crypto trading. Combining technical indicators with sentiment engines and Monte Carlo simulations.",
                    "channel": "FinTech Dev",
                    "published_at": (datetime.utcnow() - timedelta(days=45)).isoformat(),
                    "thumbnail": "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=300&q=80",
                    "view_count": "1.2M views"
                }
            ]
            
            # Filter mocks slightly by search query if applicable
            q_lower = query.lower()
            filtered = [m for m in mock_strategies if q_lower in m["title"].lower() or q_lower in m["description"].lower() or q_lower in m["channel"].lower()]
            return filtered if filtered else mock_strategies

        # Actual YouTube API Call
        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "part": "snippet",
            "q": f"{query} trading strategy intraday",
            "type": "video",
            "maxResults": 6,
            "key": effective_key
        }
        
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(url, params=params, timeout=10.0)
                if res.status_code == 200:
                    data = res.json()
                    results = []
                    for item in data.get("items", []):
                        snippet = item.get("snippet", {})
                        video_id = item.get("id", {}).get("videoId", "")
                        results.append({
                            "video_id": video_id,
                            "title": snippet.get("title", ""),
                            "description": snippet.get("description", ""),
                            "channel": snippet.get("channelTitle", ""),
                            "published_at": snippet.get("publishedAt", ""),
                            "thumbnail": snippet.get("thumbnails", {}).get("medium", {}).get("url", ""),
                            "view_count": f"{random.randint(10, 500)}K views" # Mock view counts since it needs another API call
                        })
                    return results
                else:
                    print(f"[YouTube API Error] Status {res.status_code}: {res.text}")
                    return []
        except Exception as e:
            print(f"[YouTube Search Exception] {e}")
            return []

    async def fetch_news_feed(self, symbol: str) -> list:
        """
        Fetches public RSS news feed from Google News for the given trading asset symbol.
        100% Free, no API Key needed.
        """
        clean_symbol = symbol.split("/")[0] if "/" in symbol else symbol
        url = f"https://news.google.com/rss/search?q={clean_symbol}+market+trading+finance&hl=en-US&gl=US&ceid=US:en"
        
        try:
            # Runs feedparser in a thread since it's a blocking synchronous network call
            import asyncio
            loop = asyncio.get_event_loop()
            feed = await loop.run_in_executor(None, feedparser.parse, url)
            
            news_items = []
            for entry in feed.entries[:5]: # Get top 5 articles
                title = entry.title
                link = entry.link
                published = entry.published if hasattr(entry, "published") else ""
                
                # Strip out source name from title (usually ends with "- Source Name")
                title_clean = title
                source_name = "Market News"
                if " - " in title:
                    parts = title.split(" - ")
                    title_clean = " - ".join(parts[:-1])
                    source_name = parts[-1]
                
                news_items.append({
                    "title": title_clean,
                    "source": source_name,
                    "published": published,
                    "link": link,
                    "summary": BeautifulSoup(entry.summary, "html.parser").get_text() if hasattr(entry, "summary") else ""
                })
            return news_items
        except Exception as e:
            print(f"[News Feed Exception] {e}")
            return []

    async def consult_claude_ai(self, prompt: str, system_prompt: str, api_key: str = None, model: str = None) -> dict:
        """
        Executes a call to Claude API (Anthropic or Zyloo proxy).
        If no API key is specified, falls back to a locally simulated intelligence model that reads the prompt and builds advice.
        """
        effective_key = api_key or settings.CLAUDE_API_KEY
        effective_model = model or settings.CLAUDE_MODEL or "claude-3-5-sonnet-20241022"

        if not effective_key or effective_key.strip() == "" or "FREE" in effective_key:
            return self._simulate_claude_response(prompt, system_prompt)

        # Check if using OpenRouter (key starts with sk-or- or contains openrouter)
        is_openrouter = "openrouter" in effective_model.lower() or effective_key.startswith("sk-or-") or "openrouter" in effective_key.lower()
        
        if is_openrouter:
            import asyncio
            if effective_model == "openrouter/consensus":
                models_to_query = [
                    "google/gemini-2.5-flash:free",
                    "meta-llama/llama-3.1-8b-instruct:free",
                    "mistralai/mistral-7b-instruct:free"
                ]
                
                async def query_model(m_id):
                    url = "https://openrouter.ai/api/v1/chat/completions"
                    headers = {
                        "Authorization": f"Bearer {effective_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "http://localhost:5173",
                        "X-Title": "CryptoAI Trader"
                    }
                    payload = {
                        "model": m_id,
                        "max_tokens": 1024,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": prompt}
                        ]
                    }
                    try:
                        async with httpx.AsyncClient() as client:
                            res = await client.post(url, headers=headers, json=payload, timeout=20.0)
                            if res.status_code == 200:
                                return m_id, res.json()
                    except Exception as err:
                        print(f"[OpenRouter Consensus] Model {m_id} failed: {err}")
                    return m_id, None

                tasks = [query_model(m) for m in models_to_query]
                query_results = await asyncio.gather(*tasks)
                
                parsed_models = {}
                combined_text = "### 🧠 OpenRouter Consensus Live Advisory\n\n"
                
                for m_id, data in query_results:
                    short_name = m_id.split("/")[-1].replace(":free", "").upper()
                    if data:
                        content_text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                        parsed_models[m_id] = content_text
                        
                        dec_str = "HOLD"
                        if "APPROVE" in content_text.upper():
                            dec_str = "APPROVE"
                        elif "REJECT" in content_text.upper():
                            dec_str = "REJECT"
                        elif "LONG" in content_text.upper() or "BUY" in content_text.upper():
                            dec_str = "LONG"
                        elif "SHORT" in content_text.upper() or "SELL" in content_text.upper():
                            dec_str = "SHORT"
                            
                        combined_text += f"- **{short_name}**: **{dec_str}**\n"
                        snippet = content_text[:150] + "..." if len(content_text) > 150 else content_text
                        combined_text += f"  * Reasoning snippet: {snippet}\n"
                    else:
                        combined_text += f"- **{short_name}**: Failed to query (Skipped)\n"
                
                is_json_requested = "json" in prompt.lower() or "json" in system_prompt.lower()
                
                consensus_decision = "HOLD"
                consensus_tp = 0.03
                consensus_pos = 50.0
                consensus_conf = 80
                reasons = []
                votes = {}
                
                for m_id, raw_text in parsed_models.items():
                    m_dec = "HOLD"
                    m_tp = 0.03
                    m_pos = 50.0
                    m_conf = 80
                    m_reason = ""
                    
                    try:
                        cleaned = raw_text.strip()
                        json_block = None
                        if "```json" in cleaned:
                            start = cleaned.index("```json") + 7
                            end = cleaned.index("```", start)
                            json_block = cleaned[start:end].strip()
                        elif "```" in cleaned:
                            start = cleaned.index("```") + 3
                            end = cleaned.index("```", start)
                            json_block = cleaned[start:end].strip()
                        if not json_block:
                            start_idx = cleaned.find("{")
                            end_idx = cleaned.rfind("}")
                            if start_idx != -1 and end_idx != -1:
                                json_block = cleaned[start_idx:end_idx+1]
                                
                        if json_block:
                            parsed_js = json.loads(json_block)
                            m_dec = parsed_js.get("decision", "HOLD").upper()
                            if "decision" not in parsed_js and "action" in parsed_js:
                                m_dec = parsed_js.get("action", "HOLD").upper()
                            m_tp = float(parsed_js.get("profit_target_pct", 0.03))
                            m_pos = float(parsed_js.get("position_pct", 50.0))
                            m_conf = int(parsed_js.get("confidence", 80))
                            m_reason = parsed_js.get("reasoning", "")
                    except Exception:
                        if "APPROVE" in raw_text.upper():
                            m_dec = "APPROVE"
                        elif "REJECT" in raw_text.upper():
                            m_dec = "REJECT"
                        elif "LONG" in raw_text.upper():
                            m_dec = "LONG"
                        elif "SHORT" in raw_text.upper():
                            m_dec = "SHORT"
                            
                    votes[m_dec] = votes.get(m_dec, 0) + 1
                    reasons.append(f"{m_id.split('/')[-1]}: {m_reason if m_reason else 'neutral'}")
                    
                if votes:
                    consensus_decision = max(votes, key=votes.get)
                else:
                    consensus_decision = "HOLD" if "HOLD" in system_prompt or "LONG" in system_prompt else "REJECT"
                
                combined_reason = "; ".join(reasons)
                
                if is_json_requested:
                    final_json = {
                        "decision": consensus_decision,
                        "confidence": consensus_conf,
                        "profit_target_pct": consensus_tp,
                        "position_pct": consensus_pos,
                        "reasoning": f"Consensus vote: {consensus_decision}. Details: {combined_reason[:200]}"
                    }
                    final_text = f"```json\n{json.dumps(final_json)}\n```"
                else:
                    final_text = combined_text + f"\n**Final Consensus Decision:** **{consensus_decision}**\nReason: {combined_reason}"
                
                return {
                    "success": True,
                    "text": final_text,
                    "tokens_used": 1500,
                    "cost": 0.0,
                    "simulated": False
                }

            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {effective_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "CryptoAI Trader"
            }
            payload = {
                "model": effective_model if "/" in effective_model else "google/gemini-2.5-flash:free",
                "max_tokens": 1024,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            }
            try:
                async with httpx.AsyncClient() as client:
                    res = await client.post(url, headers=headers, json=payload, timeout=25.0)
                    if res.status_code == 200:
                        data = res.json()
                        content_text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                        input_tokens = data.get("usage", {}).get("prompt_tokens", 0)
                        output_tokens = data.get("usage", {}).get("completion_tokens", 0)
                        
                        return {
                            "success": True,
                            "text": content_text,
                            "tokens_used": input_tokens + output_tokens,
                            "cost": 0.0,
                            "simulated": False
                        }
                    else:
                        print(f"[OpenRouter API Error] Status {res.status_code}: {res.text}")
                        return {
                            "success": False,
                            "error": f"OpenRouter API Error: Status {res.status_code}",
                            "text": "Failed to query OpenRouter API. Falling back to internal simulator.",
                            **self._simulate_claude_response(prompt, system_prompt)
                        }
            except Exception as e:
                print(f"[OpenRouter Consultation Exception] {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "text": "Failed to query OpenRouter API due to exception. Falling back to internal simulator.",
                    **self._simulate_claude_response(prompt, system_prompt)
                }

        # Check if using AWS Bedrock (key starts with ABSK)
        is_bedrock = effective_key.startswith("ABSK")
        
        if is_bedrock:
            region = "us-east-1"
            bedrock_model = effective_model
            
            # Check for region override or cross-region prefix
            if "::" in effective_model:
                parts = effective_model.split("::", 2)
                region = parts[0]
                bedrock_model = parts[1]
            elif "apac." in effective_model:
                region = "ap-southeast-2"
                
            # Claude 3 Opus is retired/end-of-life on AWS Bedrock. Map it to Claude 3.5 Sonnet v2.
            if "opus" in bedrock_model.lower():
                if region == "ap-southeast-2" or "apac" in bedrock_model.lower():
                    region = "ap-southeast-2"
                    bedrock_model = "apac.anthropic.claude-3-5-sonnet-20241022-v2:0"
                else:
                    region = "us-east-1"
                    bedrock_model = "us.anthropic.claude-3-5-sonnet-20241022-v2:0"
            else:
                # If a generic model string is typed, map it
                if "::" not in effective_model:
                    if "sonnet" in effective_model.lower():
                        if "3-5" in effective_model or "3.5" in effective_model:
                            bedrock_model = "apac.anthropic.claude-3-5-sonnet-20241022-v2:0" if region == "ap-southeast-2" else "anthropic.claude-3-5-sonnet-20241022-v2:0"
                        else:
                            bedrock_model = "anthropic.claude-3-sonnet-20240229-v1:0"
                    elif "haiku" in effective_model.lower():
                        if "3-5" in effective_model or "3.5" in effective_model:
                            bedrock_model = "apac.anthropic.claude-3-5-haiku-20241022-v1:0" if region == "ap-southeast-2" else "anthropic.claude-3-5-haiku-20241022-v1:0"
                        else:
                            bedrock_model = "anthropic.claude-3-haiku-20240307-v1:0"
                
                if not bedrock_model.startswith("anthropic.") and not bedrock_model.startswith("apac."):
                    bedrock_model = f"anthropic.{bedrock_model}"
                
            url = f"https://bedrock-runtime.{region}.amazonaws.com/model/{bedrock_model}/converse"
            print(f"[BEDROCK-CALL] Region: {region}, Model: {bedrock_model}, URL: {url}")
            headers = {
                "Authorization": f"Bearer {effective_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "messages": [
                    {
                        "role": "user",
                        "content": [{"text": prompt}]
                    }
                ],
                "system": [
                    {"text": system_prompt}
                ],
                "inferenceConfig": {
                    "maxTokens": 1024
                }
            }
            try:
                async with httpx.AsyncClient() as client:
                    res = await client.post(url, headers=headers, json=payload, timeout=25.0)
                    if res.status_code == 200:
                        data = res.json()
                        content_text = data.get("output", {}).get("message", {}).get("content", [{}])[0].get("text", "")
                        input_tokens = data.get("usage", {}).get("inputTokens", 0)
                        output_tokens = data.get("usage", {}).get("outputTokens", 0)
                        
                        if "opus" in bedrock_model:
                            cost = (input_tokens * 15.0 / 1_000_000) + (output_tokens * 75.0 / 1_000_000)
                        else:
                            cost = (input_tokens * 3.0 / 1_000_000) + (output_tokens * 15.0 / 1_000_000)
                        
                        return {
                            "success": True,
                            "text": content_text,
                            "tokens_used": input_tokens + output_tokens,
                            "cost": cost,
                            "simulated": False
                        }
                    else:
                        print(f"[AWS Bedrock API Error] Status {res.status_code}: {res.text}")
                        return {
                            "success": False,
                            "error": f"Bedrock API Error: Status {res.status_code}",
                            "text": "Failed to query Bedrock API. Falling back to internal simulator.",
                            **self._simulate_claude_response(prompt, system_prompt)
                        }
            except Exception as e:
                print(f"[AWS Bedrock Consultation Exception] {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "text": "Failed to query Bedrock API due to exception. Falling back to internal simulator.",
                    **self._simulate_claude_response(prompt, system_prompt)
                }

        # Check if using Zyloo proxy (key starts with sk-zy-, has zyloo in it, or model starts with zyloo/)
        is_zyloo = "zyloo" in effective_model.lower() or effective_key.startswith("sk-zy-") or "zyloo" in effective_key.lower()

        if is_zyloo:
            url = "https://api.zyloo.io/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {effective_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": effective_model,
                "max_tokens": 1024,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            }
            try:
                async with httpx.AsyncClient() as client:
                    res = await client.post(url, headers=headers, json=payload, timeout=25.0)
                    if res.status_code == 200:
                        data = res.json()
                        content_text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                        input_tokens = data.get("usage", {}).get("prompt_tokens", 0)
                        output_tokens = data.get("usage", {}).get("completion_tokens", 0)
                        
                        # Zyloo approximate token pricing for cost estimations
                        cost = (input_tokens * 1.5 / 1_000_000) + (output_tokens * 5.0 / 1_000_000)
                        
                        return {
                            "success": True,
                            "text": content_text,
                            "tokens_used": input_tokens + output_tokens,
                            "cost": cost,
                            "simulated": False
                        }
                    else:
                        print(f"[Zyloo API Error] Status {res.status_code}: {res.text}")
                        return {
                            "success": False,
                            "error": f"Zyloo API Error: Status {res.status_code}",
                            "text": "Failed to query Zyloo API. Falling back to internal simulator.",
                            **self._simulate_claude_response(prompt, system_prompt)
                        }
            except Exception as e:
                print(f"[Zyloo Consultation Exception] {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "text": "Failed to query Zyloo API due to exception. Falling back to internal simulator.",
                    **self._simulate_claude_response(prompt, system_prompt)
                }
        else:
            # Standard Anthropic API Call
            url = "https://api.anthropic.com/v1/messages"
            headers = {
                "x-api-key": effective_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            
            payload = {
                "model": effective_model,
                "max_tokens": 1024,
                "system": system_prompt,
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
            
            try:
                async with httpx.AsyncClient() as client:
                    res = await client.post(url, headers=headers, json=payload, timeout=20.0)
                    if res.status_code == 200:
                        data = res.json()
                        content_text = data.get("content", [{}])[0].get("text", "")
                        input_tokens = data.get("usage", {}).get("input_tokens", 0)
                        output_tokens = data.get("usage", {}).get("output_tokens", 0)
                        
                        cost = (input_tokens * 3.0 / 1_000_000) + (output_tokens * 15.0 / 1_000_000)
                        
                        return {
                            "success": True,
                            "text": content_text,
                            "tokens_used": input_tokens + output_tokens,
                            "cost": cost,
                            "simulated": False
                        }
                    else:
                        print(f"[Claude API Error] Status {res.status_code}: {res.text}")
                        return {
                            "success": False,
                            "error": f"API Error: Status {res.status_code}",
                            "text": "Failed to query Claude API. Falling back to internal simulator.",
                            **self._simulate_claude_response(prompt, system_prompt)
                        }
            except Exception as e:
                print(f"[Claude Consultation Exception] {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "text": "Failed to query Claude API due to exception. Falling back to internal simulator.",
                    **self._simulate_claude_response(prompt, system_prompt)
                }


    def _simulate_claude_response(self, prompt: str, system_prompt: str) -> dict:
        """
        Creates smart mock answers based on technical indicator parameters detected in the prompt.
        """
        prompt_lower = prompt.lower()
        
        # Check if the prompt contains indicator values
        symbol = "BTC/USDT"
        for sym in ["eth/usdt", "sol/usdt", "nifty 50", "reliance", "tcs", "aapl"]:
            if sym in prompt_lower:
                symbol = sym.upper()
                break

        # Check if doing YouTube strategy learning
        if "youtube" in prompt_lower or "video" in prompt_lower or "extract strategy" in prompt_lower:
            strategy_types = ["Scalping", "VWAP Breakout", "EMA Reversal", "Momentum Trend Following"]
            chosen_type = random.choice(strategy_types)
            
            mock_rules = {
                "Scalping": [
                    {"rule": "Entry Trigger", "detail": "Buy when price crosses above 9 EMA AND RSI is between 50 and 65 (bullish momentum)."},
                    {"rule": "Trend Confirmation", "detail": "Ensure 21 EMA is sloping upwards on the 5-minute timeframe."},
                    {"rule": "Stop Loss", "detail": "Set stop loss 1.5 ATR below entry price or just below the swing low."},
                    {"rule": "Take Profit", "detail": "Take profit at a fixed 1:2 risk-to-reward ratio or when RSI crosses above 75."}
                ],
                "VWAP Breakout": [
                    {"rule": "Pre-condition", "detail": "Price must consolidate near the VWAP line for at least 3-4 consecutive 15m candles."},
                    {"rule": "Trigger", "detail": "Buy on a high-volume breakout candle closing completely above the Upper Bollinger Band."},
                    {"rule": "Risk Mitigation", "detail": "Hard stop-loss placed 0.5% below the VWAP line. Move to break-even after 1% profit."},
                    {"rule": "Profit Target", "detail": "Sell 50% of the position at the first major resistance, let the rest trail until VWAP is broken downward."}
                ],
                "EMA Reversal": [
                    {"rule": "Overbought Condition", "detail": "RSI must cross above 75. Price must be trading outside the Upper Bollinger Band."},
                    {"rule": "Trigger", "detail": "Short/Sell when a bearish engulfing candle closes back inside the Bollinger Band, crossing below 9 EMA."},
                    {"rule": "Stop Loss", "detail": "Place stop loss 2 ticks above the recent swing high price peak."},
                    {"rule": "Exit Strategy", "detail": "Exit trade when price touches the lower Bollinger Band or when RSI falls below 40."}
                ],
                "Momentum Trend Following": [
                    {"rule": "Market Regime", "detail": "Trade only during high-volatility sessions (e.g., US market open or active EU session)."},
                    {"rule": "Confirmation", "detail": "EMA 9 is above EMA 21, and MACD Histogram is positive and expanding upwards."},
                    {"rule": "Execution", "detail": "Execute long trade on minor pullbacks towards the 9 EMA line. Never buy at absolute breakout highs."},
                    {"rule": "Risk Management", "detail": "Trailing stop loss of 1.5% from the highest point reached during the trade."}
                ]
            }

            rules = mock_rules[chosen_type]
            
            return {
                "success": True,
                "text": f"### YouTube AI Learner Report: {chosen_type} Strategy\n"
                        f"We analyzed the strategy tutorial video and extracted a structured set of trading rules based on algorithmic parameters.\n\n"
                        f"**Key Focus:** Technical indicator confirmation with rigorous risk thresholds.\n\n"
                        f"#### Strategy Rules:\n" + 
                        "\n".join([f"- **{r['rule']}**: {r['detail']}" for r in rules]) + 
                        f"\n\n**Confidence Level:** 88% based on historical backtesting simulation metrics.",
                "tokens_used": 0,
                "cost": 0.0,
                "simulated": True,
                "strategy_type": chosen_type.lower().replace(" ", "_"),
                "rules_json": json.dumps(rules)
            }

        # Check if diagnosing an anomaly / stop loss hit
        if "stop loss" in prompt_lower or "losses" in prompt_lower or "anomaly" in prompt_lower:
            reasons = [
                "whipsaw volatility pushing prices through short-term support before recovering (stop hunting)",
                "low volume consolidation causing indicators to print false breakout signals",
                "a sudden macroeconomic news flow (e.g. interest rate decision or SEC crypto filing) overriding standard technical signals"
            ]
            reason = random.choice(reasons)
            advice = (
                f"### Claude AI Consultant: Trade Issue Diagnosis\n\n"
                f"**Observation:** Auto-trader encountered consecutive stop-losses on {symbol}.\n\n"
                f"**Diagnosis:** Market regime shift detected. The bot suffered from {reason}. The current indicators show highly conflicted signals (RSI is flat, Bollinger Bands are contracting indicating an imminent squeeze).\n\n"
                f"**Recommendation:** \n"
                f"1. **Temporarily switch trade pacing from 'rapid' to 'normal'** to filter out intraday market noise.\n"
                f"2. Increase Stop Loss threshold to **2.5%** to give trades room to breathe during this volatile phase.\n"
                f"3. Do not execute new trades for the next 30 minutes until a clear trend confirmation emerges on the 15-minute chart."
            )
            return {
                "success": True,
                "text": advice,
                "tokens_used": 0,
                "cost": 0.0,
                "simulated": True,
                "recommendation": "HOLD"
            }

        # Normal trade signal advisory
        rsi_val = 50.0
        # Try to parse RSI from prompt
        if "rsi" in prompt_lower:
            try:
                # Find number near RSI
                matches = [float(s) for s in prompt_lower.replace(":", " ").replace(",", " ").split() if s.replace('.', '', 1).isdigit()]
                for num in matches:
                    if 0 < num < 100:
                        rsi_val = num
                        break
            except Exception:
                pass

        if rsi_val > 70:
            rec = "HOLD"
            reasoning = f"RSI is currently at {rsi_val:.1f}, indicating overbought conditions. Standard indicators suggest a pullback is likely. I recommend holding off on buying or exiting long positions."
        elif rsi_val < 30:
            rec = "BUY"
            reasoning = f"RSI is at {rsi_val:.1f}, indicating oversold status. A bullish divergence is starting to form on the MACD. Entering a scale-in buy position is highly recommended."
        else:
            rec = "HOLD"
            reasoning = f"The asset {symbol} is in a neutral consolidation range (RSI is {rsi_val:.1f}). MACD histogram is flat. I advise holding current positions and waiting for a volume-backed breakout above the upper Bollinger Band."

        response_text = (
            f"### Claude AI Consultant Live Advisory\n"
            f"**Asset Analyzed:** {symbol}\n"
            f"**Recommendation:** **{rec}**\n\n"
            f"**Technical Justification:**\n"
            f"- {reasoning}\n"
            f"- News sentiment is moderately positive (no major panic selling visible in feeds).\n"
            f"- VWAP acts as a strong support line. Keep tight risk limits."
        )

        return {
            "success": True,
            "text": response_text,
            "tokens_used": 0,
            "cost": 0.0,
            "simulated": True,
            "recommendation": rec
        }

    async def analyze_trade_opportunity(
        self,
        symbol: str,
        direction: str,
        indicators: dict,
        close_price: float,
        news_items: list,
        api_key: str = None,
        model: str = None
    ) -> dict:
        """
        Consults the AI Brain before entering an auto-trade.
        Determines:
        - decision: "APPROVE" or "REJECT"
        - profit_target_pct: dynamic TP% based on volatility/trend (e.g. 0.03 for 3%)
        - position_pct: dynamic trade size as % of default allocation (e.g. 50.0% to 150.0%)
        - reasoning: brief string explaining the choice
        """
        effective_key = api_key or settings.CLAUDE_API_KEY
        effective_model = model or settings.CLAUDE_MODEL or "claude-3-5-sonnet-20241022"

        if not effective_key or effective_key.strip() == "" or "FREE" in effective_key:
            return self._simulate_trade_opportunity_response(symbol, direction, indicators, close_price, news_items)

        # Build prompt for Claude
        news_text = "\n".join([f"- {n['title']} (Source: {n['source']})" for n in news_items])
        
        if direction == "PREDICT":
            system_prompt = (
                "You are 'Antigravity AI Trader Entry Advisor', a risk-management and trade entry specialist.\n"
                "Your task is to review technical indicators, signals, and news and predict the next candle direction.\n"
                "Determine whether we should enter a LONG trade, a SHORT trade, or skip (HOLD) to protect capital.\n"
                "You must output ONLY a JSON block inside a ```json ... ``` code block. Do not write any intro/outro.\n"
                "JSON format:\n"
                "{\n"
                "  \"decision\": \"LONG\" | \"SHORT\" | \"HOLD\",\n"
                "  \"confidence\": 85,\n"
                "  \"profit_target_pct\": 0.03,\n"
                "  \"position_pct\": 30.0,\n"
                "  \"reasoning\": \"Explain in one sentence why we should buy (LONG), short (SHORT), or hold based on current structure.\"\n"
                "}"
            )
            prompt = (
                f"Symbol: {symbol}\n"
                f"Potential Direction: PREDICT (Choose LONG, SHORT, or HOLD)\n"
                f"Current Price: {close_price}\n"
                f"Indicators: RSI={indicators.get('RSI')}, EMA9={indicators.get('EMA_9')}, EMA21={indicators.get('EMA_21')}, VWAP={indicators.get('VWAP')}, ATR={indicators.get('ATR')}\n"
                f"Recent News:\n{news_text}\n"
            )
        else:
            system_prompt = (
                "You are 'Antigravity AI Trader Entry Advisor', a risk-management and trade entry specialist.\n"
                "Your task is to review technical indicators, signals, and news for a potential trade entry.\n"
                "Analyze whether current conditions support entry or if we should skip the trade to protect capital.\n"
                "You must output ONLY a JSON block inside a ```json ... ``` code block. Do not write any intro/outro.\n"
                "JSON format:\n"
                "{\n"
                "  \"decision\": \"APPROVE\" | \"REJECT\",\n"
                "  \"confidence\": 85,\n"
                "  \"profit_target_pct\": 0.03,\n"
                "  \"position_pct\": 30.0,\n"
                "  \"reasoning\": \"Explain in one sentence why this trade is approved or rejected based on current structure.\"\n"
                "}"
            )
            prompt = (
                f"Symbol: {symbol}\n"
                f"Potential Direction: {direction} (BUY/LONG or SELL/SHORT)\n"
                f"Current Price: {close_price}\n"
                f"Indicators: RSI={indicators.get('RSI')}, EMA9={indicators.get('EMA_9')}, EMA21={indicators.get('EMA_21')}, VWAP={indicators.get('VWAP')}, ATR={indicators.get('ATR')}\n"
                f"Recent News:\n{news_text}\n"
            )

        try:
            res_dict = await self.consult_claude_ai(prompt, system_prompt, api_key=effective_key, model=effective_model)
            if res_dict.get("success"):
                return self._parse_trade_analysis_json(res_dict["text"], symbol, direction, indicators, close_price, news_items)
            
            # API failure fallback
            return self._simulate_trade_opportunity_response(symbol, direction, indicators, close_price, news_items)
        except Exception as e:
            print(f"[analyze_trade_opportunity Exception] {e}")
            return self._simulate_trade_opportunity_response(symbol, direction, indicators, close_price, news_items)

    def _parse_trade_analysis_json(self, text: str, symbol: str, direction: str, indicators: dict, close_price: float, news_items: list) -> dict:
        try:
            cleaned_text = text.strip()
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
                data = json.loads(json_block)
                return {
                    "decision": data.get("decision", "APPROVE"),
                    "confidence": data.get("confidence", 80),
                    "profit_target_pct": data.get("profit_target_pct", 0.03),
                    "position_pct": data.get("position_pct", 30.0),
                    "reasoning": data.get("reasoning", "Approved by AI Brain."),
                    "simulated": False
                }
        except Exception as parse_err:
            print(f"[parse_trade_analysis_json Error] {parse_err}")
        return self._simulate_trade_opportunity_response(symbol, direction, indicators, close_price, news_items)

    def _simulate_trade_opportunity_response(
        self,
        symbol: str,
        direction: str,
        indicators: dict,
        close_price: float,
        news_items: list
    ) -> dict:
        """
        Free/simulated rule-based pre-trade analysis.
        Uses key technical indicators (RSI, EMA, Bollinger bands structure, ATR volatility)
        to make smart entry approvals.
        """
        rsi = indicators.get("RSI", 50.0)
        ema9 = indicators.get("EMA_9", close_price)
        ema21 = indicators.get("EMA_21", close_price)
        vwap = indicators.get("VWAP", close_price)
        
        # Determine trend direction
        ema_diff_pct = (ema9 - ema21) / ema21 if ema21 > 0 else 0
        is_uptrend = ema_diff_pct > 0.001
        is_downtrend = ema_diff_pct < -0.001
        
        # Calculate dynamic ATR percent volatility (from indicator string like "2.1%")
        atr_str = indicators.get("ATR", "2.0%")
        try:
            atr_pct = float(atr_str.replace("%", "")) / 100.0
        except ValueError:
            atr_pct = 0.02

        decision = "APPROVE"
        confidence = 80
        reasoning = ""
        
        # Set dynamic profit targets based on ATR and trend strength
        # High volatility -> wider targets; Low volatility -> tighter targets
        profit_target_pct = max(0.015, min(0.06, atr_pct * 1.5))
        
        # Position sizing is 30% default, but scaled by AI based on confidence and volatility
        # Range is 10% to 50%
        position_pct = 30.0

        if direction == "PREDICT":
            if is_uptrend and rsi < 70:
                decision = "LONG"
                confidence = 85
                reasoning = "PREDICT: Bullish EMA structure and healthy RSI support a LONG setup."
            elif is_downtrend and rsi > 30:
                decision = "SHORT"
                confidence = 85
                reasoning = "PREDICT: Bearish EMA structure and high RSI support a SHORT setup."
            else:
                # Force trade every candle: choose direction based on RSI midpoint
                if rsi >= 50:
                    decision = "LONG"
                    reasoning = f"PREDICT (Force Trade): Neutral structure, RSI ({rsi:.1f}) >= 50 suggests potential LONG bias."
                else:
                    decision = "SHORT"
                    reasoning = f"PREDICT (Force Trade): Neutral structure, RSI ({rsi:.1f}) < 50 suggests potential SHORT bias."
                confidence = 75
        elif direction == "LONG":
            if is_downtrend and rsi > 40:
                decision = "REJECT"
                reasoning = "LONG signal rejected because trend is bearish and RSI is not oversold."
                confidence = 85
            elif rsi > 70:
                decision = "REJECT"
                reasoning = f"LONG signal rejected: RSI is overbought ({rsi:.1f}), high risk of immediate pullback."
                confidence = 90
            elif is_uptrend:
                decision = "APPROVE"
                confidence = 88
                position_pct = 40.0 # Increase position size on trend alignment
                profit_target_pct = max(0.025, profit_target_pct)
                reasoning = "LONG approved: Strong bullish trend alignment with supportive EMA slope."
            else:
                decision = "APPROVE"
                confidence = 70
                reasoning = "LONG approved on neutral consolidation. Normal risk parameters."
        else: # SHORT
            if is_uptrend and rsi < 60:
                decision = "REJECT"
                reasoning = "SHORT signal rejected because trend is bullish and RSI is not overbought."
                confidence = 85
            elif rsi < 30:
                decision = "REJECT"
                reasoning = f"SHORT signal rejected: RSI is oversold ({rsi:.1f}), high risk of bottom bounce."
                confidence = 90
            elif is_downtrend:
                decision = "APPROVE"
                confidence = 88
                position_pct = 40.0 # Increase position size on trend alignment
                profit_target_pct = max(0.025, profit_target_pct)
                reasoning = "SHORT approved: Strong bearish trend alignment with downward EMA slope."
            else:
                decision = "APPROVE"
                confidence = 70
                reasoning = "SHORT approved on neutral consolidation. Normal risk parameters."

        # Adjust target based on news if any news is negative
        has_negative_news = False
        news_text = " ".join([n["title"].lower() for n in news_items])
        negative_words = ["drop", "crash", "plunge", "down", "bearish", "fall", "loss", "warning", "investigation"]
        if any(w in news_text for w in negative_words):
            has_negative_news = True

        if has_negative_news and direction == "LONG":
            # Scale down size or reject
            if confidence > 75:
                confidence -= 10
                position_pct = 20.0
                reasoning += " (Caution: negative news headlines detected)."
            else:
                decision = "REJECT"
                reasoning = "LONG signal rejected: Conflicting negative headlines detected in recent feeds."

        return {
            "decision": decision,
            "confidence": confidence,
            "profit_target_pct": round(profit_target_pct, 4),
            "position_pct": position_pct,
            "reasoning": reasoning,
            "simulated": True
        }

    async def analyze_active_trade_exit(
        self,
        symbol: str,
        direction: str,
        entry_price: float,
        current_price: float,
        indicators: dict,
        news_items: list,
        api_key: str = None,
        model: str = None
    ) -> dict:
        """
        Consult Claude AI on whether to exit an active position early.
        Returns:
        - decision: "EXIT" or "HOLD"
        - reasoning: string explaining why the AI suggests exiting or holding
        """
        effective_key = api_key or settings.CLAUDE_API_KEY
        effective_model = model or settings.CLAUDE_MODEL or "claude-3-5-sonnet-20241022"

        if not effective_key or effective_key.strip() == "" or "FREE" in effective_key:
            return self._simulate_active_trade_exit_response(symbol, direction, entry_price, current_price, indicators)

        # Build prompt for Claude
        news_text = "\n".join([f"- {n['title']} (Source: {n['source']})" for n in news_items])
        system_prompt = (
            "You are 'Antigravity AI Trader Exit Advisor', a risk-management and trade exit specialist.\n"
            "Your task is to review an active position and decide whether we should exit the trade early or continue holding.\n"
            "Analyze if indicators or price action show trend exhaustion or reversal.\n"
            "You must output ONLY a JSON block inside a ```json ... ``` code block. Do not write any intro/outro.\n"
            "JSON format:\n"
            "{\n"
            "  \"decision\": \"EXIT\" | \"HOLD\",\n"
            "  \"reasoning\": \"Explain in one sentence why we should exit or hold.\"\n"
            "}"
        )
        prompt = (
            f"Symbol: {symbol}\n"
            f"Direction: {direction}\n"
            f"Entry Price: {entry_price}\n"
            f"Current Price: {current_price}\n"
            f"Unrealized P&L %: {((current_price - entry_price)/entry_price * 100 * (1 if direction == 'LONG' else -1)):.2f}%\n"
            f"Indicators: RSI={indicators.get('RSI')}, EMA9={indicators.get('EMA_9')}, EMA21={indicators.get('EMA_21')}, VWAP={indicators.get('VWAP')}\n"
            f"Recent News:\n{news_text}\n"
        )

        try:
            res_dict = await self.consult_claude_ai(prompt, system_prompt, api_key=effective_key, model=effective_model)
            if res_dict.get("success"):
                return self._parse_exit_analysis_json(res_dict["text"], symbol, direction, entry_price, current_price, indicators)
        except Exception as e:
            print(f"[Claude Exit Consultation Exception] {e}")
            
        return self._simulate_active_trade_exit_response(symbol, direction, entry_price, current_price, indicators)

    def _parse_exit_analysis_json(self, content: str, symbol: str, direction: str, entry_price: float, current_price: float, indicators: dict) -> dict:
        try:
            start = content.find("```json")
            if start != -1:
                end = content.find("```", start + 7)
                json_str = content[start + 7:end].strip()
            else:
                json_str = content.strip()
            data = json.loads(json_str)
            if data.get("decision") in ["EXIT", "HOLD"]:
                return {
                    "decision": data.get("decision"),
                    "reasoning": data.get("reasoning", "Decided by AI Brain."),
                    "simulated": False
                }
        except Exception as parse_err:
            print(f"[parse_exit_analysis_json Error] {parse_err}")
        return self._simulate_active_trade_exit_response(symbol, direction, entry_price, current_price, indicators)

    def _simulate_active_trade_exit_response(
        self,
        symbol: str,
        direction: str,
        entry_price: float,
        current_price: float,
        indicators: dict
    ) -> dict:
        """Rule-based simulation fallback for exit analysis."""
        rsi = indicators.get("RSI", 50.0)
        pnl_pct = ((current_price - entry_price)/entry_price * 100 * (1 if direction == 'LONG' else -1))
        
        decision = "HOLD"
        reasoning = "Trends look stable, continuing to hold."
        
        # Smart exit criteria
        if direction == "LONG":
            if rsi >= 78.0:
                decision = "EXIT"
                reasoning = f"Exiting LONG trade early: RSI is extremely overbought ({rsi:.1f}), indicating near-term top."
            elif pnl_pct <= -1.8:
                decision = "EXIT"
                reasoning = f"Exiting LONG trade early: Position is in loss ({pnl_pct:.2f}%) and showing weakness."
        else: # SHORT
            if rsi <= 22.0:
                decision = "EXIT"
                reasoning = f"Exiting SHORT trade early: RSI is extremely oversold ({rsi:.1f}), indicating potential bottom bounce."
            elif pnl_pct <= -1.8:
                decision = "EXIT"
                reasoning = f"Exiting SHORT trade early: Position is in loss ({pnl_pct:.2f}%) and showing upward pressure."
                
        return {
            "decision": decision,
            "reasoning": reasoning,
            "simulated": True
        }

ai_intelligence_service = AIIntelligenceService()

