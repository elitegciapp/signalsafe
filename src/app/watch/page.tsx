"use client";

import { useState } from "react";

export default function WatchPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<any>(null);

  async function addMessage() {
    if (!input.trim()) return;

    const updated = [...messages, input];
    setMessages(updated);
    setInput("");

    const res = await fetch("/api/thread", {
      method: "POST",
      body: JSON.stringify({ messages: updated }),
    });

    setResult(await res.json());
  }

  return (
    <main className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Watch Conversation</h1>

      <div className="space-y-2">
        {messages.map((m, i) => (
          <div key={i} className="border p-2">{m}</div>
        ))}
      </div>

      <textarea
        className="border w-full p-2"
        rows={3}
        value={input}
        onChange={(e)=>setInput(e.target.value)}
        placeholder="Paste next message from the conversation"
      />

      <button className="bg-black text-white px-4 py-2" onClick={addMessage}>
        Add Message
      </button>

      {result && (
        <div className="border p-4 mt-4">
          <h2 className="font-bold">{result.verdict}</h2>
          <p>Score: {result.riskScore}/100</p>
          <p>{result.summary}</p>
        </div>
      )}
    </main>
  );
}
