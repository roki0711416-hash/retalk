import Link from "next/link";

const APP_STORE_URL = "https://apps.apple.com/jp/app/re-talk/id6758968279";
const CONTACT_EMAIL = "retalk.app@proton.me";

export default function Page() {
  return (
    <main
      className="
        relative min-h-screen overflow-hidden
        bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(99,102,241,0.18),transparent),
            radial-gradient(800px_400px_at_80%_20%,rgba(168,85,247,0.12),transparent),
            linear-gradient(to_bottom,#fafaff,#f4f6ff)]
      "
    >
      <div
        className="
          pointer-events-none absolute inset-0 -z-10
          [background-image:radial-gradient(rgba(99,102,241,0.10)_0.6px,transparent_0.6px)]
          [background-size:22px_22px]
          opacity-60
        "
      />

      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-24 -right-40 h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />

      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6">
        <header className="pt-10 sm:pt-12">
          <div className="text-lg font-semibold tracking-tight text-slate-900">
            Re:Talk
          </div>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center py-10 sm:py-14 text-center">
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            会話を、ひも解く。
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            スクショを読み込んで会話の傾向を分析します。
          </p>

          <div className="mt-10 flex w-full max-w-md flex-col gap-3">
            <a
              href={APP_STORE_URL}
              className="
                inline-flex items-center justify-center
                h-14 rounded-full px-8
                bg-gradient-to-r from-indigo-500 to-violet-500
                text-white font-semibold
                shadow-lg shadow-indigo-500/25
                hover:shadow-indigo-500/35
                active:scale-[0.99]
                transition
              "
            >
              インストールはこちら（App Store）
            </a>

            <Link
              href="/privacy.html"
              className="
                inline-flex items-center justify-center
                h-14 rounded-full px-8
                bg-white/70 backdrop-blur
                border border-slate-200/70
                text-slate-700 font-semibold
                shadow-sm
                hover:bg-white/80
                active:scale-[0.99]
                transition
              "
            >
              プライバシーポリシー
            </Link>
          </div>
        </section>

        <footer className="pb-10 sm:pb-12">
          <div className="mx-auto h-px w-full max-w-2xl bg-slate-200/70" />
          <div className="mt-6 flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
            <div className="flex items-center gap-4">
              <Link href="/privacy.html" className="hover:text-slate-700 transition">
                プライバシーポリシー
              </Link>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="hover:text-slate-700 transition"
              >
                お問い合わせ
              </a>
            </div>
            <div>© {new Date().getFullYear()} Re:Talk</div>
          </div>
        </footer>
      </div>
    </main>
  );
}
