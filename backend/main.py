# # backend/main.py
# from dotenv import load_dotenv
# load_dotenv()
# import os
# from fastapi import FastAPI, WebSocket, WebSocketDisconnect
# import json
# import base64
# import asyncio
# from typing import Dict


# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel


# from agents.agent import run_agent
# from realtime_proxy import connect_to_openai_realtime, send_event, recv_events



# app = FastAPI(title="GenAI Credit Card Assistant Backend")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],   # tighten for prod
#     allow_methods=["*"],
#     allow_headers=["*"],
#     allow_credentials=True,
# )


# class ChatRequest(BaseModel):
#     user_id: str
#     message: str
#     allow_actions: bool = True


# class ChatResponse(BaseModel):
#     answer: str
#     intent: str
#     intent_meta: Dict


# @app.get("/health")
# async def health():
#     return {"status": "ok"}


# @app.post("/chat", response_model=ChatResponse)
# async def chat(req: ChatRequest):
#     result = run_agent(req.user_id, req.message, req.allow_actions)
#     return ChatResponse(
#         answer=result["answer"],
#         intent=result["intent"],
#         intent_meta=result["intent_meta"],
#     )


# @app.websocket("/ws/voice")
# async def ws_voice(websocket: WebSocket):
#     """
#     Full-duplex realtime voice bridge:
#     - Client sends binary audio chunks + small JSON control messages.
#     - We forward audio chunks to OpenAI Realtime as input_audio_buffer.append events.
#     - We forward Realtime events back as JSON text messages.
#     Audio playback is handled on the frontend.
#     """
#     await websocket.accept()
#     openai_ws = await connect_to_openai_realtime()

#     async def client_to_openai():
#         try:
#             while True:
#                 msg = await websocket.receive()

#                 # Text from client: control event
#                 if "text" in msg and msg["text"]:
#                     try:
#                         data = json.loads(msg["text"])
#                     except Exception:
#                         continue

#                     msg_type = data.get("type")

#                     if msg_type == "input_audio_commit":
#                         # Commit buffer and request a response
#                         await send_event(openai_ws, {"type": "input_audio_buffer.commit"})
#                         await send_event(openai_ws, {"type": "response.create"})

#                     # You can extend this to send system prompts / session settings
#                     continue

#                 # Binary from client: raw audio bytes
#                 if "bytes" in msg and msg["bytes"]:
#                     audio_bytes = msg["bytes"]
#                     encoded = base64.b64encode(audio_bytes).decode("utf-8")
#                     event = {
#                         "type": "input_audio_buffer.append",
#                         "audio": encoded,
#                     }
#                     await send_event(openai_ws, event)

#         except WebSocketDisconnect:
#             pass
#         except Exception:
#             pass
#         finally:
#             await openai_ws.close()

#     async def openai_to_client():
#         try:
#             async for event in recv_events(openai_ws):
#                 # Just forward Realtime events as JSON text; frontend interprets.
#                 await websocket.send_text(json.dumps(event))
#         except Exception:
#             pass
#         finally:
#             await websocket.close()

#     await asyncio.gather(client_to_openai(), openai_to_client())


import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict

# Force load .env
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

from groq import Groq
from backend.agents.agent import run_agent  # your existing agent logic

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

app = FastAPI()

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    user_id: str
    message: str
    allow_actions: bool = True


class ChatResponse(BaseModel):
    answer: str
    intent: str
    intent_meta: Dict
    rewritten_query: str



@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Text-only endpoint.
    Voice is handled in the frontend (Google Web Speech API).
    """
    result = run_agent(req.user_id, req.message, req.allow_actions)

    return ChatResponse(
    answer=result["answer"],
    intent=result["intent"],
    intent_meta=result["intent_meta"],
    rewritten_query=result["rewritten_query"]
)


