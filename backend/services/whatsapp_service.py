import os
import urllib.parse
import httpx
from datetime import datetime
from config import settings

class WhatsAppService:
    def __init__(self):
        self.account_sid = settings.TWILIO_ACCOUNT_SID
        self.auth_token = settings.TWILIO_AUTH_TOKEN
        self.from_number = settings.TWILIO_FROM_NUMBER

        # Verify if Twilio credentials are fully supplied
        if self.account_sid and self.auth_token:
            try:
                from twilio.rest import Client
                self.client = Client(self.account_sid, self.auth_token)
                print("[Twilio Service] Initialized successfully in LIVE mode.")
            except Exception as e:
                print(f"[Twilio Service] Failed to initialize live client: {e}. Falling back to SANDBOX mode.")
                self.client = None
        else:
            print("[Twilio Service] Missing credentials. Initialized in Sandbox fallback mode (Writing to whatsapp_alerts.log).")
            self.client = None

        self.log_filepath = os.path.join(os.path.dirname(os.path.dirname(__file__)), "whatsapp_alerts.log")

    def _send(self, to_number: str, message: str) -> dict:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        target_whatsapp = f"whatsapp:{to_number}" if not to_number.startswith("whatsapp:") else to_number
        
        alert_payload = {
            "timestamp": timestamp,
            "to": target_whatsapp,
            "message": message,
            "status": "logged"
        }

        # 1. Write to local history log file
        try:
            with open(self.log_filepath, "a", encoding="utf-8") as f:
                f.write(f"--- ALERT [{timestamp}] ---\nTo: {target_whatsapp}\n{message}\n-------------------------\n\n")
        except Exception as e:
            print(f"[Twilio Service] Error writing log file: {e}")

        # 2. If client is live, send real Twilio message
        if self.client:
            try:
                self.client.messages.create(
                    body=message,
                    from_=self.from_number,
                    to=target_whatsapp
                )
                alert_payload["status"] = "sent"
            except Exception as e:
                error_msg = f"Failed to send Twilio message: {e}"
                print(f"[Twilio Service] {error_msg}")
                alert_payload["status"] = "error"
                alert_payload["error"] = error_msg

        return alert_payload

    # ───────────────────────────────────────────────────────
    # CallMeBot FREE WhatsApp API
    # ───────────────────────────────────────────────────────
    # How it works:
    #   1. User saves CallMeBot number +34 644 71 80 02 in contacts
    #   2. User sends "I allow callmebot to send me messages" to that number
    #   3. CallMeBot replies with an API key
    #   4. User enters phone + apikey in Settings
    #   5. App sends GET to https://api.callmebot.com/whatsapp.php?phone=...&text=...&apikey=...
    # ───────────────────────────────────────────────────────
    def _send_callmebot(self, phone: str, apikey: str, message: str) -> dict:
        """Send a real WhatsApp message via the free CallMeBot API."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        clean_phone = "".join(filter(str.isdigit, phone))
        encoded_msg = urllib.parse.quote(message)
        url = f"https://api.callmebot.com/whatsapp.php?phone={clean_phone}&text={encoded_msg}&apikey={apikey}"

        alert_payload = {
            "timestamp": timestamp,
            "to": phone,
            "message": message,
            "method": "callmebot",
            "status": "pending"
        }

        # Log locally
        try:
            with open(self.log_filepath, "a", encoding="utf-8") as f:
                f.write(f"--- CALLMEBOT [{timestamp}] ---\nTo: {phone}\n{message}\n-------------------------\n\n")
        except Exception as e:
            print(f"[CallMeBot] Error writing log file: {e}")

        # Send via CallMeBot
        try:
            resp = httpx.get(url, timeout=15.0)
            if resp.status_code == 200:
                alert_payload["status"] = "sent"
                print(f"[CallMeBot] ✅ Message sent to {phone}")
            else:
                alert_payload["status"] = "error"
                alert_payload["error"] = f"HTTP {resp.status_code}: {resp.text[:200]}"
                print(f"[CallMeBot] ❌ Error: {resp.status_code} - {resp.text[:200]}")
        except Exception as e:
            alert_payload["status"] = "error"
            alert_payload["error"] = str(e)
            print(f"[CallMeBot] ❌ Network error: {e}")

        return alert_payload

    def send_smart(self, phone: str, apikey: str | None, message: str) -> dict:
        """Try CallMeBot first (if apikey provided), then Twilio, then just log."""
        if apikey:
            return self._send_callmebot(phone, apikey, message)
        else:
            return self._send(phone, message)

    def notify_buy(self, to_number: str, symbol: str, entry_price: float, qty: float, target_price: float, stop_price: float, confidence: int, agree_count: int, mode: str, apikey: str | None = None) -> dict:
        label = "[DEMO]" if mode == "demo" else "[REAL]"
        msg = (
            f"🟢 BUY EXECUTED {label}\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"Pair    : {symbol}\n"
            f"Action  : BUY ✅\n"
            f"Price   : ₹{entry_price:,.2f}\n"
            f"Qty     : {qty:.4f}\n"
            f"Amount  : ₹{(entry_price * qty):,.2f}\n"
            f"Target  : ₹{target_price:,.2f} (1.5X)\n"
            f"Stop    : ₹{stop_price:,.2f} (-2%)\n"
            f"AI Conf : {confidence}% ({agree_count}/9 algos)\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"CryptoAI Trader"
        )
        if apikey:
            return self._send_callmebot(to_number, apikey, msg)
        return self._send(to_number, msg)

    def notify_sell_target(self, to_number: str, symbol: str, entry_price: float, exit_price: float, qty: float, profit: float, return_pct: float, mode: str, apikey: str | None = None) -> dict:
        label = "[DEMO]" if mode == "demo" else "[REAL]"
        msg = (
            f"🎯 PROFIT TARGET HIT {label}\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"Pair    : {symbol}\n"
            f"Action  : SELL ✅ (1.5X Target)\n"
            f"Exit    : ₹{exit_price:,.2f}\n"
            f"Entry   : ₹{entry_price:,.2f}\n"
            f"Profit  : +₹{profit:,.2f}\n"
            f"Return  : +{return_pct:.1f}% 🚀\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"CryptoAI Trader"
        )
        if apikey:
            return self._send_callmebot(to_number, apikey, msg)
        return self._send(to_number, msg)

    def notify_stop_loss(self, to_number: str, symbol: str, entry_price: float, exit_price: float, qty: float, loss: float, loss_pct: float, mode: str, apikey: str | None = None) -> dict:
        label = "[DEMO]" if mode == "demo" else "[REAL]"
        msg = (
            f"🔴 STOP LOSS HIT {label}\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"Pair    : {symbol}\n"
            f"Action  : SELL ⚠️ (Stop Loss)\n"
            f"Exit    : ₹{exit_price:,.2f}\n"
            f"Entry   : ₹{entry_price:,.2f}\n"
            f"Loss    : -₹{abs(loss):,.2f}\n"
            f"Return  : {loss_pct:.1f}%\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"CryptoAI Trader"
        )
        if apikey:
            return self._send_callmebot(to_number, apikey, msg)
        return self._send(to_number, msg)

whatsapp_service = WhatsAppService()
