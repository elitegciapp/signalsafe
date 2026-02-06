export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { analyzeText } from "@/lib/analyzer";
import { aiAnalyze } from "@/lib/aiAnalyzer";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || text.length < 10) {
      return NextResponse.json({ error: "Text too short" }, { status: 400 });
    }

    // Try AI first
    let result = await aiAnalyze(text);

    // fallback if AI fails or no credits
    if (!result) {
      result = analyzeText(text);
    }

    result.requestId = crypto.randomUUID();

    const actions = (result as any).actions ?? (result as any).recommendedActions ?? [];
    const flags = (result as any).flags ?? (result as any).redFlags ?? [];

    return NextResponse.json({
      ...result,
      actions,
      flags,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
