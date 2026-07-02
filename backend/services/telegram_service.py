import os
import urllib.parse
import httpx
from datetime import datetime

class TelegramService:
    def __init__(self):
        self.log_filepath = os.path.join(os.path.dirname(os.path.dirname(__file__)), "telegram_alerts.log")

    def _send_telegram(self, bot_token: str, chat_id: str, message: str) -> dict:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        
        alert_payload = {
            "timestamp": timestamp,
            "to": chat_id,
            "message": message,
            "status": "pending"
        }

        # Log locally
        try:
            with open(self.log_filepath, "a", encoding="utf-8") as f:
                f.write(f"--- TELEGRAM [{timestamp}] ---\nChat ID: {chat_id}\n{message}\n-------------------------\n\n")
        except Exception as e:
            print(f"[Telegram] Error writing log file: {e}")

        # Send via Telegram API
        try:
            resp = httpx.post(url, json={
                "chat_id": chat_id,
                "text": message,
                "parse_mode": "HTML"
            }, timeout=15.0)
            
            if resp.status_code == 200:
                alert_payload["status"] = "sent"
                print(f"[Telegram] ✅ Message sent to chat {chat_id}")
            else:
                alert_payload["status"] = "error"
                alert_payload["error"] = f"HTTP {resp.status_code}: {resp.text[:200]}"
                print(f"[Telegram] ❌ Error: {resp.status_code} - {resp.text[:200]}")
        except Exception as e:
            alert_payload["status"] = "error"
            alert_payload["error"] = str(e)
            print(f"[Telegram] ❌ Network error: {e}")

        return alert_payload

    def notify_buy(self, bot_token: str, chat_id: str, symbol: str, entry_price: float, qty: float, target_price: float, stop_price: float, confidence: int, agree_count: int, mode: str) -> dict:
        label = "<b>[DEMO]</b>" if mode == "demo" else "<b>[REAL]</b>"
        curr = "$" if any(x in symbol.upper() for x in ["USDT", "BTC", "ETH", "SOL", "ADA", "USD"]) else "₹"
        msg = (
            f"🟢 <b>BUY EXECUTED {label}</b>\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"<b>Pair</b>    : {symbol}\n"
            f"<b>Action</b>  : BUY ✅\n"
            f"<b>Price</b>   : {curr}{entry_price:,.2f}\n"
            f"<b>Qty</b>     : {qty:.4f}\n"
            f"<b>Amount</b>  : {curr}{(entry_price * qty):,.2f}\n"
            f"<b>Target</b>  : {curr}{target_price:,.2f} (1.5X)\n"
            f"<b>Stop</b>    : {curr}{stop_price:,.2f} (-2%)\n"
            f"<b>AI Conf</b> : {confidence}% ({agree_count}/9 algos)\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"<i>CryptoAI Trader</i>"
        )
        return self._send_telegram(bot_token, chat_id, msg)

    def notify_sell_target(self, bot_token: str, chat_id: str, symbol: str, entry_price: float, exit_price: float, qty: float, profit: float, return_pct: float, mode: str) -> dict:
        label = "<b>[DEMO]</b>" if mode == "demo" else "<b>[REAL]</b>"
        curr = "$" if any(x in symbol.upper() for x in ["USDT", "BTC", "ETH", "SOL", "ADA", "USD"]) else "₹"
        msg = (
            f"🎯 <b>PROFIT TARGET HIT {label}</b>\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"<b>Pair</b>    : {symbol}\n"
            f"<b>Action</b>  : SELL ✅ (1.5X Target)\n"
            f"<b>Exit</b>    : {curr}{exit_price:,.2f}\n"
            f"<b>Entry</b>   : {curr}{entry_price:,.2f}\n"
            f"<b>Profit</b>  : +{curr}{profit:,.2f}\n"
            f"<b>Return</b>  : +{return_pct:.1f}% 🚀\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"<i>CryptoAI Trader</i>"
        )
        return self._send_telegram(bot_token, chat_id, msg)

    def notify_stop_loss(self, bot_token: str, chat_id: str, symbol: str, entry_price: float, exit_price: float, qty: float, loss: float, loss_pct: float, mode: str) -> dict:
        label = "<b>[DEMO]</b>" if mode == "demo" else "<b>[REAL]</b>"
        curr = "$" if any(x in symbol.upper() for x in ["USDT", "BTC", "ETH", "SOL", "ADA", "USD"]) else "₹"
        msg = (
            f"🔴 <b>STOP LOSS HIT {label}</b>\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"<b>Pair</b>    : {symbol}\n"
            f"<b>Action</b>  : SELL ⚠️ (Stop Loss)\n"
            f"<b>Exit</b>    : {curr}{exit_price:,.2f}\n"
            f"<b>Entry</b>   : {curr}{entry_price:,.2f}\n"
            f"<b>Loss</b>    : -{curr}{abs(loss):,.2f}\n"
            f"<b>Return</b>  : {loss_pct:.1f}%\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"<i>CryptoAI Trader</i>"
        )
        return self._send_telegram(bot_token, chat_id, msg)

telegram_service = TelegramService()
