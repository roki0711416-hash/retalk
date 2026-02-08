"use client";

import { useMemo, useState } from "react";

export default function MiteruAnalyzePage() {
  const [tab, setTab] = useState<"talk" | "screenshot">("talk");
  const [msgRatio, setMsgRatio] = useState<string>("0.6");
  const [avgGapHours, setAvgGapHours] = useState<string>("12");
  const [trend, setTrend] = useState<string>("up");

  const [imageFile, setImageFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);

  const metrics = useMemo(() => {
    const msg_ratio = Number(msgRatio);
    const avg_gap_hours = Number(avgGapHours);
    return {
      msg_ratio: Number.isFinite(msg_ratio) ? msg_ratio : msgRatio,
      avg_gap_hours: Number.isFinite(avg_gap_hours) ? avg_gap_hours : avgGapHours,
      trend,
    };
  }, [avgGapHours, msgRatio, trend]);

  async function onAnalyze() {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/miteru/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ metrics }),
      });

      const json = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        setError(
          typeof json === "object" && json !== null && "error" in json
            ? String((json as { error: unknown }).error)
            : `Request failed (${response.status})`,
        );
        setResult(json);
        return;
      }

      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }

  async function onAnalyzeImage() {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!imageFile) {
        setError("画像を選択してください");
        return;
      }

      const fd = new FormData();
      fd.append("image", imageFile);

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
        setResult(json);
        return;
      }

      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <div className="w-full">
        <h1 className="text-2xl font-semibold tracking-tight">解析</h1>
        <p className="mt-3 text-sm text-neutral-600">
          指標（JSON）だけを送って、文章を生成します。トーク本文は送信しません。
        </p>

        <div className="mt-8 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setTab("talk");
              setError(null);
              setResult(null);
            }}
            className={
              tab === "talk"
                ? "h-10 rounded-md bg-black px-4 text-sm font-medium text-white"
                : "h-10 rounded-md border border-neutral-300 bg-white px-4 text-sm"
            }
          >
            トーク履歴でしっかり解析（精度★★★★★）
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("screenshot");
              setError(null);
              setResult(null);
            }}
            className={
              tab === "screenshot"
                ? "h-10 rounded-md bg-black px-4 text-sm font-medium text-white"
                : "h-10 rounded-md border border-neutral-300 bg-white px-4 text-sm"
            }
          >
            スクショでかんたん診断（精度★★☆☆☆）
          </button>
        </div>

        {tab === "talk" ? (
          <div className="mt-8 rounded-lg border border-neutral-200 p-4">
            <h2 className="text-sm font-medium">指標入力（JSON）</h2>
            <div className="mt-4 grid gap-4">
              <label className="grid gap-1">
                <span className="text-xs text-neutral-600">msg_ratio（0-1）</span>
                <input
                  value={msgRatio}
                  onChange={(e) => setMsgRatio(e.target.value)}
                  inputMode="decimal"
                  className="h-10 rounded-md border border-neutral-300 px-3 text-sm"
                  placeholder="0.6"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs text-neutral-600">avg_gap_hours</span>
                <input
                  value={avgGapHours}
                  onChange={(e) => setAvgGapHours(e.target.value)}
                  inputMode="decimal"
                  className="h-10 rounded-md border border-neutral-300 px-3 text-sm"
                  placeholder="12"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs text-neutral-600">trend</span>
                <select
                  value={trend}
                  onChange={(e) => setTrend(e.target.value)}
                  className="h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm"
                >
                  <option value="up">up</option>
                  <option value="flat">flat</option>
                  <option value="risk">risk</option>
                </select>
              </label>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={onAnalyze}
                disabled={isLoading}
                className="inline-flex h-11 items-center justify-center rounded-md bg-black px-6 text-sm font-medium text-white disabled:opacity-60"
              >
                {isLoading ? "解析中..." : "解析する"}
              </button>
            </div>

            {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-neutral-200 p-4">
            <h2 className="text-sm font-medium">スクショ解析</h2>
            <p className="mt-3 text-xs text-neutral-600">簡易診断・精度注意</p>
            <div className="mt-4 grid gap-3">
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className="block text-sm"
              />
              <button
                type="button"
                onClick={onAnalyzeImage}
                disabled={isLoading}
                className="inline-flex h-11 items-center justify-center rounded-md bg-black px-6 text-sm font-medium text-white disabled:opacity-60"
              >
                {isLoading ? "解析中..." : "スクショを解析する"}
              </button>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>
          </div>
        )}

        {tab === "talk" ? (
          <div className="mt-8">
            <h2 className="text-sm font-medium">送信するJSON</h2>
            <pre className="mt-3 overflow-auto rounded-lg bg-neutral-50 p-4 text-xs leading-relaxed">
              {JSON.stringify({ metrics }, null, 2)}
            </pre>
          </div>
        ) : null}

        <div className="mt-8">
          <h2 className="text-sm font-medium">結果JSON</h2>
          {tab === "screenshot" && result ? (
            <p className="mt-2 text-xs text-neutral-600">
              これは簡易診断です（信頼度: ★★☆☆☆）
            </p>
          ) : null}
          <pre className="mt-3 min-h-[120px] overflow-auto rounded-lg bg-neutral-50 p-4 text-xs leading-relaxed">
            {result ? JSON.stringify(result, null, 2) : "（まだ実行していません）"}
          </pre>
        </div>
      </div>
    </main>
  );
}
