"use client";

import { useMemo, useState } from "react";
import { saveIncident } from "@/lib/historyStore";
import { buildReport } from "@/lib/reportBuilder";
import { useVerificationGate } from "@/lib/useVerificationGate";
import { getContacts } from "@/lib/contacts";
import { detectChannel } from "@/lib/channelDetector";
import { recommendVerification } from "@/lib/verificationAdvisor";
import { findRelevantContact } from "@/lib/contactMatcher";
import { downloadReportPDF } from "@/lib/pdfReport";
import { encodeReport } from "@/lib/shareEncoder";
import { copyTextToClipboard } from "@/lib/clipboard";
import { generateSafeReply } from "@/lib/safeReply";
import { findRepeatScam } from "@/lib/repeatDetector";
import { detectTactics } from "@/lib/tacticDetector";
import { getActionSteps } from "@/lib/actionAdvisor";

type Verdict = "SAFE" | "VERIFY" | "HIGH_RISK";

type AnalyzeResponse = {
  requestId: string;
  verdict: Verdict;
  riskScore: number; // 0-100
  categories: string[];
  summary: string;
  redFlags: string[];
  recommendedActions: string[];
  safeReplyDraft?: string;
};

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [safeReply, setSafeReply] = useState<string | null>(null);
  const [repeatHit, setRepeatHit] = useState<any>(null);
  const [tactics, setTactics] = useState<string[]>([]);
  const [steps, setSteps] = useState<string[]>([]);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [verifyMethod, setVerifyMethod] = useState<string | null>(null);
  const [contact, setContact] = useState<any>(null);

  const gate = useVerificationGate(result?.verdict || "SAFE");

  const disabled = useMemo(() => loading || text.trim().length < 20, [loading, text]);

  async function onCopyText(textToCopy: string) {
    const ok = await copyTextToClipboard(textToCopy);
    if (!ok) {
      alert("Copy is blocked in this browser. Please select the text and copy manually.");
    }
  }

  async function onCopyShareLink(url: string) {
    const ok = await copyTextToClipboard(url);
    if (ok) {
      setShareStatus("Share link copied.");
    } else {
      setShareStatus("Clipboard is blocked here — select and copy the link below.");
    }
  }

  async function onAnalyze() {
    setLoading(true);
    setError(null);
    setResult(null);
    setReport(null);
    setSafeReply(null);
    setRepeatHit(null);
    setTactics([]);
    setSteps([]);
    setShareUrl(null);
    setShareStatus(null);
    setVerifyMethod(null);
    setContact(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Analysis failed");
      }

      setTactics(detectTactics(text));
      setSteps(getActionSteps(data.verdict));

      const repeat = findRepeatScam(text);
      setRepeatHit(repeat);

      saveIncident({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        message: text,
        verdict: data.verdict,
        score: data.riskScore,
      });

      setResult(data);

      const channel = detectChannel(text);
      const nextVerifyMethod = recommendVerification(channel, data.verdict === "HIGH_RISK");
      setVerifyMethod(nextVerifyMethod);

      const reply = generateSafeReply(data.verdict, channel);
      setSafeReply(reply);
      setReport(buildReport(text, data, reply));

      const saved = getContacts();
      setContact(findRelevantContact(saved, text));
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">SignalSafe</h1>
          <p className="text-sm text-muted-foreground">
            Paste a message/email/invoice text. Get a risk verdict with plain-English reasons.
          </p>

          <a href="/history" className="underline text-sm">View History</a>
        </header>

        <section className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste text here…"
            className="min-h-[220px] w-full rounded-md border p-3 text-sm"
          />

          <div className="flex items-center gap-3">
            <button
              onClick={onAnalyze}
              disabled={disabled}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Analyzing…" : "Analyze risk"}
            </button>

            <span className="text-xs text-muted-foreground">
              Min 20 characters. Don’t paste SSNs or banking passwords.
            </span>
          </div>

          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </section>

        {result && (
          <>
            {repeatHit && (
              <div className="border p-3 bg-red-900/40 mb-3">
                ⚠️ Similar to a previous scam attempt from{" "}
                {new Date(repeatHit.date).toLocaleDateString()}
              </div>
            )}

          <section className="space-y-4 rounded-md border p-4">
            {tactics.length > 0 && (
              <div className="border p-3 bg-yellow-900/40 mb-3">
                <div className="font-semibold">
                  This message uses common fraud pressure tactics:
                </div>

                <ul className="list-disc ml-5 mt-2">
                  {tactics.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Verdict</div>
                <div className="text-xl font-semibold">{result.verdict}</div>
              </div>

              <div className="space-y-1 text-right">
                <div className="text-sm text-muted-foreground">Risk score</div>
                <div className="text-xl font-semibold">{result.riskScore}/100</div>
              </div>
            </div>

            {steps.length > 0 && (
              <div className="border p-4 mt-4">
                <div className="font-semibold mb-2">Recommended Actions</div>

                <ul className="list-disc ml-5">
                  {steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium">Summary</div>
              <div className="text-sm">{result.summary}</div>
            </div>

            {!!result.categories?.length && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Categories</div>
                <div className="flex flex-wrap gap-2">
                  {result.categories.map((c) => (
                    <span key={c} className="rounded-full border px-3 py-1 text-xs">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {!!result.redFlags?.length && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Red flags</div>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {result.redFlags.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {verifyMethod && (
              <div className="border p-3 bg-yellow-900/30">
                Recommended verification method: <b>{verifyMethod.toUpperCase()}</b>
                <div className="text-sm mt-1">
                  Do not verify using the same channel the request came from.
                </div>

                {contact && verifyMethod === "phone" && contact.phone && (
                  <a href={`tel:${contact.phone}`}>
                    <button className="border px-3 py-2 mt-2 w-full">
                      Call {contact.name}
                    </button>
                  </a>
                )}

                {contact && verifyMethod === "email" && contact.email && (
                  <a href={`mailto:${contact.email}?subject=Verification Request`}>
                    <button className="border px-3 py-2 mt-2 w-full">
                      Email {contact.name}
                    </button>
                  </a>
                )}

                {!contact && (
                  <div className="text-sm mt-2 opacity-70">
                    Add a trusted contact at /contacts for one-tap verification
                  </div>
                )}
              </div>
            )}

            {safeReply && (
              <div className="border p-4 mt-4">
                <div className="font-semibold mb-2">Suggested Safe Reply</div>

                <textarea className="w-full border p-2 h-24" value={safeReply} readOnly />

                <button
                  disabled={gate.blocked}
                  className="border px-3 py-1 mt-2 disabled:opacity-40"
                  onClick={() => {
                    void onCopyText(safeReply);
                  }}
                >
                  Copy Reply
                </button>
              </div>
            )}

            {result?.verdict === "HIGH_RISK" && (
              <div className="border p-3 bg-red-900/30">
                <label className="flex items-center gap-2">
                  <input type="checkbox" onChange={(e) => gate.setVerified(e.target.checked)} />
                  I called the official phone number and verified this request
                </label>
                {!gate.verified && (
                  <div className="text-sm mt-2">Actions are locked until verification</div>
                )}
              </div>
            )}

            {report && (
              <div className="mt-4">
                <div className="font-semibold">Incident Report</div>
                <textarea
                  className="border w-full p-2 mt-2 bg-black text-white"
                  rows={10}
                  readOnly
                  value={report}
                />
                <button
                  disabled={gate.blocked}
                  className="border px-3 py-1 mt-2 disabled:opacity-40"
                  onClick={() => {
                    void onCopyText(report);
                  }}
                >
                  Copy Report
                </button>

                <button
                  className="border px-3 py-1 mt-2 ml-2"
                  onClick={() => downloadReportPDF(report)}
                >
                  Download PDF
                </button>

                <button
                  disabled={gate.blocked}
                  className="border px-3 py-1 mt-2 ml-2 disabled:opacity-40"
                  onClick={() => {
                    const payload = {
                      input: text,
                      result,
                      report,
                    };

                    const path = `/share#${encodeReport(payload)}`;
                    const url = `${window.location.origin}${path}`;
                    setShareUrl(url);
                    setShareStatus(null);
                    void onCopyShareLink(url);
                  }}
                >
                  Copy Share Link
                </button>

                {shareUrl && (
                  <div className="mt-3 space-y-2">
                    {shareStatus && <div className="text-sm opacity-80">{shareStatus}</div>}
                    <div className="text-sm font-medium">Share link</div>
                    <input
                      className="border w-full p-2 bg-black text-white text-xs"
                      readOnly
                      value={shareUrl}
                      onFocus={(e) => e.currentTarget.select()}
                    />
                    <a className="underline text-sm" href={shareUrl}>
                      Open share page
                    </a>
                  </div>
                )}
              </div>
            )}

            {result.safeReplyDraft && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Safe reply draft</div>
                <pre className="whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm">
                  {result.safeReplyDraft}
                </pre>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Request ID: {result.requestId}
            </div>
          </section>
          </>
        )}
      </div>
    </main>
  );
}
