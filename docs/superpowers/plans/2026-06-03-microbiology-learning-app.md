# 微生物学习软件 框架 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **📌 状态**：此计划是 v1 框架（三大模块）的实施蓝图，已于 2026-06-03 前后完成。后续已扩展至 7 大模块、数据文件增至 12 个、分类树升级为多级。详见设计文档当前版本。

**Goal:** 搭出一个本地、免构建、可离线的静态网页应用框架，含微生物 / 抗生素 / 耐药三大模块的导航、统一数据模型、跨模块关联跳转与全局搜索，并放入少量占位条目。

**Architecture:** 纯静态网页（HTML + CSS + 原生 JS），数据文件挂到全局 `window.DB` 并以 `<script>` 加载（不使用 fetch/ES 模块，确保 `file://` 双击可用）。纯逻辑分两层：`core.js`（索引、关联解析、搜索、校验）与 `view.js`（把条目转成“视图模型”纯数据）。`app.js` 把视图模型用 `createElement`+`textContent`+`replaceChildren` 构建成 DOM——不拼接 HTML 字符串，天然防注入。

**Tech Stack:** HTML5 / CSS3 / 原生 JavaScript（ES5 风格，最大兼容）；测试用 Node 内置 `node --test` + `node:assert`（无 npm 依赖）；git 版本管理。

---

## 文件结构

```
微生物学习软件/
├─ index.html              # 应用外壳：顶栏(标签+搜索) + 侧栏容器 + 主区容器
├─ README.md               # 使用说明 + 如何加内容 + 如何跑测试
├─ .gitignore
├─ css/
│  └─ styles.css           # 全部样式
├─ js/
│  ├─ core.js              # 纯数据逻辑：buildIndex/getRelations/searchEntries/validateData
│  ├─ view.js              # 纯视图模型：moduleLabel/detailVM/sidebarVM/searchVM
│  ├─ validate.js          # 启动时调用 Core.validateData，向控制台输出提醒
│  └─ app.js              # DOM 构建（createElement/textContent/replaceChildren）+ hash 路由 + 事件
├─ data/
│  ├─ categories.js        # 三个模块的分类树
│  ├─ microbes.js          # 微生物条目
│  ├─ antibiotics.js       # 抗生素条目
│  └─ resistance.js        # 耐药条目
└─ tests/
   ├─ core.test.js         # core.js 单元测试（fixture 数据）
   ├─ view.test.js         # view.js 视图模型单元测试
   └─ data-integrity.test.js  # 用真实种子数据跑 validateData，断言无问题
```

**职责边界：** `core.js` 与 `view.js` 是纯函数（输入数据、输出数据），不碰 DOM、不读全局，可在 Node 中单测。`app.js` 只做读取全局、用安全 DOM API 渲染、绑定事件、hash 路由，由手动验收清单覆盖。文本一律经 `textContent` 写入，内容永远不会被当作标记解析。

**关键约定（全程一致）：**
- 模块键：`'microbes'` / `'antibiotics'` / `'resistance'`（`Core.MODULE_KEYS`）。
- 条目结构：`{ id, 名称, 拉丁名?, 类别, 小节:[{标题,正文}], 关联:[id...] }`。
- 分类树：`window.DB.categories[moduleKey] = [{ 名称, 子类:[{名称}] }]`，条目 `类别` 匹配某个子类 `名称`。
- hash 路由：`#/<module>/<id>`。
- 逻辑文件用 UMD 包装：Node 下 `module.exports`，浏览器下挂 `window`；数据文件用 `window.DB = window.DB || {}` 形式。

---

### Task 1: 仓库初始化与基础结构

**Files:**
- Create: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: 初始化 git 仓库**

Run（在项目根目录 `/Users/juleyang/Desktop/微生物学习软件`）:
```bash
git init
```
Expected: `Initialized empty Git repository ...`

- [ ] **Step 2: 创建 `.gitignore`**

Create `.gitignore`:
```
.DS_Store
.superpowers/
node_modules/
```

- [ ] **Step 3: 创建 `README.md`**

Create `README.md`:
```markdown
# 微生物学习软件

本地、免安装的微生物学知识库。**双击 `index.html` 即可在浏览器打开使用**（无需联网、无需构建）。

## 三大模块
- 微生物分类
- 抗生素分类及作用原理
- 耐药因素分类及原理

三大模块互相打通：在一个条目里声明 `关联`，相关条目会在两边自动互相显示。

## 怎么加内容
1. 打开对应模块的数据文件，如 `data/microbes.js`。
2. 复制一段已有条目，修改 `id`（保持唯一）、`名称`、`类别`（需匹配 `data/categories.js` 里的某个子类）、`小节`。
3. （可选）在 `关联` 里填相关条目的 `id`（可跨模块）。
4. 保存，刷新浏览器即可看到。

## 怎么跑测试（开发用，需要 Node）
\`\`\`bash
node --test
\`\`\`
（应用本身运行不需要 Node，只有跑测试时需要。）

## 数据自检
打开应用时会在浏览器控制台输出数据自检结果（id 重复 / 悬空关联 / 未匹配分类）。
```

- [ ] **Step 4: 提交**

```bash
git add .gitignore README.md
git commit -m "chore: 初始化仓库与说明文档"
```

---

### Task 2: core.js — buildIndex（建立 id 索引）

**Files:**
- Create: `js/core.js`
- Test: `tests/core.test.js`

- [ ] **Step 1: 写失败测试**

Create `tests/core.test.js`:
```js
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const Core = require('../js/core.js');

function fixture() {
  return {
    microbes: [
      { id: 'm1', 名称: '金葡', 拉丁名: 'Staph', 类别: '革兰氏阳性球菌',
        小节: [{ 标题: '致病性', 正文: '引起脓肿' }], 关联: ['a1', 'r1'] }
    ],
    antibiotics: [
      { id: 'a1', 名称: '苯唑西林', 类别: 'β-内酰胺类', 小节: [], 关联: ['r1'] }
    ],
    resistance: [
      { id: 'r1', 名称: 'MRSA', 类别: 'PBP改变', 小节: [{ 标题: '原理', 正文: 'PBP2a' }], 关联: [] }
    ]
  };
}

test('buildIndex 按 id 索引并标注所属模块', () => {
  const idx = Core.buildIndex(fixture());
  assert.strictEqual(idx['a1'].module, 'antibiotics');
  assert.strictEqual(idx['m1'].module, 'microbes');
  assert.strictEqual(idx['r1'].entry.名称, 'MRSA');
});

module.exports = { fixture };
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/core.test.js`
Expected: FAIL — `Cannot find module '../js/core.js'`（core.js 尚不存在）。

