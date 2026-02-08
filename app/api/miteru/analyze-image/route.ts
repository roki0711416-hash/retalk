import { NextResponse } from "next/server";

import { generateMiteruAnalysis } from "@/lib/miteru/analyze";

export const runtime = "nodejs";

type VisionExtract = {
  left_count: number;
  right_count: number;
  samples: {
    left: string[];
    right: string[];
  };
  sentiment: "positive" | "neutral" | "negative";
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

function coerceVisionExtract(value: unknown): VisionExtract {
  if (!isPlainObject(value)) throw new Error("Vision output is not a JSON object");

  const left_count = value.left_count;
  const right_count = value.right_count;
  const samples = value.samples;
  const sentiment = value.sentiment;

  if (typeof left_count !== "number" || !Number.isFinite(left_count) || left_count < 0)
    throw new Error("Invalid left_count");
  if (typeof right_count !== "number" || !Number.isFinite(right_count) || right_count < 0)
    throw new Error("Invalid right_count");
  if (!isPlainObject(samples)) throw new Error("Invalid samples");
  const left = samples.left;
  const right = samples.right;
  if (!Array.isArray(left) || !left.every((x) => typeof x === "string")) throw new Error("Invalid samples.left");
  if (!Array.isArray(right) || !right.every((x) => typeof x === "string"))
    throw new Error("Invalid samples.right");
  if (sentiment !== "positive" && sentiment !== "neutral" && sentiment !== "negative")
    throw new Error("Invalid sentiment");

  return {
    left_count: Math.round(left_count),
    right_count: Math.round(right_count),
    samples: {
      left: left.map((s) => s.trim()).filter(Boolean).slice(0, 12),
      right: right.map((s) => s.trim()).filter(Boolean).slice(0, 12),
    },
    sentiment,
  };
}

function computeSimpleMetrics(extract: VisionExtract): Record<string, unknown> {
  const message_count = extract.left_count + extract.right_count;
  const msg_ratio = message_count === 0 ? 0.5 : extract.right_count / message_count;
  const sentiment_trend =
    extract.sentiment === "positive" ? "pos" : extract.sentiment === "negative" ? "neg" : "neutral";

  return {
    msg_ratio,
    message_count,
    sentiment_trend,
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not set" }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "image file is required" }, { status: 400 });
  }

  const allowed = new Set(["image/png", "image/jpeg"]);
  if (!allowed.has(file.type)) {
    return NextResponse.json({ error: "Only png/jpg images are allowed" }, { status: 400 });
  }

  const maxBytes = 6 * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json({ error: "Image is too large (max 6MB)" }, { status: 413 });
  }

  // Read into memory only; do not persist.
  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

  const visionSystem =
    "You extract information from a chat screenshot for a lightweight analysis. " +
    "Return ONLY valid JSON with EXACT keys: left_count, right_count, samples, sentiment. " +
    "samples must be {left: string[], right: string[]} containing short text snippets (not full transcript). " +
    "sentiment must be one of: positive, neutral, negative. " +
    "Do not include any additional keys.";

  const visionUser =
    "From this screenshot, estimate bubble counts by side (left/right), capture a few short message snippets per side, and judge overall sentiment vibe.";

  const visionResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini",
      store: false,
      input: [
        {
          role: "system",
          content: [{ type: "text", text: visionSystem }],
        },
        {
          role: "user",
          content: [
            { type: "text", text: visionUser },
            { type: "input_image", image_url: dataUrl },
          ],
        },
      ],
    }),
  });

  if (!visionResponse.ok) {
    const errText = await visionResponse.text().catch(() => "");
    return NextResponse.json(
      { error: "OpenAI vision request failed", details: errText || undefined },
      { status: 502 },
    );
  }

  const visionData = (await visionResponse.json()) as unknown;
  const outputText = extractOutputText(visionData);
  if (!outputText) {
    return NextResponse.json({ error: "Failed to read vision output" }, { status: 502 });
  }

  let extractedUnknown: unknown;
  try {
    extractedUnknown = JSON.parse(outputText) as unknown;
  } catch {
    return NextResponse.json({ error: "Vision output was not valid JSON" }, { status: 502 });
  }

  let extract: VisionExtract;
  try {
    extract = coerceVisionExtract(extractedUnknown);
  } catch (e) {
    return NextResponse.json(
      {
        error: "Failed to extract screenshot info",
        details: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 502 },
    );
  }

  const metrics = computeSimpleMetrics(extract);

  try {
    const result = await generateMiteruAnalysis({ apiKey, metrics });
    return NextResponse.json({
      score: result.score,
      relationship_type: result.relationship_type,
      outlook: result.outlook,
      summary: result.summary,
    });
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
