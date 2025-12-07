// // // frontend/app/page.tsx
// // "use client";

// // import React, { useEffect, useRef, useState } from "react";
// // import dynamic from "next/dynamic";
// // type Role = "user" | "assistant";

// // interface Message {
// //   id: string;
// //   role: Role;
// //   content: string;
// // }

// // const BACKEND_HTTP = "http://localhost:8000";
// // const BACKEND_WS = "ws://localhost:8000/ws/voice";

// // function HomeComponent() {
// //   const [messages, setMessages] = useState<Message[]>([
// //     {
// //       id: "welcome",
// //       role: "assistant",
// //       content:
// //         "Hi! I’m your GenAI credit card assistant. You can type your question below or tap the mic and start talking.",
// //     },
// //   ]);
// //   const [input, setInput] = useState("");
// //   const [userId, setUserId] = useState("user-123");
// //   const [allowActions, setAllowActions] = useState(true);

// //   // Voice
// //   const [voiceConnected, setVoiceConnected] = useState(false);
// //   const [isRecording, setIsRecording] = useState(false);
// //   const [partialTranscript, setPartialTranscript] = useState("");
// //   const [fullTranscript, setFullTranscript] = useState("");

// //   const wsRef = useRef<WebSocket | null>(null);
// //   const mediaRecorderRef = useRef<MediaRecorder | null>(null);

// //   // Connect WebSocket for voice once on mount
// //   useEffect(() => {
// //     const ws = new WebSocket(BACKEND_WS);
// //     wsRef.current = ws;

// //     ws.onopen = () => {
// //       setVoiceConnected(true);
// //       console.log("Voice WS connected");
// //     };

// //     ws.onclose = () => {
// //       setVoiceConnected(false);
// //       console.log("Voice WS disconnected");
// //     };

// //     ws.onmessage = (ev) => {
// //       try {
// //         const data = JSON.parse(ev.data);

// //         // NOTE: Realtime event types may differ slightly.
// //         const type = data.type as string | undefined;
// //         if (!type) return;

// //         // Example handling for text deltas (you'll inspect actual events via console.log)
// //         if (type === "response.output_text.delta") {
// //           const delta = data.delta ?? "";
// //           if (delta) {
// //             setPartialTranscript((prev) => prev + delta);
// //           }
// //         } else if (type === "response.output_text.done") {
// //           const text = data.text ?? "";
// //           setFullTranscript((prev) => (prev ? prev + "\n" + text : text));
// //           setPartialTranscript("");
// //           if (text) {
// //             addMessage("assistant", text);
// //           }
// //         }

// //         // For debugging:
// //         // console.log("Realtime event:", data);
// //       } catch (e) {
// //         console.error("Error parsing WS message", e);
// //       }
// //     };

// //     return () => {
// //       ws.close();
// //     };
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, []);

// //   const addMessage = (role: Role, content: string) => {
// //     setMessages((prev) => [
// //       ...prev,
// //       {
// //         id: `${Date.now()}-${Math.random()}`,
// //         role,
// //         content,
// //       },
// //     ]);
// //   };

// //   const sendText = async () => {
// //     if (!input.trim()) return;

// //     const text = input.trim();
// //     setInput("");
// //     addMessage("user", text);

// //     try {
// //       const res = await fetch(`${BACKEND_HTTP}/chat`, {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({
// //           user_id: userId,
// //           message: text,
// //           allow_actions: allowActions,
// //         }),
// //       });

// //       const data = await res.json();
// //       addMessage("assistant", data.answer || "Sorry, something went wrong.");
// //     } catch (e) {
// //       addMessage("assistant", "I couldn’t reach the backend. Please try again.");
// //     }
// //   };

// //   const startRecording = async () => {
// //     if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

// //     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
// //     const mimeType = "audio/webm;codecs=opus";

// //     const mr = new MediaRecorder(stream, { mimeType });
// //     mediaRecorderRef.current = mr;

// //     mr.ondataavailable = (event) => {
// //       if (event.data && event.data.size > 0) {
// //         event.data.arrayBuffer().then((buf) => {
// //           wsRef.current?.send(buf);
// //         });
// //       }
// //     };

// //     mr.start(200); // send chunk every 200ms
// //     setIsRecording(true);
// //     setPartialTranscript("");
// //   };

// //   const stopRecording = () => {
// //     if (!mediaRecorderRef.current) return;

// //     mediaRecorderRef.current.stop();
// //     mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
// //     setIsRecording(false);

