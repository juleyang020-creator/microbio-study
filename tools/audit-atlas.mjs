#!/usr/bin/env node
// 全量程序化配图审计（铁律 5）：对 .atlas-matched.json 逐条判定误挂
// 规则见 atlas-image-pipeline.md：
//  ① by（匹配依据菌名）去掉括注后应出现在 sub 或图注标题段
//  ② 出现但处于对照/混合语境 → 误挂
//  ③ 标题段首菌名（主菌）与挂载菌不同且挂载菌名不在标题段 → 疑似误挂（正文串扰）
// 用法：node tools/audit-atlas.mjs [--book 94]   （不传 = 全部）
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);
const onlyBook = process.argv.includes('--book') ? process.argv[process.argv.indexOf('--book') + 1] : null;

global.window = { DB: {} };
for (const f of ['microbes', 'microbes-gram-positive', 'microbes-gram-negative', 'microbes-anaerobe', 'microbes-atypical', 'microbes-fungi', 'microbes-parasite', 'microbes-virus', 'microbes-misc']) require(path.join(root, 'data', f + '.js'));
const DB = global.window.DB;
const id2m = new Map(DB.microbes.map(m => [m.id, m]));

const matched = JSON.parse(fs.readFileSync(path.join(root, 'tools/.atlas-matched.json'), 'utf8'))
  .filter(r => !onlyBook || r.book === onlyBook);

// 读 sync 层 EXCLUDE（误挂排除在 sync 生效，parse 产物仍含被排除记录——审计须同样跳过）
const syncSrc = fs.readFileSync(path.join(root, 'tools/sync-atlas-images.mjs'), 'utf8');
const EX = new Set();
for (const m of syncSrc.matchAll(/'([a-z0-9-]+)\|(\d+)\|(\d+-\d+-\d+)'/g)) EX.add(m[1] + '|' + m[2] + '|' + m[3]);
for (const m of syncSrc.matchAll(/'([a-z0-9-]+)\|(\d+-\d+-\d+)'\s*,/g)) EX.add(m[1] + '|93|' + m[2]);

const suspects = [];
for (const r of matched) {
  if (EX.has(r.id + '|' + (r.book || '93') + '|' + r.fig)) continue; // sync 层已排除
  const m = id2m.get(r.id);
  if (!m) continue;
  // by 取 matchAll 命中名（可能是别名/拉丁名），去掉括注与截断尾巴；为空回落到菌名
  let by = (r.by || '').replace(/[（(][^（）()]*[)）]/g, '').trim();
  if (!by || by.length > 12) by = m.名称; // 截断聚合段（含标点/分联字母尾巴）回落到菌名
  const sub = r.sub || '';
  // 标题段 = caption 去掉分联部分（A. 及以后）
  const titleSeg = (r.caption || '').split(/[\s;；:：。，][A-Ia-i][\.、．]/)[0];
  // 比对菌名主体（by 可能带截断尾巴/异写前缀，取前 4 字足够区分）
  const key = by.slice(0, 4);
  const inSub = sub.includes(key);
  const inTitle = titleSeg.includes(key);
  if (inSub || inTitle) continue; // 正常：依据名出现在自己分联或标题
  // by 只出现在 caption 尾部（聚合进来的后续图行/正文串扰）→ 检查该处语境
  const cap = r.caption || '';
  let pos = cap.indexOf(by);
  if (pos < 0 && by.length > 6) pos = cap.indexOf(by.slice(0, 6)); // 截断尾巴不影响菌名主体比对
  if (pos < 0) { suspects.push({ ...r, rule: 'by不在caption', m: m.名称 }); continue; }
  const ctx = cap.slice(Math.max(0, pos - 40), pos + by.length + 40);
  if (/(对照|混合|指示菌|鉴别试验|卫星|CAMP)/.test(ctx)) suspects.push({ ...r, rule: '对照/混合语境', ctx, m: m.名称 });
  else suspects.push({ ...r, rule: '标题段外命中(疑似正文串扰)', ctx, m: m.名称 });
}
console.log('审计条目:', matched.length, ' 疑似误挂:', suspects.length);
const byRule = {};
for (const s of suspects) byRule[s.rule] = (byRule[s.rule] || 0) + 1;
console.log('按规则:', JSON.stringify(byRule));
for (const s of suspects) console.log(`[${s.rule}] ${s.id} | 图${s.fig} (${s.book}) ${s.m} ← "${(s.ctx || s.by || '').slice(0, 60)}"`);
