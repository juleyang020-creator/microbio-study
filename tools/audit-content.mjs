#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

global.window = { DB: {} };
[
  'source-metadata',
  'categories',
  'microbes',
  'antibiotics',
  'resistance',
  'biochem',
  'differential',
  'morphology',
  'treatment',
  'idcards',
  'cards',
  'tests',
  'media',
  'staining',
  'structures',
  'breakpoints',
  'biochem-tests',
  'ast-alerts'
].forEach((name) => {
  require(path.join(root, 'data', `${name}.js`));
});

const Core = require(path.join(root, 'js', 'core.js'));
const DB = global.window.DB;
const appDb = {
  microbes: DB.microbes || [],
  antibiotics: DB.antibiotics || [],
  resistance: DB.resistance || [],
  idcards: DB.idcards || [],
  cards: DB.cards || [],
  tests: DB.tests || [],
  media: DB.media || [],
  staining: DB.staining || [],
  'biochem-tests': DB.biochemTests || []
};

const errors = [];
const warnings = [];
const microbeIds = new Set((DB.microbes || []).map((m) => m.id));

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

Core.validateData(appDb, DB.categories || {}).forEach((p) => fail(p));

[
  ['形态', DB.morphology || {}],
  ['生化', DB.biochem || {}],
  ['鉴别', DB.differential || {}],
  ['治疗', DB.treatment || {}]
].forEach(([label, map]) => {
  Object.keys(map).forEach((id) => {
    if (!microbeIds.has(id)) {
      fail(`${label}数据引用了不存在的微生物 id：${id}`);
    }
  });
});

const newAnaerobes = [
  'veillonella-parvula',
  'clostridium-septicum'
];
const breakpointIds = new Set();
(DB.breakpoints || []).forEach((group) => (group.菌种 || []).forEach((id) => breakpointIds.add(id)));
const idAnc = (DB.idcards || []).find((card) => card.id === 'id-anc') || {};
const idAncIds = new Set(idAnc.关联 || []);
const anaerobicAgar = (DB.media || []).find((item) => item.id === 'anaerobic-blood-agar') || {};
const agarIds = new Set(anaerobicAgar.关联 || []);

newAnaerobes.forEach((id) => {
  if (!microbeIds.has(id)) { fail(`新增厌氧菌缺少主条目：${id}`); }
  if (!DB.morphology || !DB.morphology[id]) { fail(`新增厌氧菌缺少形态数据：${id}`); }
  if (!DB.biochem || !DB.biochem[id]) { fail(`新增厌氧菌缺少生化数据：${id}`); }
  if (!DB.differential || !DB.differential[id]) { fail(`新增厌氧菌缺少鉴别数据：${id}`); }
  if (!DB.treatment || !DB.treatment[id]) { fail(`新增厌氧菌缺少治疗要点：${id}`); }
  if (!breakpointIds.has(id)) { fail(`新增厌氧菌未纳入厌氧菌折点组：${id}`); }
  if (!idAncIds.has(id)) { fail(`新增厌氧菌未关联 ANC 鉴定卡：${id}`); }
  if (!agarIds.has(id)) { fail(`新增厌氧菌未关联厌氧血平板：${id}`); }
});

const meta = DB.sourceMetadata || {};
['app', 'breakpoints', 'treatment', 'taxonomy'].forEach((key) => {
  if (!meta[key]) {
    fail(`缺少来源元数据：${key}`);
    return;
  }
  if (!meta[key].最近校对日期) { fail(`来源元数据缺少最近校对日期：${key}`); }
});

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!html.includes('data/source-metadata.js?v=')) {
  fail('index.html 未加载 data/source-metadata.js');
}
if (!html.includes("window.APP_VERSION = '20260702-39'")) {
  warn('index.html 的 APP_VERSION 与当前脚本期望不一致');
}

const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
if (!sw.includes("versioned('./data/source-metadata.js')")) {
  fail('sw.js 未预缓存 data/source-metadata.js');
}
if (!sw.includes('CACHE_PREFIX')) {
  fail('sw.js 未使用 CACHE_PREFIX 限定缓存清理范围');
}

if (errors.length) {
  console.error('内容自检失败：');
  errors.forEach((message) => console.error(`- ${message}`));
  if (warnings.length) {
    console.error('\n警告：');
    warnings.forEach((message) => console.error(`- ${message}`));
  }
  process.exit(1);
}

console.log(`内容自检通过：${DB.microbes.length} 个微生物，${DB.antibiotics.length} 个抗微生物药，${DB.breakpoints.length} 组折点。`);
if (warnings.length) {
  console.log('警告：');
  warnings.forEach((message) => console.log(`- ${message}`));
}
