// 把 Bruker MBT DB8468（2969 种，MALDI-TOF 临床主库）并入菌名速查。
// 只取 英文名/中文名/革兰大类 三列——「需氧/厌氧」列不取，理由见 README 与提交说明：
// 该列 60% 缺失，且弯曲菌属 19 条无一标注「微需氧」、专性厌氧菌只标了一半，
// 写进教学库会误导。革兰大类列则抽查全部正确。
import fs from 'node:fs';
import path from 'node:path';

// 一次性合并脚本，保留以便复核来源与重跑（Bruker 表在仓库外，路径可用 argv 覆盖）：
//   node tools/merge-bruker-names.mjs [Bruker表.md]
// 注意：脚本对 data/microbe-names.js 就地改写且不幂等（重复跑会把别名追加两遍），
// 重跑前先 git checkout 该文件。
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.argv[2] || '/Users/juleyang/Desktop/细菌/markdown文件/Bruker MBT菌种库列表(2969种,中英对照)-DB8468-Feb2020.md';

// 现有条目
global.window = {};
await import(path.join(ROOT, 'data/microbe-names.js'));
const cur = global.window.DB.microbeNames;

// 解析 Bruker 表
const raw = fs.readFileSync(SRC, 'utf8');
const rows = [...raw.matchAll(/<tr>(.*?)<\/tr>/g)]
  .map((m) => [...m[1].matchAll(/<td[^>]*>(.*?)<\/td>/g)].map((c) => c[1]));
const bru = rows
  .filter((r) => r.length === 5 && /^\d+$/.test(r[0]))
  .map((r) => ({
    lat: r[1].trim(),
    // 〔勘误：应为「X」…〕→ 采纳勘误给出的正确名，而不是原表的错名
    cn: (() => {
      const fix = r[2].match(/〔勘误：应为「([^」]+)」/);
      if (fix) { return fix[1].trim(); }
      return r[2].replace(/〔勘误：[^〕]*〕/g, '').trim();
    })(),
    kind: r[3].replace('革兰阳性分枝杆菌', '分枝杆菌').trim()
  }));

const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

// 原文件有 34 处拉丁名带连字符，多数是 PDF 断行残留（Morganella mor-ganii、Aspergillus nidu-lans），
// 但也有合法的（B. cepacia-like、Varicella-zoster virus）。不靠猜：去掉连字符后若该名确实
// 出现在 Bruker 全表中，才认定是断行并修正；查不到就原样保留。
const bruSet = new Set(bru.map((b) => norm(b.lat)));
let dehyphened = 0;
for (const e of cur) {
  if (!/[a-z]-[a-z]/.test(e.拉丁名)) { continue; }
  const joined = e.拉丁名.replace(/([a-z])-([a-z])/g, '$1$2');
  if (bruSet.has(norm(joined))) { e.拉丁名 = joined; dehyphened++; }
}
console.log(`修正 PDF 断行造成的拉丁名连字符 ${dehyphened} 处（其余无佐证，保留原样）`);


// 原文件里同一拉丁名有 73 处重复，是同一菌的两种中文译法（烟曲霉/烟曲霉菌、
// 炭疽芽孢杆菌/炭疽芽胞杆菌…），会在速查里并排出现两条一模一样的链接。
// 归并为一条：本库 microbes.js 收录了就以本库名为准，否则取先出现者；另一种存为别名，
// 两个名字都还能搜到。
// 必须排在「去连字符」之后：mor-ganii 修成 morganii 后会与已有条目撞名，那 4 处也要一并归并。
await import(path.join(ROOT, 'data/microbes.js'));
const libNames = new Set((global.window.DB.microbes || []).map((m) => String(m.名称 || '').trim()));

const merged = new Map();
let collapsed = 0;
for (const e of cur) {
  const k = norm(e.拉丁名);
  const prev = merged.get(k);
  if (!prev) { merged.set(k, e); continue; }
  collapsed++;
  const [keep, drop] = libNames.has(e.名称) && !libNames.has(prev.名称) ? [e, prev] : [prev, e];
  if (drop.名称 && drop.名称 !== keep.名称) {
    keep.别名 = keep.别名 ? keep.别名 + '、' + drop.名称 : drop.名称;
  }
  merged.set(k, keep);
}
cur.length = 0;
cur.push(...merged.values());
console.log(`归并原文件重复条目 ${collapsed} 处`);


// 索引必须在改完拉丁名之后再建：否则键仍是旧的带连字符形式，
// Bruker 的干净拉丁名匹配不上，会被当成新条目插入，凭空造出重复。
const byLat = new Map();
cur.forEach((x) => byLat.set(norm(x.拉丁名), x));