// //     // Tell backend to commit & ask Realtime for a response
// //     wsRef.current?.send(JSON.stringify({ type: "input_audio_commit" }));

// //     // For UX, add temporary "(voice)" bubble with partial transcript when available
// //     if (partialTranscript) {
// //       addMessage("user", `(voice) ${partialTranscript}`);
// //     }
// //   };

// //   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
// //     if (e.key === "Enter") {
// //       e.preventDefault();
// //       sendText();
// //     }
// //   };

// //   return (
// //     <main
// //       style={{
// //         minHeight: "100vh",
// //         display: "flex",
// //         justifyContent: "center",
// //         background: "#0f172a",
// //         color: "#e5e7eb",
// //         padding: "24px 12px",
// //       }}
// //     >
// //       <div
// //         style={{
// //           width: "100%",
// //           maxWidth: 900,
// //           borderRadius: 24,
// //           border: "1px solid #1f2937",
// //           background: "linear-gradient(145deg, #020617, #020617, #0b1120)",
// //           display: "flex",
// //           flexDirection: "column",
// //           overflow: "hidden",
// //           boxShadow: "0 18px 50px rgba(15,23,42,0.8)",
// //         }}
// //       >
// //         {/* Header */}
// //         <div
// //           style={{
// //             padding: "16px 20px",
// //             borderBottom: "1px solid #1f2937",
// //             display: "flex",
// //             justifyContent: "space-between",
// //             alignItems: "center",
// //             gap: 12,
// //           }}
// //         >
// //           <div>
// //             <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
// //               <span>💳</span>
// //               <h1 style={{ fontSize: 18, fontWeight: 600 }}>GenAI Credit Card Assistant</h1>
// //             </div>
// //             <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
// //               Text + realtime voice. Handles FAQs and mock actions (block card, EMI, bills, collections, etc.).
// //             </p>
// //           </div>
// //           <div style={{ textAlign: "right", fontSize: 12, color: "#9ca3af" }}>
// //             <div>Voice WS: {voiceConnected ? "🟢 Connected" : "🔴 Disconnected"}</div>
// //           </div>
// //         </div>

// //         {/* Controls row */}
// //         <div
// //           style={{
// //             padding: "10px 20px",
// //             borderBottom: "1px solid #111827",
// //             display: "flex",
// //             flexWrap: "wrap",
// //             gap: 12,
// //             fontSize: 13,
// //           }}
// //         >
// //           <div>
// //             <label>User ID:&nbsp;</label>
// //             <input
// //               value={userId}
// //               onChange={(e) => setUserId(e.target.value)}
// //               style={{
// //                 background: "#020617",
// //                 border: "1px solid #374151",
// //                 borderRadius: 9999,
// //                 padding: "4px 10px",
// //                 color: "#e5e7eb",
// //                 fontSize: 12,
// //               }}
// //             />
// //           </div>
// //           <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
// //             <input
// //               type="checkbox"
// //               checked={allowActions}
// //               onChange={(e) => setAllowActions(e.target.checked)}
// //             />
// //             Allow actions (block card, EMI, etc.)
// //           </label>
// //         </div>

// //         {/* Chat area */}
// //         <div
// //           style={{
// //             flex: 1,
// //             padding: "16px 20px",
// //             display: "flex",
// //             flexDirection: "column",
// //             gap: 8,
// //             overflowY: "auto",
// //           }}
// //         >
// //           {messages.map((m) => (
// //             <div
// //               key={m.id}
// //               style={{
// //                 display: "flex",
// //                 justifyContent: m.role === "user" ? "flex-end" : "flex-start",
// //               }}
// //             >
// //               <div
// //                 style={{
// //                   maxWidth: "75%",
// //                   borderRadius: 16,
// //                   padding: "8px 12px",
// //                   marginBottom: 4,
// //                   background:
// //                     m.role === "user" ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "#020617",
// //                   color: m.role === "user" ? "#e5e7eb" : "#e5e7eb",
// //                   fontSize: 14,
// //                   lineHeight: 1.4,
// //                   border:
// //                     m.role === "assistant" ? "1px solid rgba(148,163,184,0.25)" : "1px solid transparent",
// //                   whiteSpace: "pre-wrap",
// //                 }}
// //               >
// //                 {m.content}
// //               </div>
// //             </div>
// //           ))}

// //           {partialTranscript && (
// //             <div style={{ marginTop: 8, fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>
// //               🎙 Listening… {partialTranscript}
// //             </div>
// //           )}
// //         </div>

