// voice-frontend/app/VoiceChat.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

type EventFromOpenAI = any; // you can type this better

const VoiceChat: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [partialTranscript, setPartialTranscript] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Connect WebSocket
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/voice"); // change to https/wss in prod
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onmessage = (ev) => {
      try {
        const data: EventFromOpenAI = JSON.parse(ev.data);

        // Basic handling of some common event types
        const type = data.type;

        if (type === "response.output_text.delta") {
          // hypothetical event: partial text delta
          setPartialTranscript((prev) => prev + data.delta);
        } else if (type === "response.output_text.done") {
          setTranscript((prev) => prev + "\n" + (data.text ?? ""));
          setPartialTranscript("");
          setMessages((prev) => [...prev, data.text ?? ""]);
        }

        // If Realtime sends audio chunks, they come base64-encoded in some events;
        // For now, we focus on live text; audio playback can be added similarly.
      } catch (e) {
        console.error("Failed to parse event from OpenAI", e);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const startRecording = async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = "audio/webm;codecs=opus";

    const mr = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        event.data.arrayBuffer().then((buf) => {
          // send raw audio bytes to backend; backend base64-encodes
          wsRef.current?.send(buf);
        });
      }
    };

    mr.start(250); // emit chunks every 250ms
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    setIsRecording(false);

    // Tell backend to commit audio buffer & request a response
    wsRef.current?.send(JSON.stringify({ type: "input_audio_commit" }));
  };

  return (
    <div style={{ padding: 16, maxWidth: 700, margin: "0 auto", fontFamily: "system-ui" }}>
      <h1>🎧 Realtime Voice Assistant (Prototype)</h1>
      <p>Status: {connected ? "🟢 Connected" : "🔴 Disconnected"}</p>

      <div style={{ marginTop: 16 }}>
        {isRecording ? (
          <button onClick={stopRecording}>⏹ Stop talking</button>
        ) : (
          <button onClick={startRecording} disabled={!connected}>
            🎙 Start talking
          </button>
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        <h3>Live partial transcript</h3>
        <div
          style={{
            minHeight: 40,
            padding: 8,
            borderRadius: 8,
            border: "1px solid #444",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
          }}
        >
          {partialTranscript || "—"}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3>Full conversation transcript</h3>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            padding: 8,
            borderRadius: 8,
            border: "1px solid #444",
            maxHeight: 300,
            overflowY: "auto",
          }}
        >
          {transcript || "No conversation yet."}
        </pre>
      </div>
    </div>
  );
};

export default VoiceChat;
