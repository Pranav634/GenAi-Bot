# # backend/agent/agent.py

# import os
# import json
# from typing import Dict, Any, Literal

# from dotenv import load_dotenv
# from groq import Groq
# from .query_rewriter import rewrite_query

# # NEW: import our merged RAG retriever
# from backend.rag import retrieve

# # Import tools
# from .tools import (
#     tool_block_card,
#     tool_unblock_card,
#     tool_get_bill_summary,
#     tool_convert_to_emi,
#     tool_get_current_balance
# )

# load_dotenv()

# client = Groq(api_key=os.getenv("GROQ_API_KEY"))
# MODEL_NAME = os.getenv("MODEL_NAME", "llama-3.1-8b-instant")

# Intent = Literal["info", "action", "unknown"]


# # -------------------------------------------------------
# # INTENT CLASSIFIER
# # -------------------------------------------------------
# def classify_intent(message: str) -> Dict[str, str]:
#     system = """
# You are an intent classifier for a credit card assistant.

# Return STRICT JSON:
# {
#   "intent": "info" | "action" | "unknown",
#   "category": "...",
#   "action": "none" | "block_card" | "unblock_card" | "get_bill_summary" | "convert_to_emi" | "get_current_balance"
# }

# Rules:
# - If the user asks for EMI, convert, breakup, monthly cost → action = convert_to_emi
# - If the user mentions an amount + “emi”, “installment”, “plan”, “convert”, “break into emi” → action = convert_to_emi
# - "best emi plan" ALWAYS means convert_to_emi, even without amount.
# - If the user asks for balance, available credit, outstanding amount → action = get_current_balance
# - Examples:
#   "current balance"
#   "kitna outstanding hai"
#   "available credit kya hai"
#   "due amount"
#   "how much do I owe"
# - If the user asks to block or unblock a card → action = block_card | unblock_card
# - If the user asks for bill summary, statement → action = get_bill_summary
# - If unsure, return intent = unknown and action = none
# """
#     resp = client.chat.completions.create(
#         model=MODEL_NAME,
#         messages=[
#             {"role": "system", "content": system},
#             {"role": "user", "content": message},
#         ],
#         temperature=0.0,
#         response_format={"type": "json_object"},
#     )

#     try:
#         return json.loads(resp.choices[0].message.content)
#     except:
#         return {"intent": "unknown", "category": "other", "action": "none"}


# # -------------------------------------------------------
# # INFO HANDLER (USES RAG)
# # -------------------------------------------------------
# def handle_info(message: str) -> str:
#     kb_results = retrieve(message, top_k=5)

#     context = "\n".join([f"- {r['chunk']}" for r in kb_results])

#     prompt = f"""
# User question:
# {message}

# Relevant knowledge base snippets:
# {context}

# Answer using ONLY the information in these snippets.
# If something is not defined, say so clearly.
# Be concise, correct, and friendly.
# """

#     resp = client.chat.completions.create(
#         model=MODEL_NAME,
#         messages=[
#             {"role": "system", "content": "You are a credit card assistant. Use only the provided KB context."},
#             {"role": "user", "content": prompt},
#         ],
#         temperature=0.2,
#     )

#     return resp.choices[0].message.content


# # -------------------------------------------------------
# # ACTION HANDLER (TOOLS)
# # -------------------------------------------------------
# def handle_action(user_id: str, message: str, intent_data: Dict[str, Any]) -> str:
#     action = intent_data.get("action", "none")

#     param_prompt = f"""
# You are a fintech EMI explanation engine.

# User query:
# {message}

# EMI options (computed by EMI engine):
# {json.dumps(result, indent=2)}

# Generate a structured response:
# - Create an EMI comparison table
# - Show EMI, interest, GST, and total cost
# - Highlight the cheapest total-cost plan
# - Answer in a friendly, professional tone
# """

#     resp = client.chat.completions.create(
#         model=MODEL_NAME,
#         messages=[
#             {"role": "system", "content": "Return JSON only."},
#             {"role": "user", "content": param_prompt},
#         ],
#         response_format={"type": "json_object"},
#         temperature=0.0,
#     )

#     try:
#         params = json.loads(resp.choices[0].message.content)
#     except:
#         params = {}

#     result = None

#     if action == "block_card":
#         last4 = params.get("card_last4", "1234")
#         result = tool_block_card(user_id, last4)

#     elif action == "unblock_card":
#         last4 = params.get("card_last4", "1234")
#         result = tool_unblock_card(user_id, last4)
        

