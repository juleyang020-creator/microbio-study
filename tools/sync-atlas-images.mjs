#!/usr/bin/env node
// 把解析出的图谱图片复制+压缩到 img/atlas/，生成 data/photos-atlas.js（与 CDC photos.js 同构）
// 依赖 tools/.atlas-matched.json（由 parse-atlas.mjs 生成）。
// 压缩用 macOS 自带 sips（最大边 1000px、JPEG 质量 72）。
// 用法：node tools/sync-atlas-images.mjs [--dry]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const ATLAS = path.join(process.env.HOME, 'Documents/资料库/微生物/93-实用临床微生物学检验与图谱-人卫2025');
const IMG_DIR = path.join(ATLAS, 'images');
const OUT_DIR = path.join(root, 'img', 'atlas');
const DRY = process.argv.includes('--dry');

const matched = JSON.parse(fs.readFileSync(path.join(root, 'tools/.atlas-matched.json'), 'utf8'));

// 人工核对排除的误挂（菌名仅作为对照/示例出现在图注中，或多联图属别章菌）：
// 格式 '菌id|图号'。新增菌种若发现误挂，在此追加后重跑本脚本。
const EXCLUDE = new Set([
  'staph-aureus|13-2-2',            // 卡他莫拉菌鉴别试验，金葡仅为 DNA 酶阳性对照
  'achromobacter-xylosoxidans|17-11-1', // 放射根瘤菌图误挂（章节正文串扰）
  'taenia-saginata|33-2-19',        // 猪带绦虫染色图误挂到牛带绦虫
  'plasmodium-falciparum|33-1-19',  // 微小巴贝虫图误挂到恶性疟原虫
]);

// 每菌限 12 张（多联图按出现顺序取前 N，保证形态/菌落/镜下多样）
const PER_MICROBE = 8;
const byId = new Map();
for (const r of matched) {
  if (!byId.has(r.id)) byId.set(r.id, []);
  byId.get(r.id).push(r);
}

// 拆分多联图图注："总标题 ×1000 A. xx; B. xx；C. xx" → { title, parts }
// 分隔形态：空格/分号/行首 + 「A.」或「A.」（点后空格可有可无）；字母须从 A 起连续（防 "E. coli" 误拆——
// E. coli 的 E 出现在 A 之后不连续位置时自动回退）
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

// 图注太长截断 & 生成说明（图号 + 图注）
function captionOf(r) {
  let t = (r.caption || '').replace(/\s+/g, ' ').trim();
  if (t.length > 110) t = t.slice(0, 108) + '…';
  return '图 ' + r.fig + '　' + t;
}

if (!DRY) fs.mkdirSync(OUT_DIR, { recursive: true });
const out = {}; // id -> [{文件, 说明, 来源}]
let copied = 0, missing = 0;
for (const [id, recs] of byId) {
  // 同一图号的多联图按组标 (i/n)，避免图注完全相同看起来像重复
  const figCount = new Map();
  for (const r of recs) { if (!EXCLUDE.has(id + '|' + r.fig)) figCount.set(r.fig, (figCount.get(r.fig) || 0) + 1); }
  const figSeen = new Map();
  const picked = [];
  const usedImg = new Set();
  // 预拆分各图号的分联说明：fig → { title, parts }
  const figSplit = new Map();
  for (const r of recs) {
    if (!figSplit.has(r.fig)) {
      const base = recs.filter(x => x.fig === r.fig).sort((a, b) => (b.caption || '').length - (a.caption || '').length)[0];
      figSplit.set(r.fig, splitSubs(base.caption));
    }
  }
  for (const r of recs) {
    if (EXCLUDE.has(id + '|' + r.fig)) continue;
    if (picked.length >= PER_MICROBE) break;
    if (usedImg.has(r.img)) continue; // 同图同菌只取一次（已在 parse 去重，双保险）
    const src = path.join(IMG_DIR, r.img + '.jpg');
    if (!fs.existsSync(src)) { missing++; continue; }
    const dst = path.join(OUT_DIR, r.img + '.jpg');
    if (!DRY && !fs.existsSync(dst)) {
      try {
        // 最大边 800px + 质量压缩
        execFileSync('sips', ['-Z', '800', '-s', 'formatOptions', '58', src, '--out', dst], { stdio: 'pipe' });
        copied++;
      } catch (e) {
        console.error('sips 失败:', r.img, String(e.message).slice(0, 80));
        continue;
      }
    }
    usedImg.add(r.img);
    const n = figCount.get(r.fig);
    const i = (figSeen.get(r.fig) || 0) + 1; figSeen.set(r.fig, i);
    const sp = figSplit.get(r.fig) || { title: '', parts: [] };
    let sub;
    if (n > 1 && sp.parts.length === n && sp.parts[i - 1]) {
      // 分联数与图片数吻合：每张图用自己的分联说明（A/B/C…），不再标 (i/n)
      sub = String.fromCharCode(65 + i - 1) + '. ' + sp.parts[i - 1];
    } else {
      sub = sp.title || (r.caption || ''); // 回退：整图图注（数量对不上时不猜）
    }
    let t = sub.replace(/\s+/g, ' ').trim();
    if (t.length > 110) t = t.slice(0, 108) + '…';
    const tag = n > 1 && sp.parts.length !== n ? '（' + i + '/' + n + '）' : '';
    picked.push({ 文件: 'img/atlas/' + r.img + '.jpg', 说明: '图 ' + r.fig + '　' + t + tag });
  }
  if (picked.length) out[id] = picked;
}

// 生成 data/photos-atlas.js
if (!DRY) {
  const js = 'window.DB = window.DB || {};\n' +
    '// 图谱形态图：来自《实用临床微生物学检验与图谱》人卫2025（资料库 93），仅供个人学习使用，请勿公开传播。\n' +
    '// 由 tools/parse-atlas.mjs + tools/sync-atlas-images.mjs 自动生成——手工改动会在下次同步时被覆盖；\n' +
    '// 新增菌种/图片后重跑两个脚本即可。图片文件在 img/atlas/（已压缩，原图在资料库 images/）。\n' +
    'window.DB.photosAtlas = ' + JSON.stringify(out, null, 1) + ';\n';
  fs.writeFileSync(path.join(root, 'data', 'photos-atlas.js'), js);
}

const nIds = Object.keys(out).length;
const nImgs = Object.values(out).reduce((s, v) => s + v.length, 0);
console.log(`菌种 ${nIds} 个，图片引用 ${nImgs} 条；本次新压缩 ${copied} 张${missing ? '，源图缺失 ' + missing : ''}`);
if (DRY) console.log('(dry run，未写文件)');
