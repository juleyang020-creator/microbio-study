'use strict';
const test = require('node:test');
const assert = require('node:assert');

// 数据文件挂到 global.window.DB 上；这里在文件加载前重置，
// 避免日后与其他 test 文件共享 globalThis 时互相污染。
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
require('../data/ecv.js');
require('../data/qc-strains.js');
require('../data/treatment.js');
const Core = require('../js/core.js');
const View = require('../js/view.js');
const fs = require('node:fs');
const path = require('node:path');

test('种子数据通过 validateData，无任何问题', () => {
  const db = {
    microbes: global.window.DB.microbes,
    antibiotics: global.window.DB.antibiotics,
    resistance: global.window.DB.resistance,
    idcards: global.window.DB.idcards,
    cards: global.window.DB.cards,
    tests: global.window.DB.tests,
    media: global.window.DB.media,
    staining: global.window.DB.staining,
    'biochem-tests': global.window.DB.biochemTests
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

test('折点药物名可跳转到药物或对应试验条目', () => {
  const drugNames = {};
  const aliases = {
    青霉素: true,
    '氨苄西林/阿莫西林': true,
    复方磺胺甲噁唑: true,
    复方新诺明: true
  };
  const testItems = {
    庆大霉素高水平: true,
    链霉素高水平: true
  };
  global.window.DB.antibiotics.forEach((a) => { drugNames[a.名称] = true; });
  (global.window.DB.breakpoints || []).forEach((group) => {
    (group.药物 || []).forEach((d) => {
      const name = String(d.药物 || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
      assert.ok(drugNames[name] || aliases[name] || testItems[name], group.菌组名 + ' 的折点药物无法跳转：' + d.药物);
    });
  });
});

test('药敏卡中的药物名均可跳转到药物或对应试验条目', () => {
  const drugNames = {};
  global.window.DB.antibiotics.forEach((a) => { drugNames[a.名称] = true; });
  const cardTests = {
    ESBL: true,
    头孢西丁筛选: true,
    诱导型克林霉素耐药: true,
    '庆大霉素高水平(协同)': true,
    '链霉素高水平(协同)': true
  };
  global.window.DB.cards.forEach((card) => {
    (card.药物 || []).forEach((name) => {
      assert.ok(drugNames[name] || cardTests[name], card.id + ' 的项目无法跳转：' + name);
    });
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
    'landing-antibiotics.svg', 'landing-resistance.svg', 'landing-idcards.svg', 'landing-cards.svg',
    'landing-tests.svg', 'landing-staining.svg', 'landing-media.svg', 'landing-biochem.svg'
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

test('生化反应示意图（若有映射）文件均存在', () => {
  global.window.DB.biochemTests.forEach((b) => {
    const img = View.mechanismImageFor('biochem-tests', b, global.window.DB.categories);
    if (img) {
      assert.ok(fs.existsSync(path.join(__dirname, '..', img)), '生化反应示意图文件缺失：' + img);
    }
  });
});

test('鉴定卡数据完整：每卡有适用菌关联与小节', () => {
  (global.window.DB.idcards || []).forEach((c) => {
    assert.ok(Array.isArray(c.关联) && c.关联.length > 0, '鉴定卡无关联：' + c.id);
    assert.ok(Array.isArray(c.小节) && c.小节.length > 0, '鉴定卡无小节：' + c.id);
  });
  assert.ok((global.window.DB.idcards || []).length >= 7, '鉴定卡数量不足 7');
});

test('每个微生物与耐药机制都能生成综述链接', () => {
  global.window.DB.microbes.forEach((m) => {
    assert.ok(View.referenceLinks('microbes', m).length >= 1, '微生物无综述链接：' + m.id);
  });
  global.window.DB.resistance.forEach((r) => {
    assert.ok(View.referenceLinks('resistance', r).length >= 1, '耐药机制无综述链接：' + r.id);
  });
});

test('折点数据中引用的菌 id 均存在于微生物数据中', () => {
  const microbeIds = {};
  global.window.DB.microbes.forEach((m) => { microbeIds[m.id] = true; });
  (global.window.DB.breakpoints || []).forEach((group) => {
    (group.菌种 || []).forEach((id) => {
      assert.ok(microbeIds[id], '折点组 “' + group.菌组名 + '” 引用了不存在的微生物 id：' + id);
    });
  });
});

// 关键标准值固定回归测试（防止已修正的转录/映射错误回退）——对照 CLSI 原表
test('关键折点/质控标准值不回退（CLSI 基准）', () => {
  const bp = (id) => (global.window.DB.breakpoints || []).find((g) => (g.菌种 || []).indexOf(id) !== -1);
  const drug = (g, re) => (g.药物 || []).find((d) => re.test(d.药物));
  // M27M44S Table 1 卡泊芬净种特异折点
  const cas = [
    ['candida-albicans', '≤0.25', '0.5', '≥1'],
    ['candida-glabrata', '≤0.12', '0.25', '≥0.5'],
    ['candida-parapsilosis', '≤2', '4', '≥8'],
    ['candida-tropicalis', '≤0.25', '0.5', '≥1'],
    ['candida-krusei', '≤0.25', '0.5', '≥1']
  ];
  cas.forEach(([id, s, i, r]) => {
    const d = drug(bp(id), /Caspofungin/);
    assert.ok(d, id + ' 缺卡泊芬净行');
    assert.strictEqual(d.MIC_S + '/' + d.MIC_I + '/' + d.MIC_R, s + '/' + i + '/' + r, id + ' 卡泊芬净折点错误');
  });
  // 来源不得再出现不存在的 M60 Ed3
  assert.ok(!/M60 Ed3/.test(JSON.stringify(global.window.DB.breakpoints)), '折点来源仍含不存在的 M60 Ed3');
  // M100 Ed36 Table 2B-4 嗜麦芽窄食单胞菌头孢地尔
  const fdc = drug(bp('stenotrophomonas-maltophilia'), /Cefiderocol/);
  assert.ok(fdc && fdc.MIC_S === '≤1' && fdc.抑菌圈_S === '≥17', '嗜麦芽头孢地尔折点缺失/错误');
  // HACEK 组含 Eikenella/Aggregatibacter
  const hacek = (global.window.DB.breakpoints || []).find((g) => /HACEK/.test(g.菌组名));
  assert.ok(hacek && hacek.菌种.indexOf('eikenella-corrodens') !== -1 && hacek.菌种.indexOf('aggregatibacter-actinomycetemcomitans') !== -1, 'HACEK 组未含 Eikenella/Aggregatibacter');
  // 红斑丹毒丝菌 M45 Table 7 组存在
  assert.ok(bp('erysipelothrix-rhusiopathiae'), '红斑丹毒丝菌缺 M45 折点组');
  // M27M44S Table 3 质控：C. parapsilosis ATCC 22019 伏立康唑 24h = 0.016–0.12
  const qc = (global.window.DB['qc-strains'] || []).find((s) => /22019/.test(s.英文 || ''));
  const qv = qc && (qc.质控范围 || []).find((d) => /Voriconazole/.test(d.药物));
  assert.ok(qv && qv.MIC === '0.016–0.12', '22019 伏立康唑质控范围应为 0.016–0.12');
});

test('ECV 数据中引用的菌 id 均存在，且每组有菌种/药物/ECV 值', () => {
  const microbeIds = {};
  global.window.DB.microbes.forEach((m) => { microbeIds[m.id] = true; });
  (global.window.DB.ecv || []).forEach((group) => {
    assert.ok(group.组名 && group.组名.length, 'ECV 组缺少组名');
    assert.ok(group.菌种 && group.菌种.length > 0, 'ECV 组 “' + (group.组名 || '?') + '” 菌种为空');
    assert.ok(group.药物 && group.药物.length > 0, 'ECV 组 “' + group.组名 + '” 药物为空');
    (group.菌种 || []).forEach((id) => {
      assert.ok(microbeIds[id], 'ECV 组 “' + group.组名 + '” 引用了不存在的微生物 id：' + id);
    });
    group.药物.forEach((d) => {
      assert.ok(d.药物 && d.药物.length, 'ECV 组 “' + group.组名 + '” 存在无药物名的条目');
      assert.ok(d.ECV && String(d.ECV).length, 'ECV 组 “' + group.组名 + '” 中 “' + d.药物 + '” 缺少 ECV 值');
    });
  });
});

test('折点数据中每组均有菌种和药物', () => {
  (global.window.DB.breakpoints || []).forEach((group) => {
    assert.ok(group.菌组名 && group.菌组名.length, '折点组缺少菌组名');
    assert.ok(group.菌种 && group.菌种.length > 0, '折点组 “' + (group.菌组名 || '?') + '” 菌种为空');
    assert.ok(group.药物 && group.药物.length > 0, '折点组 “' + group.菌组名 + '” 药物为空');
    group.药物.forEach((d) => {
      assert.ok(d.药物 && d.药物.length, '折点组 “' + group.菌组名 + '” 存在无药物名的条目');
      assert.ok(d.MIC_S || d.MIC_R, '折点组 “' + group.菌组名 + '” 中 “' + d.药物 + '” 缺少 MIC 折点');
    });
  });
});

test('异常药敏速查规则数据完整', () => {
  const rules = global.window.DB.astAlerts || [];
  assert.ok(rules.length > 0, '异常药敏规则为空');
  const ids = {};
  const validLevels = { '必须修正': true, '需复核': true, '限制报告': true };
  const requiredText = ['类别', '标题', '触发', '异常结果', '处理', '依据'];
  rules.forEach((r) => {
    assert.ok(r.id && r.id.length, '异常药敏规则缺少 id');
    assert.ok(!ids[r.id], '异常药敏规则 id 重复：' + r.id);
    ids[r.id] = true;
    assert.ok(validLevels[r.等级], '异常药敏规则 “' + (r.id || '?') + '” 等级非法：' + r.等级);
    requiredText.forEach((k) => {
      assert.ok(r[k] && String(r[k]).length, '异常药敏规则 “' + r.id + '” 缺少字段：' + k);
    });
    assert.ok(Array.isArray(r.关键词) && r.关键词.length > 0, '异常药敏规则 “' + r.id + '” 关键词为空');
    assert.ok(Array.isArray(r.来源) && r.来源.length > 0, '异常药敏规则 “' + r.id + '” 来源为空');
  });
});

test('治疗要点的键均为存在的微生物 id 且非空', () => {
  const treatment = global.window.DB.treatment || {};
  const micIds = {};
  global.window.DB.microbes.forEach((m) => { micIds[m.id] = true; });
  Object.keys(treatment).forEach((id) => {
    assert.ok(micIds[id], '治疗要点指向不存在的微生物 id：' + id);
    assert.ok(treatment[id] && String(treatment[id]).trim().length, '治疗要点为空：' + id);
  });
});

test('高风险性传播感染治疗要点采用当前教学口径', () => {
  const treatment = global.window.DB.treatment || {};
  assert.match(treatment['neisseria-gonorrhoeae'], /头孢曲松500mg/);
  assert.match(treatment['neisseria-gonorrhoeae'], /多西环素/);
  assert.doesNotMatch(treatment['neisseria-gonorrhoeae'], /联合阿奇霉素|经验性联合阿奇霉素/);
  assert.match(treatment['trichomonas-vaginalis'], /女性首选甲硝唑500mg/);
  assert.match(treatment['trichomonas-vaginalis'], /男性首选甲硝唑2g单次/);
});

test('Service Worker 预缓存全部图片且只清理本应用缓存', () => {
  const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  fs.readdirSync(path.join(__dirname, '..', 'img')).filter((f) => f.endsWith('.svg')).forEach((f) => {
    assert.ok(sw.includes('./img/' + f), 'sw.js 未预缓存图片：img/' + f);
  });
  assert.ok(sw.includes('CACHE_PREFIX'), 'sw.js 应使用缓存前缀');
  assert.ok(/k\.indexOf\(CACHE_PREFIX\)\s*===\s*0/.test(sw), 'sw.js 应只清理本应用缓存');
});

test('入口资源带版本参数以避免旧脚本缓存', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  ['css/styles.css', 'js/app.js', 'js/view.js', 'data/breakpoints.js', 'data/treatment.js'].forEach((asset) => {
    assert.ok(html.includes(asset + '?v='), 'index.html 未给资源加版本参数：' + asset);
  });
  assert.ok(html.includes("updateViaCache: 'none'"), 'Service Worker 注册应绕过脚本缓存');
});
