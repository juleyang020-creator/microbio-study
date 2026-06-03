'use strict';
const test = require('node:test');
const assert = require('node:assert');
const View = require('../js/view.js');

test('moduleLabel 返回中文标签', () => {
  assert.strictEqual(View.moduleLabel('microbes'), '微生物');
  assert.strictEqual(View.moduleLabel('antibiotics'), '抗微生物药');
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
  assert.strictEqual(vm.关联[0].label, '抗微生物药 · 苯唑西林');
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

test('sidebarVM 把条目挂到对应叶子，并标注选中与 href', () => {
  const entries = [{ id: 'm1', 名称: '金葡', 类别: '革兰氏阳性球菌' }];
  const vm = View.sidebarVM('microbes', sidebarCats, entries, 'm1');
  const group = vm.tree[0];
  assert.strictEqual(group.名称, '细菌');
  const leaf = group.children[0];
  assert.strictEqual(leaf.名称, '革兰氏阳性球菌');
  assert.strictEqual(leaf.entries[0].href, '#/microbes/m1');
  assert.strictEqual(leaf.entries[0].selected, true);
  assert.deepStrictEqual(vm.未分类, []);
});

test('sidebarVM 支持属级（多级）分类，菌种挂到属下', () => {
  const cats = { microbes: [
    { 名称: '细菌', 子类: [
      { 名称: '革兰氏阳性球菌', 子类: [{ 名称: '葡萄球菌属' }, { 名称: '链球菌属' }] }
    ] }
  ] };
  const entries = [{ id: 'sa', 名称: '金黄色葡萄球菌', 类别: '葡萄球菌属' }];
  const vm = View.sidebarVM('microbes', cats, entries, 'sa');
  const genus = vm.tree[0].children[0].children[0]; // 细菌 → 革兰氏阳性球菌 → 葡萄球菌属
  assert.strictEqual(genus.名称, '葡萄球菌属');
  assert.strictEqual(genus.entries[0].名称, '金黄色葡萄球菌');
  assert.strictEqual(genus.entries[0].selected, true);
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

const abxCats = { antibiotics: [
  { 名称: '抑制细胞壁合成', 子类: [{ 名称: '青霉素类' }, { 名称: '头孢菌素类' }] },
  { 名称: '抑制蛋白质合成', 子类: [{ 名称: '大环内酯类' }] }
] };

test('detailVM 暴露药敏简写/机制图/生化反应', () => {
  const entry = { id: 'cro', 名称: '头孢曲松', 类别: '头孢菌素类', 药敏简写: 'CRO', 小节: [], 关联: [] };
  const vm = View.detailVM(entry, [], { mechanismImage: 'img/mechanism-cellwall.svg', biochem: [{ 项目: '氧化酶', 结果: '−' }] });
  assert.strictEqual(vm.药敏简写, 'CRO');
  assert.strictEqual(vm.机制图, 'img/mechanism-cellwall.svg');
  assert.strictEqual(vm.生化反应[0].项目, '氧化酶');
});

test('detailVM 暴露鉴别', () => {
  const vm = View.detailVM({ 名称: 'x', 类别: 'c', 小节: [], 关联: [] }, [], { differential: [{ 名称: 'y', id: 'yy', 相似点: 'a', 鉴别: 'b' }] });
  assert.strictEqual(vm.鉴别[0].名称, 'y');
  assert.strictEqual(vm.鉴别[0].id, 'yy');
});

test('detailVM 无 extras 时默认空值', () => {
  const vm = View.detailVM({ 名称: 'x', 类别: 'c', 小节: [], 关联: [] }, []);
  assert.strictEqual(vm.药敏简写, '');
  assert.strictEqual(vm.机制图, null);
  assert.deepStrictEqual(vm.生化反应, []);
});

test('mechanismImageFor 按抗生素类别映射到机制图', () => {
  assert.strictEqual(View.mechanismImageFor('antibiotics', { 类别: '头孢菌素类' }, abxCats), 'img/mechanism-cellwall.svg');
  assert.strictEqual(View.mechanismImageFor('antibiotics', { 类别: '大环内酯类' }, abxCats), 'img/mechanism-protein.svg');
});

test('mechanismImageFor 抗真菌药按类别映射到各自机制图', () => {
  const cats = { antibiotics: [
    { 名称: '抗真菌药', 子类: [{ 名称: '唑类' }, { 名称: '多烯类' }, { 名称: '棘白菌素类' }, { 名称: '嘧啶类似物' }] }
  ] };
  assert.strictEqual(View.mechanismImageFor('antibiotics', { 类别: '唑类' }, cats), 'img/mechanism-azole.svg');
  assert.strictEqual(View.mechanismImageFor('antibiotics', { 类别: '棘白菌素类' }, cats), 'img/mechanism-echinocandin.svg');
});

test('mechanismImageFor 对非抗生素或未知类别返回 null', () => {
  assert.strictEqual(View.mechanismImageFor('microbes', { 类别: '革兰氏阳性球菌' }, abxCats), null);
  assert.strictEqual(View.mechanismImageFor('antibiotics', { 类别: '查无此类' }, abxCats), null);
  assert.strictEqual(View.mechanismImageFor('antibiotics', null, abxCats), null);
});
