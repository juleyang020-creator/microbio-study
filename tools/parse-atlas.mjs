#!/usr/bin/env node
// 从图谱类书籍分章 md 中提取 图片↔菌种 映射（支持双书源）：
//   93《实用临床微生物学检验与图谱》人卫2025：第 12–33 章菌种各论
//   94《临床微生物学诊断与图解》第5版：细菌各论 5–19 / 真菌各论 25–32 / 螺旋体·支原体·立克次体·原虫·蠕虫 48–52
// 规则：
//   1) 技术方法篇章节的试验示意图/培养基质控图不挂菌（按书的章节布局圈定各论范围）
//   2) 图注 = "图 X-Y-Z" 行 + 后续 1~8 行中以 A./B./…/分号开头的分图行（纯正文行不并入，避免正文菌名误伤）
//   3) 匹配：软件菌名（含别名，长名优先）→ id；一张多联图可挂多个菌
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);
const BOOKS = [
  {
    key: '93',
    dir: path.join(process.env.HOME, 'Documents/资料库/微生物/93-实用临床微生物学检验与图谱-人卫2025'),
    // 34 章起为药敏方法篇（试验演示图不挂菌）、42 章为组织病理方法篇（方法图不挂菌），
    // 曾因这些章的试验示意图/病例图误挂各菌，2026-08-28 全量审计后收窄。
    okChapters: n => n >= 12 && n <= 33,
  },
  {
    key: '94',
    dir: path.join(process.env.HOME, 'Documents/资料库/微生物/94-临床微生物学诊断与图解-第5版'),
    // 各论篇：细菌 5–19（4 章标本检验=方法篇不挂）、真菌 25–32（33 章起药敏方法篇）；
    // 48 螺旋体 / 49 支原体衣原体 / 50 立克次体 / 51 原虫 / 52 蠕虫（53 不存在，全书 52 章）
    okChapters: n => (n >= 5 && n <= 19) || (n >= 25 && n <= 32) || (n >= 48 && n <= 52),
  },
];

global.window = { DB: {} };
for (const f of ['microbes', 'microbes-gram-positive', 'microbes-gram-negative', 'microbes-anaerobe', 'microbes-atypical', 'microbes-fungi', 'microbes-parasite', 'microbes-virus', 'microbes-misc', 'microbe-names']) require(path.join(root, 'data', f + '.js'));
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
  // 先按「位置」收集所有命中，再剔除被更长名包含的短名命中
  // （如「副流感嗜血杆菌」包含「流感嗜血杆菌」，短名命中落在长名区间内时丢弃）。
  const hits = []; // {id, name, start, end}
  for (const nm of CN_SORTED) {
    let from = 0;
    for (;;) {
      const p = text.indexOf(nm, from);
      if (p < 0) break;
      hits.push({ id: name2id.get(nm), name: nm, start: p, end: p + nm.length });
      from = p + 1;
    }
  }
  const kept = hits.filter(h => !hits.some(o => o !== h && o.start <= h.start && o.end >= h.end && (o.end - o.start) > (h.end - h.start)));
  const ids = new Map();
  for (const h of kept) if (!ids.has(h.id)) ids.set(h.id, h.name);
  for (const { lat, id } of LAT_KEYS) {
    if (lat.length >= 8 && text.toLowerCase().includes(lat) && !ids.has(id)) ids.set(id, lat);
  }
  return [...ids.entries()];
}

// 清洗分图/标题文本中的非归属语境：括号内含「对照/混合」的整段括注剔除；
// 紧跟菌名的 (阳性对照)/(阴性对照) 标签连同菌名一起剔除不了，但括注本身
// 会被去掉，剩下的「左为金黄色葡萄球菌」这类对照描述由 EXCLUDE 定点处理。
function cleanCtx(text) {
  return text.replace(/[（(][^（）()]*?(?:对照|混合)[^（）()]*?[）)]/g, ' ');
}

// 拆分多联图图注："总标题 ×1000 A. xx; B. xx；C. xx" → { title, parts }
// 分隔形态：空格/分号/冒号/句号/逗号/行首 + 「A.」（点后空格可有可无）；字母须从 A 起连续（防 "E. coli" 误拆）。
// 94 书变体：小写分联 a./b.（图 25-1-4）；「(18～24 h)。A. xx」句号后接分联（图 12-4-8）；
// 「B、C.」连排两字母共享一段文本（图 51-1-3，拆出 parts 数 < 图片数自动退回，不会错挂）。
function splitSubs(raw) {
  const t = (raw || '').replace(/\s+/g, ' ').trim();
  const re = /(?:^|[\s;；:：。，,])([A-Ia-i])[\.、．]\s*/g;
  const marks = [];
  let mm;
  while ((mm = re.exec(t))) marks.push({ letter: mm[1], start: mm.index + mm[0].length });
  if (marks.length < 2) return { title: t, parts: [] };
  // 大小写须统一，从首字母（A 或 a）起连续
  const lowerCase = marks[0].letter === marks[0].letter.toLowerCase();
  const base = lowerCase ? 'a' : 'A';
  let end = 0;
  for (let k = 1; k < marks.length; k++) {
    const want = String.fromCharCode(base.charCodeAt(0) + k);
    if (marks[k].letter !== want) break;
    end = k;
  }
  if (end < 1) return { title: t, parts: [] };
  const parts = [];
  for (let k = 0; k <= end; k++) {
    const s = marks[k].start;
    const e = k < end ? marks[k + 1].start - 2 : t.length; // -2：吃掉下一分联前的分隔符
    parts.push(t.slice(s, Math.max(s, e)).replace(/[;；\s]+$/, ''));
  }
  return { title: t.slice(0, Math.max(0, marks[0].start - 2)).replace(/[;；:：.\s]+$/, ''), parts };
}

