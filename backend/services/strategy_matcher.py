import re
import json

def parse_rule_condition(detail_text: str, indicators: dict) -> bool:
    """
    Parses a single rule detail string to check if its technical condition is met.
    Returns True if condition is met, False otherwise.
    """
    text = detail_text.lower()
    close_price = indicators.get("close", 0.0)
    
    # --- RSI Conditions ---
    if "rsi" in text:
        rsi_val = indicators.get("RSI")
        if rsi_val is not None:
            # Matches: rsi below 30, rsi is below 30, rsi < 30
            m_below = re.search(r'(?:below|under|<|less than)\s*([0-9.]+)', text)
            if m_below:
                limit = float(m_below.group(1))
                return rsi_val < limit
                
            # Matches: rsi above 70, rsi is above 70, rsi > 70
            m_above = re.search(r'(?:above|over|>|greater than)\s*([0-9.]+)', text)
            if m_above:
                limit = float(m_above.group(1))
                return rsi_val > limit
                
            # Matches: rsi between 50 and 65
            m_between = re.search(r'between\s*([0-9.]+)\s*and\s*([0-9.]+)', text)
            if m_between:
                low = float(m_between.group(1))
                high = float(m_between.group(2))
                return low <= rsi_val <= high

    # --- EMA / Price Crossover Conditions ---
    # Case: EMA 9 is above EMA 21 (or similar)
    if "ema" in text:
        ema9 = indicators.get("EMA_9")
        ema21 = indicators.get("EMA_21")
        if ema9 is not None and ema21 is not None:
            if "9 ema is above 21 ema" in text or "ema 9 is above ema 21" in text or "9 ema above 21 ema" in text or "9 is above 21" in text or "20 ema must be above 50 ema" in text or "20 ema above 50 ema" in text:
                return ema9 > ema21
            if "9 ema is below 21 ema" in text or "ema 9 is below ema 21" in text or "9 ema below 21 ema" in text or "9 is below 21" in text or "20 ema must be below 50 ema" in text or "20 ema below 50 ema" in text:
                return ema9 < ema21
                
        # Case: Price relative to EMA
        if "price" in text or "close" in text:
            # Price above EMA 9
            if "above" in text or ">" in text:
                if "9 ema" in text or "ema 9" in text:
                    return close_price > (ema9 or 0.0)
                if "21 ema" in text or "ema 21" in text:
                    return close_price > (ema21 or 0.0)
            # Price below EMA
            if "below" in text or "<" in text:
                if "9 ema" in text or "ema 9" in text:
                    return close_price < (ema9 or 0.0)
                if "21 ema" in text or "ema 21" in text:
                    return close_price < (ema21 or 0.0)

    # --- VWAP Conditions ---
    if "vwap" in text:
        vwap = indicators.get("VWAP")
        if vwap is not None and close_price > 0:
            if "above" in text or ">" in text:
                return close_price > vwap
            if "below" in text or "<" in text:
                return close_price < vwap

    # If the rule has no recognizable technical condition, default to True (don't block the strategy)
    return True

def evaluate_strategy(rules_list: list, indicators: dict) -> str:
    """
    Evaluates a list of rules against current indicators.
    Returns: "BUY", "SELL", or "HOLD"
    """
    if not rules_list:
        return "HOLD"
        
    buy_conditions = []
    sell_conditions = []
    
    for rule in rules_list:
        if not isinstance(rule, dict):
            continue
            
        rule_title = rule.get("rule", "").lower()
        detail = rule.get("detail", "")
        
        # Determine if this rule is a BUY trigger or SELL trigger
        is_buy = "buy" in rule_title or "entry" in rule_title or "trigger" in rule_title or "long" in rule_title or "buy" in detail.lower() or "long" in detail.lower()
        is_sell = "sell" in rule_title or "exit" in rule_title or "short" in rule_title or "sell" in detail.lower() or "short" in detail.lower()
        
        condition_met = parse_rule_condition(detail, indicators)
        
        if is_buy:
            buy_conditions.append(condition_met)
        elif is_sell:
            sell_conditions.append(condition_met)

    # If all BUY conditions are met (and we have at least one), return BUY
    if buy_conditions and all(buy_conditions):
        return "BUY"
        
    # If all SELL conditions are met (and we have at least one), return SELL
    if sell_conditions and all(sell_conditions):
        return "SELL"
        
    return "HOLD"

def parse_sl_tp_ratios(rules_list: list) -> tuple:
    """
    Extracts stop-loss and take-profit percentages or ratios from the strategy rules text.
    Returns: (stop_loss_pct, take_profit_pct) or (None, None)
    """
    sl_pct = None
    tp_pct = None
    
    for rule in rules_list:
        if not isinstance(rule, dict):
            continue
        detail = rule.get("detail", "").lower()
        
        # Stop loss percentage extraction
        if "stop loss" in detail or "stop-loss" in detail or "sl" in detail:
            # Match percentages like "1.5%", "2%", "0.5%"
            m_pct = re.search(r'([0-9.]+)\s*%', detail)
            if m_pct:
                sl_pct = float(m_pct.group(1)) / 100.0
                
        # Take profit percentage extraction
        if "take profit" in detail or "take-profit" in detail or "tp" in detail or "target profit" in detail:
            m_pct = re.search(r'([0-9.]+)\s*%', detail)
            if m_pct:
                tp_pct = float(m_pct.group(1)) / 100.0
                
        # Match Risk-to-Reward ratios like "1:2", "1:3"
        m_rrr = re.search(r'(?:risk-to-reward|risk reward|ratio of)\s*([0-9.]+)\s*:\s*([0-9.]+)', detail)
        if m_rrr:
            risk = float(m_rrr.group(1))
            reward = float(m_rrr.group(2))
            if risk > 0 and reward > 0 and sl_pct is not None:
                # Calculate TP based on SL and RRR
                tp_pct = sl_pct * (reward / risk)

    return sl_pct, tp_pct
