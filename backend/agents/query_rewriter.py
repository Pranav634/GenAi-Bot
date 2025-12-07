from groq import Groq
import os
from dotenv import load_dotenv
load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL_NAME = os.getenv("MODEL_NAME", "llama-3.1-8b-instant")

def rewrite_query(message: str) -> str:
    prompt = f"""
Rewrite the following user query into clear, formal English suitable for a credit-card assistant.

User query:
{message}

Rewrite only the query. Do not answer it.
"""

    resp = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
    )

    return resp.choices[0].message.content.strip()
