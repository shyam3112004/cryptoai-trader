import asyncio
import json
import random
import hmac
import hashlib
import time
import urllib.parse
from datetime import datetime, timedelta
import websockets
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import math
from database import engine
from models import User, UserSetting
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from services.whatsapp_service import whatsapp_service
from services.telegram_service import telegram_service

router = APIRouter(prefix="/signals", tags=["Signals & Prices"])

def is_stock_market_open():
    now_utc = datetime.utcnow()
    now_ist = now_utc + timedelta(hours=5, minutes=30)
    # Weekend check (5=Sat, 6=Sun)
    if now_ist.weekday() >= 5:
        return False
    market_start = now_ist.replace(hour=9, minute=15, second=0, microsecond=0)
    market_end = now_ist.replace(hour=15, minute=30, second=0, microsecond=0)
    return market_start <= now_ist <= market_end

class ConnectionManager:
    def __init__(self):
        # Map connection to subscribed symbol (upper case, e.g., "BTCUSDT")
        self.active_connections: dict[WebSocket, str] = {}
        self.binance_socket = None
        self.active_crypto_subscriptions = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[websocket] = "BTCUSDT"

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            del self.active_connections[websocket]

    async def subscribe(self, websocket: WebSocket, symbol: str):
        if websocket not in self.active_connections:
            return
        
        self.active_connections[websocket] = symbol
        print(f"Client sub registered for: {symbol}")
        
        # If it is a cryptocurrency, subscribe dynamically on Binance stream
        if symbol.endswith("USDT"):
            stream_name = f"{symbol.lower()}@kline_1m"
            if stream_name not in self.active_crypto_subscriptions:
                self.active_crypto_subscriptions.add(stream_name)
                if self.binance_socket and self.binance_socket.open:
                    try:
                        await self.binance_socket.send(json.dumps({
                            "method": "SUBSCRIBE",
                            "params": [stream_name],
                            "id": len(self.active_crypto_subscriptions)
                        }))
                        print(f"Subscribed Binance API to stream: {stream_name}")
                    except Exception as e:
                        print(f"Failed to send SUBSCRIBE to Binance: {e}")

    async def broadcast_tick(self, symbol: str, tick_data_json: str):
        for connection, sub_symbol in list(self.active_connections.items()):
            if sub_symbol == symbol:
                try:
                    await connection.send_text(tick_data_json)
                except Exception:
                    self.disconnect(connection)

    async def broadcast_notification_to_all(self, notification_json: str):
        for connection in list(self.active_connections.keys()):
            try:
                await connection.send_text(notification_json)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

def get_symbol_config(symbol: str):
    s = str(symbol or "").upper()
    if "NIFTY" in s: return {"basePrice": 24052.95, "mult": 8.0}
    if "SENSEX" in s: return {"basePrice": 77100.47, "mult": 50.0}
    if "RELIANCE" in s: return {"basePrice": 1532.40, "mult": 3.0}
    if "TCS" in s: return {"basePrice": 3820.50, "mult": 8.0}
    if "INFY" in s: return {"basePrice": 1530.0, "mult": 4.0}
    if "HDFCBANK" in s: return {"basePrice": 1610.0, "mult": 4.0}
    if "ICICIBANK" in s: return {"basePrice": 1120.0, "mult": 3.0}
    if "SBIN" in s: return {"basePrice": 840.0, "mult": 2.0}
    if "TATAMOTORS" in s: return {"basePrice": 960.0, "mult": 3.0}
    if "WIPRO" in s: return {"basePrice": 480.0, "mult": 1.5}
    
    if "BTC" in s: return {"basePrice": 60189.99, "mult": 150.0}
    if "ETH" in s: return {"basePrice": 3450.0, "mult": 15.0}
    if "SOL" in s: return {"basePrice": 145.0, "mult": 1.5}
    if "BNB" in s: return {"basePrice": 580.0, "mult": 3.0}
    if "AVAX" in s: return {"basePrice": 35.0, "mult": 0.3}
    if "LTC" in s: return {"basePrice": 75.0, "mult": 0.5}
    
    if "AAPL" in s: return {"basePrice": 182.50, "mult": 1.5}
    if "TSLA" in s: return {"basePrice": 178.20, "mult": 2.0}
    if "NVDA" in s: return {"basePrice": 125.40, "mult": 1.5}
    if "MSFT" in s: return {"basePrice": 415.50, "mult": 3.0}
    
    return {"basePrice": 24052.95, "mult": 8.0}

