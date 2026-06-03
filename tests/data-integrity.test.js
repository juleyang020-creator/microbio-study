'use strict';
const test = require('node:test');
const assert = require('node:assert');

global.window = {};
require('../data/categories.js');
require('../data/microbes.js');
require('../data/antibiotics.js');
require('../data/resistance.js');
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
