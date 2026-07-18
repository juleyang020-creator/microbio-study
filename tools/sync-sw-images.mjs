// 把 sw.js 的 IMAGE_ASSETS 数组与 img/ 下实际的 svg 文件同步。
// 示意图数量已上百，手工维护这份清单必然漏项（漏了就离线打不开图）。
// 形态学照片（img/photo-*.webp）按设计不进预缓存，故此处只同步 svg。
//   node tools/sync-sw-images.mjs         # 写回 sw.js
//   node tools/sync-sw-images.mjs --check # 只校验，不一致则退出码 1（供 release-check 用）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SW = path.join(ROOT, 'sw.js');

const files = fs.readdirSync(path.join(ROOT, 'img'))
  .filter((f) => f.endsWith('.svg')).sort();
const block = 'var IMAGE_ASSETS = [\n'
  + files.map((f) => `  './img/${f}'`).join(',\n')
  + '\n];';

const src = fs.readFileSync(SW, 'utf8');
const re = /var IMAGE_ASSETS = \[[\s\S]*?\n\];/;
if (!re.test(src)) {
  console.error('未在 sw.js 中找到 IMAGE_ASSETS 数组');
  process.exit(2);
}
const next = src.replace(re, block);

if (process.argv.includes('--check')) {
  if (next === src) { console.log(`sw.js IMAGE_ASSETS 已同步（${files.length} 张 svg）`); process.exit(0); }
  console.error('sw.js IMAGE_ASSETS 与 img/ 不一致，请运行 node tools/sync-sw-images.mjs');
  process.exit(1);
}

if (next === src) { console.log(`无需改动（${files.length} 张 svg）`); }
else { fs.writeFileSync(SW, next); console.log(`已同步 sw.js IMAGE_ASSETS → ${files.length} 张 svg`); }
