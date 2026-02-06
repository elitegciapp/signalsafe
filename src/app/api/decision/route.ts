export const runtime = "nodejs";

import { NextResponse } from "next/server";

type Verdict = "SAFE" | "VERIFY" | "HIGH_RISK";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let score = 0;
    const reasons: string[] = [];

    if (body.changedPayment) {
      score += 40;
      reasons.push("Payment instructions changed");
    }

    if (body.urgency) {
      score += 25;
      reasons.push("Pressure or urgency used");
    }

    if (body.unusualMethod) {
      score += 35;
      reasons.push("Unusual payment method requested");
    }

    if (!body.verifiedContact) {
      score += 40;
      reasons.push("Identity not verified independently");
    }

    if (body.remoteOnly) {
      score += 20;
      reasons.push("Refused live verification");
    }

    let verdict: Verdict = "SAFE";
    if (score >= 70) verdict = "HIGH_RISK";
    else if (score >= 35) verdict = "VERIFY";

    return NextResponse.json({
      verdict,
      riskScore: Math.min(score, 100),
      reasons,
      recommendation:
        verdict === "HIGH_RISK"
          ? "Do NOT send money. Contact the known party directly using a trusted number."
          : verdict === "VERIFY"
          ? "Verify identity before proceeding."
          : "No major fraud indicators detected.",
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
