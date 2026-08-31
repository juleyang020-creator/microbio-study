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
  'microbes-gram-positive',
  'microbes-gram-negative',
  'microbes-anaerobe',
  'microbes-atypical',
  'microbes-fungi',
  'microbes-parasite',
  'microbes-virus',
  'microbes-misc',
  'antibiotics',
  'resistance',
  'virulence',
  'genetics',
  'glossary',
  'biochem',
  'differential',
  'morphology',
  'photos',
  'photos-atlas',
  'treatment',
  'cards',
  'tests',
  'media',
  'staining',
  'breakpoints',
  'biochem-tests',
  'ast-alerts',
  'nprc-catalogue'
].forEach((name) => {
  require(path.join(root, 'data', `${name}.js`));
});

const Core = require(path.join(root, 'js', 'core.js'));
const DB = global.window.DB;
const appDb = {
  microbes: DB.microbes || [],
  antibiotics: DB.antibiotics || [],
  resistance: DB.resistance || [],
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
  'clostridium-septicum'
];
const breakpointIds = new Set();
(DB.breakpoints || []).forEach((group) => (group.菌种 || []).forEach((id) => breakpointIds.add(id)));
const idAnc = (DB.cards || []).find((card) => card.id === 'id-anc') || {};
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

const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
// 版本一致性以 sw.js 的 APP_VERSION 为基准（升版本只改这一处源头），
// index.html 内联注入值与之不符才警告——不再硬编码历史版本号。
const swVersionMatch = sw.match(/APP_VERSION\s*=\s*'([^']+)'/);
const expectedInline = `window.APP_VERSION = '${swVersionMatch ? swVersionMatch[1] : ''}'`;
if (!html.includes(expectedInline)) {
  warn('index.html 的 APP_VERSION 与 sw.js 不一致（老用户可能继续吃旧缓存）');
}
if (!sw.includes("versioned('./data/source-metadata.js')")) {
  fail('sw.js 未预缓存 data/source-metadata.js');
}
if (!sw.includes('CACHE_PREFIX')) {
  fail('sw.js 未使用 CACHE_PREFIX 限定缓存清理范围');
}

// 图谱照片（photosAtlas）：id 必须存在于 microbes，图片文件必须落盘
const atlas = DB.photosAtlas || {};
Object.keys(atlas).forEach((id) => {
  if (!microbeIds.has(id)) { fail(`photosAtlas 挂到不存在的菌 id：${id}`); }
  atlas[id].forEach((p) => {
    if (!p.文件 || !p.说明) { fail(`photosAtlas 条目字段不全：${id}`); return; }
    if (!fs.existsSync(path.join(root, p.文件))) { fail(`photosAtlas 图片文件缺失：${p.文件}（${id}）`); }
  });
});
if (Object.keys(atlas).length) {
  const htmlHasAtlas = fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('data/photos-atlas.js?v=');
  if (!htmlHasAtlas) { fail('index.html 未加载 data/photos-atlas.js'); }
  if (!sw.includes("versioned('./data/photos-atlas.js')")) { fail('sw.js 未预缓存 data/photos-atlas.js'); }
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
