export type Verdict = "SAFE" | "VERIFY" | "HIGH_RISK";

export type AnalyzeResult = {
  verdict: Verdict;
  riskScore: number;
  categories: string[];
  summary: string;
  redFlags: string[];
  recommendedActions: string[];
  safeReplyDraft?: string;
  requestId?: string;
};

function uniqStrings(values: string[]) {
  return Array.from(new Set(values));
}

export function analyzeText(text: string): AnalyzeResult {
  const trimmed = (text ?? "").toString().trim();

  const lower = trimmed.toLowerCase();

  const redFlags: string[] = [];
  const categories: string[] = [];

  const hasUrgency =
    lower.includes("urgent") ||
    lower.includes("immediately") ||
    lower.includes("within 24") ||
    lower.includes("final notice");

  const hasPayment =
    lower.includes("gift card") ||
    lower.includes("wire") ||
    lower.includes("zelle") ||
    lower.includes("crypto") ||
    lower.includes("bitcoin");

  const hasImpersonation =
    lower.includes("your bank") ||
    lower.includes("irs") ||
    lower.includes("social security") ||
    lower.includes("microsoft support") ||
    lower.includes("apple support");

  if (hasUrgency) {
    redFlags.push("Uses urgency/pressure language to force quick action.");
    categories.push("Urgency/Pressure");
  }
  if (hasPayment) {
    redFlags.push("Requests high-risk payment method (gift card, wire, crypto, etc.).");
    categories.push("Payment Trap");
  }
  if (hasImpersonation) {
    redFlags.push("Potential impersonation of an authority/brand.");
    categories.push("Impersonation");
  }

  const riskScore = Math.min(100, (hasUrgency ? 35 : 5) + (hasPayment ? 45 : 5) + (hasImpersonation ? 35 : 5));
  const verdict: Verdict = riskScore >= 70 ? "HIGH_RISK" : riskScore >= 35 ? "VERIFY" : "SAFE";

  const recommendedActions =
    verdict === "HIGH_RISK"
      ? [
          "Do not click links or send money.",
          "Independently verify the sender using a known phone number or official website.",
          "If this involves a financial account, contact your bank directly.",
        ]
      : verdict === "VERIFY"
        ? [
            "Verify the sender independently (don’t use contact info in the message).",
            "Check for mismatched names, domains, and payment instructions.",
            "If money is involved, confirm details by phone.",
          ]
        : ["Proceed cautiously. If money or credentials are requested, verify identity first."];

  const summary =
    verdict === "HIGH_RISK"
      ? "High likelihood of scam indicators: pressure + risky payment or impersonation signals."
      : verdict === "VERIFY"
        ? "Some scam indicators are present. Verify sender identity before acting."
        : "No strong scam indicators detected from basic signals, but stay cautious.";

  return {
    verdict,
    riskScore,
    categories: uniqStrings(categories),
    summary,
    redFlags,
    recommendedActions,
    safeReplyDraft:
      verdict !== "SAFE"
        ? "Hi — before I proceed, I need to verify this request. I will contact you through an official channel to confirm details."
        : undefined,
  };
}
