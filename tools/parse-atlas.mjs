#!/usr/bin/env node
// 从《实用临床微生物学检验与图谱》人卫2025 分章 md 中提取 图片↔菌种 映射
// 规则：
//   1) 只处理第 12 章及以后（第三篇起，菌种各论；1-11 章为技术方法篇，其试验示意图/培养基质控图不挂菌）
//   2) 图注 = "图 X-Y-Z" 行 + 后续 1~3 行中以 A./B./…/分号开头的分图行（纯正文行不并入，避免正文菌名误伤）
//   3) 匹配：软件菌名（含别名，长名优先）→ id；一张多联图可挂多个菌
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);
const ATLAS = path.join(process.env.HOME, 'Documents/资料库/微生物/93-实用临床微生物学检验与图谱-人卫2025');

global.window = { DB: {} };
for (const f of ['microbes', 'microbe-names']) require(path.join(root, 'data', f + '.js'));
const DB = global.window.DB;

// ---- 菌名 → id 索引 ----
const name2id = new Map();
const LAT_KEYS = [];
for (const m of DB.microbes) {
  name2id.set(m.名称, m.id);
  const lat = (m.拉丁名 || '').replace(/（.*?）|\(.*?\)/g, '').trim();
  if (lat && lat.length > 3) LAT_KEYS.push({ lat: lat.toLowerCase(), id: m.id });
}
for (const n of DB.microbeNames || []) {
  if (name2id.has(n.名称) && n.别名) {
    for (const a of String(n.别名).split(/[/、,，]/)) {
      const t = a.trim(); if (t && !name2id.has(t)) name2id.set(t, name2id.get(n.名称));
    }
  }
}
const CN_SORTED = [...name2id.keys()].sort((a, b) => b.length - a.length);

function matchAll(text) {
  const ids = new Map(); // id -> 命中名
  for (const nm of CN_SORTED) {
    if (text.includes(nm)) { const id = name2id.get(nm); if (!ids.has(id)) ids.set(id, nm); }
  }
  for (const { lat, id } of LAT_KEYS) {
    if (lat.length >= 8 && text.toLowerCase().includes(lat) && !ids.has(id)) ids.set(id, lat);
  }
  return [...ids.entries()];
}

// 拆分多联图图注："总标题 ×1000 A. xx; B. xx；C. xx" → { title, parts }
// 与 sync-atlas-images.mjs 的 splitSubs 同逻辑：分隔为空格/分号/行首 + 字母句点（点后空格可有可无），
// 字母须从 A 起连续（防 "E. coli" 误拆）。
function splitSubs(raw) {
  const t = (raw || '').replace(/\s+/g, ' ').trim();
  const chunks = t.split(/(?:^|[\s;；])\s*(?=[A-I][\.、．])/).filter(Boolean);
  if (chunks.length < 2) { return { title: t, parts: [] }; }
  for (let k = 1; k < chunks.length; k++) {
    const m = chunks[k].match(/^([A-I])[\.、．]\s*(.*)$/);
    if (!m || m[1] !== String.fromCharCode(65 + k - 1)) { return { title: t, parts: [] }; }
    chunks[k] = m[2].replace(/[;；]\s*$/, '');
  }
  return { title: chunks[0].replace(/[;；]\s*$/, ''), parts: chunks.slice(1) };
}

// ---- 解析分章（第 12 章起）----
const files = fs.readdirSync(path.join(ATLAS, '分章')).filter(f => f.endsWith('.md')).sort()
  .filter(f => parseInt(f.split('-')[0], 10) >= 12);
const results = [];
for (const f of files) {
  const lines = fs.readFileSync(path.join(ATLAS, '分章', f), 'utf8').split('\n');
  const chapter = f.split('-')[0];
  let pendingImgs = [];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const m = ln.match(/!\[[^\]]*\]\((?:images\/)?([a-f0-9]{40,})\.jpg\)/);
    if (m) { pendingImgs.push(m[1]); continue; }
    const cap = ln.match(/^图\s*(\d+-\d+-\d+)/);
    if (cap && pendingImgs.length) {
      // 聚合图注首行 + 后续分图行（A. / B. … 或以分号/× 结尾的短行），最多 4 行
      const parts = [ln.replace(/^图\s*\d+-\d+-\d+[、.．]?\s*/, '')];
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const t = lines[j].trim();
        if (!t) continue;
        if (/^!\[/.test(t) || /^图\s*\d/.test(t) || /^#{1,3}\s/.test(t)) break;
        if (/^[A-Z][\.\、]/.test(t) || /^\d[\.\、]/.test(t) || /×\s*\d{2,4}/.test(t)) { parts.push(t); continue; }
        break; // 纯正文行：不并入
      }
      const capText = parts.join(' ').replace(/\s+/g, ' ').trim();
      // 联图归属：把图注拆成「总标题 + A/B/C… 分联」，分联数与图片数一致时，
      // 第 k 张小图只按第 k 联文本匹配菌名（避免联图里提到别的菌就整图挂给所有菌）；
      // 拆不出/数量对不上时退回整图图注匹配。
      const subImgs = pendingImgs.length;
      let subs = splitSubs(capText);
      if (subImgs >= 2 && subs.parts.length === subImgs) {
        pendingImgs.forEach(function (img, k) {
          const subHits = matchAll('图 ' + subs.title + ' ' + subs.parts[k]);
          for (const [id, by] of subHits) {
            results.push({ img, fig: cap[1], caption: capText.slice(0, 200), sub: subs.parts[k], chapter, id, by });
          }
        });
      } else {
        const hits = matchAll(capText);
        for (const img of pendingImgs) {
          for (const [id, by] of hits) {
            results.push({ img, fig: cap[1], caption: capText.slice(0, 200), chapter, id, by });
          }
        }
      }
      pendingImgs = [];
    }
  }
}

// 去重（同图同菌）并按菌统计
const seen = new Set();
const uniq = results.filter(r => { const k = r.img + r.id; if (seen.has(k)) return false; seen.add(k); return true; });
const byId = {};
for (const r of uniq) { (byId[r.id] = byId[r.id] || []).push(r); }
console.log('图片-菌种配对：', uniq.length, ' 覆盖菌种：', Object.keys(byId).length);
const ids = Object.keys(byId).sort();
for (const id of ids) console.log(' ', id, byId[id].length + ' 张');
fs.writeFileSync(path.join(root, 'tools/.atlas-matched.json'), JSON.stringify(uniq, null, 1));
console.log('已写 tools/.atlas-matched.json');
