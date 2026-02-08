import Link from "next/link";

export default function SupportPage() {
  return (
    <main style={{ padding: "48px 24px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.01em" }}>
          サポート（Re:Talk）
        </h1>

        <section style={{ marginTop: 20, lineHeight: 1.8, fontSize: 15 }}>
          <p>
            お問い合わせは下記メールアドレスまでご連絡ください。
          </p>
          <p style={{ marginTop: 8 }}>
            <a href="mailto:support@miteru.app" style={{ color: "#111" }}>
              support@miteru.app
            </a>
          </p>
        </section>

        <div style={{ marginTop: 32 }}>
          <Link href="/miteru" style={{ color: "#111" }}>
            ← /miteru に戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