// //         {/* Input + mic */}
// //         <div
// //           style={{
// //             borderTop: "1px solid #111827",
// //             padding: "10px 20px 16px",
// //             display: "flex",
// //             alignItems: "center",
// //             gap: 10,
// //           }}
// //         >
// //           <input
// //             value={input}
// //             onChange={(e) => setInput(e.target.value)}
// //             onKeyDown={handleKeyDown}
// //             placeholder="Ask about your card, bill, EMI, repayments, collections..."
// //             style={{
// //               flex: 1,
// //               background: "#020617",
// //               borderRadius: 9999,
// //               border: "1px solid #374151",
// //               padding: "8px 14px",
// //               color: "#e5e7eb",
// //               fontSize: 14,
// //               outline: "none",
// //             }}
// //           />
// //           <button
// //             onClick={sendText}
// //             style={{
// //               borderRadius: 9999,
// //               border: "1px solid #4b5563",
// //               padding: "7px 14px",
// //               fontSize: 13,
// //               background: "#111827",
// //               color: "#e5e7eb",
// //             }}
// //           >
// //             ➤
// //           </button>
// //           <button
// //             onClick={isRecording ? stopRecording : startRecording}
// //             disabled={!voiceConnected}
// //             style={{
// //               width: 36,
// //               height: 36,
// //               borderRadius: 9999,
// //               border: isRecording ? "2px solid #f97316" : "1px solid #4b5563",
// //               background: isRecording ? "#b91c1c" : "#111827",
// //               color: "#f9fafb",
// //               fontSize: 16,
// //             }}
// //             title={voiceConnected ? "Hold to talk" : "Voice not connected"}
// //           >
// //             {isRecording ? "⏹" : "🎙"}
// //           </button>
// //         </div>

// //         {/* Voice transcript summary */}
// //         {fullTranscript && (
// //           <div
// //             style={{
// //               borderTop: "1px solid #111827",
// //               padding: "8px 20px 12px",
// //               fontSize: 12,
// //               color: "#9ca3af",
// //             }}
// //           >
// //             <div style={{ marginBottom: 4, fontWeight: 500 }}>Voice transcript history:</div>
// //             <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{fullTranscript}</pre>
// //           </div>
// //         )}
// //       </div>
// //     </main>
// //   );
// // }

// // export default dynamic(() => Promise.resolve(HomeComponent), {
// //   ssr: false,
// // });


// "use client";

// import React, { useRef, useState } from "react";

// // Browser SpeechRecognition
// const SpeechRecognition =
//   typeof window !== "undefined"
//     ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
//     : null;

// export default function HomePage() {
//   const [messages, setMessages] = useState<
//     { id: number; role: "user" | "assistant"; content: string }[]
//   >([
//     {
//       id: 0,
//       role: "assistant",
//       content:
//         "Hi! I’m your GenAI credit card assistant. You can speak using the mic or type below.",
//     },
//   ]);

//   const [input, setInput] = useState("");
//   const [isRecording, setIsRecording] = useState(false);
//   const [partial, setPartial] = useState("");
//   const recognitionRef = useRef<any>(null);
//   const userId = "user-123";
//   const allowActions = true;

//   // Utility: add message
//   const addMessage = (role: "user" | "assistant", content: string) => {
//     setMessages((prev) => [...prev, { id: Date.now(), role, content }]);
//   };

//   // TEXT SEND FUNCTION
//   const sendMessage = async (text: string) => {
//     try {
//       const res = await fetch("http://localhost:8000/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           user_id: userId,
//           message: text,
//           allow_actions: allowActions,
//         }),
//       });

//       const data = await res.json();
//       addMessage("assistant", data.answer);

//       // OPTIONAL: browser text-to-speech
//       const utter = new SpeechSynthesisUtterance(data.answer);
//       utter.lang = "en-IN";
//       window.speechSynthesis.speak(utter);
//     } catch (err) {
//       addMessage("assistant", "Backend not reachable.");
//     }
//   };

//   // Handle typing
//   const handleSend = () => {
//     if (!input.trim()) return;
//     const text = input.trim();
//     setInput("");
//     addMessage("user", text);
//     sendMessage(text);
//   };

//   // -------- 🎤 GOOGLE WEB SPEECH API (FREE) ---------
//   const startRecording = () => {
//     if (!SpeechRecognition) {
//       alert("Speech Recognition not supported in this browser.");
//       return;
//     }

