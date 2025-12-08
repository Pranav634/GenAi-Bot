# 📌 GenAI Credit Card Assistant — Voice + RAG + EMI Planner + Actions

**⚠️ Important Notice:** The folder structure, setup instructions, and code paths detailed in this README correspond to the **master branch** of this repository.

A production-grade GenAI chatbot built for the FPL Technologies (OneCard) Product Builder Intern Assignment. This assistant understands voice + text queries, performs credit-card actions, explains EMI options, retrieves info using RAG, and offers a premium glass-morphism UI.

---

## 🚀 Key Features

### 🔊 1. Real-time Voice Assistant (Browser Native)
* Uses **Google Web Speech API** for free, low-latency speech-to-text.
* Seamless **push-to-talk / stop-talk** control.
* Bot responds in text and optional text-to-speech.

### 🤖 2. Smart Agent with Intent Classification
Understands:
* Billing queries
* Card block / unblock
* EMI conversion
* Repayments
* Delivery
* Transaction disputes
* General onboarding queries

Powered by **Groq LLaMA-3.1-8B (instant)** using:
* Intent classifier
* Parameter extractor
* Tool execution layer
* Rewritten queries for better understanding

### 📚 3. RAG (Retrieval Augmented Generation)
* Embedding model: **Snowflake Arctic embed**
* Vector DB: **In-memory cosine search**
* Handles all informational queries:
    * Bill generation rules
    * Limits
    * Fees
    * Markup
    * Eligibility
    * Refund timelines
    * Delivery stages
    * OTP, KYC, activation
* Clean inline citations using:
    ```json
    [
      { "chunk": "...", "score": 0.87 },
      ...
    ]
    ```

### 💳 4. EMI Planner Engine (Custom-built)
* Computes EMI for **3, 6, 9, 12 months**
* Includes:
    * Interest
    * GST on interest
    * Total payable
    * Recommended plan (lowest total cost)
* Formats clean readable tables

### ⚙ 5. Tool Execution Layer
Implements real actions (mocked):

| Action | Tool |
| :--- | :--- |
| Block card | `tool_block_card` |
| Unblock card | `tool_unblock_card` |
| Get bill summary | `tool_get_bill_summary` |
| Convert to EMI | `tool_convert_to_emi` |
| Get current balance | `tool_get_current_balance` |

### 🎨 6. Premium OneCard-Style UI
Built using **Next.js + Tailwind + Glassmorphism**
* Components:
    * Chat bubbles
    * Suggested prompts
    * Voice mic button
    * EMI info cards
* Intent + metadata debugging (optional)
* Fully responsive

---

## 🏗 Architecture Overview (Refined)

```text
                               ┌──────────────────────────┐
                               │    Frontend (Next.js)    │
User ↔ Browser ↔ Voice/Input → │ - Voice input            │ ↔ REST / WebSocket
                               │ - Chat UI                │
                               │ - EMI Cards              │
                               └───────────┬──────────────┘
                                           │
                                           ▼
                                 ┌──────────────────────┐
                                 │    FastAPI Backend   │
                                 │  /chat               │
                                 │  /ws (optional)      │
                                 └───────────┬──────────┘
                                             │
                       ┌─────────────────────┴──────────────────┐
                       ▼                                        ▼
             ┌──────────────────────┐                 ┌────────────────────────────┐
             │     Agent Brain      │                 │       RAG Engine           │
             │ - Intent classify    │                 │ - Vector DB search         │
             │ - Query rewrite      │                 │ - Snowflake embeddings     │
             │ - Parameter extract  │                 │ - Top-k retrieval          │
             │ - Action routing     │                 └────────────────────────────┘
             └──────────────────────┘
                                             ▼
                                 ┌──────────────────────────┐
                                 │      Tools Layer         │
                                 │ - Block card             │
                                 │ - Bill summary           │
                                 │ - EMI computation        │
                                 │ - Balance lookup         │
                                 └──────────────────────────┘
```

## Folder Structure

**⚠️ Note: This folder structure is based on the `master` branch.** ```
...
```
genai-credit-card-assistant/
│
├── backend/
│   ├── main.py               # FastAPI server
│   ├── agents/
│   │   ├── agent.py          # Main agent logic
│   │   ├── tools.py          # Action tools
│   │   ├── emi_engine.py     # EMI calculator
│   │   └── query_rewriter.py
│   ├── rag.py                # Vector search + embeddings
│   ├── data/
│   │   └── knowledge_base.json
│   └── .env.example
│
├── voice-frontend/
│   ├── app/
│   │   └── page.tsx          # UI + Voice handling
│   └── components/
│       └── ChatBubble.tsx
│
└── README.md


```

## 🛠 Setup Instructions

### 1️⃣ Backend Setup
cd backend
python -m venv venv
## On Windows
venv\Scripts\activate
## On macOS/Linux
source venv/bin/activate <br>

## Requirements
pip install -r requirements.txt

## Create .env:

GROQ_API_KEY=your_key<br>
MODEL_NAME=llama-3.1-8b-instant


## Run server:
Bash:
uvicorn backend.main:app --reload

## 2️⃣ Frontend Setup
Bash:
cd voice-frontend
npm install
npm run dev
Visit: 👉 http://localhost:3000

## 🧪 Example Queries
### ✔ Informational
“What is foreign currency markup?”

“Refund kab aata hai?”

“Delivery delay kya hota hai?”

“Minimum due kya hai?”

### ✔ Actions
“Block my card”

“Convert 8000 to EMI”

“What is my bill summary?”

“What’s my current balance?”

### ✔ Rewritten Queries (Agent auto-corrects)
“8000 ko EMI me daal do”

“kitna outstanding hai”

“due kitna hoga”