- [ ] **Step 3: 创建 core.js 并实现 buildIndex**

Create `js/core.js`:
```js
(function (factory) {
  'use strict';
  var Core = factory();
  if (typeof module !== 'undefined' && module.exports) { module.exports = Core; }
  if (typeof window !== 'undefined') { window.Core = Core; }
})(function () {
  'use strict';

  var MODULE_KEYS = ['microbes', 'antibiotics', 'resistance'];

  function buildIndex(db) {
    var index = {};
    MODULE_KEYS.forEach(function (mod) {
      (db[mod] || []).forEach(function (entry) {
        index[entry.id] = { entry: entry, module: mod };
      });
    });
    return index;
  }

  return {
    MODULE_KEYS: MODULE_KEYS,
    buildIndex: buildIndex
  };
});
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node --test tests/core.test.js`
Expected: PASS（pass 1, fail 0）。

- [ ] **Step 5: 提交**

```bash
git add js/core.js tests/core.test.js
git commit -m "feat(core): buildIndex 建立条目索引"
```

---

### Task 3: core.js — getRelations（正向 + 反向 + 悬空 + 去重）

**Files:**
- Modify: `js/core.js`
- Test: `tests/core.test.js`

- [ ] **Step 1: 追加失败测试**

在 `tests/core.test.js` 末尾（`module.exports` 之前）追加：
```js
test('getRelations 返回正向关联（当前条目声明的）', () => {
  const rels = Core.getRelations('m1', fixture());
  const ids = rels.map(r => r.id).sort();
  assert.deepStrictEqual(ids, ['a1', 'r1']);
  assert.ok(rels.every(r => r.direction === 'forward'));
  assert.ok(rels.every(r => r.exists === true));
});

test('getRelations 返回反向关联（别的条目声明指向它的）', () => {
  const rels = Core.getRelations('a1', fixture());
  const r1 = rels.find(r => r.id === 'r1');
  const m1 = rels.find(r => r.id === 'm1');
  assert.strictEqual(r1.direction, 'forward');   // a1 声明了 r1
  assert.strictEqual(m1.direction, 'reverse');    // m1 声明了 a1
  assert.strictEqual(m1.module, 'microbes');
});

test('getRelations 标注悬空关联 exists=false', () => {
  const db = fixture();
  db.microbes[0].关联 = ['nope'];
  const rels = Core.getRelations('m1', db);
  const nope = rels.find(r => r.id === 'nope');
  assert.strictEqual(nope.exists, false);
  assert.strictEqual(nope.module, null);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/core.test.js`
Expected: FAIL — 新增的 getRelations 测试报 `Core.getRelations is not a function`；buildIndex 测试仍通过。

- [ ] **Step 3: 实现 getRelations**

在 `js/core.js` 的 `buildIndex` 函数之后、`return` 之前加入：
```js
  function getRelations(id, db) {
    var index = buildIndex(db);
    var current = index[id] ? index[id].entry : null;
    var forwardIds = (current && Array.isArray(current.关联)) ? current.关联.slice() : [];

    var reverseIds = [];
    MODULE_KEYS.forEach(function (mod) {
      (db[mod] || []).forEach(function (entry) {
        if (entry.id === id) { return; }
        if (Array.isArray(entry.关联) && entry.关联.indexOf(id) !== -1) {
          reverseIds.push(entry.id);
        }
      });
    });

    var seen = {};
    var result = [];
    function push(rid, direction) {
      if (seen[rid]) { return; }
      seen[rid] = true;
      var hit = index[rid];
      result.push({
        id: rid,
        名称: hit ? hit.entry.名称 : rid,
        module: hit ? hit.module : null,
        exists: !!hit,
        direction: direction
      });
    }
    forwardIds.forEach(function (rid) { push(rid, 'forward'); });
    reverseIds.forEach(function (rid) { push(rid, 'reverse'); });
    return result;
  }
```
并在 `return { ... }` 中加入 `getRelations: getRelations,`。

- [ ] **Step 4: 运行测试确认通过**

Run: `node --test tests/core.test.js`
Expected: PASS（全部测试 fail 0）。

- [ ] **Step 5: 提交**

```bash
git add js/core.js tests/core.test.js
git commit -m "feat(core): getRelations 解析正向/反向/悬空关联"
```

---

### Task 4: core.js — searchEntries（全局搜索）

**Files:**
- Modify: `js/core.js`
- Test: `tests/core.test.js`

- [ ] **Step 1: 追加失败测试**

在 `tests/core.test.js` 末尾（`module.exports` 之前）追加：
```js
test('searchEntries 匹配名称/拉丁名/小节正文，且大小写不敏感', () => {
  const db = fixture();
  assert.deepStrictEqual(Core.searchEntries(db, '脓肿').map(r => r.id), ['m1']);
  assert.deepStrictEqual(Core.searchEntries(db, 'staph').map(r => r.id), ['m1']);
  assert.deepStrictEqual(Core.searchEntries(db, '苯唑').map(r => r.id), ['a1']);
});

test('searchEntries 空查询返回空数组', () => {
  assert.deepStrictEqual(Core.searchEntries(fixture(), '   '), []);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/core.test.js`
Expected: FAIL — `Core.searchEntries is not a function`。

- [ ] **Step 3: 实现 searchEntries**