// 中文名 → 条目，用于「同名但拉丁名写法不同」的归并。原文件有两类不完整写法：
//   ① 缩写属名「A. parvus」（源自 MCM 索引，重复属名会缩写）——mnTarget 认不出「属 种」
//      格式，只能回落 PubMed 检索，点进去不是分类页；
//   ② PDF 断行残留「Actinomyces od-ontolyticus」。
// Bruker 表给的是完整、干净的拉丁名，正好把这两类补齐。
const byCn = new Map();
cur.forEach((x) => { if (!byCn.has(x.名称)) { byCn.set(x.名称, x); } });
// 归一：去掉 sp/spp/sp[3] 泛指后缀、[ana]/[teleo] 无性型有性型标注、断行连字符与多余空格
const bare = (s) => norm(s)
  .replace(/\[(ana|teleo)\][^[]*$/, '')      // Aspergillus nidulans[ana]Emericella nidulans[teleo]
  .replace(/\s*\[\d+\]$/, '')                // Micrococcus sp[3]
  .replace(/\s*\b(sp|spp)\.?$/, '')
  .replace(/-/g, '')
  .replace(/\s+/g, ' ')
  .trim();
// 「A.putredinis」「A. putredinis」与「Alistipes putredinis」是否指同一菌
function compatible(a, b) {
  const x = bare(a), y = bare(b);
  if (x === y) { return true; }
  if (x.replace(/\s/g, '') === y.replace(/\s/g, '')) { return true; }  // 「F. gonidia forman」
  // 缩写属名：句点后可有可无空格
  const ABBR = /^([a-z])\.\s*(.+)$/, FULL = /^([a-z])[a-z]+\s+(.+)$/;
  const pair = (p, q) => {
    const m = p.match(ABBR), n = q.match(FULL);
    return !!(m && n && m[1] === n[1] && m[2] === n[2]);
  };
  return pair(x, y) || pair(y, x);
}
// 拉丁名取更完整的一个（非缩写、无断行连字符、非 sp 泛指）
function betterLat(a, b) {
  const score = (s) => (/^[a-z]\.?\s/i.test(s) ? 0 : 2) + (s.includes('-') ? 0 : 1) + (/\s(sp|spp)\.?$/i.test(s) ? 0 : 1);
  return score(b) > score(a) ? b : a;
}

// 机械规则合不掉、但确属同一菌的组合。逐条列明依据，宁可显式也不要再加正则。
// 形如 [保留的拉丁名, 并入的拉丁名, 依据]
const SAME = [
  ['Aspergillus nidu-lans', 'Aspergillus nidulans[ana]Emericella nidulans[teleo]', '无性型/有性型同一菌；保留名随后规范化为 Aspergillus nidulans', 'Aspergillus nidulans'],
  ['Nakaseomyces glabratus', 'Candida glabrata', '光滑念珠菌重命名，本库 microbes.js 已用新名'],
  ['Pichia kudriavzevii', 'Candida krusei', '克柔念珠菌重命名，同上'],
  ['Clavispora lusitaniae', 'Candida lusitaniae', '葡萄牙念珠菌重命名，同上'],
  ['Diutina rugosa', 'Candida rugosa', '皱褶念珠菌重命名，同上'],
  ['Rhodococcus equi', 'Rhodococcus hoagii', 'ICSP 司法委员会 Opinion 106 否决 hoagii 加词，equi 为有效名 (doi:10.1099/ijsem.0.005197)'],
  ['Mycobacterium abscessus complex', 'Mycobacterium abscessus', '本库 microbes.js 以复合群收录'],
  ['Fusobacterium gonidiaformans', 'F. gonidia forman', '原文件拼写残缺（forman 少 s、属名缩写且断词）'],
  ['Serratia ureilytica', 'Seratia ureilytica', '原文件属名拼写错误（Seratia → Serratia）'],
  ['Cardiobacterium sp', 'Cardibacterium', '原文件属名拼写错误（Cardibacterium → Cardiobacterium）'],
  ['Clostridium sphenoides', 'C. sphnoides', '原文件种加词拼写错误（sphnoides → sphenoides）'],
  ['Moraxella plurianimalium', 'Moraxella pluranimalium', '同一菌的拼写变体'],
  ['Streptococcus salivarius_ssp_thermophilus', 'S. salivarius subsp. thermophilus', '同一亚种的两种书写']
];

let updated = 0, added = 0, aliased = 0, fixedLat = 0;
for (const b of bru) {
  const key = norm(b.lat);
  let hit = byLat.get(key);
  // 拉丁名对不上，再看中文名是否指同一菌（缩写/断行/sp 差异）
  if (!hit) {
    const c = byCn.get(b.cn);
    if (c && compatible(c.拉丁名, b.lat)) {
      const better = betterLat(c.拉丁名, b.lat);
      if (better !== c.拉丁名) { c.拉丁名 = better; fixedLat++; }
      hit = c;
    }
  }
  if (hit) {
    // 本库已有：保留原中文名（多源自 MCM 中文版，较厂商产品表权威），
    // Bruker 的不同译名存为别名，否则按 Bruker 软件打印的名字搜不到。
    if (b.cn && b.cn !== hit.名称) { hit.别名 = b.cn; aliased++; }
    if (b.kind) { hit.类 = b.kind; }
    hit.MALDI = 1;
    updated++;
  } else {
    const e = { 名称: b.cn || b.lat, 拉丁名: b.lat };
    if (b.kind) { e.类 = b.kind; }
    e.MALDI = 1;
    byLat.set(key, e);
    cur.push(e);
    added++;
  }
}

// 应用显式同义表
const idx = new Map();
cur.forEach((x) => idx.set(norm(x.拉丁名), x));
let sameMerged = 0;
for (const [keepLat, dropLat, , canonical] of SAME) {
  const keep = idx.get(norm(keepLat)), drop = idx.get(norm(dropLat));
  if (!keep || !drop || keep === drop) { continue; }
  // 两个拉丁名都要能搜到，别名里存被并入的那个
  const extra = [drop.拉丁名, drop.名称 !== keep.名称 ? drop.名称 : '', drop.别名 || ''].filter(Boolean).join('、');
  keep.别名 = [keep.别名, extra].filter(Boolean).join('、');
  if (!keep.类 && drop.类) { keep.类 = drop.类; }
  if (!keep.MALDI && drop.MALDI) { keep.MALDI = 1; }
  if (canonical) { keep.拉丁名 = canonical; }
  cur.splice(cur.indexOf(drop), 1);
  idx.delete(norm(dropLat));
  sameMerged++;
}
console.log(`按显式同义表合并 ${sameMerged} 组`);

// 按拉丁名字母序。排序键与 tests/data-integrity.test.js 的断言保持一致：
// 去掉非字母再比较，这样「A. wautersii」和「A.actinomycetemcomitans」按 awautersii /
// aactinomycetemcomitans 排，而不会因空格、句点的排序权重不同而与断言打架。
const sortKey = (m) => String(m.拉丁名 || '').toLowerCase().replace(/[^a-z]/g, '');
cur.sort((a, b) => (sortKey(a) < sortKey(b) ? -1 : sortKey(a) > sortKey(b) ? 1 : 0));

const header = `window.DB = window.DB || {};
// 菌名速查：微生物名称索引（中文 + 拉丁），按拉丁名字母顺序排序。跳转见 app.js mnTarget()：本库详情 / NCBI Taxonomy / PubMed。
// 汇总自本软件详情模块 +《临床微生物学手册》第12版（第5章临床相关微生物表 + 全书索引）
//   + Bruker MBT 临床主库 DB8468（2969 种，Feb 2020）——即 MALDI-TOF 能报出的名字，标 MALDI:1。
// 字段：名称=首选中文名；别名=Bruker 软件打印的不同译法（供检索命中）；类=革兰大类；MALDI=1 表示在 Bruker 主库中。
// 注：Bruker 原表的「需氧/厌氧」列未采用——该列 60% 缺失，且弯曲菌属 19 条无一标注「微需氧」、
//   专性厌氧菌仅半数标注，作为教学内容不可靠。革兰大类列经抽查可靠，故采用。
// 含已从「微生物分类」详情精简移除的菌种；此为名称快照，与详情模块相互独立。
window.DB.microbeNames = `;

const body = '[' + cur.map((e) => JSON.stringify(e)).join(', ') + '];\n';
fs.writeFileSync(path.join(ROOT, 'data/microbe-names.js'), header + body);

console.log(`原有 ${cur.length - added} 条；Bruker 2969 条中已有 ${updated}、新增 ${added}`);
console.log(`合计 ${cur.length} 条，其中 ${aliased} 条记录了 Bruker 异名`);
console.log(`文件 ${(fs.statSync(path.join(ROOT, 'data/microbe-names.js')).size / 1024).toFixed(0)} KB`);