//     const recognition = new SpeechRecognition();
//     recognitionRef.current = recognition;

//     recognition.continuous = false;
//     recognition.interimResults = true;
//     recognition.lang = "en-IN";

//     setIsRecording(true);
//     setPartial("");

//     recognition.onresult = (e: any) => {
//       let interim = "";
//       let final = "";

//       for (let i = 0; i < e.results.length; i++) {
//         const transcript = e.results[i][0].transcript;
//         if (e.results[i].isFinal) final += transcript;
//         else interim += transcript;
//       }

//       setPartial(interim);

//       if (final) {
//         setIsRecording(false);
//         setPartial("");
//         addMessage("user", final);
//         sendMessage(final);
//       }
//     };

//     recognition.onerror = () => {
//       setIsRecording(false);
//     };

//     recognition.start();
//   };

//   const stopRecording = () => {
//     if (recognitionRef.current) recognitionRef.current.stop();
//     setIsRecording(false);
//   };

//   let synth = window.speechSynthesis;

// function stopSpeaking() {
//   if (synth.speaking) {
//     synth.cancel();      // 🔥 immediately stop voice output
//   }
// }

//   // ---------------------------------------------------

//   return (
//     <main
//       style={{
//         minHeight: "100vh",
//         padding: 20,
//         background: "#0f172a",
//         color: "white",
//         display: "flex",
//         justifyContent: "center",
//       }}
//     >
//       <div
//         style={{
//           width: "100%",
//           maxWidth: 900,
//           border: "1px solid #1e293b",
//           borderRadius: 20,
//           padding: 20,
//           background: "#020617",
//         }}
//       >
//         <h2 style={{ marginBottom: 10 }}>GenAI Credit Card Assistant</h2>
//         <p style={{ marginBottom: 20, opacity: 0.6 }}>
//           Text + FREE voice. Google Web Speech API handles speech-to-text.
//         </p>

//         {/* Chat Messages */}
//         <div
//           style={{
//             maxHeight: "70vh",
//             overflowY: "auto",
//             marginBottom: 20,
//             paddingRight: 10,
//           }}
//         >
//           {messages.map((msg) => (
//             <div
//               key={msg.id}
//               style={{
//                 textAlign: msg.role === "user" ? "right" : "left",
//                 marginBottom: 10,
//               }}
//             >
//               <div
//                 style={{
//                   display: "inline-block",
//                   padding: "10px 14px",
//                   borderRadius: 12,
//                   background:
//                     msg.role === "assistant" ? "#1e293b" : "#3b82f6",
//                 }}
//               >
//                 {msg.content}
//               </div>
//             </div>
//           ))}

//           {/* LIVE partial voice transcription */}
//           {partial && (
//             <div style={{ opacity: 0.6, fontStyle: "italic" }}>
//               🎙 {partial}
//             </div>
//           )}
//         </div>