在 `js/core.js` 的 `getRelations` 之后加入：
```js
  function searchEntries(db, query) {
    var q = (query || '').trim().toLowerCase();
    if (!q) { return []; }
    var results = [];
    MODULE_KEYS.forEach(function (mod) {
      (db[mod] || []).forEach(function (entry) {
        var hay = [entry.名称 || '', entry.拉丁名 || ''];
        (entry.小节 || []).forEach(function (s) { hay.push(s.正文 || ''); });
        var matched = hay.some(function (text) {
          return String(text).toLowerCase().indexOf(q) !== -1;
        });
        if (matched) { results.push({ id: entry.id, 名称: entry.名称, module: mod }); }
      });
    });
    return results;
  }
```
并在 `return { ... }` 中加入 `searchEntries: searchEntries,`。

- [ ] **Step 4: 运行测试确认通过**

Run: `node --test tests/core.test.js`
Expected: PASS（fail 0）。

- [ ] **Step 5: 提交**

```bash
git add js/core.js tests/core.test.js
git commit -m "feat(core): searchEntries 全局搜索"
```

---

### Task 5: core.js — validateData（数据自检）

**Files:**
- Modify: `js/core.js`
- Test: `tests/core.test.js`

- [ ] **Step 1: 追加失败测试**

在 `tests/core.test.js` 末尾（`module.exports` 之前）追加：
```js
function categoriesFixture() {
  return {
    microbes: [{ 名称: '细菌', 子类: [{ 名称: '革兰氏阳性球菌' }] }],
    antibiotics: [{ 名称: '抑制细胞壁合成', 子类: [{ 名称: 'β-内酰胺类' }] }],
    resistance: [{ 名称: '靶位改变', 子类: [{ 名称: 'PBP改变' }] }]
  };
}

test('validateData 在干净数据上返回空数组', () => {
  assert.deepStrictEqual(Core.validateData(fixture(), categoriesFixture()), []);
});

test('validateData 检出重复 id / 悬空关联 / 未匹配分类', () => {
  const db = fixture();
  db.antibiotics.push({ id: 'm1', 名称: '冒名', 类别: 'β-内酰胺类', 小节: [], 关联: [] }); // 重复 id
  db.resistance[0].关联 = ['ghost'];   // 悬空关联
  db.microbes[0].类别 = '不存在的类';   // 未匹配分类
  const problems = Core.validateData(db, categoriesFixture());
  assert.ok(problems.some(p => p.indexOf('重复的 id') !== -1));
  assert.ok(problems.some(p => p.indexOf('悬空关联') !== -1));
  assert.ok(problems.some(p => p.indexOf('未匹配分类') !== -1));
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/core.test.js`
Expected: FAIL — `Core.validateData is not a function`。

- [ ] **Step 3: 实现 validateData**

在 `js/core.js` 的 `searchEntries` 之后加入：
```js
  function leafNames(categories, moduleKey) {
    var leaves = {};
    var groups = (categories && categories[moduleKey]) ? categories[moduleKey] : [];
    groups.forEach(function (group) {
      (group.子类 || []).forEach(function (leaf) { leaves[leaf.名称] = true; });
    });
    return leaves;
  }

  function validateData(db, categories) {
    var problems = [];
    var idCount = {};
    MODULE_KEYS.forEach(function (mod) {
      (db[mod] || []).forEach(function (entry) {
        idCount[entry.id] = (idCount[entry.id] || 0) + 1;
      });
    });
    Object.keys(idCount).forEach(function (id) {
      if (idCount[id] > 1) {
        problems.push('重复的 id：' + id + '（出现 ' + idCount[id] + ' 次）');
      }
    });

    var index = buildIndex(db);
    MODULE_KEYS.forEach(function (mod) {
      var leaves = leafNames(categories, mod);
      (db[mod] || []).forEach(function (entry) {
        (entry.关联 || []).forEach(function (rid) {
          if (!index[rid]) {
            problems.push('悬空关联：' + entry.id + ' → ' + rid + '（目标不存在）');
          }
        });
        if (entry.类别 && !leaves[entry.类别]) {
          problems.push('未匹配分类：' + entry.id + ' 的类别 “' + entry.类别 + '” 不在分类树中');
        }
      });
    });
    return problems;
  }
```
并在 `return { ... }` 中加入 `validateData: validateData`。

- [ ] **Step 4: 运行测试确认通过**

Run: `node --test tests/core.test.js`
Expected: PASS（fail 0）。

- [ ] **Step 5: 提交**

```bash
git add js/core.js tests/core.test.js
git commit -m "feat(core): validateData 检测重复id/悬空关联/未匹配分类"
```

---

### Task 6: view.js — moduleLabel / detailVM（详情视图模型）

**Files:**
- Create: `js/view.js`
- Test: `tests/view.test.js`

- [ ] **Step 1: 写失败测试**

Create `tests/view.test.js`:
```js
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const View = require('../js/view.js');

test('moduleLabel 返回中文标签', () => {
  assert.strictEqual(View.moduleLabel('microbes'), '微生物');
  assert.strictEqual(View.moduleLabel('antibiotics'), '抗生素');
  assert.strictEqual(View.moduleLabel('resistance'), '耐药');
});

test('detailVM 为空条目时返回 null', () => {
  assert.strictEqual(View.detailVM(null, []), null);
});

test('detailVM 组装标题/类别/拉丁名/小节/关联（含 href 与 label）', () => {
  const entry = { id: 'm1', 名称: '金葡', 拉丁名: 'Staph', 类别: '革兰氏阳性球菌',
    小节: [{ 标题: '致病性', 正文: '引起脓肿' }], 关联: ['a1'] };
  const rels = [{ id: 'a1', 名称: '苯唑西林', module: 'antibiotics', exists: true, direction: 'forward' }];
  const vm = View.detailVM(entry, rels);
  assert.strictEqual(vm.名称, '金葡');
  assert.strictEqual(vm.类别, '革兰氏阳性球菌');
  assert.strictEqual(vm.拉丁名, 'Staph');
  assert.strictEqual(vm.小节[0].标题, '致病性');
  assert.strictEqual(vm.关联[0].label, '抗生素 · 苯唑西林');
  assert.strictEqual(vm.关联[0].href, '#/antibiotics/a1');
  assert.strictEqual(vm.关联[0].exists, true);
});

test('detailVM 悬空关联：label 带问号、href 为 null', () => {
  const entry = { id: 'm1', 名称: 'x', 类别: 'c', 小节: [], 关联: ['ghost'] };
  const rels = [{ id: 'ghost', 名称: 'ghost', module: null, exists: false, direction: 'forward' }];
  const vm = View.detailVM(entry, rels);
  assert.strictEqual(vm.关联[0].label, 'ghost ?');
  assert.strictEqual(vm.关联[0].href, null);
  assert.strictEqual(vm.关联[0].exists, false);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/view.test.js`
