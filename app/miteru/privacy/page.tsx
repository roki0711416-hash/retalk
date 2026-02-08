import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main style={{ padding: "48px 24px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.01em" }}>
          プライバシーポリシー
        </h1>
        <p style={{ marginTop: 8, color: "#444", fontSize: 14 }}>
          最終更新日: 2026-02-08
        </p>

        <section style={{ marginTop: 28, lineHeight: 1.8, fontSize: 15 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>1. 取得する情報</h2>
          <p style={{ marginTop: 8 }}>
            本サービス「Re:Talk（リトーク）」は、ユーザーが入力した指標情報（例: 比率や傾向などのJSON）や、
            ユーザーがアップロードしたスクリーンショット画像等をもとに解析を行います。
            なお、恋愛モードの名称として「ミテル？」という表現を用いる場合があります。
          </p>

          <h2 style={{ marginTop: 18, fontSize: 18, fontWeight: 700 }}>2. 利用目的</h2>
          <p style={{ marginTop: 8 }}>
            取得した情報は、解析結果の生成、品質向上、ならびに不正利用の防止のために利用します。
          </p>

          <h2 style={{ marginTop: 18, fontSize: 18, fontWeight: 700 }}>3. 保存について</h2>
          <p style={{ marginTop: 8 }}>
            アップロードされたスクリーンショット画像および入力されたテキストは、解析のみに利用し、保存しません。
          </p>
          <p style={{ marginTop: 8 }}>
            解析結果については、サービス運用上の都合により、最大7日間保存される可能性があります。
          </p>

          <h2 style={{ marginTop: 18, fontSize: 18, fontWeight: 700 }}>4. お問い合わせ</h2>
          <p style={{ marginTop: 8 }}>
            本ポリシーに関するお問い合わせは、サポートページをご確認ください。
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