#     elif action == "get_bill_summary":
#         result = tool_get_bill_summary(user_id)

#     elif action == "get_current_balance":
#         result = tool_get_current_balance(user_id)


#     elif action == "convert_to_emi":
#         from .emi_engine import get_emi_options

#         amount = float(params.get("amount", 0))

#     # If amount was not extracted correctly, try extracting from original message
#         if amount == 0:
#             import re
#             nums = re.findall(r"\d+", message)
#             if nums:
#                 amount = float(nums[0])

#         emi_options = get_emi_options(amount)

#         result = {
#             "amount": amount,
#             "options": emi_options
#         }




#     # If tool failed → fallback to information answer
#     if result is None:
#         return handle_info(message)

#     explain_prompt = f"""
# You are a fintech assistant. Explain the EMI options professionally.

# User query:
# {message}

# EMI computation result:
# {json.dumps(result, indent=2)}

# Guidelines:
# - Create an EMI comparison table (3, 6, 9, 12 months).
# - Highlight interest, GST, and total cost.
# - Recommend the best tenure (lowest total cost).
# - Keep formatting clean and readable.
# """


#     explain_resp = client.chat.completions.create(
#         model=MODEL_NAME,
#         messages=[
#             {"role": "system", "content": "Explain the tool result clearly to the user."},
#             {"role": "user", "content": explain_prompt},
#         ],
#         temperature=0.3,
#     )

#     return explain_resp.choices[0].message.content


# # -------------------------------------------------------
# # MAIN AGENT ROUTER
# # -------------------------------------------------------
# def run_agent(user_id: str, message: str, allow_actions: bool = True) -> Dict[str, Any]:

#     # 🔥 NEW: Rewrite the query
#     clean_query = rewrite_query(message)

#     # 🔍 Intent classification uses rewritten query
#     intent_data = classify_intent(clean_query)
#     intent = intent_data.get("intent", "unknown")

#     # 🧠 Info or Action handler
#     if intent == "info" or not allow_actions:
#         answer = handle_info(clean_query)

#     elif intent == "action":
#         answer = handle_action(user_id, clean_query, intent_data)

#     else:
#         answer = (
#             "I'm not fully sure what you mean. "
#             "Is it about your bill, EMI, repayment, delivery, or a transaction?"
#         )

#     # 🔥 RETURN FULL DEBUG DATA
#     return {
#         "intent": intent,
#         "intent_meta": intent_data,
#         "rewritten_query": clean_query,    # <-- IMPORTANT
#         "answer": answer
#     }


# backend/agent/agent.py

import os
import json
from typing import Dict, Any, Literal

from dotenv import load_dotenv
from groq import Groq
from .query_rewriter import rewrite_query

# RAG retriever
from backend.rag import retrieve

# Tools
from .tools import (
    tool_block_card,
    tool_unblock_card,
    tool_get_bill_summary,
    tool_convert_to_emi,
    tool_get_current_balance,
)

# EMI Engine
from .emi_engine import get_emi_options

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL_NAME = os.getenv("MODEL_NAME", "llama-3.1-8b-instant")

Intent = Literal["info", "action", "unknown"]


# -------------------------------------------------------
# INTENT CLASSIFIER
# -------------------------------------------------------
def classify_intent(message: str) -> Dict[str, str]:
    system = """
You are an intent classifier for a credit card assistant.

Return STRICT JSON:
{
  "intent": "info" | "action" | "unknown",
  "category": "...",
  "action": "none" | "block_card" | "unblock_card" | "get_bill_summary" |
            "convert_to_emi" | "get_current_balance"
}

Rules:
- EMI questions → convert_to_emi
- Best EMI plan → convert_to_emi
- Current balance, outstanding, due → get_current_balance
- Bill / statement → get_bill_summary
- Block / unblock → block_card / unblock_card
"""

    resp = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": message},
        ],
        temperature=0.0,
        response_format={"type": "json_object"},
    )

    try:
        return json.loads(resp.choices[0].message.content)
    except:
        return {"intent": "unknown", "category": "other", "action": "none"}


# -------------------------------------------------------
# INFO HANDLER (RAG)
# -------------------------------------------------------
def handle_info(message: str) -> str:
    kb = retrieve(message, top_k=5)

    context = "\n".join([f"- {r['chunk']}" for r in kb])

    prompt = f"""
User question:
{message}

Relevant knowledge base:
{context}

Use ONLY the information above. If not found, say so.
"""

    resp = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": "Credit card assistant. Use only KB context."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )

    return resp.choices[0].message.content