Expected: FAIL — `Cannot find module '../js/view.js'`。

- [ ] **Step 3: 创建 view.js 并实现 moduleLabel + detailVM**

Create `js/view.js`:
```js
(function (factory) {
  'use strict';
  var View = factory();
  if (typeof module !== 'undefined' && module.exports) { module.exports = View; }
  if (typeof window !== 'undefined') { window.View = View; }
})(function () {
  'use strict';

  var MODULE_LABEL = { microbes: '微生物', antibiotics: '抗生素', resistance: '耐药' };

  function moduleLabel(key) { return MODULE_LABEL[key] || '未知'; }

  function detailVM(entry, relations) {
    if (!entry) { return null; }
    return {
      名称: entry.名称,
      类别: entry.类别 || '',
      拉丁名: entry.拉丁名 || '',
      小节: (entry.小节 || []).map(function (s) {
        return { 标题: s.标题 || '', 正文: s.正文 || '' };
      }),
      关联: (relations || []).map(function (r) {
        return {
          id: r.id,
          名称: r.名称,
          module: r.module,
          exists: r.exists,
          label: r.exists ? (moduleLabel(r.module) + ' · ' + r.名称) : (r.id + ' ?'),
          href: r.exists ? ('#/' + r.module + '/' + r.id) : null
        };
      })
    };
  }

  return {
    moduleLabel: moduleLabel,
    detailVM: detailVM
  };
});
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node --test tests/view.test.js`
Expected: PASS（fail 0）。

- [ ] **Step 5: 提交**

```bash
git add js/view.js tests/view.test.js
git commit -m "feat(view): moduleLabel 与 detailVM 详情视图模型"
```

---

### Task 7: view.js — sidebarVM（分类树视图模型 + 未分类兜底）

**Files:**
- Modify: `js/view.js`
- Test: `tests/view.test.js`

- [ ] **Step 1: 追加失败测试**

在 `tests/view.test.js` 末尾追加：
```js
const sidebarCats = { microbes: [{ 名称: '细菌', 子类: [{ 名称: '革兰氏阳性球菌' }, { 名称: '革兰氏阴性杆菌' }] }] };

test('sidebarVM 把条目挂到对应子类，并标注选中与 href', () => {
  const entries = [{ id: 'm1', 名称: '金葡', 类别: '革兰氏阳性球菌' }];
  const vm = View.sidebarVM('microbes', sidebarCats, entries, 'm1');
  const leaf = vm.groups[0].子类[0];
  assert.strictEqual(vm.groups[0].名称, '细菌');
  assert.strictEqual(leaf.名称, '革兰氏阳性球菌');
  assert.strictEqual(leaf.entries[0].href, '#/microbes/m1');
  assert.strictEqual(leaf.entries[0].selected, true);
  assert.deepStrictEqual(vm.未分类, []);
});

test('sidebarVM 把未匹配分类的条目放入 未分类', () => {
  const entries = [{ id: 'x1', 名称: '怪条目', 类别: '查无此类' }];
  const vm = View.sidebarVM('microbes', sidebarCats, entries, null);
  assert.strictEqual(vm.未分类[0].名称, '怪条目');
  assert.strictEqual(vm.未分类[0].selected, false);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/view.test.js`
Expected: FAIL — `View.sidebarVM is not a function`。

- [ ] **Step 3: 实现 sidebarVM**

在 `js/view.js` 的 `detailVM` 之后加入：
```js
  function sidebarVM(moduleKey, categories, entries, selectedId) {
    var groups = (categories && categories[moduleKey]) ? categories[moduleKey] : [];
    var leafSet = {};
    groups.forEach(function (g) {
      (g.子类 || []).forEach(function (l) { leafSet[l.名称] = true; });
    });

    function item(e) {
      return { id: e.id, 名称: e.名称, href: '#/' + moduleKey + '/' + e.id, selected: e.id === selectedId };
    }

    var byCat = {};
    var uncategorized = [];
    (entries || []).forEach(function (e) {
      if (leafSet[e.类别]) { (byCat[e.类别] = byCat[e.类别] || []).push(item(e)); }
      else { uncategorized.push(item(e)); }
    });

    return {
      groups: groups.map(function (g) {
        return {
          名称: g.名称,
          子类: (g.子类 || []).map(function (l) {
            return { 名称: l.名称, entries: byCat[l.名称] || [] };
          })
        };
      }),
      未分类: uncategorized
    };
  }
```
并在 `return { ... }` 中加入 `sidebarVM: sidebarVM,`。

- [ ] **Step 4: 运行测试确认通过**

Run: `node --test tests/view.test.js`
Expected: PASS（fail 0）。

- [ ] **Step 5: 提交**

```bash
git add js/view.js tests/view.test.js
git commit -m "feat(view): sidebarVM 分类树与未分类兜底"
```

---

### Task 8: view.js — searchVM（搜索结果视图模型）

**Files:**
- Modify: `js/view.js`
- Test: `tests/view.test.js`

- [ ] **Step 1: 追加失败测试**

在 `tests/view.test.js` 末尾追加：
```js
test('searchVM 组装查询词与结果项（含 href）', () => {
  const vm = View.searchVM([{ id: 'a1', 名称: '苯唑西林', module: 'antibiotics' }], '苯');
  assert.strictEqual(vm.query, '苯');
  assert.strictEqual(vm.items[0].href, '#/antibiotics/a1');
  assert.strictEqual(vm.items[0].module, 'antibiotics');
  assert.strictEqual(vm.items[0].名称, '苯唑西林');
});

test('searchVM 无结果时 items 为空数组', () => {
  assert.deepStrictEqual(View.searchVM([], '查无').items, []);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/view.test.js`
