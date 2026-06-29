# 把「知微」装到自己的 iPhone

工程已经建好，可用 WKWebView 全屏离线加载打包进 App 的网页资源。
你只需用**免费 Apple ID** 签名一次，就能装到自己手机。**不需要付费开发者账号、不上架。**

> 免费账号限制：签出的 App 证书 **7 天到期**，到期后用 Xcode 再点一次 ▶ 续期即可；一个免费账号最多同时装 3 个自签 App。

---

## 一次性：装到 iPhone（5 步）

1. **同步网页资源**（仓库根目录执行）：
   ```sh
   sh ios/make-web.sh
   ```

2. **打开工程**：双击 `ios/Microbio/Microbio.xcodeproj`。

3. **签名**：左侧选最上方蓝色「Microbio」→ 选 TARGETS 的 Microbio → 顶部 **Signing & Capabilities** →
   - 勾选 **Automatically manage signing**
   - **Team** → 下拉 → **Add an Account…** → 登录你的 Apple ID（生成 Personal Team）→ 选中它
   - 若提示 Bundle Identifier 冲突，把它改成唯一值，如 `com.你的名字.microbio`

4. **真机运行**：数据线连 iPhone 并在手机上点「信任此电脑」→ Xcode 顶部运行目标选**你的 iPhone** → 点 **▶**。

5. **信任开发者**：首次打开提示「未受信任的开发者」时，到 iPhone **设置 → 通用 → VPN与设备管理 →** 点你的证书 → **信任**。再点开 App 即可离线使用。

## 以后更新内容
改了 `data/ css/ img/ js/ index.html` 后：
```sh
sh ios/make-web.sh      # 重新同步
```
回到 Xcode 点一次 **▶** 重装即可。若使用 `project.yml` 重新生成工程，构建阶段也会自动同步网页资源。

## 想先在模拟器看看（不连手机、免签名）
```sh
sh ios/make-web.sh
cd ios/Microbio
xcodebuild -scheme Microbio -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 17' \
  -derivedDataPath build CODE_SIGNING_ALLOWED=NO build
xcrun simctl boot "iPhone 17" 2>/dev/null; open -a Simulator
xcrun simctl install booted build/Build/Products/Debug-iphonesimulator/Microbio.app
xcrun simctl launch booted com.microbio.app
```

## 应用名 / 图标
- 显示名已设为「知微」（`project.yml` 里的 `INFOPLIST_KEY_CFBundleDisplayName`）。
- 图标：把 `ios/icon.svg` 导出 1024×1024 PNG，拖入 Xcode `Assets.xcassets → AppIcon`。

## 故障排查
- **白屏**：先跑 `sh ios/make-web.sh`，确认 `ios/Microbio/web/index.html` 存在；工程里 `web` 应是**蓝色**文件夹引用。
- **签名失败 / Bundle ID 冲突**：把 Bundle Identifier 改成唯一值。
- **过几天打不开**：免费证书 7 天到期，连 Mac 用 Xcode 再 ▶ 一次续期。
- **想调试网页**：Mac Safari →「开发」菜单 → 选你的 iPhone/模拟器 → 选该 WebView，可像浏览器一样审查。

---

## 工程结构（XcodeGen 管理）
```
ios/Microbio/
  project.yml                 # 工程定义（如需改设置后重跑: xcodegen generate）
  Sources/MicrobioApp.swift   # @main 入口
  Sources/ContentView.swift   # WKWebView 全屏离线加载 web/index.html
  web/                        # 由 make-web.sh 生成的网页副本（已 gitignore）
  Microbio.xcodeproj          # 已生成，可直接打开
```
> 改了 `project.yml` 需要 `brew install xcodegen` 后 `cd ios/Microbio && xcodegen generate` 重新生成工程；只改网页/Swift 代码则不需要。

**第 3–5 步是 Xcode 图形界面 + 你的 Apple ID 登录签名**，只能你来点。卡住就把报错截图发我。
