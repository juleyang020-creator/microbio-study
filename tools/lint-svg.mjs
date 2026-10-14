// SVG 教学示意图检查器（开发期工具，不参与 app 运行）。
// 盲写/生成 SVG 最常见的缺陷是「文字互相重叠」和「文字超出画布」，肉眼逐张看不现实，
// 这里用估算的文本包围盒做机械检查。用法：
//   node tools/lint-svg.mjs            # 检查 img/ 下全部 svg
//   node tools/lint-svg.mjs img/a.svg  # 只查指定文件
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONT_FLOOR = 9.5;          // 最小字号（SVG 坐标系内）
const OVERLAP_TOL = 0.28;        // 允许的重叠面积比例（小于此视为擦边，不报）

// 估算字符宽度：CJK/全角约 1.0em，ASCII 约 0.55em，标点介于其间
function textWidth(s, fs) {
  let w = 0;
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (c > 0x2e80) w += 1.0;                 // CJK、全角标点
    else if (/[A-Za-z0-9]/.test(ch)) w += 0.55;
    else if (ch === ' ') w += 0.28;
    else w += 0.45;                            // 其它半角符号
  }
  return w * fs;
}

function attrs(tag) {
  const o = {};
  for (const m of tag.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) o[m[1]] = m[2];
  return o;
}

// 解析 transform：仅支持 translate（含 scale/rotate 的元素跳过检查，避免误报）
function parseTransform(tr) {
  if (!tr) return { dx: 0, dy: 0, skip: false };
  if (/scale|rotate|matrix|skew/.test(tr)) return { dx: 0, dy: 0, skip: true };
  let dx = 0, dy = 0;
  for (const m of tr.matchAll(/translate\(\s*([-\d.]+)[\s,]+([-\d.]+)?\s*\)/g)) {
    dx += parseFloat(m[1]) || 0;
    dy += parseFloat(m[2] || 0) || 0;
  }
  return { dx, dy, skip: false };
}