Expected: FAIL — `View.searchVM is not a function`。

- [ ] **Step 3: 实现 searchVM**

在 `js/view.js` 的 `sidebarVM` 之后加入：
```js
  function searchVM(results, query) {
    return {
      query: query,
      items: (results || []).map(function (r) {
        return { id: r.id, 名称: r.名称, module: r.module, href: '#/' + r.module + '/' + r.id };
      })
    };
  }
```
并在 `return { ... }` 中加入 `searchVM: searchVM`。

- [ ] **Step 4: 运行测试确认通过**

Run: `node --test tests/view.test.js`
Expected: PASS（fail 0）。

- [ ] **Step 5: 提交**

```bash
git add js/view.js tests/view.test.js
git commit -m "feat(view): searchVM 搜索结果视图模型"
```

---

### Task 9: 数据文件 + 数据完整性测试

**Files:**
- Create: `data/categories.js`, `data/microbes.js`, `data/antibiotics.js`, `data/resistance.js`
- Test: `tests/data-integrity.test.js`

- [ ] **Step 1: 写数据完整性测试（先失败）**

Create `tests/data-integrity.test.js`:
```js
'use strict';
const test = require('node:test');
const assert = require('node:assert');

global.window = {};
require('../data/categories.js');
require('../data/microbes.js');
require('../data/antibiotics.js');
require('../data/resistance.js');
const Core = require('../js/core.js');

test('种子数据通过 validateData，无任何问题', () => {
  const db = {
    microbes: global.window.DB.microbes,
    antibiotics: global.window.DB.antibiotics,
    resistance: global.window.DB.resistance
  };
  const problems = Core.validateData(db, global.window.DB.categories);
  assert.deepStrictEqual(problems, [], '发现问题：' + JSON.stringify(problems, null, 2));
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/data-integrity.test.js`
Expected: FAIL — `Cannot find module '../data/categories.js'`。

- [ ] **Step 3: 创建 `data/categories.js`**

```js
window.DB = window.DB || {};
window.DB.categories = {
  microbes: [
    { 名称: '细菌', 子类: [
      { 名称: '革兰氏阳性球菌' }, { 名称: '革兰氏阴性杆菌' },
      { 名称: '革兰氏阳性杆菌' }, { 名称: '分枝杆菌' }, { 名称: '特殊类' }
    ] },
    { 名称: '病毒', 子类: [ { 名称: 'DNA病毒' }, { 名称: 'RNA病毒' } ] },
    { 名称: '真菌', 子类: [ { 名称: '浅部真菌' }, { 名称: '深部真菌' } ] },
    { 名称: '寄生虫', 子类: [ { 名称: '原虫' }, { 名称: '蠕虫' } ] }
  ],
  antibiotics: [
    { 名称: '抑制细胞壁合成', 子类: [ { 名称: 'β-内酰胺类' }, { 名称: '糖肽类' } ] },
    { 名称: '抑制蛋白质合成', 子类: [ { 名称: '氨基糖苷类' }, { 名称: '大环内酯类' }, { 名称: '四环素类' }, { 名称: '林可酰胺类' } ] },
    { 名称: '抑制核酸合成', 子类: [ { 名称: '喹诺酮类' }, { 名称: '利福霉素类' }, { 名称: '硝基咪唑类' } ] },
    { 名称: '抑制叶酸代谢', 子类: [ { 名称: '磺胺类' } ] },
    { 名称: '破坏细胞膜', 子类: [ { 名称: '多肽类' } ] }
  ],
  resistance: [
    { 名称: '产生灭活酶', 子类: [ { 名称: 'β-内酰胺酶' }, { 名称: '氨基糖苷修饰酶' } ] },
    { 名称: '靶位改变', 子类: [ { 名称: 'PBP改变' }, { 名称: '核糖体甲基化' }, { 名称: '糖肽靶位改变' } ] },
    { 名称: '主动外排', 子类: [ { 名称: '外排泵' } ] },
    { 名称: '膜通透性下降', 子类: [ { 名称: '孔蛋白缺失' } ] },
    { 名称: '旁路与其他', 子类: [ { 名称: '旁路代谢' }, { 名称: '生物膜' } ] }
  ]
};
```

- [ ] **Step 4: 创建 `data/microbes.js`**

```js
window.DB = window.DB || {};
window.DB.microbes = [
  {
    id: 'staph-aureus',
    名称: '金黄色葡萄球菌',
    拉丁名: 'Staphylococcus aureus',
    类别: '革兰氏阳性球菌',
    小节: [
      { 标题: '形态与染色', 正文: '（待填）' },
      { 标题: '致病性 / 所致疾病', 正文: '（待填）' }
    ],
    关联: ['oxacillin', 'mrsa-meca']
  },
  {
    id: 'e-coli',
    名称: '大肠埃希菌',
    拉丁名: 'Escherichia coli',
    类别: '革兰氏阴性杆菌',
    小节: [ { 标题: '形态与染色', 正文: '（待填）' } ],
    关联: ['gentamicin']
  }
];
```

- [ ] **Step 5: 创建 `data/antibiotics.js`**

```js
window.DB = window.DB || {};
window.DB.antibiotics = [
  {
    id: 'oxacillin',
    名称: '苯唑西林',
    拉丁名: 'Oxacillin',
    类别: 'β-内酰胺类',
    小节: [
      { 标题: '抗菌谱', 正文: '（待填）' },
      { 标题: '作用机制', 正文: '（待填）' }
    ],
    关联: ['mrsa-meca']
  },
  {
    id: 'vancomycin',
    名称: '万古霉素',
    拉丁名: 'Vancomycin',
    类别: '糖肽类',
    小节: [ { 标题: '作用机制', 正文: '（待填）' } ],
    关联: []
  },
  {
    id: 'gentamicin',
    名称: '庆大霉素',
    拉丁名: 'Gentamicin',
    类别: '氨基糖苷类',
    小节: [ { 标题: '作用机制', 正文: '（待填）' } ],
    关联: []
  }
];
```

