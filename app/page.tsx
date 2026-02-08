import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-16">
      <div className="w-full text-center">
        <h1 className="text-5xl font-semibold tracking-tight">ミテル？</h1>
        <p className="mt-4 text-xl">相手の気持ち、ミテル？</p>
        <p className="mt-4 text-sm text-neutral-600">
          LINEのトーク履歴から、恋愛相性と関係の温度を解析します
        </p>
        <div className="mt-10">
          <Link
            href="/miteru"
            className="inline-flex h-11 items-center justify-center rounded-md bg-black px-6 text-sm font-medium text-white"
          >
            解析へ
          </Link>
        </div>
      </div>
    </main>
  );
}
