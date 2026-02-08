import { NextResponse } from "next/server";

import { generateMiteruAnalysis } from "@/lib/miteru/analyze";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function looksLikeRawConversationPayload(body: Record<string, unknown>): boolean {
  const bannedKeys = [
    "messages",
    "message",
    "chat",
    "talk",
    "transcript",
    "text",
    "content",
    "raw",
    "lines",
    "logs",
  ];
  return bannedKeys.some((key) => key in body);
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not set" },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isPlainObject(body)) {
    return NextResponse.json({ error: "Body must be a JSON object" }, { status: 400 });
  }

  if (looksLikeRawConversationPayload(body)) {
    return NextResponse.json(
      {
        error:
          "Only computed metrics JSON is allowed. Do not send raw talk logs or message text.",
      },
      { status: 400 },
    );
  }

  const metrics = body.metrics;
  if (!isPlainObject(metrics)) {
    return NextResponse.json(
      { error: "metrics (object) is required" },
      { status: 400 },
    );
  }
  try {
    const result = await generateMiteruAnalysis({ apiKey, metrics });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      {
        error: "Analyze failed",
        details: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 502 },
    );
  }
}
