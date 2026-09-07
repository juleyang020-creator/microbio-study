'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const readSvg = (name) => fs.readFileSync(path.join(__dirname, '..', 'img', name + '.svg'), 'utf8');
function texts(svg) {
  return [...svg.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)].map((m) => ({
    x: Number((m[1].match(/\bx="([^"]+)"/) || [])[1]),
    y: Number((m[1].match(/\by="([^"]+)"/) || [])[1]),
    text: m[2].replace(/<[^>]+>/g, '').trim()
  }));
}

test('药敏术语图：MIC例值、管色和解释体系保持一致', () => {
  const svg = readSvg('glossary-ast-terms');
  const labels = texts(svg).filter((t) => t.y < 120 && [50, 84, 118, 152].includes(t.x) && /^\d+(\.\d+)?$/.test(t.text)).sort((a, b) => a.x - b.x);
  assert.strictEqual(labels.length, 4);
  assert.ok(labels.every((t, i) => i === 0 || Number(t.text) > Number(labels[i - 1].text)), '浓度应从左到右递增，与浊→清方向一致');
  // 读取实际管形填色，不只相信旁边的MIC文字。
  const tubeFills = [...svg.matchAll(/<path d="M([\d.]+),\d+ L[^\"]+" fill="([^\"]+)"/g)].filter((m) => [40, 74, 108, 142].includes(Number(m[1])));
  assert.strictEqual(tubeFills.length, 4);
  const firstClear = tubeFills.findIndex((m) => /^(#fff|#ffffff)$/i.test(m[2]));
  assert.strictEqual(Number(labels[firstClear].text), 2, '最低清亮管须与MIC示例标值一致');
  assert.ok(tubeFills.slice(firstClear).every((m) => /^(#fff|#ffffff)$/i.test(m[2])));
  assert.match(svg, /MIC = 2.*示例/);
  assert.match(svg, /CLSI：I 中介/);
  assert.match(svg, /EUCAST：I 增加暴露时敏感/);
  assert.match(svg, /SDD 独立类别/);
  assert.match(svg, /可表型检出的获得性耐药/);
  assert.doesNotMatch(svg, /高剂量方案下可报敏感|无耐药机制群体/);
});

test('厚壁孢子图保留非独有和不能单凭表型定种的边界', () => {
  const svg = readSvg('media-corn-rice-tween');
  assert.match(svg, /并非白念珠菌独有/);
  assert.match(svg, /不能仅凭.*定种/);
  assert.doesNotMatch(svg, /其他念珠菌不产生|两者都阳性 → 白念珠菌|身份证|厚壁孢子 24~48 h 确证/);
});

test('真菌与病毒结构图不混用结构、旧分类和诊断管理结论', () => {
  const svg = readSvg('glossary-structure-fungi-virus');
  assert.match(svg, /瓶梗/);
  assert.match(svg, /形态.*鉴别线索/);
  assert.match(svg, /消毒.*对象.*规范/);
  assert.doesNotMatch(svg, /大分生孢子梭形|门级分类轴|接合菌 vs 子囊菌|结构即鉴定|压片定种|裸病毒需高水平消毒|决定消毒等级与传播途径/);
});

test('抗体曲线明确为典型示意而非通用确诊规则', () => {
  const svg = readSvg('glossary-virus-serology');
  assert.match(svg, /典型初次免疫应答/);
  assert.match(svg, /依病原.*方法/);
  assert.doesNotMatch(svg, /IgM 早峰＝新近|4 倍升高＝确诊依据/);
});

test('生物膜图区分难清除、耐受和常规药敏耐药', () => {
  const svg = readSvg('resistance-biofilm');
  assert.match(svg, /不等于常规药敏必然显示耐药/);
  assert.match(svg, /耐受与持留/);
  assert.doesNotMatch(svg, /持留菌不被杀菌药杀灭|持留菌：代谢静止 → 耐受|不能预测生物膜疗效 → 常需拔除导管/);
});

test('显色图限定产品范围且任何颜色都不能独立定种', () => {
  const svg = readSvg('media-chromagar-candida');
  assert.match(svg, /不同产品/);
  assert.match(svg, /任何颜色.*不能独立.*定种/);
  assert.doesNotMatch(svg, /标本中的细菌不长，酵母菌照长|余色仍须鉴定/);
});

test('质谱图以验证规则和谱库范围限定报告而非相对最高分', () => {
  const svg = readSvg('test-maldi');
  assert.match(svg, /谱库覆盖/);
  assert.match(svg, /经验证的判读规则/);
  assert.doesNotMatch(svg, /最高分显著领先则报告到种|与次高项拉开 → 报告到种/);
});


test('重点图在所有挂载详情页显示具体图名、命题、范围与来源', () => {
  const { loadApp, goto } = require('./dom-stub.js');
  const app = loadApp();
  const notes = app.win.DB.sourceMetadata.diagrams;
  assert.ok(notes, '缺少逐图来源与适用范围');
  assert.strictEqual(Object.keys(notes).length, 7);
  const seen = new Set();
  Object.entries(app.win.AppNS.db()).forEach(([module, entries]) => {
    entries.forEach((entry) => {
      const src = app.win.View.mechanismImageFor(module, entry, app.win.DB.categories);
      const note = notes[src];
      if (!note) { return; }
      seen.add(src);
      assert.ok(note.核心命题 && note.适用范围 && note.核对日期 && note.来源.length);
      assert.ok(note.来源.every((s) => s.名称 && (!s.url || /^https:\/\//.test(s.url))));
      goto(app, '#/' + module + '/' + entry.id);
      const main = app.doc.getElementById('main');
      assert.ok(main.textContent.includes(note.核心命题), entry.id + ' 缺核心命题');
      assert.ok(main.textContent.includes(note.适用范围), entry.id + ' 缺适用范围');
      assert.ok(main.textContent.includes(note.核对日期), entry.id + ' 缺核对日期');
      const image = main.querySelector('.mechanism-img');
      assert.strictEqual(image.getAttribute('alt'), note.标题);
      const version = app.win.DB.sourceMetadata.app.资源版本;
      assert.strictEqual(image.getAttribute('src'), src + '?v=' + version);
      const figure = main.querySelector('.mechanism-fig');
      const caption = figure.querySelector('figcaption');
      assert.strictEqual(caption.textContent, note.标题);
      assert.ok(figure.children[0] === caption || figure.children[figure.children.length - 1] === caption, 'figcaption 必须位于 figure 首部或末尾');
      const links = main.querySelector('.diagram-guidance').querySelectorAll('a');
      const linkedSources = note.来源.filter((s) => s.url);
      assert.strictEqual(links.length, linkedSources.length);
      linkedSources.forEach((s, i) => {
        assert.strictEqual(links[i].getAttribute('href'), s.url);
        assert.strictEqual(links[i].getAttribute('target'), '_blank');
        assert.strictEqual(links[i].getAttribute('rel'), 'noopener noreferrer');
      });
      note.来源.forEach((s) => assert.ok(main.textContent.includes(s.名称), entry.id + ' 缺来源'));
    });
  });
  assert.strictEqual(seen.size, 7, '有来源记录的图片必须确实被页面使用');
  goto(app, '#/tests/catalase');
  assert.strictEqual(app.doc.getElementById('main').querySelectorAll('.diagram-guidance').length, 0);
  function assertFallback() {
    assert.doesNotThrow(() => goto(app, '#/glossary/gloss-mic'));
    const main = app.doc.getElementById('main');
    assert.ok(main.querySelector('.mechanism-img'));
    assert.ok(main.querySelector('figcaption').textContent);
    assert.strictEqual(main.querySelectorAll('.diagram-guidance').length, 0);
  }
  delete notes['img/glossary-ast-terms.svg'];
  assertFallback();
  delete app.win.DB.sourceMetadata.diagrams;
  assertFallback();
  delete app.win.DB.sourceMetadata;
  assertFallback();
});


test('确认错配的条目不再借用专用图，生物膜词条挂实际结构图', () => {
  const View = require('../js/view.js');
  ['hbsag-elisa', 'hcv-ab-elisa', 'hiv-ab-screen', 'sars2-rtqpcr'].forEach((id) => {
    assert.strictEqual(View.mechanismImageFor('tests', { id }), null, id + ' 不应借错图');
  });
  assert.strictEqual(View.mechanismImageFor('staining', { id: 'calcofluor-white' }), null);
  assert.strictEqual(View.mechanismImageFor('glossary', { id: 'gloss-biofilm-structure' }), 'img/resistance-biofilm.svg');
});
