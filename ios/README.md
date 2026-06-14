# 把「微生物学习」装到自己的 iPhone（WKWebView 套壳）

目标：用免费 Apple ID，把这个网页应用打包成原生 App 装到自己手机，离线可用。**不需要付费开发者账号，不上架。**

> 限制：免费账号签的 App 证书 **7 天到期**，到期后用 Xcode 再运行一次即可续期；一个免费账号最多同时装 3 个自签 App。

---

## 0. 准备
- 一台 **Mac**，从 App Store 安装 **Xcode**（免费，较大，约需半小时下载）。
- 一根数据线 + 你的 **iPhone**。
- 一个 **Apple ID**（免费即可）。

## 1. 生成网页资源包
在仓库根目录执行：

```sh
sh ios/make-web.sh
```

会生成 `ios/web/`（含 `index.html` + `css/ js/ data/ img/`）。以后改了网页内容，重跑一次即可。

## 2. 新建 Xcode 工程
1. 打开 Xcode → **Create New Project**。
2. 选 **iOS → App**，**Next**。
3. 填写：
   - Product Name：`Microbio`（随意，将作为 App 名；想用中文可之后在设置里改显示名）
   - Team：先留空（第 5 步再设）
   - Organization Identifier：`com.你的名字`（如 `com.jule`）
   - Interface：**SwiftUI**；Language：**Swift**
   - 「Include Tests」可不勾。
4. 选个保存位置，**Create**。

## 3. 放入网页与代码
1. 用我提供的 `ios/ContentView.swift` 的全部内容，**替换**工程里自动生成的 `ContentView.swift`（整文件覆盖）。
   - 默认生成的 `XxxApp.swift` 已是 `WindowGroup { ContentView() }`，**无需改动**。
2. 把 **`ios/web` 这个文件夹**从访达拖进 Xcode 左侧文件列表，弹窗里：
   - 勾选 **Copy items if needed**
   - **务必选 “Create folder references”**（加入后是**蓝色**文件夹，不是黄色；否则子目录会被打平、网页加载失败）
   - Add to targets：勾选你的 App
   - **Finish**。
   - 确认列表里出现一个**蓝色** `web` 文件夹，展开能看到 `index.html`。

## 4. （可选）应用名 / 图标
- 中文显示名：选中工程 → Target → **Info** → 加一行 `Bundle display name` = `微生物学习`。
- 图标：工程里 `Assets.xcassets → AppIcon` 拖入 1024×1024 PNG（`ios/icon.svg` 可作设计稿，用任意工具导出 PNG）。

## 5. 配置签名（关键）
1. 选中工程（最上方蓝色图标）→ 选 Target → 顶部 **Signing & Capabilities**。
2. 勾选 **Automatically manage signing**。
3. **Team**：点下拉 → **Add an Account…** → 登录你的 Apple ID（会创建一个 “Personal Team”）→ 选中它。
4. 若报 Bundle Identifier 冲突，把它改成唯一值，如 `com.jule.microbio`。

## 6. 真机运行
1. 数据线连接 iPhone，手机上点「**信任**此电脑」并解锁。
2. Xcode 顶部运行目标从模拟器改成**你的 iPhone**。
3. 点 **▶（Run）**。首次会编译+安装。
4. 第一次在手机上打开会提示「未受信任的开发者」：到 iPhone **设置 → 通用 → VPN与设备管理 →** 点你的开发者证书 → **信任**。
5. 再点开 App，即可离线使用。

## 7. 日常更新内容
改完网页（`data/*.js`、`css`、`img` 等）后：

```sh
sh ios/make-web.sh        # 重新生成 ios/web
```

回到 Xcode 点一次 **▶** 重新安装即可（蓝色文件夹引用会自动带上新文件）。

## 8. 故障排查
- **白屏**：`web` 必须是**蓝色**文件夹引用，且 `index.html` 在其根目录；重做第 3.2 步。
- **“Untrusted Developer”**：按第 6.4 步在设备管理里信任。
- **签名失败 / Bundle ID 冲突**：改成唯一的 Organization Identifier / Bundle Identifier。
- **App 过几天打不开**：免费证书 7 天到期，连上 Mac 用 Xcode 再 Run 一次续期。
- **想调试网页**：Mac Safari →「开发」菜单 → 选你的 iPhone → 选该 WebView，可像浏览器一样审查。

---

需要我做的我都放这儿了（代码 + 脚本 + 步骤）；**第 2、5、6 步是 Xcode 图形界面 + 你的 Apple ID 登录**，必须你来点，我无法替你登录/签名。卡在任何一步把报错截图发我，我帮你定位。
