export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { analyzeText } from "@/lib/analyzer";
import { aiAnalyze } from "@/lib/aiAnalyzer";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function withCorsHeaders(res: NextResponse) {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.headers.set(key, value);
  }
  return res;
}

export async function OPTIONS(_req: Request) {
  return withCorsHeaders(new NextResponse(null, { status: 204 }));
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || text.length < 10) {
      return withCorsHeaders(NextResponse.json({ error: "Text too short" }, { status: 400 }));
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

    return withCorsHeaders(
      NextResponse.json({
        ...result,
        actions,
        flags,
      }),
    );
  } catch {
    return withCorsHeaders(NextResponse.json({ error: "Invalid request" }, { status: 400 }));
  }
}
