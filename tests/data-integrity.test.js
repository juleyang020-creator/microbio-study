'use strict';
const test = require('node:test');
const assert = require('node:assert');

global.window = {};
require('../data/categories.js');
require('../data/microbes.js');
require('../data/antibiotics.js');
require('../data/resistance.js');
require('../data/biochem.js');
require('../data/differential.js');
require('../data/morphology.js');
require('../data/cards.js');
require('../data/tests.js');
require('../data/media.js');
require('../data/staining.js');
require('../data/structures.js');
const Core = require('../js/core.js');
const View = require('../js/view.js');
const fs = require('node:fs');
const path = require('node:path');

test('种子数据通过 validateData，无任何问题', () => {
  const db = {
    microbes: global.window.DB.microbes,
    antibiotics: global.window.DB.antibiotics,
    resistance: global.window.DB.resistance,
    cards: global.window.DB.cards,
    tests: global.window.DB.tests,
    media: global.window.DB.media,
    staining: global.window.DB.staining
  };
  const problems = Core.validateData(db, global.window.DB.categories);
  assert.deepStrictEqual(problems, [], '发现问题：' + JSON.stringify(problems, null, 2));
});

test('生化反应的键均为存在的微生物 id', () => {
  const ids = {};
  global.window.DB.microbes.forEach((m) => { ids[m.id] = true; });
  Object.keys(global.window.DB.biochem || {}).forEach((k) => {
    assert.ok(ids[k], '生化反应引用了不存在的微生物 id：' + k);
  });
});

test('鉴别数据的键与引用 id 均为存在的微生物', () => {
  const ids = {};
  global.window.DB.microbes.forEach((m) => { ids[m.id] = true; });
  Object.keys(global.window.DB.differential || {}).forEach((k) => {
    assert.ok(ids[k], '鉴别引用了不存在的微生物 id（键）：' + k);
    global.window.DB.differential[k].forEach((d) => {
      if (d.id) { assert.ok(ids[d.id], '鉴别项引用了不存在的 id：' + d.id + '（在 ' + k + '）'); }
    });
  });
});

test('形态数据的键均为存在的微生物 id', () => {
  const ids = {};
  global.window.DB.microbes.forEach((m) => { ids[m.id] = true; });
  Object.keys(global.window.DB.morphology || {}).forEach((k) => {
    assert.ok(ids[k], '形态引用了不存在的微生物 id：' + k);
  });
});

test('每个抗生素都有药敏简写', () => {
  global.window.DB.antibiotics.forEach((a) => {
    assert.ok(a.药敏简写 && a.药敏简写.length, '缺少药敏简写：' + a.id);
  });
});

function isAntifungal(a, cats) {
  const g = (cats.antibiotics || []).find((grp) => grp.名称 === '抗真菌药');
  return !!(g && (g.子类 || []).some((l) => l.名称 === a.类别));
}

test('抗细菌药均映射到存在的机制图；抗真菌药可无图', () => {
  const cats = global.window.DB.categories;
  global.window.DB.antibiotics.forEach((a) => {
    const img = View.mechanismImageFor('antibiotics', a, cats);
    if (isAntifungal(a, cats)) {
      if (img) { assert.ok(fs.existsSync(path.join(__dirname, '..', img)), '机制图文件缺失：' + img); }
    } else {
      assert.ok(img, '无机制图映射：' + a.id + '（类别 ' + a.类别 + '）');
      assert.ok(fs.existsSync(path.join(__dirname, '..', img)), '机制图文件缺失：' + img);
    }
  });
});

test('每个耐药机制都映射到存在的机制图', () => {
  const cats = global.window.DB.categories;
  global.window.DB.resistance.forEach((r) => {
    const img = View.mechanismImageFor('resistance', r, cats);
    assert.ok(img, '无机制图映射：' + r.id + '（类别 ' + r.类别 + '）');
    assert.ok(fs.existsSync(path.join(__dirname, '..', img)), '机制图文件缺失：' + img);
  });
});

test('每个试验都映射到存在的示意图', () => {
  global.window.DB.tests.forEach((t) => {
    const img = View.mechanismImageFor('tests', t, global.window.DB.categories);
    assert.ok(img, '无示意图映射：' + t.id);
    assert.ok(fs.existsSync(path.join(__dirname, '..', img)), '示意图文件缺失：' + img);
  });
});

test('分子结构(structures) 的键均为存在的抗微生物药 id', () => {
  const ids = {};
  global.window.DB.antibiotics.forEach((a) => { ids[a.id] = true; });
  Object.keys(global.window.DB.structures || {}).forEach((k) => {
    assert.ok(ids[k], 'structures 引用了不存在的抗微生物药 id：' + k);
    assert.ok((global.window.DB.structures[k] || '').length > 0, 'SMILES 为空：' + k);
    const svg = path.join(__dirname, '..', 'img', 'struct-' + k + '.svg');
    assert.ok(fs.existsSync(svg), '结构式 SVG 缺失：img/struct-' + k + '.svg');
  });
});

test('各模块主界面的总览图均存在', () => {
  [
    'morphology-overview.svg', 'morphology-fungi.svg', 'morphology-virus.svg',
    'landing-antibiotics.svg', 'landing-resistance.svg', 'landing-cards.svg',
    'landing-tests.svg', 'landing-staining.svg', 'landing-media.svg'
  ].forEach((f) => {
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'img', f)), '缺少 img/' + f);
  });
});

test('染色示意图（若有映射）文件均存在', () => {
  global.window.DB.staining.forEach((s) => {
    const img = View.mechanismImageFor('staining', s, global.window.DB.categories);
    if (img) {
      assert.ok(fs.existsSync(path.join(__dirname, '..', img)), '染色示意图文件缺失：' + img);
    }
  });
});

test('每个微生物与耐药机制都能生成综述链接', () => {
  global.window.DB.microbes.forEach((m) => {
    assert.ok(View.referenceLinks('microbes', m).length >= 1, '微生物无综述链接：' + m.id);
  });
  global.window.DB.resistance.forEach((r) => {
    assert.ok(View.referenceLinks('resistance', r).length >= 1, '耐药机制无综述链接：' + r.id);
  });
});
