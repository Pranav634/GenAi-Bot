# backend/realtime/proxy.py
import os
from dotenv import load_dotenv
load_dotenv()
import json
import websockets
from websockets import WebSocketClientProtocol
from typing import AsyncIterator

REALTIME_MODEL = os.getenv("REALTIME_MODEL", "gpt-4o-realtime-preview")
OPENAI_REALTIME_URL = f"wss://api.openai.com/v1/realtime?model={REALTIME_MODEL}"


async def connect_to_openai_realtime() -> WebSocketClientProtocol:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "OpenAI-Beta": "realtime=v1",
    }

    ws = await websockets.connect(
        OPENAI_REALTIME_URL,
        additional_headers=headers  # fallback for old websockets versions
)

    return ws


async def send_event(ws: WebSocketClientProtocol, event: dict):
    await ws.send(json.dumps(event))


async def recv_events(ws: WebSocketClientProtocol) -> AsyncIterator[dict]:
    async for message in ws:
        try:
            yield json.loads(message)
        except Exception:
            continue
