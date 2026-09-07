#!/usr/bin/env node
// Isolated browser acceptance checks: only test-local name lists are written.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_MODULE || 'playwright-core');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = process.env.UI_BASE_URL || pathToFileURL(path.join(root, 'index.html')).href;
const out = path.resolve(process.env.COMMON_NAMES_OUTPUT || path.join(root, 'docs/审核/common-names-20260907'));
await fs.mkdir(out, { recursive: true });
const result = { base, testFixturesOnly: true, checks: [], matrix: [], errors: [] };
function check(name, ok, evidence) {
  result.checks.push({ name, ok: !!ok, evidence });
  if (!ok) { throw new Error(name); }
}
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
try {
  const context = await browser.newContext({ acceptDownloads: true, serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => {
    if (navigator.serviceWorker) { navigator.serviceWorker.register = () => new Promise(() => {}); }
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copiedForTest = text; } } });
  });
  const page = await context.newPage();
  page.on('pageerror', e => result.errors.push(e.message));
  const go = async route => { await page.goto(base + route); await page.locator('#main').waitFor(); };
  const count = async n => { await page.waitForFunction(n => document.querySelectorAll('.common-row').length === n, n); };
  const save = async () => { await page.locator('.common-save').click(); };
  const newForm = async () => { await page.locator('.common-new').click(); };
  await go('#/microbes');
  check('overview diagrams are first', await page.locator('.landing').evaluate(n => n.firstElementChild.classList.contains('landing-diagrams')));
  await go('#/common-names');
  check('new tool renders an empty personal list', await page.locator('.common-empty').count() === 1 && await page.locator('.common-row').count() === 0);
  check('name input is a usable touch target', await page.locator('#common-name').evaluate(n => n.getBoundingClientRect().height >= 42));
  await page.locator('#common-name').fill('金黄色葡萄球菌');
  await page.locator('.common-option').filter({ hasText: 'Staphylococcus aureus' }).first().click();
  const latin = await page.locator('#common-latin').inputValue();
  check('candidate fills Latin name without guessing instrument code', latin === 'Staphylococcus aureus' && await page.locator('#common-abbr').inputValue() === '');
  await page.locator('#common-abbr').fill('Sa-Test01');
  await save(); await count(1);
  await page.locator('.common-copy-abbr').click();
  await page.waitForFunction(() => window.copiedForTest === 'Sa-Test01');
  check('abbreviation copy keeps user letter case', await page.evaluate(() => window.copiedForTest === 'Sa-Test01'));
  await newForm();
  await page.locator('#common-name').fill('示例自定义菌');
  await page.locator('#common-latin').fill('Example custom');
  await page.locator('#common-abbr').fill('User-02');
  await save(); await count(2);
  await page.reload(); await count(2);
  check('manually added records survive reload', (await page.locator('#common-list').innerText()).includes('User-02'));
  await page.locator('#common-filter').fill('user-02'); await count(1);
  check('list filter finds custom abbreviation case-insensitively', (await page.locator('.common-row').innerText()).includes('示例自定义菌'));
  await page.locator('.common-edit').click();
  await page.locator('#common-abbr').fill('User-03');
  await save(); await count(2);
  check('edit updates one item rather than adding a duplicate', (await page.locator('#common-list').innerText()).includes('User-03') && !(await page.locator('#common-list').innerText()).includes('User-02'));
  await go('#/microbes/staph-aureus');
  await page.locator('.common-add-btn').click();
  check('detail add detects existing item without overwriting code', (await page.locator('.common-add-btn').innerText()).includes('已在常用'));
  await go('#/microbes/pseudomonas-aeruginosa');
  await page.locator('.common-add-btn').click();
  check('detail add stays on the detail page', page.url().endsWith('#/microbes/pseudomonas-aeruginosa') && (await page.locator('.common-add-btn').innerText()).includes('已加入'));
  await go('#/microbe-names/' + encodeURIComponent('大肠埃希菌'));
  await page.locator('.common-add-btn').first().click();
  check('full name lookup has a separate add control', await page.locator('.mn-item button').count() === 0 && (await page.locator('.common-add-btn').first().innerText()).includes('已加入'));
  await go('#/common-names'); await count(4);
  check('cross-page additions and original code persist', (await page.locator('#common-list').innerText()).includes('Sa-Test01'));
  await page.locator('.common-backup > summary').click();
  const downloaded = page.waitForEvent('download');
  await page.locator('.common-export').click();
  const download = await downloaded;
  const backup = await fs.readFile(await download.path(), 'utf8');
  check('download is an actual restorable JSON backup', JSON.parse(backup).format === 'zhiwei-common-names' && JSON.parse(backup).items.length === 4, download.suggestedFilename());
  await page.locator('#common-import').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(backup) });
  await page.waitForFunction(() => document.getElementById('common-status').textContent.includes('导入完成'));
  check('merging a backup does not duplicate existing records', await page.locator('.common-row').count() === 4 && (await page.locator('#common-list').innerText()).includes('Sa-Test01'));
  await page.locator('#common-import').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{invalid') });
  await page.locator('#common-status.is-error').waitFor();
  check('invalid backup leaves saved data intact', await page.locator('.common-row').count() === 4);
  const row = page.locator('.common-row').filter({ hasText: '示例自定义菌' });
  await row.locator('.common-remove').click();
  check('remove asks for confirmation', await page.locator('.common-row').count() === 4 && await row.locator('.common-remove-confirm').isVisible());
  await row.locator('.common-remove-confirm').click(); await count(3);
  check('confirmed remove changes only the selected record', !(await page.locator('#common-list').innerText()).includes('示例自定义菌'));
  for (const width of [1280, 900, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      const dimensions = await page.locator('#main').evaluate(n => ({ overflow: n.scrollWidth - n.clientWidth, bodyOverflow: document.documentElement.scrollWidth - innerWidth }));
      result.matrix.push({ width, colorScheme, ...dimensions });
      check('populated list fits ' + width + ' ' + colorScheme, dimensions.overflow <= 1 && dimensions.bodyOverflow <= 1, dimensions);
      if ([1280, 390].includes(width) && colorScheme === 'light') { await page.screenshot({ path: path.join(out, 'common-' + width + '.png') }); }
    }
  }
  await newForm();
  await page.locator('#common-name').fill('铜绿假单胞菌');
  await page.locator('#common-name').press('ArrowDown');
  await page.locator('#common-name').press('Enter');
  check('autocomplete is keyboard operable', await page.locator('#common-latin').inputValue() === 'Pseudomonas aeruginosa');
  await page.locator('#common-name').fill('另一个手工名称');
  check('changing the chosen name clears stale auto-completion', await page.locator('#common-latin').inputValue() === '');
  await page.locator('.common-form .common-actions button').last().click();
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('denied'); }; });
  await page.locator('.common-copy-latin').first().click();
  await page.locator('.common-copy-fallback').waitFor();
  check('clipboard denial shows text for manual copy', await page.locator('.common-copy-fallback').inputValue() === latin && !(await page.locator('#common-status').innerText()).includes('已复制'));
  const fresh = await browser.newContext({ serviceWorkers: 'block' });
  await fresh.addInitScript(() => { if (navigator.serviceWorker) { navigator.serviceWorker.register = () => new Promise(() => {}); } });
  const restored = await fresh.newPage();
  await restored.goto(base + '#/common-names');
  await restored.locator('#common-import').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(backup) });
  await restored.waitForFunction(() => document.querySelectorAll('.common-row').length === 4);
  check('backup restores names in a fresh browser context', (await restored.locator('#common-list').innerText()).includes('Sa-Test01'));
  await fresh.close();
  // Two real tabs share storage, but an old editor must not overwrite newer data.
  await page.locator('.common-edit').first().click();
  const otherTab = await context.newPage();
  await otherTab.goto(base + '#/common-names');
  await otherTab.locator('.common-edit').first().click();
  await otherTab.locator('#common-abbr').fill('Other-tab-code');
  await otherTab.locator('.common-save').click();
  await page.locator('.common-save').click();
  await page.locator('#common-status.is-error').waitFor();
  check('stale editor cannot overwrite a newer value from another tab', await page.evaluate(() => window.AppNS.commonNameStore().load().items[0].abbr === 'Other-tab-code'));
  await otherTab.close();
  await newForm();
  await page.locator('#common-name').fill('示例手工名称');
  await page.locator('#common-latin').fill('Example manual');
  await save();
  const manual = page.locator('.common-row').filter({ hasText: '示例手工名称' });
  await manual.locator('.common-edit').click();
  await page.locator('#common-name').fill('示例手工名称修订');
  check('renaming a manual entry preserves its manual Latin field', await page.locator('#common-latin').inputValue() === 'Example manual');
  await save();
  await page.locator('.common-edit').first().click();
  await page.locator('#common-name').fill('示例保留编码');
  await save();
  check('changed name cannot silently retain old instrument code', await page.evaluate(() => window.AppNS.commonNameStore().load().items[0].name !== '示例保留编码') && await page.locator('#common-keep-code').isVisible());
  await page.locator('#common-keep-code').check();
  await save();
  check('explicit confirmation permits retaining the old code', await page.evaluate(() => { const x = window.AppNS.commonNameStore().load().items[0]; return x.name === '示例保留编码' && x.abbr === 'Other-tab-code'; }));
  const incoming = JSON.parse(backup);
  incoming.items = [{ id: 'async-example', name: '示例异步导入', latin: 'Example async', abbr: 'Async-01', microbeId: '' }];
  const delayedText = JSON.stringify(incoming);
  const beforeImport = await page.locator('.common-row').count();
  await page.evaluate(text => {
    window.originalCommonFileText = File.prototype.text;
    File.prototype.text = function () { return new Promise(resolve => { window.completeCommonImport = () => resolve(text); }); };
  }, delayedText);
  await page.locator('#common-import').setInputFiles({ name: 'delayed.json', mimeType: 'application/json', buffer: Buffer.from(delayedText) });
  await page.waitForFunction(() => typeof window.completeCommonImport === 'function');
  await page.locator('.tab[data-module="microbes"]').click();
  await page.locator('.landing-diagrams').waitFor();
  await page.evaluate(() => { location.hash = '#/common-names'; });
  await page.locator('.common-workspace').waitFor();
  await page.evaluate(() => { window.completeCommonImport(); File.prototype.text = window.originalCommonFileText; });
  await count(beforeImport + 1);
  check('async import updates the current view after leaving and returning', (await page.locator('#common-status').innerText()).includes('新增 1 条') && (await page.locator('#common-list').innerText()).includes('示例异步导入'));
  await context.close();
} catch (error) { result.errors.push(error.stack); }
finally {
  await browser.close();
  await fs.writeFile(path.join(out, 'checks.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ base, checks: result.checks.length, passed: result.checks.filter(c => c.ok).length, matrix: result.matrix, failures: result.checks.filter(c => !c.ok), errors: result.errors }, null, 2));
  if (result.errors.length || result.checks.some(c => !c.ok)) { process.exitCode = 1; }
}
