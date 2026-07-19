'use strict';
// 路由冒烟：把 app.js 在最小 DOM stub 里真正跑起来，逐条路由渲染并断言不抛异常。
// 存在的理由：#74 删「关系图」模块时把 GRAPH_COMMON 的定义删了、却漏删生化对比里的引用，
// 'use strict' 下 #/compare 一进就抛 ReferenceError，整个工具不可用——而当时
// 110 个测试全绿、发布检查也全过，因为 tests/ 只覆盖 core/view/数据，从不加载 app.js。
const test = require('node:test');
const assert = require('node:assert');
const { loadApp, goto } = require('./dom-stub.js');

const TOOL_ROUTES = [
  '#/compare', '#/cardcompare', '#/intrinsic', '#/breakpoints',
  '#/ast-alerts', '#/lab-workflow', '#/microbe-names', '#/about'
];

function tryGoto(app, hash) {
  try { goto(app, hash); return null; } catch (e) { return e; }
}

test('全部模块着陆页渲染不抛异常', () => {
  const app = loadApp();
  const fail = [];
  app.win.Core.MODULE_KEYS.forEach((m) => {
    const e = tryGoto(app, '#/' + m);
    if (e) { fail.push('#/' + m + ' → ' + e.message); }
  });
  assert.deepStrictEqual(fail, []);
});

test('全部工具页渲染不抛异常', () => {
  const app = loadApp();
  const fail = [];
  TOOL_ROUTES.forEach((r) => {
    const e = tryGoto(app, r);
    if (e) { fail.push(r + ' → ' + e.message); }
  });
  assert.deepStrictEqual(fail, []);
});

test('全部条目详情页渲染不抛异常', () => {
  const app = loadApp();
  const db = app.win.DB;
  const fail = [];
  let n = 0;
  app.win.Core.MODULE_KEYS.forEach((m) => {
    (db[m] || []).forEach((entry) => {
      n++;
      const e = tryGoto(app, '#/' + m + '/' + entry.id);
      if (e && fail.length < 10) { fail.push('#/' + m + '/' + entry.id + ' → ' + e.message); }
    });
  });
  assert.ok(n > 300, '条目数异常偏少：' + n);
  assert.deepStrictEqual(fail, []);
});

test('未知路由与不存在的条目安全回落', () => {
  const app = loadApp();
  ['#/does-not-exist', '#/microbes/no-such-id', '#/antibiotics/no-such-id', '#/'].forEach((r) => {
    assert.strictEqual(tryGoto(app, r), null, r + ' 应安全回落而非抛异常');
  });
});

test('生化对比：常见菌排在前（GRAPH_COMMON 回归的具体防线）', () => {
  const app = loadApp();
  assert.strictEqual(tryGoto(app, '#/compare'), null, '#/compare 不得抛异常');
  // 侧栏勾选列表必须真的列出了菌，而不是异常后留下的空壳
  const items = app.doc.querySelectorAll('pick-item');
  const sidebar = app.doc.getElementById('sidebar');
  assert.ok(sidebar.textContent.length > 20, '勾选列表为空，渲染中途失败了');
  // 金黄色葡萄球菌应排在冷门菌之前
  const txt = sidebar.textContent;
  const iAureus = txt.indexOf('金黄色葡萄球菌');
  const iSuis = txt.indexOf('猪链球菌');
  assert.ok(iAureus !== -1, '常见菌未出现在勾选列表中');
  if (iSuis !== -1) { assert.ok(iAureus < iSuis, '常见菌应排在冷门菌之前'); }
  assert.ok(items.length >= 0);
});

test('工具页内的按钮逐个点击不抛异常', () => {
  // 渲染路径之外还有一层：事件处理器。悬空引用同样可能藏在只有点了才走到的分支里。
  const app = loadApp();
  const fail = [];
  TOOL_ROUTES.concat(app.win.Core.MODULE_KEYS.map((m) => '#/' + m)).forEach((r) => {
    if (tryGoto(app, r)) { return; }               // 渲染失败的另有断言覆盖
    ['main', 'sidebar'].forEach((cid) => {
      const root = app.doc.getElementById(cid);
      if (!root) { return; }
      root.querySelectorAll('button').forEach((b) => {
        try { b.click(); } catch (e) {
          if (fail.length < 10) { fail.push(r + ' 的按钮「' + b.textContent.slice(0, 12) + '」→ ' + e.message); }
        }
      });
    });
  });
  assert.deepStrictEqual(fail, []);
});

test('搜索渲染不抛异常（含别名词）', () => {
  const app = loadApp();
  const input = app.doc.getElementById('search-input');
  ['mrsa', 'e-coli', '金黄色', 'vre', ''].forEach((q) => {
    input.value = q;
    assert.doesNotThrow(() => { input.dispatch('input', { type: 'input', target: input }); }, '搜索「' + q + '」抛异常');
  });
});
