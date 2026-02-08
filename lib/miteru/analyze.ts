export type AnalyzeResult = {
  score: number;
  relationship_type: string;
  outlook: "up" | "flat" | "risk";
  summary: string;
  red_flags: string[];
  advice: string[];
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

function coerceResult(value: unknown): AnalyzeResult {
  if (!isPlainObject(value)) throw new Error("Model output is not a JSON object");

  const score = value.score;
  const relationship_type = value.relationship_type;
  const outlook = value.outlook;
  const summary = value.summary;
  const red_flags = value.red_flags;
  const advice = value.advice;

  if (typeof score !== "number" || !Number.isFinite(score)) throw new Error("Invalid score");
  if (score < 0 || score > 100) throw new Error("Score out of range");
  if (typeof relationship_type !== "string" || relationship_type.length === 0)
    throw new Error("Invalid relationship_type");
  if (outlook !== "up" && outlook !== "flat" && outlook !== "risk") throw new Error("Invalid outlook");
  if (typeof summary !== "string" || summary.length === 0) throw new Error("Invalid summary");
  if (!Array.isArray(red_flags) || !red_flags.every((x) => typeof x === "string"))
    throw new Error("Invalid red_flags");
  if (!Array.isArray(advice) || !advice.every((x) => typeof x === "string"))
    throw new Error("Invalid advice");

  return {
    score: Math.round(score),
    relationship_type,
    outlook,
    summary,
    red_flags,
    advice,
  };
}

export async function generateMiteruAnalysis(params: {
  apiKey: string;
  metrics: Record<string, unknown>;
}): Promise<AnalyzeResult> {
  const { apiKey, metrics } = params;

  const systemText =
    "You are ミテル？, an analysis tool. Do not use fortune-telling language. " +
    "You may only use the provided computed metrics JSON (no raw chat logs unless explicitly provided). " +
    "Return ONLY valid JSON with keys: score (0-100), relationship_type, outlook (up|flat|risk), summary, red_flags (string[]), advice (string[]).";

  const userText = `Metrics JSON:\n${JSON.stringify(metrics)}`;

  const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      store: false,
      input: [
        {
          role: "system",
          content: [{ type: "text", text: systemText }],
        },
        {
          role: "user",
          content: [{ type: "text", text: userText }],
        },
      ],
    }),
  });

  if (!openaiResponse.ok) {
    const errText = await openaiResponse.text().catch(() => "");
    throw new Error(errText || `OpenAI API request failed (${openaiResponse.status})`);
  }

  const data = (await openaiResponse.json()) as unknown;
  const outputText = extractOutputText(data);
  if (!outputText) throw new Error("Failed to read model output");

  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    throw new Error("Model output was not valid JSON");
  }

  return coerceResult(parsed);
}
