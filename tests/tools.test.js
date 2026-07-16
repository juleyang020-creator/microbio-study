'use strict';
const test = require('node:test');
const assert = require('node:assert');

global.window = global.window || {};
global.window.DB = global.window.DB || {};
require('../data/categories.js');
require('../data/microbes.js');
require('../data/antibiotics.js');
require('../data/resistance.js');
require('../data/biochem.js');
require('../data/differential.js');
require('../data/morphology.js');
require('../data/idcards.js');
require('../data/cards.js');
require('../data/tests.js');
require('../data/media.js');
require('../data/staining.js');
require('../data/structures.js');
require('../data/breakpoints.js');
require('../data/biochem-tests.js');
require('../data/ast-alerts.js');
const Core = require('../js/core.js');
const View = require('../js/view.js');

const db = () => ({
  microbes: global.window.DB.microbes,
  antibiotics: global.window.DB.antibiotics,
  resistance: global.window.DB.resistance,
  idcards: global.window.DB.idcards,
  cards: global.window.DB.cards,
  tests: global.window.DB.tests,
  media: global.window.DB.media,
  staining: global.window.DB.staining,
  'biochem-tests': global.window.DB.biochemTests
});

// ===== 天然耐药速查 =====
test('intrinsicVM 返回所有有天然耐药字段的微生物', () => {
  const vm = View.intrinsicVM(db(), '');
  const directCount = global.window.DB.microbes.filter((m) => m.天然耐药 && String(m.天然耐药).length).length;
  assert.strictEqual(vm.count, directCount);
  assert.ok(vm.count > 0, '应有天然耐药条目');
  const groupSum = vm.groups.reduce((s, g) => s + g.items.length, 0);
  assert.strictEqual(groupSum, vm.count, '分组求和应等于总数');
});

test('intrinsicVM 按药名子串过滤', () => {
  const vm = View.intrinsicVM(db(), '氨苄西林');
  assert.ok(vm.count > 0);
  vm.groups.forEach((g) => {
    g.items.forEach((it) => {
      assert.ok(it.天然耐药.indexOf('氨苄西林') !== -1, '过滤结果应含关键字');
    });
  });
});

test('intrinsicVM 无匹配返回空', () => {
  const vm = View.intrinsicVM(db(), '___不存在的菌名___');
  assert.strictEqual(vm.count, 0);
  assert.strictEqual(vm.groups.length, 0);
});

// ===== 关系图构建 =====
test('buildGraph 找不到中心返回 null', () => {
  assert.strictEqual(Core.buildGraph(db(), 'microbes', '___none___', 1), null);
});

test('buildGraph 中心节点 level=0，关联节点 level=1', () => {
  const g = Core.buildGraph(db(), 'microbes', 'staph-aureus', 1);
  assert.ok(g);
  assert.strictEqual(g.center.id, 'staph-aureus');
  const center = g.nodes.find((n) => n.id === 'staph-aureus');
  assert.ok(center);
  assert.strictEqual(center.level, 0);
  // 应有至少一个一级关联
  const l1 = g.nodes.filter((n) => n.level === 1);
  assert.ok(l1.length > 0, '应有一级关联节点');
});

test('buildGraph depth=2 时节点不少于 depth=1', () => {
  const g1 = Core.buildGraph(db(), 'microbes', 'staph-aureus', 1);
  const g2 = Core.buildGraph(db(), 'microbes', 'staph-aureus', 2);
  assert.ok(g2.nodes.length >= g1.nodes.length, 'depth=2 应至少与 depth=1 相同');
  // 二级节点应存在
  const l2 = g2.nodes.filter((n) => n.level === 2);
  // 视数据而定，可能为 0；但若 g2 多于 g1，多出的应为 level=2
  if (g2.nodes.length > g1.nodes.length) {
    assert.ok(l2.length > 0, '若 depth=2 节点更多，则应有二级节点');
  }
});

test('buildGraph 边去重：一对节点只算一条边', () => {
  const g = Core.buildGraph(db(), 'microbes', 'staph-aureus', 1);
  const seen = new Set();
  g.edges.forEach((e) => {
    const key = [e.from, e.to].sort().join('|');
    assert.ok(!seen.has(key), '重复边：' + key);
    seen.add(key);
  });
});

