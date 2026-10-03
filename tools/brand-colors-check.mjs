#!/usr/bin/env node
// Color-only preview gate. Uses the same external Playwright setup as ui-check.mjs.
// PW_MODULE=/path/to/playwright-core node tools/brand-colors-check.mjs --baseline
// Run again without --baseline after editing. --routes includes all navigation routes.
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_MODULE || 'playwright-core');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(process.env.COLOR_OUTPUT || path.join(root, 'docs/审核/品牌配色-20261003'));
const baseline = process.argv.includes('--baseline');
const phase = baseline ? 'before' : 'after';
const allRoutes = process.argv.includes('--routes');
// Reuse a saved original stylesheet for a fresh, identically isolated baseline.
const css = await fs.readFile(baseline && process.env.COLOR_BASELINE_CSS ? path.resolve(process.env.COLOR_BASELINE_CSS) : path.join(root, 'css/styles.css'), 'utf8');
await fs.mkdir(path.join(out, phase), { recursive: true });
if (baseline) await fs.writeFile(path.join(out, 'before.css'), css, { flag: 'wx' });
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon' };
const server = http.createServer(async (req, res) => {
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
    if (!/^(index\.html|sw\.js|manifest\.json|favicon\.ico|(?:js|data|css|img|icons)\/.+)$/.test(name) || name.split('/').some(p => p === '..' || p.startsWith('.'))) { res.writeHead(404).end(); return; }
    const content = name === 'css/styles.css' ? css : await fs.readFile(path.join(root, name));
    res.writeHead(200, { 'Content-Type': mime[path.extname(name)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(content);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const result = { phase, browser: browser.version(), version: null, scope: 'Rendered HTML text, pseudo-text and placeholders, including disabled text; image/SVG pixels and photo-overlay icons excluded.', matrix: [], interactions: [], errors: [], shots: [] };
const previews = [
  { name: 'microbes', route: '#/microbes' },
  { name: 'detail', route: '#/microbes/pseudomonas-aeruginosa' },
  { name: 'breakpoints', route: '#/breakpoints' }
];

// Runs in the page. Paint backgrounds from root to leaf, including alpha; never
// round ratios before the AA comparison. Off-scroll text is included, hidden text is not.
function measure() {
  const parse = v => {
    const m = v.match(/[\d.]+/g);
    if (!m || !/^rgba?\(/.test(v)) throw new Error('Unsupported color: ' + v);
    const a = m.map(Number);
    return [a[0], a[1], a[2], a.length > 3 ? a[3] : 1];
  };
  const blend = (a, b) => a.slice(0, 3).map((v, i) => v * a[3] + b[i] * (1 - a[3]));
  const lum = rgb => rgb.slice(0, 3).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
  const styleCache = new Map(), bgCache = new Map();
  const style = n => { if (!styleCache.has(n)) styleCache.set(n, getComputedStyle(n)); return styleCache.get(n); };
  const bg = n => {
    if (!n) return [255, 255, 255];
    if (!bgCache.has(n)) bgCache.set(n, blend(parse(style(n).backgroundColor), bg(n.parentElement)));
    return bgCache.get(n);
  };
  const visible = n => n.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && !n.closest('svg, .sr-only') && !n.closest('details:not([open]) > :not(summary)');
  const label = n => n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + (typeof n.className === 'string' && n.className ? '.' + n.className.trim().split(/\s+/).join('.') : '');
  const pairs = new Map(), cards = [], exclusions = [];
  function sample(n, text, pseudo = null) {
    if (!text.trim()) return;
    // Photo arrows are graphical controls over image pixels, not text on the
    // ancestor's flat color. Keep the original photo UI and report the exclusion.
    if (n.matches('.photo-nav')) { exclusions.push({ kind: 'image-overlay-icon', selector: label(n) }); return; }
    const s = pseudo ? getComputedStyle(n, pseudo) : style(n);
    let back = pseudo ? blend(parse(s.backgroundColor), bg(n)) : bg(n);
    let fore = blend(parse(s.color), back);
    let opacity = Number(s.opacity);
    if (pseudo) opacity *= Number(style(n).opacity);
    for (let p = n.parentElement; p; p = p.parentElement) opacity *= Number(style(p).opacity);
    fore = blend([...fore, opacity], back);
    const x = lum(fore), y = lum(back), ratio = (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
    const key = [label(n), pseudo, s.color, back, opacity].join('|');
    if (!pairs.has(key)) pairs.set(key, { selector: label(n) + (pseudo || ''), text: text.trim().slice(0, 90), foreground: s.color, background: back, opacity, ratio, count: 0 });
    pairs.get(key).count++;
  }
  for (const n of document.body.querySelectorAll('*')) {
    if (!visible(n) || /^(SCRIPT|STYLE|OPTION|IMG)$/.test(n.tagName)) continue;
    const direct = Array.from(n.childNodes).filter(c => c.nodeType === Node.TEXT_NODE).map(c => c.textContent).join('').trim();
    sample(n, direct);
    if (n.matches('input:not([type="checkbox"]):not([type="radio"]), textarea')) {
      if (n.value) sample(n, n.value);
      else if (n.placeholder) sample(n, n.placeholder, '::placeholder');
    }
    if (n.matches('select')) sample(n, n.selectedOptions[0]?.textContent || '');
    for (const pseudo of ['::before', '::after']) {
      const s = getComputedStyle(n, pseudo);
      if (s.content && !['none', 'normal', '""', "''"].includes(s.content) && s.display !== 'none' && /[\p{L}\p{N}]/u.test(s.content)) sample(n, s.content, pseudo);
    }
    const r = n.getBoundingClientRect(), s = style(n);
    if (parse(s.backgroundColor)[3] > 0 && r.width >= 160 && r.height >= 36 && !n.closest('svg, .photo-viewport, .zoom-overlay')) {
      cards.push({ selector: label(n), backgroundColor: s.backgroundColor, luminance: lum(bg(n)), width: r.width, height: r.height });
    }
  }
  const texts = [...pairs.values()];
  const main = document.getElementById('main');
  const bodyLum = lum(bg(document.body));
  return {
    texts, failures: texts.filter(p => p.ratio < 4.5), exclusions,
    cards, whiteCards: matchMedia('(prefers-color-scheme: dark)').matches ? cards.filter(c => c.luminance > bodyLum + .30) : [],
    bodyLuminance: bodyLum,
    overflow: { main: main.scrollWidth - main.clientWidth, page: document.documentElement.scrollWidth - innerWidth },
    geometry: Array.from(document.querySelectorAll('.topbar, .brand, #main, #main *, .site-footer')).filter(n => visible(n) && !n.closest('svg')).map(n => {
      const r = n.getBoundingClientRect(), s = style(n);
      return [label(n), ...[r.x, r.y, r.width, r.height].map(v => Math.round(v * 100) / 100), s.fontSize, s.lineHeight];
    }),
    content: main.textContent,
    colors: Object.fromEntries(['bg', 'surface', 'ink', 'ink-soft', 'muted', 'line', 'line-2', 'accent', 'accent-weak', 'accent-edge', 'link', 'green', 'rust', 'gold'].map(k => [k, getComputedStyle(document.documentElement).getPropertyValue('--' + k).trim()]))
  };
}

try {
  const context = await browser.newContext({ serviceWorkers: 'block', deviceScaleFactor: 1 });
  await context.addInitScript(() => { if (navigator.serviceWorker) navigator.serviceWorker.register = () => new Promise(() => {}); });
  const page = await context.newPage();
  page.on('pageerror', e => result.errors.push(e.message));
  await page.goto(base);
  result.version = await page.evaluate(() => window.APP_VERSION);
  if (!baseline) {
    result.colorOnly = await page.evaluate(({ oldCSS, newCSS }) => {
      function signature(source, omitDisabledOpacity = false) {
        const sheet = new CSSStyleSheet(); sheet.replaceSync(source);
        const disabledOpacity = [];
        function rules(list) {
          return Array.from(list).flatMap(rule => {
            if (rule.style) {
              const disabled = rule.selectorText === '.cmp-add.disabled';
              if (disabled) disabledOpacity.push({ value: rule.style.getPropertyValue('opacity'), priority: rule.style.getPropertyPriority('opacity') });
              const kept = Array.from(rule.style).filter(p => !/(^|-)color$/.test(p) && !/^--(?:accent(?:-weak|-edge)?|link|on-accent)$/.test(p) && !(omitDisabledOpacity && disabled && p === 'opacity')).map(p => [p, rule.style.getPropertyValue(p), rule.style.getPropertyPriority(p)]);
              return kept.length ? [[rule.selectorText, kept]] : [];
            }
            return rule.cssRules ? [[rule.conditionText, rules(rule.cssRules)]] : [[rule.cssText]];
          });
        }
        return { rules: rules(sheet.cssRules), disabledOpacity };
      }
      const before = signature(oldCSS), after = signature(newCSS);
      const [oldOpacity] = before.disabledOpacity, [newOpacity] = after.disabledOpacity;
      // Sole paint exception: replace translucent disabled text with explicit gray colors.
      // Require one exact selector per sheet; never hide opacity changes elsewhere.
      const permitted = before.disabledOpacity.length === 1 && after.disabledOpacity.length === 1 && oldOpacity.value === '0.45' && ['', '1'].includes(newOpacity.value) && !oldOpacity.priority && !newOpacity.priority;
      const nonColorCSSUnchanged = JSON.stringify(before.rules) === JSON.stringify(after.rules);
      return {
        nonColorCSSUnchanged,
        nonColorCSSUnchangedExceptAllowedPaint: nonColorCSSUnchanged || (permitted && JSON.stringify(signature(oldCSS, true).rules) === JSON.stringify(signature(newCSS, true).rules)),
        allowedPaintExceptions: permitted ? [{ selector: '.cmp-add.disabled', property: 'opacity', before: oldOpacity.value, after: newOpacity.value, beforePriority: oldOpacity.priority, afterPriority: newOpacity.priority, permitted: true }] : [],
        rulesBefore: before.rules.length, rulesAfter: after.rules.length
      };
    }, { oldCSS: await fs.readFile(path.join(out, 'before.css'), 'utf8'), newCSS: css });
  }
  const routes = allRoutes ? await page.evaluate(() => [...new Set([...Array.from(document.querySelectorAll('.tab'), n => '#/' + n.dataset.module), ...Array.from(document.querySelectorAll('.tool-btn'), n => n.getAttribute('href')), '#/about', '#/search/' + encodeURIComponent('葡萄球菌'), '#/microbes/pseudomonas-aeruginosa', '#/microbes/salmonella-genus', '#/antibiotics/ampicillin', '#/search/zzzz-no-such-entry'])]) : previews.map(p => p.route);
  for (const width of allRoutes ? [1280, 900, 390, 320] : [1280, 390]) {
    for (const colorScheme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: width > 760 ? 900 : 844 });
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      for (const route of routes) {
        await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
        // A different query forces a new document: clearing storage alone does
        // not clear the app's in-memory recent-entry list during hash navigation.
        await page.goto(base + (allRoutes ? '?colorCase=' + result.matrix.length : '') + route);
        await page.waitForFunction(() => document.getElementById('main').textContent.length > 0);
        await page.evaluate(() => document.fonts.ready);
        await page.mouse.move(0, 0);
        if (allRoutes) await page.evaluate(() => { document.getElementById('main').scrollTop = 0; document.getElementById('sidebar').scrollTop = 0; });
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const metrics = await page.evaluate(measure);
        result.matrix.push({ width, colorScheme, route, ...metrics });
        const preview = previews.find(p => p.route === route);
        if (preview && [1280, 390].includes(width)) {
          const file = `${phase}/${preview.name}-${width}-${colorScheme}.png`;
          await page.screenshot({ path: path.join(out, file) });
          result.shots.push({ route, width, colorScheme, file });
          if (preview.name === 'detail') {
            const card = page.locator('.treatment');
            if (await card.count()) {
              await card.scrollIntoViewIfNeeded();
              const detailFile = `${phase}/detail-cards-${width}-${colorScheme}.png`;
              await page.screenshot({ path: path.join(out, detailFile) });
              result.shots.push({ route, width, colorScheme, file: detailFile });
            }
          }
        }
        await fs.writeFile(path.join(out, `${phase}.json`), JSON.stringify(result, null, 2) + '\n');
      }
    }
  }
  // Exercise real links rather than fabricating a passing foreground/background pair.
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme });
    for (const [route, selector] of [['#/microbes/pseudomonas-aeruginosa', '.wiki-link'], ['#/microbe-names', '.mn-az-l']]) {
      await page.goto(base + route);
      await page.locator(selector).first().hover();
      const m = await page.evaluate(measure);
      result.interactions.push({ route, colorScheme, state: selector + ':hover', failures: m.failures, texts: m.texts });
    }
  }
  await context.close();
} catch (error) { result.errors.push(error.stack); }
finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
  if (!baseline) {
    const previous = JSON.parse(await fs.readFile(path.join(out, 'before.json'), 'utf8'));
    if (!Array.isArray(previous.errors) || previous.errors.length) result.errors.push('Baseline errors must be an empty array.');
    const caseKey = m => JSON.stringify([m.width, m.colorScheme, m.route]);
    const beforeKeys = new Set(previous.matrix.map(caseKey)), afterKeys = new Set(result.matrix.map(caseKey));
    if (beforeKeys.size !== previous.matrix.length) result.errors.push('Duplicate baseline case keys.');
    if (afterKeys.size !== result.matrix.length) result.errors.push('Duplicate current case keys.');
    if (!beforeKeys.size || beforeKeys.size !== afterKeys.size || [...beforeKeys].some(k => !afterKeys.has(k))) result.errors.push('Baseline/current case key sets must match and be non-empty.');
    result.preservation = result.matrix.map(m => {
      const old = previous.matrix.find(b => b.width === m.width && b.colorScheme === m.colorScheme && b.route === m.route);
      return { width: m.width, colorScheme: m.colorScheme, route: m.route, compared: !!old, geometryUnchanged: old ? JSON.stringify(old.geometry) === JSON.stringify(m.geometry) : null, contentUnchanged: old ? old.content === m.content : null, fixedTokensUnchanged: old ? ['bg', 'surface', 'ink', 'ink-soft', 'muted', 'line', 'line-2', 'green', 'rust', 'gold'].every(k => old.colors[k] === m.colors[k]) : null };
    });
  }
  result.summary = {
    cases: result.matrix.length, screenshots: result.shots.length,
    textSamples: result.matrix.reduce((s, m) => s + m.texts.reduce((n, p) => n + p.count, 0), 0),
    textFailures: result.matrix.reduce((s, m) => s + m.failures.length, 0),
    interactionFailures: result.interactions.reduce((s, m) => s + m.failures.length, 0),
    darkCards: result.matrix.filter(m => m.colorScheme === 'dark').reduce((s, m) => s + m.cards.length, 0),
    whiteCards: result.matrix.reduce((s, m) => s + m.whiteCards.length, 0),
    overflows: result.matrix.filter(m => m.overflow.main > 1 || m.overflow.page > 1).length,
    preservationFailures: (result.preservation || []).filter(m => !m.compared || !m.geometryUnchanged || !m.contentUnchanged || !m.fixedTokensUnchanged).length,
    scopeFailures: !baseline && !(result.colorOnly?.nonColorCSSUnchanged || result.colorOnly?.nonColorCSSUnchangedExceptAllowedPaint) ? 1 : 0,
    errors: result.errors.length
  };
  await fs.writeFile(path.join(out, `${phase}.json`), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ phase, out, ...result.summary, errors: result.errors }, null, 2));
  if (result.errors.length || (!baseline && ['textFailures', 'interactionFailures', 'whiteCards', 'overflows', 'preservationFailures', 'scopeFailures'].some(k => result.summary[k]))) process.exitCode = 1;
}
