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
  // 批28 新增：链球菌/嗜血批次审计补充
  'streptococcus-porcinus|12-4-14',  // 第七分联实为「假豕链球菌」（S. pseudoporcinus≠豕链球菌）
  'streptococcus-porcinus|12-4-17',  // CAMP 试验方法图（多菌对照演示）
  'streptococcus-porcinus|12-4-22',  // 假肺炎链球菌胆汁溶菌试验，正文串扰
  'streptococcus-infantarius|12-4-22', // 同上
  'strep-dysgalactiae|12-4-22',      // 同上（此前漏加）
  'flavobacterium|17-9-2',         // 金黄杆菌属万古霉素药敏图，正文段（伊丽莎白金菌与短稳杆菌鉴别）串扰
  'streptomyces|14-8-14',          // 诺卡菌肉汤生长图，图注正文串扰（「与链霉菌属鉴别」段落）
  'staph-aureus|13-2-2',            // 卡他莫拉菌鉴别试验，金葡仅为 DNA 酶阳性对照
  'achromobacter-xylosoxidans|17-11-1', // 放射根瘤菌图误挂（章节正文串扰）
  'taenia-saginata|33-2-19',        // 猪带绦虫染色图误挂到牛带绦虫
  'plasmodium-falciparum|33-1-19',  // 微小巴贝虫图误挂到恶性疟原虫
  'strep-intermedius|12-4-22',      // 假肺炎链球菌胆汁溶菌试验误挂（正文段串扰）
  // ==== 2026-08-28 全量审计补充（对照/混合/卫星试验指示菌等非归属语境）====
  'enterococcus-faecalis|14-17-5',  // 沙尔放线棒杆菌镜下图，粪肠球菌仅为混合涂片提及（用户发现）
  'e-coli|14-17-5',                 // 同上，大肠埃希菌为混合涂片提及
  'strep-anginosus|12-4-22',        // 假肺炎链球菌胆汁溶菌试验，正文段提及咽峡炎链球菌群
  'strep-constellatus|12-4-22',     // 同上
  'strep-agalactiae|12-4-17',       // CAMP 试验方法图（多菌对照演示）
  'corynebacterium-pseudotuberculosis|12-4-17', // 同上
  'streptococcus-suis|12-4-17',     // 同上
  'staph-aureus|14-2-9',            // 棒杆菌 CAMP 试验图，金葡为指示菌
  'staph-lugdunensis|14-2-9',       // 同上
  'strep-agalactiae|14-2-9',        // 同上
  'corynebacterium-pseudotuberculosis|14-2-9', // 同上
  'staph-aureus|18-1-6',            // 卫星试验指示菌演示图（多菌）
  'staph-epidermidis|18-1-6',       // 同上
  'pseudomonas-aeruginosa|18-1-6',  // 同上
  'acinetobacter-baumannii|18-1-6', // 同上
  'moraxella-catarrhalis|18-1-6',   // 同上
  'stenotrophomonas-maltophilia|18-1-6', // 同上
  'staph-aureus|18-1-8',            // 嗜血杆菌溶血试验（卫星现象），金葡为指示菌
  'staph-aureus|17-3-5',            // 不动杆菌 CAMP 演示图，金葡为对照
  'stenotrophomonas-maltophilia|17-2-2', // 荧光素试验方法图
  'cryptococcus-neoformans|25-2-3', // 格特隐球菌 CGB 平板鉴别图，新型隐球菌为对比株
  'chryseobacterium-indologenes|17-9-2', // 万古敏感性试验演示图
  'chryseobacterium-gleum|17-9-2',  // 同上
  'scedosporium-apiospermum|27-27-1', // 赛多孢示意图（含多育节荚孢霉示意）
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
  const SUB_EXCLUDE = [
    // 分联说明尾部粘连相邻菌正文（源书 OCR 段落粘连）：图片归属正确，仅截断说明文字
    // [id, 图号, 说明截断锚点]
    ['trichophyton-schoenleinii', '26-1-4', ' 5. 紫色毛癣菌'],
    ['trichophyton-violaceum', '26-1-4', ' 5. 紫色毛癣菌'],
    ['microsporum-nanum', '26-3-3', ' 4. 杂色小孢子菌'],
  ];
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
    // 分联说明尾部粘连相邻菌正文时截断（SUB_EXCLUDE trim 模式）
    const tr = SUB_EXCLUDE.find(([sid, fig, anchor]) => id === sid && r.fig === fig && (r.sub || '').includes(anchor));
    if (tr && r.sub) r.sub = r.sub.slice(0, r.sub.indexOf(tr[2]));
    // 优先用 parse 阶段记下的分联文本（r.sub）——联图按联归属菌种后，
    // 一联只命中一个菌时（如 3 联图 C 联腐生葡萄球菌），该图的说明就用这一联。
    if (r.sub) {
      sub = r.sub;
    } else if (n > 1 && sp.parts.length === n && sp.parts[i - 1]) {
      // 该菌命中了整图图注（多菌联图）：按位置取分联说明（A/B/C…），不标 (i/n)
      sub = String.fromCharCode(65 + i - 1) + '. ' + sp.parts[i - 1];
    } else {
      sub = sp.title || (r.caption || ''); // 回退：整图图注（数量对不上时不猜）
    }
    let t = sub.replace(/\s+/g, ' ').trim();
    if (t.length > 110) t = t.slice(0, 108) + '…';
    const tag = !r.sub && n > 1 && sp.parts.length !== n ? '（' + i + '/' + n + '）' : '';
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
