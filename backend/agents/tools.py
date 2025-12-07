# backend/agent/tools.py
from typing import Dict, Any
from datetime import datetime
import json


def tool_block_card(user_id: str, card_last4: str) -> str:
    data = {
        "status": "success",
        "action": "block_card",
        "card_last4": card_last4,
        "message": f"Card ending {card_last4} has been temporarily blocked."
    }
    return json.dumps(data)




def tool_unblock_card(user_id: str, card_last4: str) -> Dict[str, Any]:
    data = {
        "status": "success",
        "action": "unblock_card",
        "user_id": user_id,
        "card_last4": card_last4,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "message": f"Card ending {card_last4} has been unblocked."
    }
    return json.dumps(data)


def tool_get_bill_summary(user_id: str) -> Dict[str, Any]:
    return {
        "status": "success",
        "action": "bill_summary",
        "user_id": user_id,
        "current_outstanding": 15432.50,
        "minimum_due": 1500.00,
        "due_date": "2025-12-15",
        "currency": "INR"
    }


def tool_convert_to_emi(user_id: str, amount: float, tenure_months: int) -> Dict[str, Any]:
    monthly_interest_rate = 0.18 / 12
    emi = (amount * monthly_interest_rate * (1 + monthly_interest_rate) ** tenure_months) / (
        (1 + monthly_interest_rate) ** tenure_months - 1
    )
    return {
        "status": "success",
        "action": "convert_to_emi",
        "user_id": user_id,
        "amount": amount,
        "tenure_months": tenure_months,
        "approx_emi_per_month": round(emi, 2),
        "currency": "INR"
    }

def tool_get_current_balance(user_id: str):
    # Mock data — you can replace with DB later
    return {
        "total_outstanding": 12540,
        "available_credit": 47460,
        "statement_balance": 8200,
        "minimum_due": 820
    }
