# 怎么把「知微」分享给朋友

这本质上是一个网页应用，而且已做成 **PWA（可离线、可加到主屏）**。所以分享给朋友最简单的方式不是发 iOS App，而是发一个**网址**。

## ✅ 方式 A：发网页链接（推荐，免费，人人可用）
适合所有朋友（iPhone / 安卓 / 电脑都能用），无需 Apple 账号、不花钱。

**第 1 步 · 把网页托管到线上**，二选一：

- **最省事（无需注册）—— Netlify Drop**
  1. 浏览器打开 https://app.netlify.com/drop
  2. 把这些网页资源拖进去：`index.html`、`css/`、`js/`、`data/`、`img/`、`icons/`、`manifest.json`、`sw.js`
  3. 几秒后得到一个网址，如 `https://xxxx.netlify.app`
  > 不需要上传 `ios/`、`tests/`、`.git/`、`docs/` 或构建产物。

- **更正式、网址稳定 —— GitHub Pages（免费）**
  1. 在 github.com 新建一个仓库，把本项目推上去（项目根目录已有 `.nojekyll`，可跳过 Jekyll 处理，直接发布 `data/` 等下划线外的资源）
  2. 仓库 Settings → Pages → Source 选 `main` 分支、根目录 → Save
  3. 得到网址，如 `https://你的用户名.github.io/仓库名/`

**第 2 步 · 把网址发给朋友**。他们：
- **iPhone**：用 Safari 打开 → 点底部「分享」→「添加到主屏幕」→ 就有一个 App 图标，全屏打开、**联网打开一次后核心内容可离线用**。
- **安卓**：用 Chrome 打开 → 菜单「安装应用 / 添加到主屏幕」。
- **电脑**：直接用浏览器，或地址栏的「安装」图标。

## 方式 B：TestFlight（真·iOS App，需付费）
想让朋友在 iPhone 上装成**原生 App**，要先注册 **Apple 开发者（$99/年）**，再用 TestFlight：
- Xcode Archive 上传到 App Store Connect → TestFlight → 邀请朋友（邮件或公开链接，最多 1 万人）→ 朋友装「TestFlight」App 后即可安装试用。
- 只有确实需要原生分发才值得花这个钱；否则方式 A 完全够用。

## 方式 C：自签到本机（仅自己/技术朋友）
免费 Apple ID 自签只能装到**自己**的设备，且每台都要各自的 Mac+Xcode、证书 7 天到期。**不适合分享给一般朋友。**

---

> 想了解项目本身（模块、数据结构、测试）见 [`README.md`](./README.md)。

**一句话**：发链接最省事——按方式 A 托管一次，发网址，朋友「添加到主屏幕」就当 App 用、还能离线。
