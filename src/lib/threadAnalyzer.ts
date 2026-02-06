import { analyzeText } from "./analyzer";

export function analyzeThread(messages: string[]) {
  let total = 0;
  let highSignals = 0;
  const flags = new Set<string>();

  for (const msg of messages) {
    const r = analyzeText(msg);
    total += r.riskScore;

    if (r.verdict === "HIGH_RISK") highSignals++;

    r.redFlags.forEach(f => flags.add(f));
  }

  const score = Math.min(100, Math.round(total));

  let verdict: "SAFE" | "VERIFY" | "HIGH_RISK" = "SAFE";

  if (highSignals >= 2 || score >= 70) verdict = "HIGH_RISK";
  else if (score >= 35) verdict = "VERIFY";

  return {
    verdict,
    riskScore: score,
    redFlags: [...flags],
    summary:
      verdict === "HIGH_RISK"
        ? "Escalating scam behavior detected across conversation"
        : verdict === "VERIFY"
        ? "Conversation becoming suspicious"
        : "No clear scam pattern yet"
  };
}
