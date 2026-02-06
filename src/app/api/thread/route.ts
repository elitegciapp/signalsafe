export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { analyzeThread } from "@/lib/threadAnalyzer";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages" }, { status: 400 });
    }

    const result = analyzeThread(messages);
    return NextResponse.json(result);

  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