test('graphLayoutVM 中心位于画布中心，一级节点在圆周上', () => {
  const g = Core.buildGraph(db(), 'microbes', 'staph-aureus', 1);
  const layout = View.graphLayoutVM(g, 600, 600);
  assert.ok(layout);
  assert.strictEqual(layout.center.x, 300);
  assert.strictEqual(layout.center.y, 300);
  const l1 = layout.nodes.filter((n) => n.level === 1);
  l1.forEach((n) => {
    const d = Math.hypot(n.x - 300, n.y - 300);
    // 一级圆半径 ≈ 600*0.30 = 180
    assert.ok(Math.abs(d - 180) < 1, '一级节点应在半径 180 的圆上，实际距离 ' + d);
  });
});

// ===== 折点解析 =====
test('parseBP 解析 ≤ / ≥ / 区间 / 单值 / 无折点', () => {
  assert.deepStrictEqual(View.parseBP('≤0.06'), { type: 'le', val: 0.06 });
  assert.deepStrictEqual(View.parseBP('≥2'), { type: 'ge', val: 2 });
  assert.deepStrictEqual(View.parseBP('0.12–1'), { type: 'range', lo: 0.12, hi: 1 });
  assert.deepStrictEqual(View.parseBP('0.12-1'), { type: 'range', lo: 0.12, hi: 1 });
  assert.deepStrictEqual(View.parseBP('32/4–64/4'), { type: 'range', lo: 32, hi: 64 });
  assert.deepStrictEqual(View.parseBP('1/19–2/38'), { type: 'range', lo: 1, hi: 2 });
  assert.deepStrictEqual(View.parseBP('16'), { type: 'value', val: 16 });
  assert.strictEqual(View.parseBP('—'), null);
  assert.strictEqual(View.parseBP(''), null);
  assert.strictEqual(View.parseBP(null), null);
});

test('parseBP 去掉尾部括注', () => {
  assert.deepStrictEqual(View.parseBP('16/4 (SDD)'), { type: 'value', val: 16 });
  assert.deepStrictEqual(View.parseBP('4–8 (SDD)'), { type: 'range', lo: 4, hi: 8 });
});

// ===== MIC 判读 =====
test('judgeMIC 标准 S/I/R 折点判读', () => {
  // 头孢曲松：S≤1 / I=2 / R≥4
  const r1 = View.judgeMIC(0.5, '≤1', '2', '≥4');
  assert.strictEqual(r1.result, 'S');
  const r2 = View.judgeMIC(2, '≤1', '2', '≥4');
  assert.strictEqual(r2.result, 'I');
  const r3 = View.judgeMIC(8, '≤1', '2', '≥4');
  assert.strictEqual(r3.result, 'R');
});

test('judgeMIC 区间型 I（如 0.12–1）', () => {
  // 青霉素（链球菌）：S≤0.06 / I=0.12–1 / R≥2
  const r = View.judgeMIC(0.5, '≤0.06', '0.12–1', '≥2');
  assert.strictEqual(r.result, 'I');
});

test('judgeMIC 复方药按主药数值判读斜线区间', () => {
  assert.strictEqual(View.judgeMIC(64, '≤16/4', '32/4–64/4', '≥128/4').result, 'I');
  assert.strictEqual(View.judgeMIC(1.5, '≤0.5/9.5', '1/19–2/38', '≥4/76').result, 'I');
});

test('judgeMIC 边界值：恰好等于阈值', () => {
  // S≤1：val=1 应为 S
  const r = View.judgeMIC(1, '≤1', '2', '≥4');
  assert.strictEqual(r.result, 'S');
  // R≥4：val=4 应为 R
  const r2 = View.judgeMIC(4, '≤1', '2', '≥4');
  assert.strictEqual(r2.result, 'R');
});

test('judgeMIC 黏菌素无 S 折点（仅 I≤2 / R≥4）', () => {
  // val=1 → I（≤2）
  const r = View.judgeMIC(1, '—', '≤2', '≥4');
  assert.strictEqual(r.result, 'I');
  // val=3 → 介于 I 与 R 之间，无 S；落在 range 之外，应为 unknown
  const r2 = View.judgeMIC(3, '—', '≤2', '≥4');
  // val=3 不满足任何条件
  assert.ok(r2.result === 'unknown' || r2.result === 'R', 'val=3 应为 unknown 或 R');
});