- [ ] **Step 6: 创建 `data/resistance.js`**

```js
window.DB = window.DB || {};
window.DB.resistance = [
  {
    id: 'mrsa-meca',
    名称: 'MRSA（mecA / PBP2a）',
    类别: 'PBP改变',
    小节: [ { 标题: '原理', 正文: '（待填）' } ],
    关联: []
  },
  {
    id: 'esbl',
    名称: '超广谱β-内酰胺酶（ESBL）',
    类别: 'β-内酰胺酶',
    小节: [ { 标题: '原理', 正文: '（待填）' } ],
    关联: []
  }
];
```

- [ ] **Step 7: 运行测试确认通过**

Run: `node --test tests/data-integrity.test.js`
Expected: PASS（种子数据 id 唯一、关联均可解析、类别均匹配分类树）。

- [ ] **Step 8: 跑全部测试 + 提交**

Run: `node --test`
Expected: 所有测试通过（fail 0）。
```bash
git add data/ tests/data-integrity.test.js
git commit -m "feat(data): 分类树与占位种子条目 + 数据完整性测试"
```

---

### Task 10: index.html 外壳 + css/styles.css

**Files:**
- Create: `index.html`
- Create: `css/styles.css`

- [ ] **Step 1: 创建 `index.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>微生物学习</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <header class="topbar">
    <div class="brand">🦠 微生物学习</div>
    <nav class="tabs">
      <button class="tab" data-module="microbes">微生物分类</button>
      <button class="tab" data-module="antibiotics">抗生素分类</button>
      <button class="tab" data-module="resistance">耐药因素</button>
    </nav>
    <input id="search-input" class="search" type="search" placeholder="🔍 搜索全部知识点…" autocomplete="off">
  </header>

  <div class="layout">
    <aside id="sidebar" class="sidebar"></aside>
    <main id="main" class="main"></main>
  </div>

  <!-- 数据（定义 window.DB） -->
  <script src="data/categories.js"></script>
  <script src="data/microbes.js"></script>
  <script src="data/antibiotics.js"></script>
  <script src="data/resistance.js"></script>
  <!-- 逻辑 -->
  <script src="js/core.js"></script>
  <script src="js/view.js"></script>
  <script src="js/validate.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建 `css/styles.css`**

```css
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; }
body {
  font-family: -apple-system, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  color: #1e293b; background: #f1f5f9; display: flex; flex-direction: column; height: 100vh;
}