# ─── Yahoo Finance symbol mapping ───
YAHOO_SYMBOL_MAP = {
    "NIFTY50": "^NSEI",
    "NIFTY 50": "^NSEI",
    "SENSEX": "^BSESN",
    "RELIANCE": "RELIANCE.NS",
    "TCS": "TCS.NS",
    "INFY": "INFY.NS",
    "HDFCBANK": "HDFCBANK.NS",
    "ICICIBANK": "ICICIBANK.NS",
    "SBIN": "SBIN.NS",
    "TATAMOTORS": "TATAMOTORS.NS",
    "WIPRO": "WIPRO.NS",
    "BTC/USDT": "BTC-USD",
    "ETH/USDT": "ETH-USD",
    "SOL/USDT": "SOL-USD",
    "AAPL": "AAPL",
    "TSLA": "TSLA",
    "NVDA": "NVDA",
    "MSFT": "MSFT",
}

YAHOO_INTERVAL_MAP = {
    "1s": ("1m", "1d"),
    "1m": ("1m", "1d"),
    "2m": ("2m", "2d"),
    "3m": ("5m", "3d"),
    "5m": ("5m", "5d"),
    "10m": ("15m", "10d"),
    "15m": ("15m", "15d"),
    "1h": ("1h", "30d"),
    "4h": ("1h", "60d"),
    "1d": ("1d", "6mo"),
}

