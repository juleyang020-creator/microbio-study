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
    ],
    'biochem-tests': []
  };
}

function categoriesFixture() {
  return {
    microbes: [{ 名称: '细菌', 子类: [{ 名称: '革兰氏阳性球菌' }] }],
    antibiotics: [{ 名称: '抑制细胞壁合成', 子类: [{ 名称: 'β-内酰胺类' }] }],
    resistance: [{ 名称: '靶位改变', 子类: [{ 名称: 'PBP改变' }] }]
  };
}

test('buildIndex 按 id 索引并标注所属模块', () => {
  const idx = Core.buildIndex(fixture());
  assert.strictEqual(idx['a1'].module, 'antibiotics');
  assert.strictEqual(idx['m1'].module, 'microbes');
  assert.strictEqual(idx['r1'].entry.名称, 'MRSA');
});

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
  assert.strictEqual(r1.direction, 'forward');
  assert.strictEqual(m1.direction, 'reverse');
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

test('searchEntries 匹配名称/拉丁名/小节正文，且大小写不敏感', () => {
  const db = fixture();
  assert.deepStrictEqual(Core.searchEntries(db, '脓肿').map(r => r.id), ['m1']);
  assert.deepStrictEqual(Core.searchEntries(db, 'staph').map(r => r.id), ['m1']);
  assert.deepStrictEqual(Core.searchEntries(db, '苯唑').map(r => r.id), ['a1']);
});

test('searchEntries 匹配类别、药敏简写、药敏卡药物与扩展数据', () => {
  const db = {
    microbes: [{ id: 'm1', 名称: '金葡', 拉丁名: 'Staph', 类别: '葡萄球菌属', 小节: [], 关联: [] }],
    antibiotics: [{ id: 'a1', 名称: '苯唑西林', 药敏简写: 'OXA', 类别: '青霉素类', 小节: [], 关联: [] }],
    resistance: [],
    cards: [{ id: 'c1', 名称: 'GP68', 类别: '链球菌药敏卡', 药物: ['泰利霉素'], 小节: [], 关联: [] }],
    tests: [], media: [], staining: [], 'biochem-tests': [],
    morphology: { m1: { 镜下: '葡萄串状排列' } },
    biochem: { m1: [{ 项目: '血浆凝固酶', 结果: '+' }] }
  };
  assert.deepStrictEqual(Core.searchEntries(db, 'OXA').map(r => r.id), ['a1']);
  assert.deepStrictEqual(Core.searchEntries(db, '泰利霉素').map(r => r.id), ['c1']);
  assert.deepStrictEqual(Core.searchEntries(db, '凝固酶').map(r => r.id), ['m1']);
});

test('searchEntries 空查询返回空数组', () => {
  assert.deepStrictEqual(Core.searchEntries(fixture(), '   '), []);
});

test('validateData 在干净数据上返回空数组', () => {
  assert.deepStrictEqual(Core.validateData(fixture(), categoriesFixture()), []);
});

test('validateData 检出重复 id / 悬空关联 / 未匹配分类', () => {
  const db = fixture();
  db.antibiotics.push({ id: 'm1', 名称: '冒名', 类别: 'β-内酰胺类', 小节: [], 关联: [] });
  db.resistance[0].关联 = ['ghost'];
  db.microbes[0].类别 = '不存在的类';
  const problems = Core.validateData(db, categoriesFixture());
  assert.ok(problems.some(p => p.indexOf('重复的 id') !== -1));
  assert.ok(problems.some(p => p.indexOf('悬空关联') !== -1));
  assert.ok(problems.some(p => p.indexOf('未匹配分类') !== -1));
});

test('validateData 支持多级分类树（属作为最深叶子）', () => {
  const db = {
    microbes: [{ id: 'sa', 名称: '金葡', 类别: '葡萄球菌属', 小节: [], 关联: [] }],
    antibiotics: [], resistance: []
  };
  const cats = {
    microbes: [
      { 名称: '细菌', 子类: [
        { 名称: '革兰氏阳性球菌', 子类: [{ 名称: '葡萄球菌属' }, { 名称: '链球菌属' }] }
      ] }
    ],
    antibiotics: [], resistance: []
  };
  assert.deepStrictEqual(Core.validateData(db, cats), []);
});