# -------------------------------------------------------
# ACTION HANDLER
# -------------------------------------------------------
def handle_action(user_id: str, message: str, intent_data: Dict[str, Any]) -> str:
    action = intent_data.get("action", "none")

    # Extract parameters
    param_prompt = f"""
Extract parameters from this message.

Return JSON ONLY:

Supported fields:
- amount (number)
- card_last4 (string)
- tenure_months (int)

Message:
{message}
"""
    resp = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": "Extract parameters. Return JSON only."},
            {"role": "user", "content": param_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.0,
    )

    try:
        params = json.loads(resp.choices[0].message.content)
    except:
        params = {}

    result = None

    # ------------------------
    # ACTION EXECUTION (Correct)
    # ------------------------

    if action == "block_card":
        last4 = params.get("card_last4", "1234")
        return tool_block_card(user_id, last4)

    elif action == "unblock_card":
        last4 = params.get("card_last4", "1234")
        return tool_unblock_card(user_id, last4)

    elif action == "get_bill_summary":
        return tool_get_bill_summary(user_id)

    elif action == "get_current_balance":
        return tool_get_current_balance(user_id)

    # ---------- EMI Logic ONLY here ----------
    elif action == "convert_to_emi":
    # Extract amount
        amount = params.get("amount")
        if not amount:
            import re
            nums = re.findall(r"\d+", message)
            if nums:
                amount = float(nums[0])
            else:
                amount = 0

        emi_options = get_emi_options(float(amount))

        result = {
            "amount": amount,
            "emi_options": emi_options
        }

   # -----------------------------
# ONECARD-STYLED EMI RESPONSE
# -----------------------------
    explain_prompt = f"""
    Create a highly polished OneCard-style EMI summary.

    User message:
    {message}

    EMI data:
    {json.dumps(result, indent=2)}

    RULES FOR OUTPUT:
    ---------------------------------------
    1. Currency → Always ₹
    2. Output must contain THREE sections:
   
    (A) Title Line:
        "✨ EMI Options for ₹{result['amount']:,}"

    (B) Styled EMI Table:
        Use this **exact** formatting:
        | Tenure | EMI | Interest | GST | Total |
        |--------|-----|----------|-----|-------|
        | ...rows... |

        - Keep numbers clean (₹12,345.67 formatting)
        - No dollar signs
        - Never exceed 6 rows of text

    (C) Recommendation Card:
        Show 3 bullet points:
        - 🔥 Best Value Plan → lowest total payable
        - 💸 Lowest EMI Option → highest tenure
        - ⭐ Well-Balanced Option → middle tenure (6 or 9)

        Keep summary ≤ 4 lines.

    3. No long paragraphs.
    4. Do NOT include disclaimers or assumptions unless asked.
    5. FINAL OUTPUT MUST:

    - Fit under 12 lines  
    - Be clean, short, readable  
    - Use emojis from rule section  
    - NEVER rearrange table columns  
    """


    explain_resp = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": "Produce a clean, short EMI response."},
                {"role": "user", "content": explain_prompt},
            ],
            temperature=0.2,
        )

    return explain_resp.choices[0].message.content


        # explain_resp = client.chat.completions.create(
        #     model=MODEL_NAME,
        #     messages=[
        #         {"role": "system", "content": "Explain EMI options."},
        #         {"role": "user", "content": explain_prompt},
        #     ],
        #     temperature=0.3,
        # )

        # return explain_resp.choices[0].message.content

    # ------------------------
    # Fallback: treat as info
    # ------------------------
    return handle_info(message)


# -------------------------------------------------------
# MAIN AGENT ROUTER
# -------------------------------------------------------
def run_agent(user_id: str, message: str, allow_actions: bool = True) -> Dict[str, Any]:
    clean_query = rewrite_query(message)

    intent_data = classify_intent(clean_query)

    if intent_data["intent"] == "info" or not allow_actions:
        answer = handle_info(clean_query)

    elif intent_data["intent"] == "action":
        answer = handle_action(user_id, clean_query, intent_data)

    else:
        answer = "Can you clarify? Is it about EMI, bill, card, repayment, or a transaction?"

    return {
        "intent": intent_data["intent"],
        "intent_meta": intent_data,
        "rewritten_query": clean_query,
        "answer": answer
    }