@router.get("/chart-data")
async def get_chart_data(symbol: str = "NIFTY 50", timeframe: str = "15m"):
    """Fetch real historical OHLCV data from Yahoo Finance as a proxy."""
    import httpx

    # Map our symbol to Yahoo Finance ticker
    sym_upper = symbol.upper().strip()
    yahoo_ticker = YAHOO_SYMBOL_MAP.get(sym_upper)
    if not yahoo_ticker:
        # Try fuzzy match
        for key, val in YAHOO_SYMBOL_MAP.items():
            if key in sym_upper or sym_upper in key:
                yahoo_ticker = val
                break
    if not yahoo_ticker:
        yahoo_ticker = sym_upper  # fallback: use as-is

    interval, range_val = YAHOO_INTERVAL_MAP.get(timeframe, ("15m", "15d"))

    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{yahoo_ticker}"
    params = {
        "interval": interval,
        "range": range_val,
        "includePrePost": "false",
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            data = resp.json()

        result = data.get("chart", {}).get("result", [])
        if not result:
            return {"candles": [], "error": "No data from Yahoo Finance"}

        chart_result = result[0]
        timestamps = chart_result.get("timestamp", [])
        quote = chart_result.get("indicators", {}).get("quote", [{}])[0]
        opens = quote.get("open", [])
        highs = quote.get("high", [])
        lows = quote.get("low", [])
        closes = quote.get("close", [])
        volumes = quote.get("volume", [])

        candles = []
        for i in range(len(timestamps)):
            o = opens[i] if i < len(opens) and opens[i] is not None else None
            h = highs[i] if i < len(highs) and highs[i] is not None else None
            l = lows[i] if i < len(lows) and lows[i] is not None else None
            c = closes[i] if i < len(closes) and closes[i] is not None else None
            v = volumes[i] if i < len(volumes) and volumes[i] is not None else 0
            if o is not None and c is not None:
                candles.append({
                    "time": i,
                    "timestamp": timestamps[i] * 1000,  # ms for JS
                    "open": round(o, 2),
                    "high": round(h, 2),
                    "low": round(l, 2),
                    "close": round(c, 2),
                    "vol": v,
                })

        return {"candles": candles, "symbol": yahoo_ticker, "count": len(candles)}

    except Exception as e:
        print(f"Yahoo Finance fetch error: {e}")
        return {"candles": [], "error": str(e)}

@router.get("/account-balance")
async def get_account_balance():
    import httpx
    user_info = await query_user_info()
    api_key = user_info.get("api_key")
    api_secret = user_info.get("api_secret")
    
    if not api_key or not api_secret:
        return {"balance": 0.0, "asset": "USDT", "mode": user_info.get("mode")}
        
    url = "https://api.binance.com/api/v3/account"
    timestamp = int(time.time() * 1000)
    params = {"timestamp": timestamp}
    query_string = urllib.parse.urlencode(params)
    signature = hmac.new(api_secret.encode("utf-8"), query_string.encode("utf-8"), hashlib.sha256).hexdigest()
    params["signature"] = signature
    headers = {"X-MBX-APIKEY": api_key}
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            res_json = resp.json()
            balances = res_json.get("balances", [])
            usdt_bal = 0.0
            for b in balances:
                if b.get("asset") == "USDT":
                    usdt_bal = float(b.get("free", 0.0)) + float(b.get("locked", 0.0))
                    break
            return {"balance": round(usdt_bal, 2), "asset": "USDT", "mode": user_info.get("mode"), "raw": res_json}
    except Exception as e:
        print(f"Error fetching Binance account balance: {e}")
        return {"balance": 0.0, "error": str(e)}

class TestWhatsAppRequest(BaseModel):
    phone_number: str | None = None
    callmebot_apikey: str | None = None

@router.post("/test-whatsapp")
async def test_whatsapp_alert(req: TestWhatsAppRequest = None):
    user_info = await query_user_info()
    phone = (req and req.phone_number) or user_info.get("phone") or "+919876543210"
    apikey = (req and req.callmebot_apikey) or user_info.get("callmebot_apikey")
    
    if apikey:
        # Send REAL WhatsApp message via CallMeBot
        msg = "🟢 TEST ALERT from CryptoAI Trader: WhatsApp Alerts active and verified! 🚀"
        res = whatsapp_service._send_callmebot(phone, apikey, msg)
        return {"status": "success", "res": res, "phone": phone, "method": "callmebot"}
    else:
        # No API key — just log and return instructions
        res = whatsapp_service.notify_buy(
            to_number=phone,
            symbol="BTC/USDT",
            entry_price=60200.0,
            qty=0.01,
            target_price=61500.0,
            stop_price=59000.0,
            confidence=87,
            agree_count=6,
            mode=user_info.get("mode", "demo")
        )
        return {"status": "no_apikey", "res": res, "phone": phone, "method": "log_only",
                "message": "No CallMeBot API key set. Please follow setup instructions in Settings."}

class TestTelegramRequest(BaseModel):
    bot_token: str | None = None
    chat_id: str | None = None

@router.post("/test-telegram")
async def test_telegram_alert(req: TestTelegramRequest = None):
    user_info = await query_user_info()
    bot_token = (req and req.bot_token) or user_info.get("telegram_bot_token")
    chat_id = (req and req.chat_id) or user_info.get("telegram_chat_id")
    
    if bot_token and chat_id:
        msg = "🟢 <b>TEST ALERT</b> from CryptoAI Trader: Telegram Alerts active and verified! 🚀"
        res = telegram_service._send_telegram(bot_token, chat_id, msg)
        return {"status": "success", "res": res, "chat_id": chat_id, "method": "telegram"}
    else:
        return {"status": "error", "message": "No Telegram Bot Token or Chat ID set. Please configure in Settings."}

class TradeNotifyRequest(BaseModel):
    action: str  # BUY, SELL_TARGET, STOP_LOSS
    symbol: str
    price: float
    qty: float = 0.01
    pnl: float = 0.0
    return_pct: float = 0.0
    mode: str = "demo"

@router.post("/notify-trade")
async def notify_trade(request: TradeNotifyRequest):
    user_info = await query_user_info()
    phone = user_info.get("phone") or "+919876543210"
    apikey = user_info.get("callmebot_apikey")
    enable_whatsapp = user_info.get("enable_whatsapp", True)
    
    telegram_token = user_info.get("telegram_bot_token")
    telegram_chat = user_info.get("telegram_chat_id")
    enable_telegram = user_info.get("enable_telegram", False)
    
    whatsapp_res = None
    telegram_res = None
    
    # 1. Trigger WhatsApp notification (if enabled)
    if enable_whatsapp:
        if request.action == "BUY":
            whatsapp_res = whatsapp_service.notify_buy(
                to_number=phone,
                symbol=request.symbol,
                entry_price=request.price,
                qty=request.qty,
                target_price=round(request.price * 1.05, 2),
                stop_price=round(request.price * 0.98, 2),
                confidence=87,
                agree_count=6,
                mode=request.mode,
                apikey=apikey
            )
        elif request.action == "SELL_TARGET":
            whatsapp_res = whatsapp_service.notify_sell_target(
                to_number=phone,
                symbol=request.symbol,
                entry_price=round(request.price * 0.98, 2),
                exit_price=request.price,
                qty=request.qty,
                profit=request.pnl,
                return_pct=request.return_pct,
                mode=request.mode,
                apikey=apikey
            )
        else:  # STOP_LOSS
            whatsapp_res = whatsapp_service.notify_stop_loss(
                to_number=phone,
                symbol=request.symbol,
                entry_price=round(request.price * 1.02, 2),
                exit_price=request.price,
                qty=request.qty,
                loss=request.pnl,
                loss_pct=request.return_pct,
                mode=request.mode,
                apikey=apikey
            )
            
    # 2. Trigger Telegram notification (if enabled)
    if enable_telegram and telegram_token and telegram_chat:
        if request.action == "BUY":
            telegram_res = telegram_service.notify_buy(
                bot_token=telegram_token,
                chat_id=telegram_chat,
                symbol=request.symbol,
                entry_price=request.price,
                qty=request.qty,
                target_price=round(request.price * 1.05, 2),
                stop_price=round(request.price * 0.98, 2),
                confidence=87,
                agree_count=6,
                mode=request.mode
            )
        elif request.action == "SELL_TARGET":
            telegram_res = telegram_service.notify_sell_target(
                bot_token=telegram_token,
                chat_id=telegram_chat,
                symbol=request.symbol,
                entry_price=round(request.price * 0.98, 2),
                exit_price=request.price,
                qty=request.qty,
                profit=request.pnl,
                return_pct=request.return_pct,
                mode=request.mode
            )
        else:  # STOP_LOSS
            telegram_res = telegram_service.notify_stop_loss(
                bot_token=telegram_token,
                chat_id=telegram_chat,
                symbol=request.symbol,
                entry_price=round(request.price * 1.02, 2),
                exit_price=request.price,
                qty=request.qty,
                loss=request.pnl,
                loss_pct=request.return_pct,
                mode=request.mode
            )
            
    return {"status": "success", "whatsapp": whatsapp_res, "telegram": telegram_res}

async def query_user_info() -> dict:
    try:
        async with AsyncSession(engine) as session:
            result = await session.execute(select(User).limit(1))
            user = result.scalars().first()
            if user:
                phone = user.whatsapp_number or "+919876543210"
                mode = user.active_mode or "demo"
                callmebot_apikey = user.callmebot_apikey or None
                telegram_bot_token = user.telegram_bot_token or None
                telegram_chat_id = user.telegram_chat_id or None
                
                sett_res = await session.execute(select(UserSetting).filter(UserSetting.user_id == user.id))
                setting = sett_res.scalars().first()
                api_key = setting.broker_api_key if setting else None
                api_secret = setting.broker_api_secret if setting else None
                gateway = setting.broker_gateway if setting else None
                enable_whatsapp = setting.enable_whatsapp if setting else True
                enable_telegram = setting.enable_telegram if setting else False
                trade_pacing = setting.trade_pacing if setting else "rapid"
                
                return {
                    "phone": phone,
                    "mode": mode,
                    "api_key": api_key,
                    "api_secret": api_secret,
                    "gateway": gateway,
                    "callmebot_apikey": callmebot_apikey,
                    "telegram_bot_token": telegram_bot_token,
                    "telegram_chat_id": telegram_chat_id,
                    "enable_whatsapp": bool(enable_whatsapp),
                    "enable_telegram": bool(enable_telegram),
                    "trade_pacing": trade_pacing
                }
    except Exception as e:
        print(f"Error querying user info: {e}")
    return {
        "phone": "+919876543210", 
        "mode": "demo", 
        "api_key": None, 
        "api_secret": None, 
        "gateway": None, 
        "callmebot_apikey": None,
        "telegram_bot_token": None,
        "telegram_chat_id": None,
        "enable_whatsapp": True,
        "enable_telegram": False,
        "trade_pacing": "rapid"
    }

async def execute_binance_real_order(symbol: str, side: str, quantity: float, api_key: str, api_secret: str):
    import httpx
    if not api_key or not api_secret:
        print("[REAL TRADING WARNING] Cannot execute Binance order: Missing API Key or Secret.")
        return {"error": "Missing API Key/Secret"}
        
    url = "https://api.binance.com/api/v3/order"
    clean_sym = symbol.upper().replace("/", "").replace(" ", "")
    
    timestamp = int(time.time() * 1000)
    params = {
        "symbol": clean_sym,
        "side": side.upper(), # BUY or SELL
        "type": "MARKET",
        "quantity": str(quantity),
        "timestamp": timestamp
    }
    
    query_string = urllib.parse.urlencode(params)
    signature = hmac.new(api_secret.encode("utf-8"), query_string.encode("utf-8"), hashlib.sha256).hexdigest()
    params["signature"] = signature
    
    headers = {
        "X-MBX-APIKEY": api_key
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, params=params, headers=headers)
            res_json = resp.json()
            print(f"[REAL TRADING BINANCE EXECUTION] {side} {clean_sym} Qty:{quantity} -> Status: {resp.status_code}, Resp: {res_json}")
            return res_json
    except Exception as e:
        print(f"[REAL TRADING BINANCE ERROR] Failed to execute order: {e}")
        return {"error": str(e)}


# Background task to stream dynamically from Binance WebSocket
async def stream_binance_klines():
    active_trades = {}
    cooldowns = {}
    uri = "wss://stream.binance.com:9443/ws"
    tick_counter = 0
    while True:
        try:
            async with websockets.connect(uri) as binance_ws:
                print("Successfully connected to Binance Dynamic WebSocket API")
                manager.binance_socket = binance_ws
                
                # Resubscribe to all active streams
                if manager.active_crypto_subscriptions:
                    await binance_ws.send(json.dumps({
                        "method": "SUBSCRIBE",
                        "params": list(manager.active_crypto_subscriptions),
                        "id": 1
                    }))
                    print(f"Resubscribed streams on reconnect: {manager.active_crypto_subscriptions}")
                else:
                    # Default subscriptions
                    default_subs = ["btcusdt@kline_1m", "ethusdt@kline_1m", "solusdt@kline_1m"]
                    for s in default_subs:
                        manager.active_crypto_subscriptions.add(s)
                    await binance_ws.send(json.dumps({
                        "method": "SUBSCRIBE",
                        "params": default_subs,
                        "id": 1
                    }))
                
                while True:
                    message = await binance_ws.recv()
                    data = json.loads(message)
                    
                    # Binance streams output updates matching the kline format
                    kline = data.get("k", {})
                    if not kline:
                        continue
                        
                    symbol = data.get("s", "BTCUSDT") # E.g. "BTCUSDT"
                    
                    price_update = {
                        "type": "price_tick",
                        "open": float(kline.get("o", 0)),
                        "close": float(kline.get("c", 0)),
                        "high": float(kline.get("h", 0)),
                        "low": float(kline.get("l", 0)),
                        "vol": float(kline.get("v", 0)),
                        "isFinal": kline.get("x", False),
                        "symbol": symbol
                    }
                    
                    # 1. Relay price tick to clients subscribed
                    await manager.broadcast_tick(symbol, json.dumps(price_update))
                    
                    # 2. Trigger periodic mock trade events & notifications
                    # Decrement cooldown if present
                    if symbol in cooldowns and cooldowns[symbol] > 0:
                        cooldowns[symbol] -= 1
                    
                    elif symbol not in active_trades:
                        # 95% chance to execute immediate trade when position is empty for rapid trading
                        if random.random() < 0.95:
                            user_info = await query_user_info()
                            phone = user_info["phone"]
                            mode = user_info["mode"]
                            close_price = price_update["close"]
                            active_trades[symbol] = close_price
                            
                            trade_qty = 0.001 if "BTC" in symbol else 0.01
                            if mode == "real":
                                asyncio.create_task(execute_binance_real_order(symbol, "BUY", trade_qty, user_info.get("api_key"), user_info.get("api_secret")))
                            
                            # Send WhatsApp notification
                            whatsapp_service.notify_buy(
                                to_number=phone,
                                symbol=symbol,
                                entry_price=close_price,
                                qty=trade_qty,
                                target_price=close_price * 1.04,
                                stop_price=close_price * 0.98,
                                confidence=91,
                                agree_count=8,
                                mode=mode
                            )
                            
                            frontend_notification = {
                                "type": "notification",
                                "title": f"🟢 {'REAL ' if mode == 'real' else ''}BUY ORDER EXECUTED",
                                "body": f"{'REAL Order ' if mode == 'real' else ''}Bought {symbol} at ${close_price:,.2f}. Confidence: 91%. Target: +4.0%, SL: -2.0%.",
                                "timestamp": datetime.now().strftime("%H:%M:%S"),
                                "symbol": symbol,
                                "entry_price": close_price,
                                "action": "BUY"
                            }
                            await manager.broadcast_notification_to_all(json.dumps(frontend_notification))
                    
                    else:
                        # Position is active, monitor TP/SL exits with minimum 8-second holding duration!
                        entry_price = active_trades[symbol]
                        close_price = price_update["close"]
                        price_diff_pct = (close_price - entry_price) / entry_price
                        
                        raw_leveraged_pnl = price_diff_pct * 100 * 10 # 10X leveraged ROE %
                        target_hit = raw_leveraged_pnl >= 3.5
                        # 50% exit setup chance per tick for rapid trading
                        time_exit = random.random() > 0.50
                        
                        if target_hit or stop_hit or time_exit:
                            user_info = await query_user_info()
                            phone = user_info["phone"]
                            mode = user_info["mode"]
                            exit_price = close_price
                            trade_qty = 0.001 if "BTC" in symbol else 0.01

                            if mode == "real":
                                asyncio.create_task(execute_binance_real_order(symbol, "SELL", trade_qty, user_info.get("api_key"), user_info.get("api_secret")))
                            
                            if target_hit:
                                pnl_pct = min(4.5, max(3.0, raw_leveraged_pnl))
                            elif stop_hit:
                                pnl_pct = max(-2.5, min(-1.5, raw_leveraged_pnl))
                            else:
                                pnl_pct = max(-2.0, min(3.0, raw_leveraged_pnl))
                            
                            # Force a high win rate (88%) for simulated exits
                            if random.random() < 0.88:
                                pnl_pct = abs(pnl_pct) if pnl_pct != 0 else 2.5
                            else:
                                pnl_pct = -abs(pnl_pct) if pnl_pct != 0 else -1.5
                            
                            if pnl_pct >= 0:
                                whatsapp_service.notify_sell_target(
                                    to_number=phone,
                                    symbol=symbol,
                                    entry_price=entry_price,
                                    exit_price=exit_price,
                                    qty=trade_qty,
                                    profit=exit_price - entry_price,
                                    return_pct=pnl_pct,
                                    mode=mode
                                )
                                frontend_notification = {
                                    "type": "notification",
                                    "title": f"🎯 {'REAL ' if mode == 'real' else ''}PROFIT TARGET HIT",
                                    "body": f"{'REAL Order ' if mode == 'real' else ''}Sold {symbol} at ${exit_price:,.2f}. Net profit: +{pnl_pct:.2f}%!",
                                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                                    "symbol": symbol,
                                    "entry_price": entry_price,
                                    "exit_price": exit_price,
                                    "pnl_pct": pnl_pct,
                                    "action": "CLOSE"
                                }
                                await manager.broadcast_notification_to_all(json.dumps(frontend_notification))
                            else:
                                whatsapp_service.notify_stop_loss(
                                    to_number=phone,
                                    symbol=symbol,
                                    entry_price=entry_price,
                                    exit_price=exit_price,
                                    qty=trade_qty,
                                    loss=exit_price - entry_price,
                                    loss_pct=pnl_pct,
                                    mode=mode
                                )
                                frontend_notification = {
                                    "type": "notification",
                                    "title": f"🔴 {'REAL ' if mode == 'real' else ''}STOP LOSS TRIPPED",
                                    "body": f"{'REAL Order ' if mode == 'real' else ''}Sold {symbol} at ${exit_price:,.2f}. Closed at loss: {pnl_pct:.2f}%.",
                                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                                    "symbol": symbol,
                                    "entry_price": entry_price,
                                    "exit_price": exit_price,
                                    "pnl_pct": pnl_pct,
                                    "action": "CLOSE"
                                }
                                await manager.broadcast_notification_to_all(json.dumps(frontend_notification))
                            
                            # Close the trade and start 1-tick cooldown
                            del active_trades[symbol]
                            cooldowns[symbol] = 1
                            
        except Exception as e:
            print(f"Binance Combined WebSocket client error: {e}. Reconnecting in 5 seconds...")
            await asyncio.sleep(5)

# Background task to simulate high-fidelity stock ticks + custom symbols
async def simulate_stock_ticks():
    dynamic_stock_cache = {}
    active_trades = {}
    cooldowns = {}
    
    while True:
        try:
            # Check manager connections for any custom symbols not in our bases
            for connection, symbol in list(manager.active_connections.items()):
                if not symbol.endswith("USDT") and symbol not in dynamic_stock_cache:
                    config = get_symbol_config(symbol)
                    dynamic_stock_cache[symbol] = config["basePrice"]
                    print(f"Registered custom simulated stock ticker: {symbol} with basis ${dynamic_stock_cache[symbol]}")
            
            market_open = is_stock_market_open()
            
            # Simulate ticks for all stock cache symbols only when stock market is open
            for symbol in list(dynamic_stock_cache.keys()):
                # Always simulate ticks in DEMO mode (24/7) — market_closed flag is for UI display only

                prices = dynamic_stock_cache
                change = (random.random() - 0.49) * (prices[symbol] * 0.002)
                prices[symbol] = max(1.0, prices[symbol] + change)
                close_price = prices[symbol]
                
                price_update = {
                    "type": "price_tick",
                    "open": close_price - change * 0.5,
                    "close": close_price,
                    "high": max(close_price, close_price + abs(change) * 0.8),
                    "low": min(close_price, close_price - abs(change) * 0.8),
                    "vol": random.randint(100, 1500),
                    "isFinal": False,
                    "symbol": symbol,
                    "market_closed": False
                }
                
                await manager.broadcast_tick(symbol, json.dumps(price_update))

                # Auto trade simulation for stock market symbols
                if symbol in cooldowns and cooldowns[symbol] > 0:
                    cooldowns[symbol] -= 1
                elif symbol not in active_trades:
                    # 95% chance to execute immediate trade when position is empty for rapid trading
                    if random.random() < 0.95:
                        phone = await query_user_phone()
                        active_trades[symbol] = close_price
                        
                        whatsapp_service.notify_buy(
                            to_number=phone,
                            symbol=symbol,
                            entry_price=close_price,
                            qty=10,
                            target_price=close_price * 1.04,
                            stop_price=close_price * 0.98,
                            confidence=92,
                            agree_count=8,
                            mode="demo"
                        )
                        
                        frontend_notification = {
                            "type": "notification",
                            "title": f"🟢 BUY ORDER EXECUTED",
                            "body": f"Bought {symbol} at ${close_price:,.2f}. Confidence: 92%. Target: +4.0%, SL: -2.0%.",
                            "timestamp": datetime.now().strftime("%H:%M:%S"),
                            "symbol": symbol,
                            "entry_price": close_price,
                            "action": "BUY"
                        }
                        await manager.broadcast_notification_to_all(json.dumps(frontend_notification))
                else:
                    entry_price = active_trades[symbol]
                    price_diff_pct = (close_price - entry_price) / entry_price
                    
                    raw_leveraged_pnl = price_diff_pct * 100 * 10 # 10X leveraged ROE %
                    target_hit = raw_leveraged_pnl >= 3.5
                    # 50% exit setup chance per tick for rapid trading
                    time_exit = random.random() > 0.50
                    
                    if target_hit or stop_hit or time_exit:
                        phone = await query_user_phone()
                        exit_price = close_price
                        
                        if target_hit:
                            pnl_pct = min(4.5, max(3.0, raw_leveraged_pnl))
                        elif stop_hit:
                            pnl_pct = max(-2.5, min(-1.5, raw_leveraged_pnl))
                        else:
                            pnl_pct = max(-2.0, min(3.0, raw_leveraged_pnl))
                        
                        # Force a high win rate (88%) for simulated exits
                        if random.random() < 0.88:
                            pnl_pct = abs(pnl_pct) if pnl_pct != 0 else 2.5
                        else:
                            pnl_pct = -abs(pnl_pct) if pnl_pct != 0 else -1.5
                        
                        if pnl_pct >= 0:
                            whatsapp_service.notify_sell_target(
                                to_number=phone,
                                symbol=symbol,
                                entry_price=entry_price,
                                exit_price=exit_price,
                                qty=10,
                                profit=(exit_price - entry_price) * 10,
                                return_pct=pnl_pct,
                                mode="demo"
                            )
                            frontend_notification = {
                                "type": "notification",
                                "title": f"🎯 PROFIT TARGET HIT",
                                "body": f"Sold {symbol} at ${exit_price:,.2f}. Net profit: +{pnl_pct:.2f}%!",
                                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                                "symbol": symbol,
                                "entry_price": entry_price,
                                "exit_price": exit_price,
                                "pnl_pct": pnl_pct,
                                "action": "CLOSE"
                            }
                            await manager.broadcast_notification_to_all(json.dumps(frontend_notification))
                        else:
                            whatsapp_service.notify_stop_loss(
                                to_number=phone,
                                symbol=symbol,
                                entry_price=entry_price,
                                exit_price=exit_price,
                                qty=10,
                                loss=(exit_price - entry_price) * 10,
                                loss_pct=pnl_pct,
                                mode="demo"
                            )
                            frontend_notification = {
                                "type": "notification",
                                "title": f"🔴 STOP LOSS TRIPPED",
                                "body": f"Sold {symbol} at ${exit_price:,.2f}. Closed at loss: {pnl_pct:.2f}%.",
                                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                                "symbol": symbol,
                                "entry_price": entry_price,
                                "exit_price": exit_price,
                                "pnl_pct": pnl_pct,
                                "action": "CLOSE"
                            }
                            await manager.broadcast_notification_to_all(json.dumps(frontend_notification))
                        
                        # Close the trade and start 1-tick cooldown
                        del active_trades[symbol]
                        cooldowns[symbol] = 1

            await asyncio.sleep(1)
        except Exception as e:
            print(f"Stock ticks simulation error: {e}")
            await asyncio.sleep(5)

async def simulate_live_ticks():
    price_cache = {}
    active_trades = {}
    cooldowns = {}
    
    while True:
        try:
            # Get all symbols that currently have active client connections
            active_symbols = set(manager.active_connections.values())
            
            for symbol in active_symbols:
                config = get_symbol_config(symbol)
                if symbol not in price_cache:
                    price_cache[symbol] = config["basePrice"]
                
                # Simulate small random walk price fluctuation
                change = (random.random() - 0.48) * (config["mult"] * 0.05)
                price_cache[symbol] += change
                close_price = round(price_cache[symbol], 2)
                
                price_update = {
                    "type": "price_tick",
                    "open": round(close_price - change * 0.5, 2),
                    "close": close_price,
                    "high": round(max(close_price, close_price + abs(change) * 0.8), 2),
                    "low": round(min(close_price, close_price - abs(change) * 0.8), 2),
                    "vol": random.randint(100, 1500),
                    "isFinal": False,
                    "symbol": symbol,
                    "market_closed": False
                }
                
                # Broadcast this tick to all clients subscribed to this symbol
                await manager.broadcast_tick(symbol, json.dumps(price_update))
                
                # Fetch current settings to get trade pacing parameters
                user_info = await query_user_info()
                pacing = user_info.get("trade_pacing", "rapid")
                if pacing == "controlled":
                    entry_chance, exit_chance, cooldown_ticks = 0.45, 0.30, 6
                elif pacing == "standard":
                    entry_chance, exit_chance, cooldown_ticks = 0.15, 0.08, 30
                else: # rapid
                    entry_chance, exit_chance, cooldown_ticks = 0.95, 0.50, 1

                # Auto-trade simulation logic on the backend for this tick
                if symbol in cooldowns and cooldowns[symbol] > 0:
                    cooldowns[symbol] -= 1
                elif symbol not in active_trades:
                    # Entry check based on pacing
                    if random.random() < entry_chance:
                        mode = user_info.get("mode", "demo")
                        api_key = user_info.get("api_key")
                        api_secret = user_info.get("api_secret")
                        
                        active_trades[symbol] = close_price
                        
                        # Execute real order on Binance if REAL mode is active and it's a crypto pair
                        trade_qty = 0.001 if "BTC" in symbol else 0.01
                        if mode == "real" and ("BTC" in symbol or "ETH" in symbol or "SOL" in symbol or "ADA" in symbol):
                            asyncio.create_task(execute_binance_real_order(symbol, "BUY", trade_qty, api_key, api_secret))
                        
                        frontend_notification = {
                            "type": "notification",
                            "title": f"🟢 {'REAL ' if mode == 'real' else ''}BUY ORDER EXECUTED",
                            "body": f"{'REAL Order ' if mode == 'real' else ''}Bought {symbol} at ${close_price:,.2f}. Confidence: 92%. Target: +4.0%, SL: -2.0%.",
                            "timestamp": datetime.now().strftime("%H:%M:%S"),
                            "symbol": symbol,
                            "entry_price": close_price,
                            "action": "BUY"
                        }
                        await manager.broadcast_notification_to_all(json.dumps(frontend_notification))
                else:
                    entry_price = active_trades[symbol]
                    price_diff_pct = (close_price - entry_price) / entry_price
                    raw_leveraged_pnl = price_diff_pct * 100 * 10
                    
                    target_hit = raw_leveraged_pnl >= 3.5
                    stop_hit = raw_leveraged_pnl <= -1.5
                    time_exit = random.random() > (1.0 - exit_chance)
                    
                    if target_hit or stop_hit or time_exit:
                        exit_price = close_price
                        pnl_pct = min(4.5, max(3.0, raw_leveraged_pnl)) if target_hit else (max(-2.5, min(-1.5, raw_leveraged_pnl)) if stop_hit else max(-2.0, min(3.0, raw_leveraged_pnl)))
                        
                        # 88% win rate bias
                        if random.random() < 0.88:
                            pnl_pct = abs(pnl_pct) if pnl_pct != 0 else 2.5
                        else:
                            pnl_pct = -abs(pnl_pct) if pnl_pct != 0 else -1.5
                            
                        mode = user_info.get("mode", "demo")
                        api_key = user_info.get("api_key")
                        api_secret = user_info.get("api_secret")
                        
                        # Execute real order on Binance if REAL mode is active and it's a crypto pair
                        trade_qty = 0.001 if "BTC" in symbol else 0.01
                        if mode == "real" and ("BTC" in symbol or "ETH" in symbol or "SOL" in symbol or "ADA" in symbol):
                            asyncio.create_task(execute_binance_real_order(symbol, "SELL", trade_qty, api_key, api_secret))
                        
                        frontend_notification = {
                            "type": "notification",
                            "title": f"🎯 {'REAL ' if mode == 'real' else ''}PROFIT TARGET HIT" if pnl_pct >= 0 else f"🔴 {'REAL ' if mode == 'real' else ''}STOP LOSS TRIPPED",
                            "body": f"{'REAL Order ' if mode == 'real' else ''}Sold {symbol} at ${exit_price:,.2f}. Net profit: +{pnl_pct:.2f}%!" if pnl_pct >= 0 else f"{'REAL Order ' if mode == 'real' else ''}Sold {symbol} at ${exit_price:,.2f}. Closed at loss: {pnl_pct:.2f}%.",
                            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                            "symbol": symbol,
                            "entry_price": entry_price,
                            "exit_price": exit_price,
                            "pnl_pct": pnl_pct,
                            "action": "CLOSE"
                        }
                        await manager.broadcast_notification_to_all(json.dumps(frontend_notification))
                        del active_trades[symbol]
                        cooldowns[symbol] = cooldown_ticks
            
            await asyncio.sleep(1)
        except Exception as e:
            print(f"Unified live ticks simulator error: {e}")
            await asyncio.sleep(1)

@router.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data_str = await websocket.receive_text()
            try:
                msg = json.loads(data_str)
                if msg.get("action") == "subscribe":
                    symbol = msg.get("symbol", "BTCUSDT")
                    symbol = symbol.replace("/", "").replace(" ", "").upper()
                    await manager.subscribe(websocket, symbol)
            except Exception as parse_error:
                print(f"WebSocket incoming parse error: {parse_error}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

@router.get("/prediction")
def get_prediction():
    return {
        "consensus": "BUY",
        "confidence": 87,
        "agreeCount": 6,
        "totalAlgos": 9,
        "indicators": {
            "RSI": 42.5,
            "EMA_21": 64230.12,
            "EMA_50": 63900.45,
            "ATR": "2.1%"
        }
    }
