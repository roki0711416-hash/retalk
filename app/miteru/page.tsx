import Link from "next/link";

export default function MiteruTopPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "64px 24px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 720, textAlign: "center" }}>
          <h1 style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Re:Talk
          </h1>
          <p style={{ marginTop: 12, fontSize: 14, color: "#444" }}>
            恋愛モード：ミテル？
          </p>
          <p style={{ marginTop: 16, fontSize: 20 }}>相手の気持ち、ミテル？</p>
          <p style={{ marginTop: 16, fontSize: 14, color: "#444" }}>
            Re:Talk（リトーク）の恋愛モード「ミテル？」では、LINEのトーク履歴から恋愛相性と関係の温度を解析します
          </p>
          <div style={{ marginTop: 32 }}>
            <Link
              href="/miteru/analyze"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 44,
                padding: "0 20px",
                borderRadius: 8,
                background: "#000",
                color: "#fff",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Re:Talkで解析を始める
            </Link>
          </div>
        </div>
      </div>

      <footer
        style={{
          borderTop: "1px solid #e5e5e5",
          padding: "16px 24px",
        }}
      >
        <nav
          style={{
            margin: "0 auto",
            maxWidth: 720,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            fontSize: 14,
          }}
        >
          <Link href="/miteru/privacy" style={{ color: "#111", textDecoration: "none" }}>
            プライバシー
          </Link>
          <Link href="/miteru/terms" style={{ color: "#111", textDecoration: "none" }}>
            利用規約
          </Link>
          <Link href="/support" style={{ color: "#111", textDecoration: "none" }}>
            サポート
          </Link>
        </nav>
      </footer>
    </main>
  );
}
