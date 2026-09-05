#!/usr/bin/env node
// 批46 折点程序化比对：breakpoints.js 2B-5 组 vs M100 md 源表逐格 diff
global.window = { DB: {} };
require('/Users/juleyang/Projects/微生物学习软件/data/breakpoints.js');
const fs = require('fs');
const md = fs.readFileSync('/Users/juleyang/Documents/资料库/微生物/01-药敏标准-CLSI/M100(2026)-完整版.md', 'utf8');

// 提取 Table 2B-5 两个 <table> 块（1654 与 1660 行附近，锚：表标题后第一个 table 到 Abbreviations）
const secStart = md.indexOf('## Table 2B-5. MIC Breakpoints for Other Non-Enterobacterales');
const secEnd = md.indexOf('## Table 2C.', secStart);
const sec = md.slice(secStart, secEnd);
const tables = [...sec.matchAll(/<table>([\s\S]*?)<\/table>/g)].map(m => m[1]);
// 药物数据在第 2、3 个 table（第 1 个是 General Comment 里的 tier 表，无药物行）
const drugRows = [];
for (const t of tables) {
  for (const tr of t.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const cells = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => m[1].trim());
    // 药物行特征：首格为药物名（非空、非分组标题、非表头），后面 8 格
    if (cells.length >= 8 && /^[A-Z]/.test(cells[0]) && !/^(Antimicrobial|Disk Content|Testing)/.test(cells[0])
        && !/PENICILLINS|CEPHEMS|MONOBACTAMS|CARBAPENEMS|AMINOGLYCOSIDES|TETRACYCLINES|FLUOROQUINOLONES|FOLATE|PHENICOLS|β-LACTAM/.test(cells[0])) {
      drugRows.push({ name: cells[0], diskS: cells[2], diskI: cells[3], diskR: cells[4], s: cells[5], i: cells[6], r: cells[7] });
    }
  }
}
console.log('源表提取药物行数:', drugRows.length);

// 库内 2B-5 组
const grp = global.window.DB.breakpoints.find(g => g.CLSI表 === 'Table 2B-5');
if (!grp) { console.error('库内无 2B-5 组!'); process.exit(1); }

const norm = s => String(s||'').replace(/\s+/g,'').replace(/≤\s*/g,'≤').replace(/≥\s*/g,'≥').replace(/-/g,'–');
let errs = 0, checked = 0;
for (const d of grp.药物) {
  const en = d.药物.match(/\(([^)]+)\)/);
  const enName = en ? en[1] : d.药物;
  const src = drugRows.find(r => r.name.replace(/\*|\(U\)[a-z]?|\s*\(U\)\w?/g,'').trim().startsWith(enName.split('-')[0]) && r.name.replace(/[^A-Za-z]/g,'').toLowerCase().includes(enName.split('-')[0].toLowerCase().slice(0,6)));
  if (!src) { console.log('⚠ 源表未找到:', d.药物, '(可能为分组行/名称变体，需人工看)'); continue; }
  checked++;
  const diffs = [];
  if (norm(d.MIC_S) !== norm(src.s)) diffs.push(`S: 库=${d.MIC_S} 源=${src.s}`);
  if (norm(d.MIC_I).replace('—','') !== norm(src.i).replace('—','') && !(d.MIC_I==='—'&&src.i==='-')) diffs.push(`I: 库=${d.MIC_I} 源=${src.i}`);
  if (norm(d.MIC_R) !== norm(src.r)) diffs.push(`R: 库=${d.MIC_R} 源=${src.r}`);
  if (diffs.length) { errs++; console.log('✗', d.药物, diffs.join(' | ')); }
}
console.log(`逐格比对完成：${checked} 药，${errs} 处不一致`);
// 打印源行以供人工复核
console.log('\n源表行（人工复核用）:');
drugRows.forEach(r => console.log(`  ${r.name.padEnd(30)} S=${r.s} I=${r.i} R=${r.r}`));
