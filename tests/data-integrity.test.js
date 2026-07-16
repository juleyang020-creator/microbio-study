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
require('../data/intrinsic-resistance.js');
require('../data/site-reporting.js');
require('../data/source-metadata.js');
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
  // M27M44S Table 1 阿尼芬净作为独立药物行（种特异折点）
  const andCases = [
    ['candida-albicans', '≤0.25', '0.5', '≥1'],
    ['candida-glabrata', '≤0.12', '0.25', '≥0.5'],
    ['candida-parapsilosis', '≤2', '4', '≥8']
  ];
  andCases.forEach(([id, s, i, r]) => {
    const d = drug(bp(id), /Anidulafungin/);
    assert.ok(d, id + ' 缺阿尼芬净独立行');
    assert.strictEqual(d.MIC_S + '/' + d.MIC_I + '/' + d.MIC_R, s + '/' + i + '/' + r, id + ' 阿尼芬净折点错误');
  });
  // M27M44S Table 1 瑞扎芬净暂定「仅敏感」折点（仅 S，无 I/R）
  const rzf = [
    ['candida-albicans', '≤0.25'], ['candida-glabrata', '≤0.5'], ['candida-parapsilosis', '≤2'],
    ['candida-tropicalis', '≤0.25'], ['candida-krusei', '≤0.25'], ['candida-auris', '≤0.5']
  ];
  rzf.forEach(([id, s]) => {
    const d = drug(bp(id), /Rezafungin/);
    assert.ok(d, id + ' 缺瑞扎芬净行');
    assert.strictEqual(d.MIC_S, s, id + ' 瑞扎芬净 S 折点错误');
    assert.strictEqual(d.MIC_R, '—', id + ' 瑞扎芬净不应有 R 折点（仅敏感）');
  });
  // M27M44S Table 1 季也蒙念珠菌折点组（阿尼芬净/卡泊芬净/米卡芬净 ≤2/4/≥8）
  const guil = bp('candida-guilliermondii');
  assert.ok(guil, '缺季也蒙念珠菌折点组');
  [/Anidulafungin/, /Caspofungin/, /Micafungin/].forEach((re) => {
    const d = drug(guil, re);
    assert.ok(d && d.MIC_S === '≤2' && d.MIC_I === '4' && d.MIC_R === '≥8', '季也蒙 ' + re + ' 折点应为 ≤2/4/≥8');
  });
  // M27M44S Table 5 纸片抑菌圈（卡泊芬净对 C. albicans ≥17/15–16/≤14）
  const casAlb = drug(bp('candida-albicans'), /Caspofungin/);
  assert.ok(casAlb && casAlb.抑菌圈_S === '≥17' && casAlb.抑菌圈_R === '≤14', 'C. albicans 卡泊芬净纸片折点缺失/错误');
  // 瑞扎芬净须有独立药物条目可跳转
  assert.ok(global.window.DB.antibiotics.some((a) => a.名称 === '瑞扎芬净'), '缺瑞扎芬净药物条目');
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

test('真菌固有耐药结构化数据符合 CLSI 附录（M27M44S App B / M38M51S App）', () => {
  const ir = global.window.DB.intrinsicResistance;
  assert.ok(ir && Array.isArray(ir.分组) && ir.分组.length >= 2, '缺真菌固有耐药结构化数据');
  const microbeIds = {};
  global.window.DB.microbes.forEach((m) => { microbeIds[m.id] = true; });
  const findRow = (latin) => {
    for (const g of ir.分组) { const r = (g.行 || []).find((x) => x.拉丁 === latin); if (r) return r; }
    return null;
  };
  // M27M44S Appendix B（酵母）
  assert.deepStrictEqual(findRow('Pichia kudriavzevii / C. krusei').耐药, ['氟康唑'], '克柔念珠菌固有耐药应仅氟康唑');
  assert.deepStrictEqual(findRow('Cryptococcus spp.').耐药, ['阿尼芬净', '卡泊芬净', '米卡芬净'], '隐球菌固有耐棘白菌素类');
  assert.deepStrictEqual(findRow('Rhodotorula spp.').耐药, ['阿尼芬净', '卡泊芬净', '氟康唑', '米卡芬净'], '红酵母固有耐药错误');
  assert.deepStrictEqual(findRow('Trichosporon spp.').耐药, ['阿尼芬净', '卡泊芬净', '米卡芬净'], '毛孢子菌固有耐棘白菌素类');
  // M38M51S Appendix（丝状真菌）
  assert.deepStrictEqual(findRow('Aspergillus spp.').耐药, ['氟康唑'], '曲霉固有耐氟康唑');
  assert.deepStrictEqual(findRow('Lomentospora prolificans').耐药, ['两性霉素B', '氟康唑'], 'Lomentospora 固有耐药错误');
  assert.deepStrictEqual(findRow('Mucorales').耐药, ['氟康唑', '伏立康唑'], '毛霉目固有耐短侧链唑类');
  assert.deepStrictEqual(findRow('Purpureocillium lilacinum').耐药, ['两性霉素B'], '淡紫紫孢霉固有耐两性霉素B');
  // 引用的菌 id（若给出）须存在
  ir.分组.forEach((g) => (g.行 || []).forEach((r) => {
    if (r.id) assert.ok(microbeIds[r.id], '固有耐药引用了不存在的微生物 id：' + r.id);
  }));
});

