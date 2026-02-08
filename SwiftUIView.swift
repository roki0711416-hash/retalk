import SwiftUI
import WebKit

// WebView ラッパー
struct WebView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView(frame: .zero)
        webView.allowsBackForwardNavigationGestures = true
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        let request = URLRequest(url: url)
        uiView.load(request)
    }
}

// メイン画面
struct SwiftUIView: View {
    var body: some View {
        WebView(
            url: URL(string: "https://YOUR_DOMAIN/miteru")!
        )
        .ignoresSafeArea() // 画面全体に表示
    }
}

#Preview {
    SwiftUIView()
}

