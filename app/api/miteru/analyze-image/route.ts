import { NextResponse } from "next/server";

import { generateMiteruMetricsFromTranscript } from "@/lib/miteru/analyze";

export const runtime = "nodejs";

const MAX_FILES = 10;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg"]);

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX = 12;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

type VisionTextExtract = {
  conversation_text: string;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractOutputText(data: unknown): string | null {
  if (!isPlainObject(data)) return null;
  if (typeof data.output_text === "string") return data.output_text;

  const output = data.output;
  if (!Array.isArray(output)) return null;

  const textParts: string[] = [];
  for (const item of output) {
    if (!isPlainObject(item)) continue;
    const content = item.content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!isPlainObject(part)) continue;
      if (part.type === "output_text" && typeof part.text === "string") {
        textParts.push(part.text);
      }
    }
  }
  return textParts.length ? textParts.join("\n") : null;
}

function coerceVisionTextExtract(value: unknown): VisionTextExtract {
  if (!isPlainObject(value)) throw new Error("Vision output is not a JSON object");
  const conversation_text = value.conversation_text;
  if (typeof conversation_text !== "string" || conversation_text.trim().length === 0)
    throw new Error("Invalid conversation_text");
  return { conversation_text: conversation_text.trim() };
}

function jsonError(status: number, error: string, details?: unknown) {
  return NextResponse.json({ error, details }, { status });
}

function getClientIp(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(ip: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  }
  entry.count += 1;
  return { ok: true };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return jsonError(500, "OPENAI_API_KEY is not set");
  }

  const ip = getClientIp(request);
  const rl = checkRateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded", details: { retry_after_sec: rl.retryAfterSec } },
      {
        status: 429,
        headers: {
          "Retry-After": String(rl.retryAfterSec),
        },
      },
    );
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const n = Number(contentLength);
    if (Number.isFinite(n) && n > MAX_TOTAL_BYTES + 64 * 1024) {
      return jsonError(413, "Request too large", { max_total_bytes: MAX_TOTAL_BYTES });
    }
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError(400, "Expected multipart/form-data");
  }

  const files = formData.getAll("images").filter((x): x is File => x instanceof File);
  if (files.length === 0) {
    return jsonError(400, 'images files are required (field name: "images")');
  }
  if (files.length > MAX_FILES) {
    return jsonError(413, "Too many images", { max_files: MAX_FILES });
  }

  let totalBytes = 0;
  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return jsonError(400, "Only png/jpg images are allowed", { file_type: file.type });
    }
    if (file.size > MAX_FILE_BYTES) {
      return jsonError(413, "Image is too large", { max_file_bytes: MAX_FILE_BYTES });
    }
    totalBytes += file.size;
  }
  if (totalBytes > MAX_TOTAL_BYTES) {
    return jsonError(413, "Total image size is too large", { max_total_bytes: MAX_TOTAL_BYTES });
  }

  const dataUrls: string[] = [];
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    dataUrls.push(`data:${file.type};base64,${buffer.toString("base64")}`);
  }

  const visionSystem =
    "You are an OCR + structuring tool for LINE chat screenshots. " +
    "Return ONLY valid JSON with EXACT key: conversation_text. " +
    "conversation_text must be a plain text transcript, one message per line, prefixed with speaker label like 'A:' or 'B:'. " +
    "Keep ordering as best-effort (top-to-bottom, across images in given order). " +
    "Do not include any extra keys.";

  const visionUser =
    "Extract the conversation text from these screenshots. If some text is unreadable, omit it or mark as '[unreadable]'.";

  const visionSchema = {
    name: "miteru_vision_extract",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        conversation_text: { type: "string" },
      },
      required: ["conversation_text"],
    },
  };

  const visionResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
      store: false,
      response_format: { type: "json_schema", json_schema: visionSchema },
      input: [
        {
          role: "system",
          content: [{ type: "text", text: visionSystem }],
        },
        {
          role: "user",
          content: [
            { type: "text", text: visionUser },
            ...dataUrls.map((u) => ({ type: "input_image", image_url: u })),
          ],
        },
      ],
    }),
  });

  if (!visionResponse.ok) {
    const errText = await visionResponse.text().catch(() => "");
    return jsonError(502, "OpenAI vision request failed", errText || undefined);
  }

  const visionData = (await visionResponse.json()) as unknown;
  const outputText = extractOutputText(visionData);
  if (!outputText) {
    return jsonError(502, "Failed to read vision output");
  }

  let extractedUnknown: unknown;
  try {
    extractedUnknown = JSON.parse(outputText) as unknown;
  } catch {
    return jsonError(502, "Vision output was not valid JSON");
  }

  let extract: VisionTextExtract;
  try {
    extract = coerceVisionTextExtract(extractedUnknown);
  } catch (e) {
    return jsonError(502, "Failed to extract conversation text", e instanceof Error ? e.message : "Unknown error");
  }

  try {
    const metrics = await generateMiteruMetricsFromTranscript({ apiKey, transcript: extract.conversation_text });
    return NextResponse.json({
      metrics,
      transcript: extract.conversation_text,
      debug: {
        image_count: files.length,
        total_bytes: totalBytes,
        vision_model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      },
    });
  } catch (e) {
    return jsonError(502, "Analyze failed", e instanceof Error ? e.message : "Unknown error");
  }
}
