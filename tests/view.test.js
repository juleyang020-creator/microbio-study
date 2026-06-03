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