//         {/* Input Row */}
//         <div style={{ display: "flex", gap: 10 }}>
//           <input
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             style={{
//               flex: 1,
//               padding: "10px 14px",
//               borderRadius: 10,
//               border: "1px solid #334155",
//               background: "#0f172a",
//               color: "white",
//             }}
//             placeholder="Ask something about card, bill, EMI..."
//           />

//           {/* Send Button */}
//           <button
//             onClick={handleSend}
//             style={{
//               padding: "10px 14px",
//               background: "#3b82f6",
//               borderRadius: 10,
//               border: "none",
//               color: "white",
//             }}
//           >
//             ➤
//           </button>
          


//           {/* Mic Button */}
//           <button
//             onClick={isRecording ? stopRecording : startRecording}
//             style={{
//               width: 45,
//               height: 45,
//               borderRadius: "50%",
//               border: "none",
//               background: isRecording ? "#dc2626" : "#1e293b",
//               fontSize: 20,
//             }}
//           >
//             {isRecording ? "⏹" : "🎙"}
//           </button>

//           <button
//               onClick={stopSpeaking}
//               className="stop-btn"
//             >
//                🛑stop
//           </button>
//         </div>
//       </div>
//     </main>
//   );
// }


"use client";

import { useEffect, useRef, useState } from "react";

/* ---------- Types ---------- */
interface IntentMeta {
  intent: string;
  category: string;
  action: string;
  [key: string]: any;
}

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
  intent?: string;
  meta?: IntentMeta;
}

/* ---------- Extend Window for Web Speech ---------- */
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

/* Safe window helper so SSR doesn’t crash */
const safeWindow = typeof window !== "undefined" ? window : null;

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const synth = safeWindow?.speechSynthesis ?? null;

  /* ---------- Setup Speech Recognition ---------- */
  useEffect(() => {
    if (!safeWindow) return;

    const SpeechRecognition =
      safeWindow.webkitSpeechRecognition || safeWindow.SpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Browser does not support SpeechRecognition");
      return;
    }

    const recog = new SpeechRecognition();
    recog.continuous = false;
    recog.interimResults = false;
    recog.lang = "en-IN";

    recog.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      handleSend(text);
    };

    recog.onerror = (e: any) => console.error("Voice error:", e);

    recognitionRef.current = recog;
  }, []);

  /* ---------- TTS ---------- */
  function speak(text: string) {
    if (!synth) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-IN";
    synth.cancel();
    synth.speak(utter);
  }

  function stopSpeaking() {
    if (!synth) return;
    synth.cancel();
  }

  /* ---------- Backend Call ---------- */
  async function handleSend(msgText: string) {
    if (!msgText.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: msgText }]);
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "user-123",
          message: msgText,
          allow_actions: true,
        }),
      });

      const data = await resp.json();

      const botMessage: ChatMessage = {
        sender: "bot",
        text: data.answer,
        intent: data.intent,
        meta: data.intent_meta,
      };

      setMessages((prev) => [...prev, botMessage]);
      speak(data.answer);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  }

  /* ---------- Voice Controls ---------- */
  const startVoice = () => {
    if (!recognitionRef.current) return;
    stopSpeaking();
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopVoice = () => {
    if (!recognitionRef.current) return;
    setIsListening(false);
    recognitionRef.current.stop();
  };

  /* ---------- Suggested Prompts ---------- */
  const suggestions = [
    "Block my card",
    "Convert 8000 to EMI",
    "What is my bill?",
    "Why was my transaction declined?",
    "Foreign currency markup kya hota hai?",
  ];

  /* ---------- Insight panel: last bot meta ---------- */
  const lastBotMessage = [...messages].reverse().find((m) => m.sender === "bot");
  const lastMeta = lastBotMessage?.meta;

  const renderMetaExplanation = () => {
    if (!lastMeta) return "Ask something about card, EMI, bill or transactions.";
    switch (lastMeta.category) {
      case "emi":
        return "You’re in the EMI flow. The assistant can compare tenures, interest and total cost.";
      case "bill":
        return "This is about billing — statement date, due amount, minimum due and interest rules.";
      case "transaction":
        return "The assistant is analysing why a transaction failed or how it was processed.";
      case "repayment":
        return "This relates to how you repay — full payment vs minimum, auto-debit, etc.";
      case "collections":
        return "This touches collections / overdue behaviour: DPD buckets, follow-ups, etc.";
      default:
        return "General information or FAQ. Ask about card features, charges, limits or onboarding.";
    }
  };

  /* ---------- JSX ---------- */
  return (
    <div className="page">
      <div className="shell">
        {/* Left: Chat Side */}
        <div className="leftPane glass">
          <header className="header">
            <div>
              <h1>GenAI Credit Card Assistant</h1>
              <p>Ask about your card, bill, EMI, repayments, disputes & more.</p>
            </div>
          </header>

          {/* Suggestions */}
          <div className="suggestRow">
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="chip"
                onClick={() => handleSend(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Chat window */}
          <div className="chat">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={
                  m.sender === "user"
                    ? "bubble userBubble"
                    : "bubble botBubble"
                }
              >
                <p>{m.text}</p>
              </div>
            ))}

            {loading && <div className="thinking">Thinking…</div>}
          </div>

          {/* Input row */}
          <div className="inputBar">
            <input
              className="textInput"
              placeholder="Ask about EMI, card, bill…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend(input);
              }}
            />

            <button className="iconBtn" onClick={() => handleSend(input)}>
              ➤
            </button>

            {!isListening ? (
              <button className="iconBtn micBtn" onClick={startVoice}>
                🎤
              </button>
            ) : (
              <button className="iconBtn micBtn listening" onClick={stopVoice}>
                🔴
              </button>
            )}

            <button className="iconBtn stopBtn" onClick={stopSpeaking}>
              ⏹
            </button>
          </div>
        </div>

        {/* Right: Insights / Info Side */}
        <div className="rightPane">
          <div className="glass infoCard">
            <h2>Conversation Insight</h2>
            <p className="hint">
              Shows how the assistant is interpreting your last query.
            </p>

            <div className="metaRow">
              <span className="metaLabel">Intent</span>
              <span className="metaValue">
                {lastMeta?.intent ?? "—"}
              </span>
            </div>
            <div className="metaRow">
              <span className="metaLabel">Category</span>
              <span className="metaValue">
                {lastMeta?.category ?? "—"}
              </span>
            </div>
            <div className="metaRow">
              <span className="metaLabel">Action</span>
              <span className="metaValue">
                {lastMeta?.action ?? "—"}
              </span>
            </div>

            <div className="metaExplain">
              {renderMetaExplanation()}
            </div>
          </div>

          <div className="glass infoCard secondary">
            <h3>Quick Tips</h3>
            <ul>
              <li>Say “convert 12000 to EMI” to see EMI options.</li>
              <li>Ask “what is my bill” for a mock bill summary.</li>
              <li>Say “block my card” to test action execution.</li>
              <li>Ask “mera txn decline kyu hua” for decline reasons.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 24px;
          background: radial-gradient(circle at top, #15172b, #05060b);
          color: #f5f7ff;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text",
            "Segoe UI", sans-serif;
        }

        .shell {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          gap: 20px;
          height: calc(100vh - 48px);
        }

        .glass {
          background: rgba(17, 24, 39, 0.85);
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.4);
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(18px);
        }

        .leftPane {
          flex: 2;
          padding: 18px 18px 14px;
          display: flex;
          flex-direction: column;
        }

        .rightPane {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .header h1 {
          font-size: 22px;
          font-weight: 700;
          color: #7dd3fc;
          margin-bottom: 4px;
        }
        .header p {
          font-size: 13px;
          color: #cbd5f5;
        }

        .suggestRow {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 12px 0 10px;
        }
        .chip {
          font-size: 12px;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.5);
          background: radial-gradient(circle at top left, #1f2937, #020617);
          color: #e5f2ff;
        }

        .chat {
          flex: 1;
          overflow-y: auto;
          padding-right: 4px;
          margin-bottom: 10px;
        }

        .bubble {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 16px;
          margin-bottom: 10px;
          font-size: 14px;
          line-height: 1.4;
          animation: fadeIn 0.18s ease-out;
        }
        .userBubble {
          margin-left: auto;
          background: linear-gradient(135deg, #38bdf8, #0ea5e9);
          color: #0b1220;
        }
        .botBubble {
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.5);
        }

        .thinking {
          font-size: 13px;
          color: #a5b4fc;
        }

        .inputBar {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 2px;
          padding-top: 8px;
          border-top: 1px solid rgba(148, 163, 184, 0.35);
        }

        .textInput {
          flex: 1;
          padding: 9px 12px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.6);
          background: rgba(15, 23, 42, 0.8);
          color: #e5e7eb;
          font-size: 14px;
        }

        .iconBtn {
          border-radius: 999px;
          border: none;
          padding: 9px 12px;
          font-size: 14px;
          cursor: pointer;
          background: linear-gradient(135deg, #38bdf8, #0ea5e9);
          color: #020617;
        }

        .micBtn {
          font-size: 16px;
        }
        .micBtn.listening {
          background: #ef4444;
          color: #f9fafb;
        }

        .stopBtn {
          background: #334155;
          color: #e5e7eb;
        }

        .infoCard {
          padding: 16px 16px 14px;
        }
        .infoCard.secondary {
          flex: 1;
        }

        .infoCard h2 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 6px;
          color: #bfdbfe;
        }
        .infoCard h3 {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 6px;
          color: #c7d2fe;
        }
        .hint {
          font-size: 12px;
          color: #9ca3af;
          margin-bottom: 10px;
        }

        .metaRow {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin-bottom: 4px;
        }
        .metaLabel {
          color: #9ca3af;
        }
        .metaValue {
          color: #e5e7eb;
        }

        .metaExplain {
          margin-top: 10px;
          font-size: 13px;
          color: #cbd5f5;
        }

        .infoCard ul {
          padding-left: 18px;
          font-size: 13px;
          color: #e5e7eb;
        }
        .infoCard li {
          margin-bottom: 4px;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0px);
          }
        }

        @media (max-width: 900px) {
          .shell {
            flex-direction: column;
            height: auto;
          }
          .rightPane {
            order: -1;
          }
        }
      `}</style>
    </div>
  );
}
