"use client";

import { useEffect, useState } from "react";
import { getHistory, clearHistory, Incident } from "@/lib/historyStore";

export default function HistoryPage() {
  const [items, setItems] = useState<Incident[]>([]);

  useEffect(() => {
    setItems(getHistory());
  }, []);

  return (
    <main className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Scan History</h1>

      <button
        className="border px-3 py-1"
        onClick={() => {
          clearHistory();
          setItems([]);
        }}
      >
        Clear History
      </button>

      {items.map((i) => (
        <div key={i.id} className="border p-3">
          <div className="text-sm opacity-70">
            {new Date(i.date).toLocaleString()}
          </div>

          <div className="font-semibold">
            {i.verdict} — {i.score}/100
          </div>

          <div className="text-sm mt-1">{i.message}</div>
        </div>
      ))}
    </main>
  );
}
