import Link from "next/link";

export default function TermsPage() {
  return (
    <main style={{ padding: "48px 24px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.01em" }}>
          利用規約
        </h1>
        <p style={{ marginTop: 8, color: "#444", fontSize: 14 }}>
          最終更新日: 2026-02-08
        </p>

        <section style={{ marginTop: 28, lineHeight: 1.8, fontSize: 15 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>1. 本サービスについて</h2>
          <p style={{ marginTop: 8 }}>
            本サービス「Re:Talk（リトーク）」は、ユーザーが入力・アップロードした情報をもとに、関係性に関する分析結果を提示するツールです。
            なお、恋愛モードの名称として「ミテル？」という表現を用いる場合があります。
          </p>

          <h2 style={{ marginTop: 18, fontSize: 18, fontWeight: 700 }}>2. 正確性の保証なし</h2>
          <p style={{ marginTop: 8 }}>
            本サービスの診断・分析結果は推定に基づくものであり、正確性・完全性・有用性を保証しません。
          </p>

          <h2 style={{ marginTop: 18, fontSize: 18, fontWeight: 700 }}>3. 免責</h2>
          <p style={{ marginTop: 8 }}>
            本サービスの利用または利用不能により生じたいかなる損害についても、当方は責任を負いません。
            本サービスの結果に基づく判断は、ユーザーご自身の責任で行ってください。
          </p>

          <h2 style={{ marginTop: 18, fontSize: 18, fontWeight: 700 }}>4. 禁止事項</h2>
          <ul style={{ marginTop: 8, paddingLeft: 18 }}>
            <li>法令または公序良俗に反する行為</li>
            <li>第三者の権利（プライバシー、著作権等）を侵害する行為</li>
            <li>不正アクセス、サービスの妨害、過度な負荷をかける行為</li>
            <li>本サービスの出力を用いた誹謗中傷、嫌がらせ等の行為</li>
          </ul>
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
