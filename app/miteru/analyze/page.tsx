"use client";

import { useMemo, useState } from "react";

type Metrics = {
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

type AnalyzeApiResponse = {
  metrics: Metrics;
  transcript: string;
  debug?: unknown;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function coerceAnalyzeApiResponse(value: unknown): AnalyzeApiResponse {
  if (!isPlainObject(value)) throw new Error("結果が不正です");
  const metrics = value.metrics;
  const transcript = value.transcript;
  const debug = value.debug;
  if (!isPlainObject(metrics)) throw new Error("metrics が不正です");
  if (typeof transcript !== "string") throw new Error("transcript が不正です");

  const score = metrics.score;
  const relationship_type = metrics.relationship_type;
  const outlook = metrics.outlook;
  const summary = metrics.summary;
  const signals = metrics.signals;
  const red_flags = metrics.red_flags;
  const advice = metrics.advice;
  const confidence = metrics.confidence;

  if (typeof score !== "number" || !Number.isFinite(score)) throw new Error("score が不正です");
  if (typeof relationship_type !== "string") throw new Error("relationship_type が不正です");
  if (typeof outlook !== "string") throw new Error("outlook が不正です");
  if (typeof summary !== "string") throw new Error("summary が不正です");
  if (!isPlainObject(signals)) throw new Error("signals が不正です");
  if (!isPlainObject(signals.message_ratio)) throw new Error("signals.message_ratio が不正です");
  if (!isPlainObject(signals.question_ratio)) throw new Error("signals.question_ratio が不正です");
  if (typeof signals.reply_speed_gap !== "string") throw new Error("signals.reply_speed_gap が不正です");
  if (typeof signals.affection_words !== "string") throw new Error("signals.affection_words が不正です");
  if (typeof signals.plan_initiative !== "string") throw new Error("signals.plan_initiative が不正です");
  if (!Array.isArray(red_flags) || !red_flags.every((x) => typeof x === "string"))
    throw new Error("red_flags が不正です");
  if (!Array.isArray(advice) || !advice.every((x) => typeof x === "string"))
    throw new Error("advice が不正です");
  if (typeof confidence !== "number" || !Number.isFinite(confidence)) throw new Error("confidence が不正です");

  return {
    metrics: {
      score: Math.round(score),
      relationship_type,
      outlook,
      summary,
      signals: {
        message_ratio: {
          you: Number((signals.message_ratio as Record<string, unknown>).you),
          them: Number((signals.message_ratio as Record<string, unknown>).them),
        },
        question_ratio: {
          you: Number((signals.question_ratio as Record<string, unknown>).you),
          them: Number((signals.question_ratio as Record<string, unknown>).them),
        },
        reply_speed_gap: signals.reply_speed_gap,
        affection_words: signals.affection_words,
        plan_initiative: signals.plan_initiative,
      },
      red_flags,
      advice,
      confidence,
    },
    transcript,
    debug,
  };
}

export default function MiteruAnalyzePage() {
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeApiResponse | null>(null);

  const limits = useMemo(() => {
    const maxFiles = 10;
    const maxTotalBytes = 20 * 1024 * 1024;
    const totalBytes = imageFiles.reduce((sum, f) => sum + f.size, 0);
    return { maxFiles, maxTotalBytes, totalBytes };
  }, [imageFiles]);

  async function onAnalyzeImage() {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      if (imageFiles.length === 0) {
        setError("画像を選択してください（最大10枚）");
        return;
      }
      if (imageFiles.length > limits.maxFiles) {
        setError(`画像は最大${limits.maxFiles}枚までです`);
        return;
      }
      if (limits.totalBytes > limits.maxTotalBytes) {
        setError("合計サイズが大きすぎます（最大20MB）");
        return;
      }

      const fd = new FormData();
      for (const file of imageFiles) {
        fd.append("images", file, file.name);
      }

      const response = await fetch("/api/miteru/analyze-image", {
        method: "POST",
        body: fd,
      });

      const json = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        setError(
          typeof json === "object" && json !== null && "error" in json
            ? String((json as { error: unknown }).error)
            : `Request failed (${response.status})`,
        );
        return;
      }

      setResult(coerceAnalyzeApiResponse(json));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <div className="w-full">
        <h1 className="text-2xl font-semibold tracking-tight">ミテル？解析</h1>
        <p className="mt-3 text-sm text-neutral-600">
          LINEトーク履歴のスクショ（複数枚）をアップロードして解析します。
        </p>

        <div className="mt-8 rounded-lg border border-neutral-200 p-4">
          <h2 className="text-sm font-medium">スクショをアップロード</h2>
          <p className="mt-2 text-xs text-neutral-600">png/jpg・最大10枚・合計20MBまで</p>

          <div className="mt-4 grid gap-3">
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg"
              onChange={(e) => {
                const next = Array.from(e.target.files ?? []);
                setImageFiles(next);
                setError(null);
                setResult(null);
              }}
              className="block text-sm"
            />

            <div className="text-xs text-neutral-600">
              選択中: {imageFiles.length}枚 / 合計 {(limits.totalBytes / (1024 * 1024)).toFixed(2)}MB
            </div>

            <button
              type="button"
              onClick={onAnalyzeImage}
              disabled={isLoading}
              className="inline-flex h-11 items-center justify-center rounded-md bg-black px-6 text-sm font-medium text-white disabled:opacity-60"
            >
              {isLoading ? "解析中..." : "解析を始める"}
            </button>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-neutral-200 p-4">
          <h2 className="text-sm font-medium">結果</h2>
          {result ? (
            <div className="mt-4 grid gap-4">
              <div>
                <div className="text-xs text-neutral-600">score</div>
                <div className="mt-1 text-3xl font-semibold">{result.metrics.score}</div>
              </div>

              <div className="grid gap-2">
                <div>
                  <div className="text-xs text-neutral-600">relationship_type</div>
                  <div className="mt-1 text-sm font-medium">{result.metrics.relationship_type}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-600">outlook</div>
                  <div className="mt-1 text-sm font-medium">{result.metrics.outlook}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-600">confidence</div>
                  <div className="mt-1 text-sm font-medium">{result.metrics.confidence.toFixed(2)}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-neutral-600">summary</div>
                <p className="mt-2 text-sm leading-relaxed">{result.metrics.summary}</p>
              </div>

              <div>
                <div className="text-xs text-neutral-600">signals</div>
                <div className="mt-2 grid gap-2 text-sm">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-neutral-600">message_ratio (you/them)</span>
                    <span>
                      {result.metrics.signals.message_ratio.you.toFixed(2)} / {result.metrics.signals.message_ratio.them.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-neutral-600">question_ratio (you/them)</span>
                    <span>
                      {result.metrics.signals.question_ratio.you.toFixed(2)} / {result.metrics.signals.question_ratio.them.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-neutral-600">reply_speed_gap</span>
                    <span>{result.metrics.signals.reply_speed_gap}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-neutral-600">affection_words</span>
                    <span>{result.metrics.signals.affection_words}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-neutral-600">plan_initiative</span>
                    <span>{result.metrics.signals.plan_initiative}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-neutral-600">red_flags</div>
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {result.metrics.red_flags.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-xs text-neutral-600">advice</div>
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {result.metrics.advice.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-xs text-neutral-600">transcript</div>
                <pre className="mt-2 max-h-72 overflow-auto rounded-md bg-neutral-50 p-3 text-xs leading-relaxed">
                  {result.transcript}
                </pre>
              </div>

              <div>
                <div className="text-xs text-neutral-600">metrics (raw JSON)</div>
                <pre className="mt-2 max-h-72 overflow-auto rounded-md bg-neutral-50 p-3 text-xs leading-relaxed">
                  {JSON.stringify(result.metrics, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-neutral-600">（まだ実行していません）</p>
          )}
        </div>
      </div>
    </main>
  );
}
