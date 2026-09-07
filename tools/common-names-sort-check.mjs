#!/usr/bin/env node
// Sorting acceptance checks use isolated, clearly labelled test fixtures.
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const pw = require(process.env.PW_MODULE || 'playwright-core');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fileBase = pathToFileURL(path.join(root, 'index.html')).href;
// Cross-tab storage events are checked on an HTTP origin: WebKit file:// reloads
// can read fresh storage yet omit storage events. File compatibility is tested separately.
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon' };
const server = http.createServer(async (req, res) => {
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
    if (!/^(index\.html|sw\.js|manifest\.json|favicon\.ico|(?:js|data|css|img|icons)\/.+)$/.test(name) || name.split('/').some(p => p === '..' || p.startsWith('.'))) { res.writeHead(404).end(); return; }
    const data = await fs.readFile(path.join(root, name));
    res.writeHead(200, { 'Content-Type': mime[path.extname(name)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = process.env.UI_BASE_URL || 'http://127.0.0.1:' + server.address().port + '/';
const out = path.resolve(process.env.SORT_OUTPUT || path.join(root, 'docs/审核/common-sort'));
await fs.mkdir(out, { recursive: true });
const report = { base, testFixturesOnly: true, checks: [], errors: [] };
function check(engine, name, ok, evidence) { report.checks.push({ engine, name, ok: !!ok, evidence }); if (!ok) { throw new Error(name); } }
for (const engine of ['webkit', 'chromium']) {
  const browser = await pw[engine].launch({ headless: true, ...(engine === 'chromium' && process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block', acceptDownloads: true });
    await context.addInitScript(() => { if (navigator.serviceWorker) { navigator.serviceWorker.register = () => new Promise(() => {}); } });
    const page = await context.newPage();
    page.on('pageerror', e => report.errors.push(engine + ': ' + e.message));
    await page.goto(base + '#/common-names');
    await page.evaluate(() => {
      const store = window.AppNS.commonNameStore();
      for (const [name, latin, abbr] of [['中组', 'Zeta', 'C10'], ['阿组', 'Alpha', 'C2'], ['波组', 'Beta', '']]) { store.save({ name, latin, abbr }); }
      window.AppNS.renderCommonNames();
    });
    const names = () => page.locator('.common-row-name h2').allTextContents();
    const storedNames = () => page.evaluate(() => window.AppNS.commonNameStore().load().items.map(x => x.name));
    const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    check(engine, 'existing insertion order is the initial manual order', equal(await names(), ['中组', '阿组', '波组']));
    await page.locator('#common-sort').selectOption('name');
    check(engine, 'automatic Chinese pinyin sorting', equal(await names(), ['阿组', '波组', '中组']));
    await page.locator('#common-sort').selectOption('latin');
    check(engine, 'automatic Latin A-Z sorting', equal(await names(), ['阿组', '波组', '中组']));
    await page.locator('#common-sort').selectOption('abbr');
    check(engine, 'abbreviation natural sorting and missing values last', equal(await names(), ['阿组', '中组', '波组']));
    check(engine, 'automatic sorting does not rewrite manual data', equal(await storedNames(), ['中组', '阿组', '波组']));
    await page.reload();
    check(engine, 'sort preference survives reload', await page.locator('#common-sort').inputValue() === 'abbr');
    await page.locator('#common-sort').selectOption('manual');
    await page.locator('.common-arrange-toggle').click();
    const last = page.locator('.common-row').filter({ hasText: '波组' });
    await last.locator('.common-move-top').click();
    check(engine, 'manual top move saves immediately', equal(await storedNames(), ['波组', '中组', '阿组']));
    await page.locator('.common-row').filter({ hasText: '中组' }).locator('.common-move-down').click();
    check(engine, 'manual down move', equal(await names(), ['波组', '阿组', '中组']));
    await page.locator('.common-row').filter({ hasText: '中组' }).locator('.common-move-up').click();
    check(engine, 'manual up move', equal(await names(), ['波组', '中组', '阿组']));
    check(engine, 'moved control keeps keyboard focus', await page.locator('.common-row').filter({ hasText: '中组' }).locator('.common-move-up').evaluate(n => n === document.activeElement));
    await page.evaluate(() => {
      window.originalSortSetter = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) { if (key === window.CommonNames.STORAGE_KEY) { throw new Error('test write blocked'); } return window.originalSortSetter.call(this, key, value); };
    });
    await page.locator('.common-row').filter({ hasText: '阿组' }).locator('.common-move-top').click();
    await page.locator('#common-status.is-error').waitFor();
    check(engine, 'failed move preserves order and restores focus', equal(await storedNames(), ['波组', '中组', '阿组']) && await page.locator('.common-row').filter({ hasText: '阿组' }).locator('.common-move-top').evaluate(n => n === document.activeElement));
    await page.evaluate(() => { Storage.prototype.setItem = window.originalSortSetter; });
    await page.locator('#common-filter').fill('中组');
    check(engine, 'filtered results cannot reorder hidden records', await page.locator('.common-move-top').isDisabled() && equal(await storedNames(), ['波组', '中组', '阿组']));
    await page.locator('#common-filter').fill('');
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const colorScheme of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
        const metrics = await page.evaluate(() => ({ overflow: document.getElementById('main').scrollWidth - document.getElementById('main').clientWidth, controlHeight: document.querySelector('.common-move-down').getBoundingClientRect().height, font: parseFloat(getComputedStyle(document.getElementById('common-sort')).fontSize) }));
        check(engine, 'ordering controls fit ' + width + ' ' + colorScheme, metrics.overflow <= 1 && metrics.controlHeight >= 44 && metrics.font >= 16, metrics);
      }
    }
    await page.screenshot({ path: path.join(out, engine + '-manual.png') });
    await page.locator('.common-arrange-toggle').click();
    await page.locator('#common-sort').selectOption('latin');
    await page.locator('#common-sort').selectOption('manual');
    check(engine, 'returning from auto restores the saved manual order', equal(await names(), ['波组', '中组', '阿组']));
    await page.reload();
    check(engine, 'manual order survives reload', equal(await names(), ['波组', '中组', '阿组']));
    await page.locator('.common-backup > summary').click();
    const pendingDownload = page.waitForEvent('download'); await page.locator('.common-export').click();
    const download = await pendingDownload; const backup = await fs.readFile(await download.path(), 'utf8');
    check(engine, 'actual backup file contains manual array order', equal(JSON.parse(backup).items.map(x => x.name), ['波组', '中组', '阿组']));
    const fresh = await browser.newContext({ serviceWorkers: 'block' });
    await fresh.addInitScript(() => { if (navigator.serviceWorker) { navigator.serviceWorker.register = () => new Promise(() => {}); } });
    const restored = await fresh.newPage(); await restored.goto(base + '#/common-names');
    await restored.locator('#common-import').setInputFiles({ name: 'order.json', mimeType: 'application/json', buffer: Buffer.from(backup) });
    await restored.waitForFunction(() => document.querySelectorAll('.common-row').length === 3);
    check(engine, 'import into a fresh browser restores manual order and codes', equal(await restored.locator('.common-row-name h2').allTextContents(), ['波组', '中组', '阿组']) && (await restored.locator('#common-list').innerText()).includes('C10'));
    await fresh.close();
    const oldIds = await page.evaluate(() => window.AppNS.commonNameStore().load().items.map(x => x.id));
    const other = await context.newPage(); await other.goto(base + '#/common-names');
    await other.locator('.common-arrange-toggle').click();
    await other.locator('.common-row').filter({ hasText: '阿组' }).locator('.common-move-top').click();
    await page.bringToFront(); // WebKit 会暂停后台页的 requestAnimationFrame。
    await page.waitForFunction(() => document.querySelector('.common-row h2').textContent === '阿组', null, { polling: 100 });
    check(engine, 'another tab updates the displayed manual order', equal(await names(), ['阿组', '波组', '中组']));
    const stale = await page.evaluate(ids => window.AppNS.commonNameStore().move(ids[1], 'top', ids), oldIds);
    check(engine, 'old order snapshot cannot override a newer order', !stale.ok && equal(await storedNames(), ['阿组', '波组', '中组']));
    await other.bringToFront();
    await other.locator('#common-sort').selectOption('abbr');
    await page.bringToFront();
    await page.waitForFunction(() => document.getElementById('common-sort').value === 'abbr', null, { polling: 100 });
    check(engine, 'sort preferences sync between tabs', equal(await names(), ['阿组', '中组', '波组']));
    const filePage = await context.newPage();
    await filePage.goto(fileBase + '#/common-names');
    await filePage.evaluate(() => {
      const s = window.AppNS.commonNameStore();
      s.save({ name: 'File Z', latin: 'Zeta' }); s.save({ name: 'File A', latin: 'Alpha' });
      window.AppNS.renderCommonNames();
    });
    await filePage.locator('.common-arrange-toggle').click();
    await filePage.locator('.common-row').last().locator('.common-move-top').click();
    await filePage.locator('#common-sort').selectOption('latin');
    await filePage.reload();
    check(engine, 'file mode remembers automatic preference after reload', await filePage.locator('#common-sort').inputValue() === 'latin');
    await filePage.locator('#common-sort').selectOption('manual');
    check(engine, 'file mode preserves manual order across reload', equal(await filePage.locator('.common-row h2').allTextContents(), ['File A', 'File Z']));
    await context.close();
  } catch (error) {
    report.errors.push(engine + ': ' + error.stack);
    for (const ctx of browser.contexts()) {
      for (const p of ctx.pages()) {
        try { report.errors.push(JSON.stringify(await p.evaluate(() => ({ url: location.href, stored: window.AppNS.commonNameStore().load(), visible: Array.from(document.querySelectorAll('.common-row h2')).map(n => n.textContent), mode: document.getElementById('common-sort').value, status: document.getElementById('common-status').textContent })))); } catch {}
      }
    }
  }
  finally { await browser.close(); }
}
await new Promise(resolve => server.close(resolve));
await fs.writeFile(path.join(out, 'checks.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ base, checks: report.checks.length, passed: report.checks.filter(c => c.ok).length, failures: report.checks.filter(c => !c.ok), errors: report.errors }, null, 2));
if (report.errors.length || report.checks.some(c => !c.ok)) { process.exitCode = 1; }