test('念珠菌标本部位报告数据结构完整（M27M44S App A）', () => {
  const sr = global.window.DB.siteReporting;
  assert.ok(sr && Array.isArray(sr.分组) && sr.分组.length >= 3, '缺念珠菌标本部位报告数据');
  const azole = sr.分组.find((g) => /唑类|Azole/.test(g.药类));
  const echino = sr.分组.find((g) => /棘白菌素|Echinocandin/.test(g.药类));
  assert.ok(azole && echino, '缺唑类或棘白菌素分组');
  // 唑类：尿液仅报氟康唑
  const azUrine = (azole.规则 || []).find((r) => /尿/.test(r.部位));
  assert.ok(azUrine && /氟康唑/.test(azUrine.报告), '唑类尿液应仅报告氟康唑');
  // 棘白菌素：尿液不应常规报告
  const ecUrine = (echino.规则 || []).find((r) => /尿/.test(r.部位));
  assert.ok(ecUrine && /不应常规报告/.test(ecUrine.报告), '棘白菌素尿液应不常规报告');
  // 每条规则字段完整
  sr.分组.forEach((g) => {
    assert.ok(g.药类 && (g.规则 || []).length > 0, '标本部位分组 “' + (g.药类 || '?') + '” 规则为空');
    g.规则.forEach((r) => assert.ok(r.部位 && r.报告, '标本部位规则缺部位/报告字段'));
  });
});

test('质控菌株结构化字段：MEC 终点与 QC/Reference 用途（M27M44S / M38M51S）', () => {
  const qcById = (id) => (global.window.DB['qc-strains'] || []).find((s) => s.id === id);
  // 8.2 棘白菌素对霉菌以 MEC 判读——须有 终点:'MEC' 结构化字段
  const afum = qcById('qc-afumigatus-mya3626');
  assert.ok(afum, '缺烟曲霉 MYA-3626 质控株');
  const afumAnid = (afum.质控范围 || []).find((r) => /Anidulafungin/.test(r.药物));
  assert.ok(afumAnid && afumAnid.终点 === 'MEC', '烟曲霉阿尼芬净应标注 终点=MEC');
  // 8.3 纯参考株须标注 用途:'Reference'
  const sced = qcById('qc-sapiospermum-mya3635');
  assert.ok(sced && /reference/i.test(sced.质控用途 || ''), '赛多孢参考株应标注 用途=Reference');
  assert.ok(/reference/i.test((qcById('qc-tmentagrophytes-mya4439') || {}).质控用途 || ''), '须癣毛癣菌应标注 Reference');
  // 8.4 参考株须带结构化方法背景
  assert.ok(sced.质控方法 && sced.质控培养基 && sced.质控孵育, '赛多孢参考株缺方法/培养基/孵育结构化字段');
  // 常规酵母 QC 株默认 QC 用途且带方法字段
  const cpara = qcById('qc-cparapsilosis-22019');
  assert.ok(cpara && (cpara.质控用途 || 'QC') === 'QC' && cpara.质控孵育, '近平滑念珠菌应为 QC 且带孵育字段');
});

test('来源元数据：折点标准结构化且 M60 标为历史对照（非 2022 Ed3）', () => {
  const meta = global.window.DB.sourceMetadata || {};
  const bp = meta.breakpoints || {};
  assert.ok(bp.标准 && bp.标准.细菌 && bp.标准.酵母 && bp.标准.丝状真菌, '折点来源缺细菌/酵母/丝状真菌结构化标准');
  const m100 = bp.标准.细菌.find((d) => d.文件 === 'CLSI M100');
  assert.ok(m100 && m100.版次 === 36 && m100.年份 === 2026, 'M100 应为 Ed36 (2026)');
  const m27 = bp.标准.酵母.find((d) => d.文件 === 'CLSI M27M44S');
  assert.ok(m27 && m27.版次 === 3 && m27.年份 === 2022, 'M27M44S 应为 Ed3 (2022)');
  const m38 = bp.标准.丝状真菌.find((d) => d.文件 === 'CLSI M38M51S');
  assert.ok(m38 && m38.版次 === 3 && m38.年份 === 2022, 'M38M51S 应为 Ed3 (2022)');
  const m60 = bp.标准.酵母.find((d) => d.文件 === 'CLSI M60');
  assert.ok(m60 && m60.状态 && /取代|历史|superseded/i.test(m60.状态), 'M60 应标注为已被取代/历史对照');
  assert.ok(!(m60.版次 === 3 || m60.年份 === 2022), 'M60 不应标为 2022 年第 3 版');
  assert.ok(Array.isArray(bp.优先顺序) && bp.优先顺序.length >= 4, '折点来源缺优先顺序列表');
});