/* 顶栏 */
.topbar { display: flex; align-items: center; gap: 14px; background: #0f766e; color: #fff; padding: 10px 16px; flex-shrink: 0; }
.brand { font-weight: 700; font-size: 16px; white-space: nowrap; }
.tabs { display: flex; gap: 6px; }
.tab { background: transparent; color: #d1fae5; border: none; font-size: 13px; padding: 7px 13px; border-radius: 6px; cursor: pointer; }
.tab:hover { background: #0b5d56; }
.tab.active { background: #fff; color: #0f766e; font-weight: 600; }
.search { margin-left: auto; border: none; border-radius: 6px; padding: 7px 11px; font-size: 13px; min-width: 220px; background: #0b5d56; color: #fff; }
.search::placeholder { color: #a7f3d0; }
.search:focus { outline: 2px solid #5eead4; background: #fff; color: #0f172a; }

/* 布局 */
.layout { display: flex; flex: 1; min-height: 0; }
.sidebar { width: 240px; background: #fff; border-right: 1px solid #e2e8f0; overflow-y: auto; padding: 12px 10px; font-size: 13px; flex-shrink: 0; }
.main { flex: 1; overflow-y: auto; padding: 20px 24px; }

/* 侧栏分类树 */
.cat-group { margin-bottom: 10px; }
.cat-group-name { color: #64748b; font-weight: 700; margin-bottom: 4px; }
.cat-leaf { color: #475569; font-weight: 600; padding: 4px 8px; margin-top: 4px; }
.entry-link { display: block; color: #334155; text-decoration: none; padding: 5px 8px 5px 20px; border-radius: 5px; }
.entry-link:hover { background: #f1f5f9; }
.entry-link.selected { background: #ccfbf1; color: #0f766e; font-weight: 600; }

/* 详情 */
.detail-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.detail-title { font-size: 22px; margin: 0; }
.badge { background: #e0e7ff; color: #4338ca; font-size: 12px; padding: 3px 10px; border-radius: 11px; }
.latin { color: #94a3b8; font-style: italic; margin: 4px 0 16px; }
.section-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px; }
.section-title { font-size: 13px; font-weight: 700; color: #0f766e; margin-bottom: 6px; }
.section-body { color: #334155; line-height: 1.65; white-space: pre-wrap; }

/* 关联 */
.relations { border-top: 1px dashed #cbd5e1; margin-top: 16px; padding-top: 14px; }
.relations-label { font-size: 13px; color: #64748b; margin-bottom: 8px; }
.chips { display: flex; flex-wrap: wrap; gap: 7px; }
.chip { font-size: 12.5px; padding: 5px 11px; border-radius: 13px; text-decoration: none; }
.chip-microbes { background: #dbeafe; color: #1d4ed8; }
.chip-antibiotics { background: #dcfce7; color: #15803d; }
.chip-resistance { background: #fee2e2; color: #b91c1c; }
.chip-missing { background: #f1f5f9; color: #94a3b8; }

/* 搜索结果 */
.search-head { color: #64748b; font-size: 14px; margin-bottom: 12px; }
.search-list { display: flex; flex-direction: column; gap: 6px; }
.search-item { display: block; background: #fff; border: 1px solid #e2e8f0; border-radius: 7px; padding: 9px 12px; text-decoration: none; color: #1e293b; }
.search-item:hover { border-color: #5eead4; }
.tag { font-size: 11px; padding: 2px 8px; border-radius: 9px; margin-right: 6px; }
.tag-microbes { background: #dbeafe; color: #1d4ed8; }
.tag-antibiotics { background: #dcfce7; color: #15803d; }
.tag-resistance { background: #fee2e2; color: #b91c1c; }

/* 空状态 */
.empty { color: #94a3b8; padding: 40px 0; text-align: center; }
.empty-sm { color: #94a3b8; font-size: 13px; }
```

- [ ] **Step 3: 提交**

```bash
git add index.html css/styles.css
git commit -m "feat(ui): 应用外壳与样式"
```

---

### Task 11: js/validate.js（启动自检 → 控制台）

**Files:**
- Create: `js/validate.js`

- [ ] **Step 1: 创建 `js/validate.js`**

```js
(function () {
  'use strict';
  if (typeof window === 'undefined' || !window.Core) { return; }
  var DB = window.DB || {};
  var db = {
    microbes: DB.microbes || [],
    antibiotics: DB.antibiotics || [],
    resistance: DB.resistance || []
  };
  var problems = window.Core.validateData(db, DB.categories || {});
  if (problems.length) {
    console.warn('[数据自检] 发现 ' + problems.length + ' 个问题：');
    problems.forEach(function (p) { console.warn('  • ' + p); });
  } else {
    console.info('[数据自检] 数据正常，未发现问题。');
  }
})();
```

- [ ] **Step 2: 提交**

```bash
git add js/validate.js
git commit -m "feat: 启动时数据自检输出到控制台"
```

（验证留到 Task 13 的手动验收：打开页面看控制台是否打印“数据正常”。）

---

### Task 12: js/app.js（安全 DOM 构建 + hash 路由 + 事件）

`app.js` 用 `createElement` + `textContent` + `setAttribute` + `replaceChildren` 渲染，所有文本经 `textContent` 写入，内容不会被当作标记解析。

**Files:**
- Create: `js/app.js`

- [ ] **Step 1: 创建 `js/app.js`**

```js
(function () {
  'use strict';
  var Core = window.Core, View = window.View;
  var MODULES = Core.MODULE_KEYS;

  function db() {
    var DB = window.DB || {};
    return { microbes: DB.microbes || [], antibiotics: DB.antibiotics || [], resistance: DB.resistance || [] };
  }
  function categories() { return (window.DB && window.DB.categories) || {}; }

  // 安全建节点：文本一律走 textContent
  function el(tag, opts, children) {
    var node = document.createElement(tag);
    opts = opts || {};
    if (opts.cls != null) { node.className = opts.cls; }
    if (opts.text != null) { node.textContent = opts.text; }
    if (opts.href != null) { node.setAttribute('href', opts.href); }
    if (opts.title != null) { node.setAttribute('title', opts.title); }
    (children || []).forEach(function (c) { if (c) { node.appendChild(c); } });
    return node;
  }
  function fill(container, nodes) {
    container.replaceChildren.apply(container, nodes);
  }

  function parseHash() {
    var raw = (location.hash || '').replace(/^#\/?/, '');
    var parts = raw.split('/').filter(Boolean);
    var module = MODULES.indexOf(parts[0]) !== -1 ? parts[0] : MODULES[0];
    return { module: module, id: parts[1] || null };
  }

  function setActiveTab(moduleKey) {
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) {
      t.classList.toggle('active', t.getAttribute('data-module') === moduleKey);
    });
  }

  function buildSidebar(vm) {
    var nodes = [];
    vm.groups.forEach(function (g) {
      var kids = [ el('div', { cls: 'cat-group-name', text: g.名称 }) ];
      g.子类.forEach(function (leaf) {
        kids.push(el('div', { cls: 'cat-leaf', text: leaf.名称 }));
        leaf.entries.forEach(function (e) {
          kids.push(el('a', { cls: 'entry-link' + (e.selected ? ' selected' : ''), text: e.名称, href: e.href }));
        });
      });
      nodes.push(el('div', { cls: 'cat-group' }, kids));
    });
    if (vm.未分类.length) {
      var uc = [ el('div', { cls: 'cat-group-name', text: '未分类' }) ];
      vm.未分类.forEach(function (e) {
        uc.push(el('a', { cls: 'entry-link' + (e.selected ? ' selected' : ''), text: e.名称, href: e.href }));
      });
      nodes.push(el('div', { cls: 'cat-group' }, uc));
    }
    if (!nodes.length) { nodes.push(el('div', { cls: 'empty-sm', text: '（暂无分类）' })); }
    return nodes;
  }

  function buildDetail(vm) {
    if (!vm) { return [ el('div', { cls: 'empty', text: '请选择左侧的一个条目查看详情。' }) ]; }
    var nodes = [];
    var head = [ el('h2', { cls: 'detail-title', text: vm.名称 }) ];
    if (vm.类别) { head.push(el('span', { cls: 'badge', text: vm.类别 })); }
    nodes.push(el('div', { cls: 'detail-head' }, head));
    if (vm.拉丁名) { nodes.push(el('div', { cls: 'latin', text: vm.拉丁名 })); }

    if (vm.小节.length === 0) {
      nodes.push(el('div', { cls: 'empty-sm', text: '（暂无内容小节）' }));
    } else {
      vm.小节.forEach(function (s) {
        nodes.push(el('div', { cls: 'section-card' }, [
          el('div', { cls: 'section-title', text: s.标题 }),
          el('div', { cls: 'section-body', text: s.正文 })
        ]));
      });
    }

    var relKids = [ el('div', { cls: 'relations-label', text: '🔗 关联' }) ];
    if (vm.关联.length === 0) {
      relKids.push(el('span', { cls: 'empty-sm', text: '（暂无关联）' }));
    } else {
      var chips = vm.关联.map(function (r) {
        if (!r.exists) { return el('span', { cls: 'chip chip-missing', text: r.label, title: '目标不存在' }); }
        return el('a', { cls: 'chip chip-' + r.module, text: r.label, href: r.href });
      });
      relKids.push(el('div', { cls: 'chips' }, chips));
    }
    nodes.push(el('div', { cls: 'relations' }, relKids));
    return nodes;
  }

  function buildSearch(vm) {
    var nodes = [ el('div', { cls: 'search-head', text: '搜索：“' + vm.query + '”' }) ];
    if (vm.items.length === 0) {
      nodes.push(el('div', { cls: 'empty', text: '没有找到匹配的条目。' }));
      return nodes;
    }
    var items = vm.items.map(function (r) {
      var link = el('a', { cls: 'search-item', href: r.href }, [
        el('span', { cls: 'tag tag-' + r.module, text: View.moduleLabel(r.module) })
      ]);
      link.appendChild(document.createTextNode(' ' + r.名称));
      return link;
    });
    nodes.push(el('div', { cls: 'search-list' }, items));
    return nodes;
  }

  function renderRoute() {
    var route = parseHash();
    var data = db();
    setActiveTab(route.module);
    fill(document.getElementById('sidebar'), buildSidebar(View.sidebarVM(route.module, categories(), data[route.module], route.id)));

    var entry = null, rels = [];
    if (route.id) {
      var hit = Core.buildIndex(data)[route.id];
      entry = hit ? hit.entry : null;
      rels = entry ? Core.getRelations(route.id, data) : [];
    }
    fill(document.getElementById('main'), buildDetail(View.detailVM(entry, rels)));
  }

  function runSearch(query) {
    fill(document.getElementById('main'), buildSearch(View.searchVM(Core.searchEntries(db(), query), query)));
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) {
      t.addEventListener('click', function () {
        document.getElementById('search-input').value = '';
        location.hash = '#/' + t.getAttribute('data-module');
      });
    });

    var box = document.getElementById('search-input');
    box.addEventListener('input', function () {
      var q = box.value.trim();
      if (q) { runSearch(q); } else { renderRoute(); }
    });

    window.addEventListener('hashchange', function () {
      var s = document.getElementById('search-input');
      if (s.value.trim()) { s.value = ''; }
      renderRoute();
    });

    renderRoute();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

- [ ] **Step 2: 提交**

```bash
git add js/app.js
git commit -m "feat(app): 安全 DOM 渲染、hash 路由与事件绑定"
```

---

### Task 13: 手动验收 + README 收尾 + 最终提交

**Files:**
- Modify: `README.md`（如验收中发现说明缺漏）

- [ ] **Step 1: 跑全部自动化测试**

Run: `node --test`
Expected: 所有测试通过（fail 0）。

- [ ] **Step 2: 用 `file://` 双击打开验收**

在 Finder 双击 `index.html`（或浏览器打开 `file:///Users/juleyang/Desktop/微生物学习软件/index.html`）。逐项核对：

- [ ] 顶部三个标签可切换；当前标签高亮（active）。
- [ ] 默认进入“微生物分类”，左侧显示完整分类树骨架。
- [ ] 点击左侧“金黄色葡萄球菌”，右侧显示标题、`革兰氏阳性球菌` 徽章、拉丁名、两张小节卡片。
- [ ] 该条目底部“🔗 关联”出现绿色“抗生素 · 苯唑西林”和红色“耐药 · MRSA…”标签。
- [ ] 点击“抗生素 · 苯唑西林”跳转到该抗生素；其关联里**反向**出现蓝色“微生物 · 金黄色葡萄球菌”。
- [ ] 顶部搜索“葡萄球菌”或“苯唑”→ 主区出现结果列表，点击可跳转。
- [ ] 切换标签时搜索框清空、回到该模块分类树。
- [ ] 浏览器控制台打印 `[数据自检] 数据正常，未发现问题。`
- [ ] 浏览器地址栏 hash 形如 `#/microbes/staph-aureus`；刷新后停留在同一条目。

> 若任一项不符：定位到对应文件（路由/事件看 `js/app.js`；视图模型看 `js/view.js` 并补单测；样式看 `css/styles.css`），修复后回到 Step 1 重跑。

- [ ] **Step 3: 按需补充 README**

若验收中发现使用说明有缺漏，更新 `README.md` 对应段落。

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "chore: 手动验收通过，框架完成"
```

---

## Self-Review（计划自检）

**Spec coverage（对照设计文档逐条）：**
- 三大模块导航 → Task 10（标签）+ Task 12（切换路由）✓
- 统一数据模型 → Task 9（数据）+ 约定章节 ✓
- 跨模块关联（声明一次、两边显示） → Task 3 `getRelations` ✓
- 顶部模块切换 + 全局搜索 → Task 10 + Task 12 + Task 4/8 ✓
- 左侧分类树 → Task 7 `sidebarVM` + Task 12 `buildSidebar` ✓
- 右侧详情（小节卡片 + 关联标签） → Task 6 `detailVM` + Task 12 `buildDetail` ✓
- hash 路由 → Task 12 `parseHash` ✓
- `file://` 双击可用（不用 fetch/模块） → 全程 `<script>` + 全局 `window.DB` ✓
- 数据自检（控制台） → Task 5 `validateData` + Task 11 `validate.js` ✓
- 悬空关联灰显、未匹配分类归“未分类”、空状态 → Task 6/7（VM）+ Task 12（DOM）✓
- XSS 安全（内容不被当作标记） → Task 12 全程 `textContent`/`createElement` ✓
- 测试策略（自检 + 手动清单） → Task 9 数据完整性测试 + Task 13 手动清单 ✓
- 占位种子条目 → Task 9 ✓

**Placeholder scan：** 计划内无 TODO/TBD；每个代码步骤均给出完整代码（数据 `小节.正文` 中的“（待填）”是**内容占位**，非计划占位，符合“先放占位条目”的范围）。

**Type/命名一致性：** `MODULE_KEYS`、`buildIndex`、`getRelations`、`searchEntries`、`validateData`、`moduleLabel`、`detailVM`、`sidebarVM`、`searchVM` 在 core/view/app/validate 各处签名与调用一致；视图模型字段（`groups/子类/entries/未分类`、`关联[].label/href/exists`、`items[].href`）与 `app.js` 的 `buildSidebar/buildDetail/buildSearch` 消费方式一致；DOM 元素 id（`sidebar`/`main`/`search-input`）、CSS 类名（`tab/active/entry-link/selected/chip-<module>/tag-<module>`）在 html/css/app 间一致。

**Scope：** 单一应用、单一计划即可产出可运行可测试的框架；自测/编辑器等非目标未纳入。
