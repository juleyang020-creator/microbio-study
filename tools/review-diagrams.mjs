// 作图科学准确性审校脚本（开发期工具，不在 app 运行时使用）。
// 把每张教学示意图中的文字标签发给 DeepSeek 与 GLM，做事实核对，汇总疑似错误。
// 用法（密钥从环境变量读取，切勿写入文件）：
//   DEEPSEEK_API_KEY=xxx GLM_API_KEY=yyy node tools/review-diagrams.mjs
// 仅审校教学示意图（stain-/test-/mechanism-/resistance- 等）。
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IMG = path.join(ROOT, 'img');
const DS_KEY = process.env.DEEPSEEK_API_KEY;
const GLM_KEY = process.env.GLM_API_KEY;

const files = fs.readdirSync(IMG)
  .filter((f) => f.endsWith('.svg'))
  .sort();

function labelsOf(svg) {
  const out = [];
  const re = /<(?:text|tspan)\b[^>]*>([\s\S]*?)<\/(?:text|tspan)>/g;
  let m;
  while ((m = re.exec(svg))) {
    const t = m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (t) out.push(t);
  }
  return [...new Set(out)];
}

const PROMPT = (name, labels) =>
`你是临床/医学微生物学专家。下面是教学示意图「${name}」中提取的全部文字标签（顺序无关）：
${labels.map((l, i) => `${i + 1}. ${l}`).join('\n')}

请只核对其中**确凿的科学事实错误**（如染色结果颜色、阴阳性归属、菌种/试剂、步骤顺序、机制描述等）。
忽略排版、措辞、风格问题。若无明确错误，issues 返回空数组。
严格只输出 JSON：{"issues":[{"wrong":"原标签或错误点","correct":"正确说法","why":"简要依据"}]}`;

async function askModel(url, key, model, prompt) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 60000);
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 900,
        stream: false
      }),
      signal: ctrl.signal
    });
    const j = await r.json();
    return parseIssues(j && j.choices && j.choices[0] && j.choices[0].message ? j.choices[0].message.content : '');
  } catch (e) {
    return { error: String(e).slice(0, 80) };
  } finally { clearTimeout(to); }
}

function parseIssues(txt) {
  const s = txt.indexOf('{'), e = txt.lastIndexOf('}');
  if (s === -1 || e === -1) return { issues: [] };
  try { return JSON.parse(txt.slice(s, e + 1)); }
  catch { return { raw: txt.slice(0, 200) }; }
}

const deepseek = (p) => DS_KEY ? askModel('https://api.deepseek.com/chat/completions', DS_KEY, 'deepseek-chat', p) : Promise.resolve({ error: 'no DEEPSEEK_API_KEY' });
const glm = (p) => GLM_KEY ? askModel('https://open.bigmodel.cn/api/paas/v4/chat/completions', GLM_KEY, 'glm-4-flash', p) : Promise.resolve({ error: 'no GLM_API_KEY' });

async function pool(items, n, fn) {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}

const results = await pool(files, 4, async (f) => {
  const svg = fs.readFileSync(path.join(IMG, f), 'utf8');
  const labels = labelsOf(svg);
  const name = labels[0] || f;
  const p = PROMPT(name, labels);
  const both = await Promise.all([deepseek(p), glm(p)]);
  return { f, name, ds: both[0], gl: both[1] };
});

let md = '# 示意图审校（DeepSeek + GLM）\n\n';
let flagged = 0;
for (const r of results) {
  const dsi = (r.ds && r.ds.issues) || [];
  const gli = (r.gl && r.gl.issues) || [];
  if (dsi.length || gli.length) flagged++;
  md += `## ${r.f} — ${r.name}\n`;
  if (r.ds.error) md += `- DeepSeek: ⚠️ ${r.ds.error}\n`;
  dsi.forEach((x) => { md += `- **DS**: ❌ ${x.wrong} → ✅ ${x.correct}　(${x.why || ''})\n`; });
  if (r.gl.error) md += `- GLM: ⚠️ ${r.gl.error}\n`;
  gli.forEach((x) => { md += `- **GLM**: ❌ ${x.wrong} → ✅ ${x.correct}　(${x.why || ''})\n`; });
  if (!dsi.length && !gli.length && !r.ds.error && !r.gl.error) md += `- ✅ 两模型均未发现明确错误\n`;
  md += '\n';
}
const OUT = path.join(os.tmpdir(), 'diagram-review.md');
fs.writeFileSync(OUT, md);
console.log(`审校完成：${results.length} 张图，${flagged} 张被标记可疑。报告：${OUT}`);
console.log(md);
