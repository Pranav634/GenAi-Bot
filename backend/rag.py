# import os
# import json
# import numpy as np
# from sentence_transformers import SentenceTransformer

# model = SentenceTransformer(
#     "sentence-transformers/all-MiniLM-L6-v2",
#     device="cpu"   # force CPU
# )


# def embed_text(text: str):
#     """Embed text using MiniLM encoder."""
#     return model.encode(text, normalize_embeddings=True)


# # ----------------------------------------------------
# # 2. Chunking Logic
# # ----------------------------------------------------
# def chunk_kb_section(section):
#     """
#     Converts one KB section into multiple retrievable text chunks.
#     Format stays consistent for RAG.
#     """
#     title = section.get("title", "")
#     rules = section.get("rules", [])
#     examples = section.get("examples", [])
#     notes = section.get("notes", [])

#     chunks = []

#     if title:
#         chunks.append(f"Topic: {title}")

#     for r in rules:
#         chunks.append(f"{title} - Rule: {r}")

#     for e in examples:
#         chunks.append(f"{title} - Example: {e}")

#     for n in notes:
#         chunks.append(f"{title} - Note: {n}")

#     return chunks


# # ----------------------------------------------------
# # 3. Load All KB JSON Files and Build Chunk List
# # ----------------------------------------------------
# KB_DIR = "backend/kb/data"

# def load_kb_chunks():
#     """Load all .json KB files and convert to structured chunks."""
#     chunks = []

#     for filename in os.listdir(KB_DIR):
#         if not filename.endswith(".json"):
#             continue

#         path = os.path.join(KB_DIR, filename)
#         with open(path, "r", encoding="utf-8") as f:
#             data = json.load(f)

#         topic = data.get("topic", filename.replace(".json", ""))

#         for sec in data.get("sections", []):
#             sec_chunks = chunk_kb_section(sec)
#             for text in sec_chunks:
#                 chunks.append({
#                     "text": text,
#                     "topic": topic,
#                     "source": filename
#                 })

#     return chunks


# # ----------------------------------------------------
# # 4. Build Vector Index (In-Memory)
# # ----------------------------------------------------
# print("🔄 Loading KB and building embeddings...")

# KB_CHUNKS = load_kb_chunks()
# KB_EMBEDDINGS = np.vstack([embed_text(c["text"]) for c in KB_CHUNKS])

# print(f"✅ Loaded {len(KB_CHUNKS)} KB chunks.")
# print("✅ RAG system initialized.\n")


# # ----------------------------------------------------
# # 5. Retrieve Top-K Chunks
# # ----------------------------------------------------
# def retrieve(query: str, top_k: int = 5):
#     """
#     Returns top_k most relevant KB chunks for the query using cosine similarity.
#     """
#     q_emb = embed_text(query)

#     # Dot product = cosine similarity since we normalized vectors
#     scores = np.dot(KB_EMBEDDINGS, q_emb)

#     # Get indexes of highest scores
#     top_idx = scores.argsort()[-top_k:][::-1]

#     results = []
#     for i in top_idx:
#         results.append({
#             "chunk": KB_CHUNKS[i]["text"],
#             "topic": KB_CHUNKS[i]["topic"],
#             "source": KB_CHUNKS[i]["source"],
#             "score": float(scores[i])
#         })

#     return results



import os
import json
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

# ------------------------------------------------------------
# 1. Chunking Logic
# ------------------------------------------------------------
def chunk_kb_section(section):
    title = section.get("title", "")
    rules = section.get("rules", [])
    examples = section.get("examples", [])
    notes = section.get("notes", [])

    chunks = []

    if title:
        chunks.append(f"Topic: {title}")

    for r in rules:
        chunks.append(f"{title} - Rule: {r}")

    for e in examples:
        chunks.append(f"{title} - Example: {e}")

    for n in notes:
        chunks.append(f"{title} - Note: {n}")

    return chunks


# ------------------------------------------------------------
# 2. Load KB Files
# ------------------------------------------------------------
KB_DIR = "backend/kb/data"

def load_kb_chunks():
    chunks = []
    for filename in os.listdir(KB_DIR):
        if filename.endswith(".json"):
            path = os.path.join(KB_DIR, filename)
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)

            topic = data.get("topic", filename.replace(".json", ""))

            for sec in data.get("sections", []):
                for c in chunk_kb_section(sec):
                    chunks.append({
                        "text": c,
                        "topic": topic,
                        "source": filename
                    })
    return chunks


# ------------------------------------------------------------
# 3. Build TF-IDF Vector Index (PURE PYTHON)
# ------------------------------------------------------------
print("🔄 Building TF-IDF knowledge base...")

KB_CHUNKS = load_kb_chunks()
KB_TEXTS = [c["text"] for c in KB_CHUNKS]

vectorizer = TfidfVectorizer(stop_words="english")
KB_MATRIX = vectorizer.fit_transform(KB_TEXTS)

print(f"✅ RAG KB Loaded: {len(KB_CHUNKS)} chunks")
print("✅ TF-IDF index built successfully\n")


# ------------------------------------------------------------
# 4. RAG Retrieval (Cosine similarity)
# ------------------------------------------------------------
def retrieve(query: str, top_k=5):
    query_vec = vectorizer.transform([query])
    scores = (KB_MATRIX @ query_vec.T).toarray().ravel()

    top_idx = scores.argsort()[-top_k:][::-1]

    results = []
    for i in top_idx:
        results.append({
            "chunk": KB_CHUNKS[i]["text"],
            "topic": KB_CHUNKS[i]["topic"],
            "source": KB_CHUNKS[i]["source"],
            "score": float(scores[i])
        })

    return results
