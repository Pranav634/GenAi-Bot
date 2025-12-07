# # frontend/app.py
# import requests
# import streamlit as st

# BACKEND_URL = "http://localhost:8000"

# st.set_page_config(page_title="GenAI Credit Card Assistant", page_icon="💳", layout="centered")

# st.title("💳 GenAI Credit Card Assistant")
# st.caption("Chat & (prototype) Voice bot for credit card support")

# if "messages" not in st.session_state:
#     st.session_state.messages = []

# user_id = st.text_input("User ID (for demo)", value="user-123")
# allow_actions = st.checkbox("Allow bot to perform actions (block card, EMI, etc.)", value=True)

# st.markdown("---")

# # Display previous messages
# for msg in st.session_state.messages:
#     role = msg["role"]
#     content = msg["content"]
#     if role == "user":
#         st.chat_message("user").markdown(content)
#     else:
#         st.chat_message("assistant").markdown(content)

# # Text chat input
# if prompt := st.chat_input("Ask about your card, bill, EMI, or repayments..."):
#     st.session_state.messages.append({"role": "user", "content": prompt})
#     st.chat_message("user").markdown(prompt)

#     try:
#         resp = requests.post(
#             f"{BACKEND_URL}/chat",
#             json={
#                 "user_id": user_id,
#                 "message": prompt,
#                 "allow_actions": allow_actions,
#             },
#             timeout=30,
#         )
#         resp.raise_for_status()
#         data = resp.json()
#         answer = data["answer"]
#     except Exception as e:
#         answer = f"Error talking to backend: {e}"

#     st.session_state.messages.append({"role": "assistant", "content": answer})
#     st.chat_message("assistant").markdown(answer)

# st.markdown("---")
# st.subheader("🎤 Voice Assistant")

# st.write("Record a short audio question (e.g., using your phone or OS recorder), then upload it here.")

# voice_file = st.file_uploader(
#     "Upload an audio file (wav/mp3/m4a)",
#     type=["wav", "mp3", "m4a"],
#     key="voice_uploader",
# )

# if voice_file is not None:
#     st.audio(voice_file, format="audio/wav")

#     if st.button("Send voice query"):
#         with st.spinner("Transcribing and processing..."):
#             try:
#                 files = {
#                     "file": (voice_file.name, voice_file.getvalue(), voice_file.type),
#                 }
#                 data = {
#                     "user_id": user_id,
#                     "allow_actions": str(allow_actions).lower(),
#                 }
#                 resp = requests.post(f"{BACKEND_URL}/voice", data=data, files=files, timeout=120)
#                 resp.raise_for_status()
#                 data = resp.json()

#                 transcript = data["transcript"]
#                 answer = data["answer"]

#                 st.markdown("**Transcript:**")
#                 st.write(transcript)

#                 st.markdown("**Assistant answer:**")
#                 st.write(answer)

#                 # Also push into chat history for continuity
#                 st.session_state.messages.append({"role": "user", "content": f"(voice) {transcript}"})
#                 st.session_state.messages.append({"role": "assistant", "content": answer})

#             except Exception as e:
#                 st.error(f"Error processing voice query: {e}")

