#!/usr/bin/env node
// WebKit/Chromium geometry and CSS checks; not the native iOS keyboard compositor.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const pw = require(process.env.PW_MODULE || 'playwright-core');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = process.env.UI_BASE_URL || pathToFileURL(path.join(root, 'index.html')).href;
const baseline = process.argv.includes('--baseline');
const out = path.resolve(process.env.APPEARANCE_OUTPUT || path.join(root, 'docs/审核/mobile-appearance-20260907'));
await fs.mkdir(out, { recursive: true });
const result = { base, baseline, scope: 'Real WebKit/Chromium layout and focus CSS; excludes native iOS keyboard/glass effects', checks: [], errors: [] };
function check(engine, name, ok, evidence) { result.checks.push({ engine, name, ok: !!ok, evidence }); }
for (const engine of ['webkit', 'chromium']) {
  const browser = await pw[engine].launch({ headless: true, ...(engine === 'chromium' && process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
    await context.addInitScript(() => { if (navigator.serviceWorker) { navigator.serviceWorker.register = () => new Promise(() => {}); } });
    const page = await context.newPage();
    page.on('pageerror', error => result.errors.push(engine + ': ' + error.message));
    await page.goto(base + '#/microbes/e-coli');
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      for (const safeTop of [0, 59]) {
        // Explicit safe-area fixture: headless hosts do not have an iPhone notch.
        await page.evaluate(top => document.documentElement.style.setProperty('--safe-top', top + 'px'), safeTop);
        await page.locator('#search-input').focus();
        const position = await page.evaluate(() => {
          const input = document.getElementById('search-input');
          const rect = input.getBoundingClientRect();
          const brand = document.querySelector('.brand').getBoundingClientRect();
          const style = getComputedStyle(input);
          return { top: rect.top, bottom: rect.bottom, height: rect.height, brandBottom: brand.bottom, appearance: style.webkitAppearance || style.appearance, outlineOffset: parseFloat(style.outlineOffset), font: parseFloat(style.fontSize), overflow: document.documentElement.scrollWidth - innerWidth };
        });
        check(engine, 'search below brand and safe area ' + width + '/' + safeTop, position.top >= position.brandBottom + 8 && position.top >= safeTop + 52 && position.height >= 44 && position.overflow <= 1, position);
        check(engine, 'custom focus without native search decoration ' + width + '/' + safeTop, position.appearance === 'none' && position.outlineOffset <= 0 && position.font >= 16, position);
      }
    }
    await page.evaluate(() => document.documentElement.style.removeProperty('--safe-top'));
    await page.setViewportSize({ width: 390, height: 420 });
    await page.locator('#search-input').fill('金葡');
    await page.waitForTimeout(250);
    check(engine, 'search still works in a short visible area', await page.locator('.search-item').count() > 0 && await page.locator('#main').evaluate(n => n.getBoundingClientRect().height > 80));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '#/microbes/e-coli');
    // Small component fixtures cover the same QC selectors without copying clinical values.
    await page.evaluate(() => {
      const box = document.createElement('div'); box.id = 'appearance-qc-fixtures';
      for (const [cls, text] of [['qc-purpose qc-ref', '参考'], ['qc-endpoint', 'MEC']]) {
        const item = document.createElement('span'); item.className = cls; item.textContent = text; box.appendChild(item);
      }
      document.getElementById('main').appendChild(box);
    });
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme });
      const colors = await page.evaluate(() => {
        const rgb = value => (value.match(/[\d.]+/g) || []).map(Number);
        const luminance = values => values.slice(0, 3).map(x => { x /= 255; return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }).reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0);
        return ['.bp-eucast-note', '.qc-ref', '.qc-endpoint', '.detail-toc'].map(selector => {
          const node = document.querySelector(selector);
          if (!node) { return { selector, missing: true }; }
          const style = getComputedStyle(node), foreground = luminance(rgb(style.color)), background = luminance(rgb(style.backgroundColor));
          return { selector, background: style.backgroundColor, luminance: background, contrast: (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05) };
        });
      });
      check(engine, 'warning/QC panels have readable ' + colorScheme + ' colors', colors.every(c => !c.missing && (c.selector === '.detail-toc' || c.contrast >= 4.5) && (colorScheme !== 'dark' || c.luminance < .12)), colors);
    }
    await page.goto(base + '#/antibiotics/piperacillin');
    await page.emulateMedia({ colorScheme: 'dark' });
    const diagram = page.locator('.mechanism-img').first();
    check(engine, 'dark diagram preview is softened', await diagram.evaluate(n => /brightness\(0\./.test(getComputedStyle(n).filter)));
    await diagram.click();
    const imageSrc = await page.locator('.zoom-img').getAttribute('src');
    check(engine, 'dark diagram zoom has an original-brightness control', await page.locator('.zoom-brightness').count() === 1);
    if (await page.locator('.zoom-brightness').count()) {
      await page.locator('.zoom-brightness').click();
      check(engine, 'original brightness is reversible without changing the image', await page.locator('.zoom-overlay').count() === 1 && await page.locator('.zoom-img').evaluate(n => getComputedStyle(n).filter === 'none') && await page.locator('.zoom-img').getAttribute('src') === imageSrc);
      await page.locator('.zoom-brightness').click();
      check(engine, 'soft brightness can be restored', await page.locator('.zoom-img').evaluate(n => /brightness\(0\./.test(getComputedStyle(n).filter)));
    }
    await page.locator('.zoom-close').click();
    await page.emulateMedia({ colorScheme: 'light' });
    check(engine, 'light-mode diagram colors are untouched', await diagram.evaluate(n => getComputedStyle(n).filter === 'none'));
    await page.goto(base + '#/microbes/pseudomonas-aeruginosa');
    await page.emulateMedia({ colorScheme: 'dark' });
    const photo = page.locator('.photo-img').first();
    check(engine, 'clinical photographs are never dimmed', await photo.evaluate(n => getComputedStyle(n).filter === 'none'));
    await photo.click();
    check(engine, 'enlarged clinical photograph keeps original colors', await page.locator('.zoom-img').evaluate(n => getComputedStyle(n).filter === 'none') && await page.locator('.zoom-brightness').count() === 0);
    await page.locator('.zoom-close').click();
    await page.goto(base + '#/antibiotics/piperacillin');
    await page.locator('#search-input').focus();
    await page.screenshot({ path: path.join(out, (baseline ? 'before-' : 'after-') + engine + '.png') });
    await context.close();
  } catch (error) { result.errors.push(engine + ': ' + error.stack); }
  finally { await browser.close(); }
}
await fs.writeFile(path.join(out, baseline ? 'before.json' : 'after.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ checks: result.checks.length, passed: result.checks.filter(c => c.ok).length, failures: result.checks.filter(c => !c.ok), errors: result.errors }, null, 2));
if (result.errors.length || result.checks.some(c => !c.ok)) { process.exitCode = 1; }
