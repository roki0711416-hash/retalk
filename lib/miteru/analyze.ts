import "server-only";

export type AnalyzeResult = {
  score: number;
  relationship_type: string;
  outlook: "up" | "flat" | "risk";
  summary: string;
  red_flags: string[];
  advice: string[];
};

export type MiteruMetrics = {
  score: number;
  relationship_type: string;
  outlook: string;
  summary: string;
  signals: {
    message_ratio: { you: number; them: number };
    question_ratio: { you: number; them: number };
    reply_speed_gap: string;
    affection_words: string;
    plan_initiative: string;
  };
  red_flags: string[];
  advice: string[];
  confidence: number;
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

function coerceMiteruMetrics(value: unknown): MiteruMetrics {
  if (!isPlainObject(value)) throw new Error("Model output is not a JSON object");

  const score = value.score;
  const relationship_type = value.relationship_type;
  const outlook = value.outlook;
  const summary = value.summary;
  const signals = value.signals;
  const red_flags = value.red_flags;
  const advice = value.advice;
  const confidence = value.confidence;

  if (typeof score !== "number" || !Number.isFinite(score)) throw new Error("Invalid score");
  if (score < 0 || score > 100) throw new Error("Score out of range");
  if (typeof relationship_type !== "string" || relationship_type.trim().length === 0)
    throw new Error("Invalid relationship_type");
  if (typeof outlook !== "string" || outlook.trim().length === 0) throw new Error("Invalid outlook");
  if (typeof summary !== "string" || summary.trim().length === 0) throw new Error("Invalid summary");
  if (!isPlainObject(signals)) throw new Error("Invalid signals");

  const message_ratio = signals.message_ratio;
  const question_ratio = signals.question_ratio;
  const reply_speed_gap = signals.reply_speed_gap;
  const affection_words = signals.affection_words;
  const plan_initiative = signals.plan_initiative;

  if (!isPlainObject(message_ratio)) throw new Error("Invalid signals.message_ratio");
  if (!isPlainObject(question_ratio)) throw new Error("Invalid signals.question_ratio");
  const mrYou = message_ratio.you;
  const mrThem = message_ratio.them;
  const qrYou = question_ratio.you;
  const qrThem = question_ratio.them;
  if (typeof mrYou !== "number" || !Number.isFinite(mrYou)) throw new Error("Invalid signals.message_ratio.you");
  if (typeof mrThem !== "number" || !Number.isFinite(mrThem))
    throw new Error("Invalid signals.message_ratio.them");
  if (typeof qrYou !== "number" || !Number.isFinite(qrYou)) throw new Error("Invalid signals.question_ratio.you");
  if (typeof qrThem !== "number" || !Number.isFinite(qrThem))
    throw new Error("Invalid signals.question_ratio.them");

  if (typeof reply_speed_gap !== "string") throw new Error("Invalid signals.reply_speed_gap");
  if (typeof affection_words !== "string") throw new Error("Invalid signals.affection_words");
  if (typeof plan_initiative !== "string") throw new Error("Invalid signals.plan_initiative");

  if (!Array.isArray(red_flags) || !red_flags.every((x) => typeof x === "string"))
    throw new Error("Invalid red_flags");
  if (!Array.isArray(advice) || !advice.every((x) => typeof x === "string"))
    throw new Error("Invalid advice");
  if (typeof confidence !== "number" || !Number.isFinite(confidence)) throw new Error("Invalid confidence");
  if (confidence < 0 || confidence > 1) throw new Error("Confidence out of range");

  return {
    score: Math.round(score),
    relationship_type: relationship_type.trim(),
    outlook: outlook.trim(),
    summary: summary.trim(),
    signals: {
      message_ratio: { you: mrYou, them: mrThem },
      question_ratio: { you: qrYou, them: qrThem },
      reply_speed_gap: reply_speed_gap.trim(),
      affection_words: affection_words.trim(),
      plan_initiative: plan_initiative.trim(),
    },
    red_flags: red_flags.map((s) => s.trim()).filter(Boolean).slice(0, 10),
    advice: advice.map((s) => s.trim()).filter(Boolean).slice(0, 10),
    confidence,
  };
}

function getModelFromEnv(params: { key: string; fallback: string }): string {
  const v = process.env[params.key];
  return typeof v === "string" && v.trim().length ? v.trim() : params.fallback;
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
      model: getModelFromEnv({ key: "OPENAI_MODEL", fallback: "gpt-4o-mini" }),
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

export async function generateMiteruMetricsFromTranscript(params: {
  apiKey: string;
  transcript: string;
}): Promise<MiteruMetrics> {
  const { apiKey, transcript } = params;

  const systemText =
    "You are Re:Talk (ミテル？) relationship analyzer for an MVP. " +
    "Use only the provided transcript text (OCR may be imperfect). " +
    "Prioritize being helpful and consistent over being perfectly accurate. " +
    "Avoid fortune-telling or definitive claims; use cautious, practical wording. " +
    "Return ONLY valid JSON matching the provided schema.";

  const userText =
    "Generate metrics JSON from the following chat transcript.\n" +
    "Transcript:\n" +
    transcript;

  const jsonSchema = {
    name: "miteru_metrics",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        score: { type: "number", minimum: 0, maximum: 100 },
        relationship_type: { type: "string" },
        outlook: { type: "string" },
        summary: { type: "string" },
        signals: {
          type: "object",
          additionalProperties: false,
          properties: {
            message_ratio: {
              type: "object",
              additionalProperties: false,
              properties: {
                you: { type: "number" },
                them: { type: "number" },
              },
              required: ["you", "them"],
            },
            question_ratio: {
              type: "object",
              additionalProperties: false,
              properties: {
                you: { type: "number" },
                them: { type: "number" },
              },
              required: ["you", "them"],
            },
            reply_speed_gap: { type: "string" },
            affection_words: { type: "string" },
            plan_initiative: { type: "string" },
          },
          required: [
            "message_ratio",
            "question_ratio",
            "reply_speed_gap",
            "affection_words",
            "plan_initiative",
          ],
        },
        red_flags: { type: "array", items: { type: "string" }, maxItems: 10 },
        advice: { type: "array", items: { type: "string" }, maxItems: 10 },
        confidence: { type: "number", minimum: 0, maximum: 1 },
      },
      required: [
        "score",
        "relationship_type",
        "outlook",
        "summary",
        "signals",
        "red_flags",
        "advice",
        "confidence",
      ],
    },
  };

  const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getModelFromEnv({ key: "OPENAI_MODEL", fallback: "gpt-4o-mini" }),
      store: false,
      response_format: { type: "json_schema", json_schema: jsonSchema },
      input: [
        { role: "system", content: [{ type: "text", text: systemText }] },
        { role: "user", content: [{ type: "text", text: userText }] },
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

  return coerceMiteruMetrics(parsed);
}

// Backward-compat export for older call sites (keep API stable)
export async function generateMiteruDiagnosisFromText(params: {
  apiKey: string;
  extractedText: string;
}): Promise<Pick<MiteruMetrics, "score" | "summary" | "red_flags" | "advice">> {
  const metrics = await generateMiteruMetricsFromTranscript({
    apiKey: params.apiKey,
    transcript: params.extractedText,
  });
  return {
    score: metrics.score,
    summary: metrics.summary,
    red_flags: metrics.red_flags,
    advice: metrics.advice,
  };
}
