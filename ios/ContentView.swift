import SwiftUI
import WebKit

/// 把打包进 App 的本地网页用 WKWebView 全屏离线加载。
/// 网页资源需作为名为 "web" 的「文件夹引用(蓝色)」加入工程，其中含 index.html / css / js / data / img。
struct WebView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.allowsBackForwardNavigationGestures = true          // 侧滑返回
        webView.scrollView.contentInsetAdjustmentBehavior = .never  // 由网页 env(safe-area) 处理刘海/底部
        webView.isOpaque = true
        webView.backgroundColor = .white
        webView.scrollView.backgroundColor = .white
        #if DEBUG
        if #available(iOS 16.4, *) { webView.isInspectable = true } // 便于 Safari「开发」菜单调试
        #endif
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        guard webView.url == nil else { return }                    // 只加载一次
        let index = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "web")
            ?? Bundle.main.url(forResource: "index", withExtension: "html")
        if let index = index {
            webView.loadFileURL(index, allowingReadAccessTo: index.deletingLastPathComponent())
        }
    }
}

struct ContentView: View {
    var body: some View {
        WebView()
            .ignoresSafeArea()   // 全屏，安全区由网页 CSS env(safe-area-inset-*) 内边距处理
    }
}

#Preview {
    ContentView()
}
