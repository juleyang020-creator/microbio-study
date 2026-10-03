# 知微 · 微生物学习手册（静态版）— Codex 入口

**完整项目约定在 `CLAUDE.md`（单一事实源），开工前必读。** 本文件只放最容易被踩的铁律速查：

## 这是什么

医学检验方向的微生物学习/速查 PWA。本地无构建，双击 `index.html` 即可用，线上 GitHub Pages（公开仓库 `juleyang020-creator/microbio-study`）。**不是诊疗工具**，折点/判读/治疗表述一律保守，宁可留空不推断。

## 固定用途声明

本项目面向医学检验、临床微生物学教学和知识查询，涉及病原微生物的内容用于教育、诊断和检验，不以增强致病性、扩大传播能力或其他有害用途为目的。
完整声明及协作适用原则见 [CLAUDE.md「项目用途声明（长期有效）」](CLAUDE.md#项目用途声明长期有效)。后续协作应沿用该背景，避免反复确认项目整体用途；具体请求仍按实际内容及适用的安全要求判断。

## 改完必做（顺序不能乱）

1. 改了 `data/`、`js/`、`css/` → **必升 `APP_VERSION`**，四处同步：`sw.js`、`index.html` 全部 `?v=`、`js/app/helpers.js` 兜底值、`data/source-metadata.js` 的 `资源版本`。不升版本线上 PWA 继续吃旧缓存，而测试照样全绿（测试走 Node require 不经 SW）——这个坑踩过不止一次。
2. 跑 `node tools/release-check.mjs`，全部测试（2026-10-03 为 200 个）+ 内容自检全绿才算完成。
3. 新增数据文件接线共 **六处**（index.html script 列表、sw.js CORE、tests/data-integrity、tests/tools、tools/audit-content.mjs、tools/parse-atlas.mjs），漏一处数据静默丢。
4. 新增/改动 `img/*.svg` → 跑 `node tools/sync-sw-images.mjs`。

## 架构红线

- 数据文件 `window.DB.xxx = [...]` 用 `<script>` 加载，**禁止 fetch / ES module / 打包器**（file:// 双击打开会废）。
- 渲染不用 `innerHTML`；`js/app/` 各文件独立 IIFE，经 `window.AppNS` 共享，script 加载顺序即依赖顺序。

## git

- **绝不 `git add -A` / `git add .`**：公开仓库，`docs/软著材料/` 有软著申请材料，出过身份信息泄漏（PR #70/#71）。stage 前看 `git status --short`。
- 发布流程：push → PR → 合并 main → Pages 自动部署 → 轮询线上 `sw.js` APP_VERSION 到位 → headless 核对改动真实到达。用户已授权（2026-09-06，长期有效）验证通过后直接发布，不用先问。

## 医学内容

折点/QC 范围/天然耐药绝不凭记忆写，回查 `~/Documents/资料库/微生物/01-药敏标准-CLSI/`（PDF 优先，markdown 转换件对矩阵表格不可靠）。MCM 分章索引定位后只读单章，查不到就不写。加/改菌种前读 `docs/菌种编辑规范.md`，黄金样例 `pseudomonas-aeruginosa`。

## 协作方式

用户是产品负责人，不日常维护代码——录入、改数据、跑测试直接做掉。审查报告写进 `docs/审核/审查报告-YYYYMMDD.md`，按 🔴/🟡/🟢 分级，每条带 `path:line` + 原因 + 修法。浏览器检查的截图/JSON 证据放 `docs/审核/<任务目录>/`（已 gitignore，不入库）。每个任务做完在 `docs/任务日志.md` 顶部记一笔（完成 / 可继续空间 / 发现的问题）。