// ---- 解析分章（各书各论章范围见 BOOKS 注释）----
const results = [];
for (const BOOK of BOOKS) {
const files = fs.readdirSync(path.join(BOOK.dir, '分章')).filter(f => f.endsWith('.md')).sort()
  .filter(f => BOOK.okChapters(parseInt(f.split('-')[0], 10)));
for (const f of files) {
  const lines = fs.readFileSync(path.join(BOOK.dir, '分章', f), 'utf8').split('\n');
  const chapter = f.split('-')[0];
  let pendingImgs = [];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const m = ln.match(/!\[[^\]]*\]\((?:images\/)?([a-f0-9]{40,})\.jpg\)/);
    if (m) { pendingImgs.push(m[1]); continue; }
    const cap = ln.match(/^图\s*(\d+-\d+-\d+)/);
    if (cap && pendingImgs.length) {
      // 聚合图注首行 + 后续分图行（A. / B. … 或以分号/× 结尾的短行），最多 8 行
      // （2026-08-28：4→8，6 联图如 25-1-4 近平滑复合群 A~F 曾拆不开而整图误挂全部成员）
      const parts = [ln.replace(/^图\s*\d+-\d+-\d+[、.．]?\s*/, '')];
      for (let j = i + 1; j < Math.min(i + 9, lines.length); j++) {
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
      // 例外：图片数=1 且分联数≥2 = 多菌合成演示版面（如 5-1-2 黏液型菌落三联合成图、
      // 7-1-2 二十联镜下总览），单张 jpg 无法对应到某一联——不挂任何菌（曾整图挂给全部 20 菌）。
      const subImgs = pendingImgs.length;
      const subs = splitSubs(capText);
      if (subImgs === 1 && subs.parts.length >= 2) {
        // 图片数=1 且分联数≥2 = 多联合成版面，按书分支：
        //  93 书：保持旧版整图匹配行为（如 14-2-5 六联棒杆菌组图挂全部成员菌、20-12-4 九联乳杆菌
        //   组图——用户半年审阅认可的惯例，2026-09-03 回归实测收紧会误杀既有挂载）；
        //  94 书：新源无历史基线，分联命中同一菌（组图）则挂，命中多个不同菌（如 5-1-2 黏液型
        //   菌落三联=金葡/肺链/溶血葡、6-0-13 六联奈瑟鉴别）= 演示版面，跳过。
        if (BOOK.key === '94') {
          const partHits = new Set();
          for (const p of subs.parts) for (const [pid] of matchAll(cleanCtx(p))) partHits.add(pid);
          if (partHits.size > 1) { pendingImgs = []; continue; }
          const hits94 = partHits.size === 1 ? [...partHits].map(id => [id, subs.title]) : matchAll(cleanCtx(subs.title));
          for (const [id, by] of hits94) {
            results.push({ img: pendingImgs[0], fig: cap[1], caption: capText.slice(0, 200), chapter, id, by, book: BOOK.key });
          }
          pendingImgs = [];
          continue;
        }
      }
      if (subImgs >= 2 && subs.parts.length === subImgs) {
        // 标题含「复合群」时（如「近平滑念珠菌复合群的形态特征」），标题名指整个群
        // 而非模式种——分图只按自己的文本匹配，不继承标题，避免复合群成员的分图
        // 全部误挂给模式种（2026-08-28：D 似平滑/E 拟平滑/F 罗德酵母曾全挂近平滑）。
        const isComplex = /复合群/.test(subs.title);
        pendingImgs.forEach(function (img, k) {
          const ctx = isComplex ? subs.parts[k] : '图 ' + subs.title + ' ' + subs.parts[k];
          const subHits = matchAll(cleanCtx(ctx));
          for (const [id, by] of subHits) {
            results.push({ img, fig: cap[1], caption: capText.slice(0, 200), sub: subs.parts[k], chapter, id, by, book: BOOK.key });
          }
        });
      } else {
        // 数量对不上（OCR 丢部分小图、B、C. 共享文本等）：退回整图匹配（旧版行为，运行半年稳定）——
        // 多联组图（A~F 每联一种菌）整图挂给每个成员菌，说明文字按分联位置拆。
        // 泛标题演示图不会走到这（subImgs==1 分支已拦截）；标题段限流的方案实测会丢
        // 「颗粒链菌的形态特征」这类靠分联种名命中的正确挂载（12-7-2、12-9-1，2026-09-03 回归）。
        // 附加护栏（仅 94 书）：≥8 联演示总览图且命中菌数>图片数（如 7-1-2 二十联仅 2 张 jpg）
        // ——跳过，避免 20 菌互相误挂。93 书的九联组图（20-12-4 乳杆菌、20-12-5）是既有挂载惯例，
        // 不拦（2026-09-03 回归实测：拦了会丢 6 个乳杆菌种 + 嗜酸乳杆菌的既有图）。
        const hits = matchAll(cleanCtx(capText));
        if (!(BOOK.key === '94' && subs.parts.length >= 8 && hits.length > pendingImgs.length)) {
          for (const img of pendingImgs) {
            for (const [id, by] of hits) {
              results.push({ img, fig: cap[1], caption: capText.slice(0, 200), chapter, id, by, book: BOOK.key });
            }
          }
        }
      }
      pendingImgs = [];
    }
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
