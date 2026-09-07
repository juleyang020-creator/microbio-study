#!/usr/bin/env node
// Real-browser UI regression; no application dependency or build step required.
// PW_MODULE=/path/to/playwright-core CHROME_PATH=/path/to/chrome node tools/ui-check.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_MODULE || 'playwright-core');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseline = process.argv.includes('--baseline');
const out = path.resolve(process.env.UI_OUTPUT || path.join(root, 'docs/审核/ui-20260907'));
await fs.mkdir(out, { recursive: true });
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png', '.ico': 'image/x-icon' };
const server = http.createServer(async (req, res) => {
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
    // Serve only public application assets, never project docs or dotfiles.
    if (!/^(index\.html|sw\.js|manifest\.json|favicon\.ico|(?:js|data|css|img|icons)\/.+)$/.test(name) || name.split('/').some(p => p === '..' || p.startsWith('.'))) { res.writeHead(404).end(); return; }
    const file = path.join(root, name);
    const content = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(content);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = process.env.UI_BASE_URL || `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const result = { baseline, base, matrix: [], checks: [], errors: [] };
function check(name, ok, evidence) { result.checks.push({ name, ok: !!ok, evidence }); }
try {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  // Layout checks bypass SW deliberately. Suppress only the resulting test-only notice;
  // a separate fresh context below verifies the real install/cache/offline path.
  await context.addInitScript(() => { if (navigator.serviceWorker) { navigator.serviceWorker.register = () => new Promise(() => {}); } });
  const page = await context.newPage();
  page.on('pageerror', error => result.errors.push(error.message));
  await page.goto(base);
  const modules = await page.locator('.tab').evaluateAll(nodes => nodes.map(n => n.dataset.module));
  const tools = await page.locator('.tool-btn').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')));
  const routes = [...new Set([...modules.map(m => '#/' + m), ...tools, '#/about', '#/microbes/pseudomonas-aeruginosa', '#/microbes/salmonella-genus', '#/antibiotics/ampicillin', '#/search/' + encodeURIComponent('葡萄球菌'), '#/search/zzzz-no-such-entry'])];
  for (const width of [1280, 900, 390, 320]) {
    await page.setViewportSize({ width, height: width > 760 ? 900 : 844 });
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      for (const route of routes) {
        await page.goto(base + route);
        await page.locator('#main').waitFor();
        const metrics = await page.evaluate(() => {
          const main = document.getElementById('main');
          const header = document.querySelector('.topbar').getBoundingClientRect();
          const footer = document.querySelector('.site-footer').getBoundingClientRect();
          const search = document.getElementById('search-input').getBoundingClientRect();
          const colors = value => (value.match(/[\d.]+/g) || []).map(Number);
          const luminance = rgb => rgb.slice(0, 3).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
          const contrast = Array.from(document.querySelectorAll('.eyebrow, .landing-title, .landing-count, .action-btn, .landing-category-head, .landing-entry, .recent-link, .search-filter, .search-context, .search-context-field, .search-status, .search-hit, .detail-toc-title, .detail-toc-link')).filter(n => n.getClientRects().length).map(n => {
            let parent = n, bg;
            while (parent) {
              const value = colors(getComputedStyle(parent).backgroundColor);
              if (value.length === 3 || value[3] === 1) { bg = value; break; }
              parent = parent.parentElement;
            }
            const fg = luminance(colors(getComputedStyle(n).color));
            const back = luminance(bg || [255, 255, 255]);
            return { cls: n.className, ratio: Number(((Math.max(fg, back) + .05) / (Math.min(fg, back) + .05)).toFixed(2)) };
          });
          return { header: Math.round(header.height), footer: Math.round(footer.height), main: Math.round(main.getBoundingClientRect().height), overflow: main.scrollWidth - main.clientWidth, bodyOverflow: document.documentElement.scrollWidth - innerWidth, searchWidth: Math.round(search.width), h1: !!main.querySelector('h1'), text: main.textContent.length, contrastSamples: contrast.length, contrastFailures: contrast.filter(c => c.ratio < 4.5) };
        });
        result.matrix.push({ width, colorScheme, route, ...metrics });
        if (route === '#/microbes' && [1280, 390].includes(width) && colorScheme === 'light') {
          await page.screenshot({ path: path.join(out, `${baseline ? 'before' : 'after'}-${width}.png`) });
        }
      }
    }
  }
  check('all routes render without horizontal page overflow', result.matrix.every(m => m.overflow <= 1 && m.bodyOverflow <= 1 && m.text > 0), result.matrix.filter(m => m.overflow > 1 || m.bodyOverflow > 1 || m.text <= 0));
  check('new workspace text contrast meets 4.5:1', result.matrix.every(m => !m.contrastFailures.length), { samples: result.matrix.reduce((n, m) => n + m.contrastSamples, 0), failures: result.matrix.filter(m => m.contrastFailures.length) });
  check('mobile header keeps reading room (≤132px)', result.matrix.filter(m => m.width <= 390).every(m => m.header <= 132), result.matrix.filter(m => m.width === 390 && m.route === '#/microbes'));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(base + '#/microbes');
  check('landing has actionable heading and entry count', await page.locator('.landing-title').count() === 1 && await page.locator('.landing-count').count() === 1, await page.locator('#main h1').allTextContents());
  await page.locator('#search-input').fill('葡萄球菌');
  await page.waitForTimeout(240);
  check('search has result count and module filters', await page.locator('.search-status').count() === 1 && await page.locator('.search-filter').count() > 1);
  if (!baseline) {
    const total = await page.locator('.search-status').innerText();
    await page.locator('.search-filter[data-module="microbes"]').click();
    check('module filter restricts results', await page.locator('.search-item').evaluateAll(ns => ns.length > 0 && ns.every(n => n.dataset.module === 'microbes')), total);
    await page.locator('.search-item').first().click();
    await page.goBack();
    check('browser back restores query and filter', await page.locator('#search-input').inputValue() === '葡萄球菌' && await page.locator('.search-filter[data-module="microbes"]').getAttribute('aria-pressed') === 'true');
    await page.locator('#search-input').fill('zzzz-no-such-entry');
    await page.waitForTimeout(240);
    check('empty search explains recovery', await page.locator('.search-empty').count() === 1 && await page.locator('.search-item').count() === 0);
    await page.locator('#search-input').press('Escape');
    check('Escape leaves search', await page.locator('#search-input').inputValue() === '' && await page.locator('.search-empty').count() === 0);
    await page.keyboard.press('Control+k');
    check('Ctrl+K focuses global search', await page.locator('#search-input').evaluate(n => n === document.activeElement));
    await page.locator('#search-input').fill('金葡');
    await page.waitForTimeout(240);
    await page.locator('#search-input').press('ArrowDown');
    check('ArrowDown moves to first result', await page.locator('.search-item').first().evaluate(n => n === document.activeElement));
    await page.locator('#search-clear').click();
    await page.goto(base + '#/glossary');
    await page.locator('#search-input').fill('ampicillin');
    await page.locator('#search-input').press('Enter');
    await page.locator('.search-item').first().click();
    await page.waitForURL('**/#/antibiotics/ampicillin');
    await page.locator('#search-input').fill('葡萄');
    await page.locator('#search-input').press('Enter');
    await page.goBack();
    await page.goBack();
    await page.waitForURL('**/#/search/ampicillin');
    await page.reload();
    await page.locator('#search-clear').click();
    check('older search keeps its own return route across reload', page.url().endsWith('#/glossary'));
    await page.goto(base + '#/microbes/staph-aureus');
    await page.locator('#search-input').fill('coli');
    await page.locator('#sidebar .entry-link.selected').first().click();
    await page.waitForTimeout(220);
    check('same-detail click cancels pending search', page.url().endsWith('#/microbes/staph-aureus') && await page.locator('#search-input').inputValue() === '');
    await page.goto(base + '#/microbes');
    await page.locator('#search-input').dispatchEvent('compositionstart');
    await page.locator('#search-input').fill('jin');
    await page.waitForTimeout(220);
    check('IME composition does not search unfinished syllables', !page.url().includes('#/search/'));
    await page.locator('#search-input').fill('金葡');
    await page.locator('#search-input').dispatchEvent('compositionend');
    await page.waitForTimeout(220);
    check('IME completion searches committed text', (await page.locator('.search-item').first().innerText()).includes('金黄色葡萄球菌'));
    await page.locator('#search-input').fill('葡萄球菌');
    await page.evaluate(() => { location.hash = '#/antibiotics'; });
    await page.waitForTimeout(220);
    check('pending search cannot overwrite a new module', page.url().endsWith('#/antibiotics') && await page.locator('.landing-title').innerText() === '抗微生物药');
    await page.goto(base + '#/microbes/pseudomonas-aeruginosa');
    const toc = page.locator('.detail-toc-link');
    check('long detail has section shortcuts', await toc.count() >= 3);
    if (await toc.count()) {
      const target = await toc.last().getAttribute('aria-controls');
      await toc.last().click();
      check('section jump focuses visible target', await page.locator('#' + target).evaluate(n => n === document.activeElement && n.getBoundingClientRect().top >= document.getElementById('main').getBoundingClientRect().top - 1));
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '#/microbes');
    check('closed mobile drawer cannot receive focus', await page.locator('#sidebar').evaluate(n => n.inert));
    await page.locator('#menu-btn').click();
    check('drawer opens with close control', await page.locator('#menu-btn').getAttribute('aria-expanded') === 'true' && await page.locator('#nav-close').isVisible());
    await page.keyboard.press('Tab');
    check('drawer Tab moves into directory rather than behind it', await page.evaluate(() => document.getElementById('sidebar').contains(document.activeElement)));
    await page.keyboard.press('Shift+Tab');
    check('drawer reverse Tab returns to close button', await page.locator('#nav-close').evaluate(n => n === document.activeElement));
    await page.locator('#nav-close').click();
    await page.locator('.category-browse').last().click();
    const categoryPosition = await page.evaluate(() => ({ top: document.activeElement.getBoundingClientRect().top, headerBottom: document.querySelector('.drawer-head').getBoundingClientRect().bottom }));
    check('category jump is not hidden by drawer header', categoryPosition.top >= categoryPosition.headerBottom, categoryPosition);
    await page.locator('#nav-close').click();
    await page.locator('#tools-toggle').click();
    check('mobile tool menu exposes all tools', await page.locator('.tool-btn').evaluateAll(ns => ns.every(n => n.getBoundingClientRect().height >= 40)));
    await page.locator('.tool-btn[data-tool="compare"]').click();
    await page.waitForURL('**/#/compare');
    await page.locator('#tools-toggle[aria-expanded="false"]').waitFor();
    await page.locator('#main .detail-title').filter({ hasText: '生化鉴定' }).waitFor();
    check('tool selection closes menu', await page.locator('#tools-toggle').getAttribute('aria-expanded') === 'false' && (await page.locator('#main').innerText()).includes('生化'));
    await page.locator('#tools-toggle').click();
    await page.locator('.tool-btn[data-tool="compare"]').click();
    check('selecting the current tool also closes its menu', await page.locator('#tools-toggle').getAttribute('aria-expanded') === 'false');
    const offline = await context.newPage();
    offline.on('pageerror', error => result.errors.push('file: ' + error.message));
    await offline.goto('file://' + path.join(root, 'index.html') + '#/microbes');
    await offline.locator('#search-input').fill('金葡');
    await offline.waitForTimeout(240);
    check('file:// search works without a server', await offline.locator('.search-item').count() > 0);
    await offline.close();
    const cached = await browser.newContext({ serviceWorkers: 'allow' });
    const pwa = await cached.newPage();
    pwa.on('pageerror', error => result.errors.push('pwa: ' + error.message));
    await pwa.goto(base + '#/microbes');
    await pwa.evaluate(() => navigator.serviceWorker.ready);
    await pwa.waitForFunction(() => !!navigator.serviceWorker.controller);
    const cacheState = await pwa.evaluate(async () => {
      const name = 'microbio-' + window.APP_VERSION;
      const cache = await caches.open(name);
      const assets = ['navigation', 'landing', 'search'].map(n => './js/app/' + n + '.js?v=' + window.APP_VERSION);
      return { version: window.APP_VERSION, name, present: await Promise.all(assets.map(async p => !!(await cache.match(p)))) };
    });
    check('new UI scripts are actually precached', cacheState.present.every(Boolean), cacheState);
    await cached.setOffline(true);
    await pwa.reload();
    await pwa.locator('#search-input').fill('金葡');
    await pwa.waitForTimeout(240);
    check('installed PWA reloads and searches offline', await pwa.locator('.search-item').count() > 0);
    await cached.close();
  }
  await context.close();
} catch (error) { result.errors.push(error.stack); }
finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
  const file = path.join(out, baseline ? 'before.json' : 'after.json');
  await fs.writeFile(file, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ file, routes: [...new Set(result.matrix.map(m => m.route))].length, cases: result.matrix.length, checks: result.checks, errors: result.errors }, null, 2));
  if (result.errors.length || result.checks.some(c => !c.ok)) { process.exitCode = 1; }
}