test('高致病/选择性生物战剂微生物带生物安全警示（BSL-3 转送提示）', () => {
  const byId = {};
  global.window.DB.microbes.forEach((m) => { byId[m.id] = m; });
  const selectAgents = ['bacillus-anthracis', 'brucella-melitensis', 'yersinia-pestis', 'francisella-tularensis', 'burkholderia-pseudomallei', 'coccidioides-immitis'];
  selectAgents.forEach((id) => {
    const m = byId[id];
    assert.ok(m, '缺微生物：' + id);
    assert.ok(m.生物安全 && m.生物安全.级别 && m.生物安全.提示, id + ' 缺生物安全警示（级别/提示）');
    assert.ok(/BSL|生物安全柜|BSC|LRN|转送|通知/.test(m.生物安全.提示), id + ' 生物安全提示应含防护/转送要点');
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

// 13.2 文档与缓存：版本号跨文件同步
test('版本号在 index.html / sw.js / 来源元数据间保持一致', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  const htmlVer = (html.match(/window\.APP_VERSION = '([^']+)'/) || [])[1];
  const swVer = (sw.match(/var APP_VERSION = '([^']+)'/) || [])[1];
  const metaVer = ((global.window.DB.sourceMetadata || {}).app || {}).资源版本;
  assert.ok(htmlVer, 'index.html 缺 APP_VERSION');
  assert.strictEqual(swVer, htmlVer, 'sw.js APP_VERSION 应与 index.html 一致（否则预缓存 URL 版本不匹配）');
  assert.strictEqual(metaVer, htmlVer, '来源元数据 资源版本 应与 index.html APP_VERSION 一致');
  // 入口页所有带版本的资源均用同一版本号
  const stray = (html.match(/\?v=20260702-\d+/g) || []).filter((s) => s !== '?v=' + htmlVer);
  assert.strictEqual(stray.length, 0, 'index.html 存在版本号不一致的资源引用：' + stray.join(', '));
});

// 13.2 文档与缓存：新增数据文件须进入离线缓存清单并被入口页加载
test('新增数据模块进入 sw 预缓存清单且被 index.html 加载', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  ['data/ecv.js', 'data/qc-strains.js', 'data/intrinsic-resistance.js', 'data/site-reporting.js'].forEach((f) => {
    assert.ok(sw.includes("versioned('./" + f + "')"), 'sw.js 未预缓存：' + f);
    assert.ok(html.includes(f + '?v='), 'index.html 未加载：' + f);
  });
});

// 13.2 M100 Ed36 关键变化（数据基准）
test('M100 Ed36 关键变化固定在数据中', () => {
  const bps = global.window.DB.breakpoints || [];
  const grp = (id) => bps.find((g) => (g.菌种 || []).indexOf(id) !== -1);
  const drug = (g, re) => (g.药物 || []).find((d) => re.test(d.药物));
  // 肠杆菌目存在氨曲南/阿维巴坦
  assert.ok(drug(grp('e-coli'), /Aztreonam.?[–/-].?Avibactam|氨曲南\/阿维巴坦|Aztreonam.*Avibactam/), '肠杆菌目缺氨曲南/阿维巴坦');
  // 淋病奈瑟菌头孢克肟/头孢曲松：MIC 判读、纸片折点已暂时移除
  const gc = grp('neisseria-gonorrhoeae');
  ['Cefixime', 'Ceftriaxone'].forEach((n) => {
    const d = drug(gc, new RegExp(n));
    assert.ok(d && d.MIC_S && d.MIC_S !== '—', '淋病奈瑟菌 ' + n + ' 应有 MIC 折点');
    assert.strictEqual(d.抑菌圈_S, '—', '淋病奈瑟菌 ' + n + ' 纸片折点应已移除（Ed36）');
  });
  // 流感嗜血杆菌不得误命中 M45 HACEK 组
  const hacek = bps.find((g) => /HACEK/.test(g.菌组名));
  assert.ok(hacek && (hacek.菌种 || []).indexOf('haemophilus-influenzae') === -1, '流感嗜血杆菌不应落入 HACEK 组');
});