// 取出 <text>（含 tspan 与 tspan 后尾文）与位置；累加祖先 <g> 的 translate 偏移与 font-size/text-anchor 继承
function parseTexts(svg) {
  const out = [];
  const stack = [{ dx: 0, dy: 0, skip: false, fs: 11, anchor: 'start' }];
  const ctxAt = new Map();
  for (const tm of svg.matchAll(/<(\/?)(g|text|rect)\b([^>]*?)(\/?)>/g)) {
    const closing = tm[1], tag = tm[2], attrStr = tm[3], selfClose = tm[4];
    const top = stack[stack.length - 1];
    if (tag === 'g') {
      if (closing) { if (stack.length > 1) stack.pop(); }
      else if (!selfClose) {
        const ga = attrs('<g ' + attrStr + '>');
        const t = parseTransform(ga.transform);
        stack.push({
          dx: top.dx + t.dx,
          dy: top.dy + t.dy,
          skip: top.skip || t.skip || Boolean(ga['clip-path']),
          fs: ga['font-size'] ? parseFloat(ga['font-size']) : top.fs,
          anchor: ga['text-anchor'] || top.anchor
        });
      }
    } else if ((tag === 'text' || tag === 'rect') && !closing) {
      const ta = attrs('<' + tag + ' ' + attrStr + '>');
      const t = parseTransform(ta.transform);
      ctxAt.set(tm.index, {
        dx: top.dx + t.dx,
        dy: top.dy + t.dy,
        skip: top.skip || t.skip || Boolean(ta['clip-path']),
        fs: ta['font-size'] ? parseFloat(ta['font-size']) : top.fs,
        anchor: ta['text-anchor'] || top.anchor
      });
    }
  }

  for (const m of svg.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)) {
    const ctx = ctxAt.get(m.index) || { dx: 0, dy: 0, skip: false, fs: 11, anchor: 'start' };
    if (ctx.skip) continue;                       // 含 scale/rotate，跳过
    const a = attrs('<text ' + m[1] + '>');
    const raw = m[2];
    const base = {
      x: parseFloat(a.x || 0),
      y: parseFloat(a.y || 0),
      fs: a['font-size'] ? parseFloat(a['font-size']) : ctx.fs,
      anchor: a['text-anchor'] || ctx.anchor
    };
    if (/<tspan\b/.test(raw)) {
      // 拆分为交替的纯文本片段与 <tspan> 片段，避免漏掉 </tspan> 后的父节点尾文
      const tokens = raw.split(/(<tspan\b[^>]*>[\s\S]*?<\/tspan>)/g);
      // 將同一行（无独立 x/y/dy）的连续片段合并按整行锚点计算，有独立 x/y/dy 的开启新行
      const lines = [];
      let curLine = { x: base.x, y: base.y, fs: base.fs, anchor: base.anchor, text: '', width: 0 };
      for (const tok of tokens) {
        if (!tok) continue;
        const sp = tok.match(/^<tspan\b([^>]*)>([\s\S]*?)<\/tspan>$/);
        if (sp) {
          const sa = attrs('<tspan ' + sp[1] + '>');
          const t = sp[2].replace(/<[^>]+>/g, '');
          if (!t.trim()) continue;
          const fs = sa['font-size'] ? parseFloat(sa['font-size']) : base.fs;
          const hasNewPos = sa.x != null || sa.y != null || sa.dy != null;
          if (hasNewPos) {
            if (curLine.text.trim()) lines.push(curLine);
            const nx = sa.x != null ? parseFloat(sa.x) : curLine.x;
            const ny = sa.y != null ? parseFloat(sa.y)
              : (sa.dy != null ? curLine.y + parseFloat(sa.dy) : curLine.y);
            curLine = {
              x: nx, y: ny, fs,
              anchor: sa['text-anchor'] || base.anchor,
              text: t,
              width: textWidth(t, fs)
            };
          } else {
            curLine.text += t;
            curLine.width += textWidth(t, fs);
            if (fs > curLine.fs) curLine.fs = fs;
          }
        } else {
          const t = tok.replace(/<[^>]+>/g, '');
          if (!t.trim()) continue;
          curLine.text += t;
          curLine.width += textWidth(t, base.fs);
        }
      }
      if (curLine.text.trim()) lines.push(curLine);
      for (const ln of lines) {
        out.push({
          text: ln.text.trim(),
          x: ln.x + ctx.dx,
          y: ln.y + ctx.dy,
          fs: ln.fs,
          anchor: ln.anchor,
          w: ln.width,
          order: m.index
        });
      }
    } else {
      const t = raw.replace(/<[^>]+>/g, '').trim();
      if (t) out.push({ text: t, ...base, x: base.x + ctx.dx, y: base.y + ctx.dy, w: textWidth(t, base.fs), order: m.index });
    }
  }
  return {
    texts: out.map((t) => {
      const w = t.w != null ? t.w : textWidth(t.text, t.fs);
      let x0 = t.x;
      if (t.anchor === 'middle') x0 = t.x - w / 2;
      else if (t.anchor === 'end') x0 = t.x - w;
      // 基线在 y，字形大致占 [y-0.80fs, y+0.20fs]
      return { ...t, x0, x1: x0 + w, y0: t.y - t.fs * 0.80, y1: t.y + t.fs * 0.20, w, h: t.fs };
    }),
    ctxAt
  };
}

function overlapArea(a, b) {
  const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  return ox > 0 && oy > 0 ? ox * oy : 0;
}

