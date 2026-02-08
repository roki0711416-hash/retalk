import SwiftUI
import WebKit

struct WebView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        let webView = WKWebView(frame: .zero, configuration: config)

        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.bounces = false
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        uiView.load(URLRequest(url: url))
    }
}

struct ContentView: View {
    private var startURL: URL {
        // キャッシュ回避: ビルドごとにURLが少し変わる
        let base = "https://retalk-tau.vercel.app"
        let ts = Int(Date().timeIntervalSince1970)
        return URL(string: "\(base)?t=\(ts)")!
    }

    var body: some View {
        WebView(url: startURL)
            .ignoresSafeArea()
    }
}

#Preview {
    ContentView()
}

