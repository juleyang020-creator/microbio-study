import SwiftUI

// 仅供参考：Xcode 新建 App 时会自动生成同名 App 文件（struct 名 = 工程名 + App）。
// 默认生成的内容已是「WindowGroup { ContentView() }」，所以通常你只需替换 ContentView.swift，
// 不必改这个文件。若想手动创建，可用下面内容（把 MicrobioApp 改成你的工程名+App）。
@main
struct MicrobioApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
