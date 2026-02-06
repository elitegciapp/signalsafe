"use client";

import { useEffect, useState } from "react";
import { decodeReport } from "@/lib/shareEncoder";

export default function SharePage() {
  const [data, setData] = useState<any>(null);
  const [decision, setDecision] = useState<null | "safe" | "fraud">(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    setData(decodeReport(hash));
  }, []);

  if (!data) return <main className="p-6">Invalid or expired link</main>;

  return (
    <main className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Shared Fraud Report</h1>

      <div className="border p-4">
        <div className="font-bold">{data.result.verdict}</div>
        <p>{data.result.summary}</p>

        <div className="mt-3">
          <div className="font-semibold">Original Message</div>
          <div className="border p-2 mt-1">{data.input}</div>
        </div>

        <div className="mt-3">
          <div className="font-semibold">Full Report</div>
          <pre className="whitespace-pre-wrap text-sm">{data.report}</pre>
        </div>
      </div>

      <div className="border p-4 space-y-3">
        <div className="font-semibold">Recipient Verification</div>

        <div className="flex gap-3">
          <button
            className="border px-4 py-2 bg-green-700 text-white"
            onClick={() => setDecision("safe")}
          >
            I verified this is legitimate
          </button>

          <button
            className="border px-4 py-2 bg-red-700 text-white"
            onClick={() => setDecision("fraud")}
          >
            This appears fraudulent
          </button>
        </div>

        {decision && (
          <div className="mt-3 border p-3">
            {decision === "safe" ? (
              <div className="text-green-400">
                Verification response: Recipient confirmed legitimacy through a trusted channel.
              </div>
            ) : (
              <div className="text-red-400">
                Warning: Recipient believes this is fraudulent. Do NOT send funds or information.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
