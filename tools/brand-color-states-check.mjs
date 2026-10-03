#!/usr/bin/env node
// Dynamic color states, using real application renderers and data-derived UI fixtures.
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_MODULE || 'playwright-core');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(process.env.STATE_OUTPUT || path.join(root, 'docs/审核/品牌配色-20261003/states.json'));
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon' };
const server = http.createServer(async (req, res) => {
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
    if (!/^(index\.html|sw\.js|manifest\.json|favicon\.ico|(?:js|data|css|img|icons)\/.+)$/.test(name) || name.split('/').some(p => p === '..' || p.startsWith('.'))) { res.writeHead(404).end(); return; }
    const content = await fs.readFile(path.join(root, name));
    res.writeHead(200, { 'Content-Type': mime[path.extname(name)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(content);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true });
const result = { states: [], errors: [] };
try {
  const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => { if (navigator.serviceWorker) navigator.serviceWorker.register = () => new Promise(() => {}); });
  const page = await context.newPage();
  page.on('pageerror', e => result.errors.push(e.message));
  async function inspect(theme, state, selector) {
    await page.locator(selector).first().waitFor({ state: 'visible' });
    const pairs = await page.locator(selector).evaluateAll(nodes => {
      const rgba = v => { const a = v.match(/[\d.]+/g).map(Number); return [...a.slice(0, 3), a.length === 4 ? a[3] : 1]; };
      const blend = (a, b) => a.slice(0, 3).map((v, i) => v * a[3] + b[i] * (1 - a[3]));
      const lum = a => a.map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
      const background = n => n ? blend(rgba(getComputedStyle(n).backgroundColor), background(n.parentElement)) : [255, 255, 255];
      return nodes.filter(n => n.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })).map(n => {
        const s = getComputedStyle(n), bg = background(n);
        let opacity = 1;
        for (let p = n; p; p = p.parentElement) opacity *= Number(getComputedStyle(p).opacity);
        const fg = blend([...blend(rgba(s.color), bg), opacity], bg), x = lum(fg), y = lum(bg);
        return { className: n.className, text: n.textContent.trim().slice(0, 80), foreground: s.color, background: bg, opacity, ratio: (Math.max(x, y) + .05) / (Math.min(x, y) + .05) };
      });
    });
    result.states.push({ theme, state, pairs, pass: pairs.length > 0 && pairs.every(p => p.ratio >= 4.5) });
  }
  for (const theme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto(base + '#/search/ampicillin/antibiotics');
    await page.locator('.search-item').filter({ has: page.locator('.tag-antibiotics') }).first().hover();
    await inspect(theme, 'antibiotic search-tag hover', '.search-item:hover .tag-antibiotics');
    await page.goto(base + '#/compare');
    await page.getByRole('button', { name: '结果查菌', exact: true }).click();
    await page.locator('.id-tri.pos').first().click();
    await inspect(theme, 'positive selected', '.id-tri.pos.sel');
    await page.locator('.id-tri.neg').first().click();
    await inspect(theme, 'negative selected', '.id-tri.neg.sel');
    await page.evaluate(() => window.showUpdateNotice('配色检查'));
    await inspect(theme, 'update notice', '.update-toast');
    await page.evaluate(() => document.querySelectorAll('.update-toast').forEach(n => n.remove()));
    await page.goto(base + '#/microbes/bacillus-anthracis');
    await inspect(theme, 'biosafety title and level', '.biosafety-title, .biosafety-level');
    // Query parameters force fresh tool state, so the unselected form is covered.
    await page.goto(base + '?state=' + theme + '#/breakpoints');
    await page.locator('.tool-controls .cmp-add').filter({ hasText: 'MIC 判读' }).click();
    await inspect(theme, 'unavailable disk method', '.bp-method-toggle .cmp-add.disabled');
    const examples = await page.evaluate(() => {
      const found = {};
      for (const g of window.View.judgeableBreakpointGroups(window.DB.breakpoints)) {
        for (const d of g.药物) {
          for (let power = -7; power <= 10; power++) {
            const value = 2 ** power;
            const verdict = window.View.judgeMIC(value, d.MIC_S, d.MIC_I, d.MIC_R).result;
            if (['S', 'I', 'R', 'SDD', 'NS'].includes(verdict) && !found[verdict]) found[verdict] = { group: g.菌组名, drug: d.药物, value: String(value) };
          }
          if (Object.keys(found).length === 5) return found;
        }
      }
      return found;
    });
    if (Object.keys(examples).length !== 5) throw new Error('Missing UI verdict fixtures');
    for (const [verdict, fixture] of Object.entries(examples)) {
      await page.selectOption('#bp-judge-group', fixture.group);
      await page.selectOption('#bp-judge-drug', fixture.drug);
      await page.locator('#bp-judge-mic').fill(fixture.value);
      await page.waitForFunction(expected => document.querySelector('.bp-verdict-tag')?.textContent === expected, verdict);
      await inspect(theme, 'verdict ' + verdict, '.bp-verdict-tag, .bp-verdict-reason');
    }
  }
  await context.close();
} catch (e) { result.errors.push(e.stack); }
finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
  result.summary = { states: result.states.length, failures: result.states.filter(s => !s.pass), errors: result.errors };
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result.summary, null, 2));
  if (result.errors.length || result.summary.failures.length || result.states.length !== 22) process.exitCode = 1;
}
