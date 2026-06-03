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
const Core = require('../js/core.js');
const View = require('../js/view.js');
const fs = require('node:fs');
const path = require('node:path');

test('种子数据通过 validateData，无任何问题', () => {
  const db = {
    microbes: global.window.DB.microbes,
    antibiotics: global.window.DB.antibiotics,
    resistance: global.window.DB.resistance
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
