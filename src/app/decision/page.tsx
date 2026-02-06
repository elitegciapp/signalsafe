"use client";

import { useState } from "react";
import { saveIncident } from "@/lib/historyStore";

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    if (!text || text.length < 10) return;

    setLoading(true);

    try {
      const res = await fetch("/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Decision failed");
      }
      setResult(data);

      // Save to history
      saveIncident({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        message: text,
        verdict: data.verdict,
        score: data.riskScore,
      });

    } catch (err) {
      console.error("Decision error:", err);
    }

    setLoading(false);
  }

  return (
    <main className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">SignalSafe</h1>

      <textarea
        className="border w-full p-3 rounded bg-black text-white"
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste suspicious message, email, or invoice text"
      />

      <button
        onClick={analyze}
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Analyze Risk"}
      </button>

      {result && (
        <div className="border p-4 rounded mt-4 space-y-2">
          <div className="flex justify-between">
            <h2 className="text-lg font-bold">{result.verdict}</h2>
            <span>{result.riskScore}/100</span>
          </div>

          <p>{result.summary}</p>

          {result.redFlags?.length > 0 && (
            <>
              <div className="font-semibold">Red Flags</div>
              <ul className="list-disc pl-5">
                {result.redFlags.map((r: string, i: number) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </>
          )}

          {result.recommendedActions?.length > 0 && (
            <>
              <div className="font-semibold">Recommended Actions</div>
              <ul className="list-disc pl-5">
                {result.recommendedActions.map((r: string, i: number) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </main>
  );
}