test('judgeMIC 无效输入', () => {
  assert.strictEqual(View.judgeMIC('abc', '≤1', '2', '≥4').result, 'invalid');
  assert.strictEqual(View.judgeMIC(-1, '≤1', '2', '≥4').result, 'invalid');
});

test('judgeMIC：仅敏感折点时高于折点判为 NS，完全无折点判为 unknown', () => {
  // 仅设敏感折点 S≤0.12（I/R 均 —）：MIC 4 高于折点 → 非敏感 NS（CLSI nonsusceptible），不判为耐药
  const ns = View.judgeMIC(4, '≤0.12', '—', '—');
  assert.strictEqual(ns.result, 'NS');
  assert.notStrictEqual(ns.result, 'R');
  // 敏感折点以内仍判 S
  assert.strictEqual(View.judgeMIC(0.06, '≤0.12', '—', '—').result, 'S');
  // 三段折点全缺 → 无法判读 unknown
  assert.strictEqual(View.judgeMIC(4, '—', '—', '—').result, 'unknown');
});

// ===== 折点查询 =====
test('breakpointLookupVM 按菌组名过滤', () => {
  const all = View.breakpointLookupVM(global.window.DB.breakpoints, '', '');
  assert.ok(all.length > 0);
  const filtered = View.breakpointLookupVM(global.window.DB.breakpoints, '肠杆菌', '');
  assert.ok(filtered.length > 0);
  filtered.forEach((g) => {
    assert.ok(g.菌组名.indexOf('肠杆菌') !== -1);
  });
});

test('breakpointLookupVM 按药物名过滤并返回完整药物对象', () => {
  const filtered = View.breakpointLookupVM(global.window.DB.breakpoints, '', '头孢曲松');
  assert.ok(filtered.length > 0);
  filtered.forEach((g) => {
    g.药物.forEach((d) => {
      assert.ok(d.药物.indexOf('头孢曲松') !== -1 || d.简写.toLowerCase().indexOf('头孢曲松') !== -1);
    });
  });
});

test('breakpointLookupVM 药物过滤后空组被剔除', () => {
  const filtered = View.breakpointLookupVM(global.window.DB.breakpoints, '', '__不存在的药__');
  filtered.forEach((g) => {
    assert.ok(g.药物.length > 0, '过滤后不应有空的药物组');
  });
});

test('judgeableBreakpointGroups 排除历史或已撤销折点', () => {
  const groups = View.judgeableBreakpointGroups(global.window.DB.breakpoints);
  assert.ok(groups.length > 0);
  assert.ok(!groups.some((g) => /B\. cepacia|已撤销|历史参考/.test(g.菌组名 + ' ' + (g.备注 || ''))));
  groups.forEach((g) => {
    g.药物.forEach((d) => assert.ok(!/已撤销|历史参考/.test(String(d.备注 || ''))));
  });
});

// ===== 异常药敏 / 修正规则 =====
test('astAlertsVM 返回异常药敏规则并按类别分组', () => {
  const vm = View.astAlertsVM(global.window.DB.astAlerts, { filter: '', level: 'all' });
  assert.strictEqual(vm.count, global.window.DB.astAlerts.length);
  assert.ok(vm.count >= 10, '应有常见异常药敏规则');
  assert.ok(vm.groups.length > 0, '应按类别分组');
  const groupSum = vm.groups.reduce((sum, g) => sum + g.items.length, 0);
  assert.strictEqual(groupSum, vm.count);
});

test('astAlertsVM 支持按等级与关键词筛选', () => {
  const critical = View.astAlertsVM(global.window.DB.astAlerts, { filter: '', level: '必须修正' });
  assert.ok(critical.count > 0);
  critical.groups.forEach((g) => {
    g.items.forEach((it) => assert.strictEqual(it.等级, '必须修正'));
  });

  const mrsa = View.astAlertsVM(global.window.DB.astAlerts, { filter: 'mecA', level: 'all' });
  assert.ok(mrsa.count > 0);
  assert.ok(mrsa.groups.some((g) => g.items.some((it) => it.id === 'mrsa-beta-lactam')));
});