export function lintSvg(file) {
  const svg = fs.readFileSync(file, 'utf8');
  const issues = [];
  const name = path.basename(file);

  // 0) XML 良构性：文本节点里裸的 < 或 > 会让整张图在浏览器中直接不渲染，
  //    而看代码很难发现（曾把「60–80」改成「60–<80」导致整图空白）。
  //    正则区分不了标签内外，这里用状态机逐字扫描。
  {
    let inTag = false, inQuote = '', bad = -1;
    for (let i = 0; i < svg.length && bad < 0; i++) {
      const c = svg[i];
      if (inTag) {
        if (inQuote) { if (c === inQuote) inQuote = ''; }
        else if (c === '"' || c === "'") inQuote = c;
        else if (c === '>') inTag = false;
      } else if (c === '<') {
        // 合法标签起始：字母、/、!、?
        if (/[A-Za-z/!?]/.test(svg[i + 1] || '')) inTag = true;
        else bad = i;
      } else if (c === '>') {
        bad = i;                       // 文本节点中的裸 >
      }
    }
    if (bad >= 0) {
      const ctx = svg.slice(Math.max(0, bad - 35), bad + 35).replace(/\n/g, ' ');
      issues.push({ sev: 'ERR', msg: `XML 非法字符「${svg[bad]}」未转义（应写 &lt; / &gt;）：…${ctx}…` });
    }
  }

  const vb = svg.match(/viewBox="([\d.\-]+) ([\d.\-]+) ([\d.]+) ([\d.]+)"/);
  if (!vb) issues.push({ sev: 'ERR', msg: '缺少 viewBox（无法响应式缩放）' });
  if (!/<title>/.test(svg)) issues.push({ sev: 'WARN', msg: '缺少 <title>（无障碍）' });

  const W = vb ? parseFloat(vb[3]) : 0;
  const H = vb ? parseFloat(vb[4]) : 0;
  const { texts, ctxAt } = parseTexts(svg);

  // 1) 字号下限
  for (const t of texts) {
    if (t.fs < FONT_FLOOR) {
      issues.push({ sev: 'WARN', msg: `字号 ${t.fs} < ${FONT_FLOOR}：「${t.text.slice(0, 18)}」` });
    }
  }
  // 2) 超出画布
  for (const t of texts) {
    if (W && (t.x0 < -1 || t.x1 > W + 1 || t.y0 < -1 || t.y1 > H + 1)) {
      issues.push({ sev: 'ERR', msg: `文字超出画布：「${t.text.slice(0, 18)}」 x[${t.x0.toFixed(0)},${t.x1.toFixed(0)}] y[${t.y0.toFixed(0)},${t.y1.toFixed(0)}] / ${W}x${H}` });
    }
  }
  // 3) 文字互相重叠
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i], b = texts[j];
      const ov = overlapArea(a, b);
      if (!ov) continue;
      const ratio = ov / Math.min(a.w * a.h, b.w * b.h);
      if (ratio > OVERLAP_TOL) {
        issues.push({ sev: 'ERR', msg: `文字重叠 ${(ratio * 100).toFixed(0)}%：「${a.text.slice(0, 14)}」×「${b.text.slice(0, 14)}」` });
      }
    }
  }
  // 4) 后绘不透明 <rect> 遮挡先绘 <text>
  for (const rm of svg.matchAll(/<rect\b([^>]*?)>/g)) {
    const rctx = ctxAt.get(rm.index) || { dx: 0, dy: 0, skip: false };
    if (rctx.skip) continue;
    const ra = attrs('<rect ' + rm[1] + '>');
    const rw = parseFloat(ra.width || 0), rh = parseFloat(ra.height || 0);
    if (!rw || !rh || (W && rw >= W - 10 && rh >= H - 10)) continue;
    const fill = (ra.fill || '').toLowerCase();
    const op = parseFloat(ra['fill-opacity'] ?? ra.opacity ?? 1);
    if (!fill || fill === 'none' || fill === 'transparent' || op < 0.85) continue;
    const rx0 = parseFloat(ra.x || 0) + rctx.dx, ry0 = parseFloat(ra.y || 0) + rctx.dy;
    const rBox = { x0: rx0, x1: rx0 + rw, y0: ry0, y1: ry0 + rh };
    for (const t of texts) {
      if (t.order >= rm.index) continue;
      const ov = overlapArea(t, rBox);
      if (ov && ov / (t.w * t.h) > 0.20) {
        issues.push({ sev: 'ERR', msg: `后绘矩形遮挡先绘文字：「${t.text.slice(0, 16)}」被 rect(${rx0},${ry0},${rw}x${rh}) 覆盖` });
      }
    }
  }
  return { name, file, texts: texts.length, issues };
}

// CLI
const argv = process.argv.slice(2);
const files = argv.length ? argv : fs.readdirSync(path.join(ROOT, 'img'))
  .filter((f) => f.endsWith('.svg')).map((f) => path.join(ROOT, 'img', f));

let nErr = 0, nWarn = 0, bad = 0;
const report = [];
for (const f of files.sort()) {
  const r = lintSvg(f);
  const e = r.issues.filter((i) => i.sev === 'ERR');
  const w = r.issues.filter((i) => i.sev === 'WARN');
  nErr += e.length; nWarn += w.length;
  if (r.issues.length) {
    bad++;
    report.push(`\n${r.name}  (${r.texts} 标签)`);
    for (const i of r.issues) report.push(`   ${i.sev === 'ERR' ? '✗' : '·'} ${i.msg}`);
  }
}
console.log(report.join('\n') || '（无问题）');
console.log(`\n检查 ${files.length} 张；有问题 ${bad} 张；错误 ${nErr}，提示 ${nWarn}`);
// 供 release-check 拦截：仅「错误」（重叠/超框/缺 viewBox）阻断发布，提示不阻断
if (nErr > 0) { process.exit(1); }
