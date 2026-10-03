// Run: PW_MODULE=/path/to/playwright-core node --test tools/brand-colors-selfcheck.mjs
// Explicit opt-in: do not auto-discover this browser check in dependency-free node --test.
// Execute actual CLI blocks; CSSOM uses a blank browser page, never the UI matrix.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { test } from 'node:test';

const source = await fs.readFile(new URL('./brand-colors-check.mjs', import.meta.url), 'utf8');
const start = source.indexOf('  if (!baseline) {', source.indexOf('\nfinally {'));
const end = source.lastIndexOf('\n}');
assert.ok(start > 0 && end > start, 'CLI reporting block must be found');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const finish = new AsyncFunction('result', 'baseline', 'fs', 'path', 'out', 'phase', 'console', 'process', source.slice(start, end));

function record() {
  return {
    errors: [], shots: [], interactions: [], colorOnly: { nonColorCSSUnchanged: true },
    matrix: [390, 1280].map(width => ({
      width, colorScheme: 'light', route: '#/microbes', geometry: [['main', 0, 0, width, 844]], content: 'fixture',
      colors: Object.fromEntries(['bg', 'surface', 'ink', 'ink-soft', 'muted', 'line', 'line-2', 'green', 'rust', 'gold'].map(k => [k, '#123456'])),
      texts: [{ count: 1 }], failures: [], cards: [], whiteCards: [], overflow: { main: 0, page: 0 }
    }))
  };
}

async function tempDir(t) {
  const scratch = path.join(homedir(), '.hermes/cache/scratch');
  await fs.mkdir(scratch, { recursive: true });
  const out = await fs.mkdtemp(path.join(scratch, 'brand-colors-check-'));
  t.after(() => fs.rm(out, { recursive: true, force: true }));
  return out;
}

async function check(t, previous = record(), result = record()) {
  const out = await tempDir(t);
  if (previous !== null) await fs.writeFile(path.join(out, 'before.json'), JSON.stringify(previous));
  const runtime = { exitCode: 0 };
  await finish(result, false, fs, path, out, 'after', { log() {} }, runtime);
  return { ...JSON.parse(await fs.readFile(path.join(out, 'after.json'), 'utf8')), exitCode: runtime.exitCode };
}

test('matching, error-free baseline passes regardless of case order', async t => {
  const previous = record();
  previous.matrix.reverse();
  const result = await check(t, previous);
  assert.equal(result.exitCode, 0);
  assert.equal(result.summary.preservationFailures, 0);
  assert.deepEqual(result.errors, []);
});

test('a current case without a baseline fails preservation', async t => {
  const previous = record();
  previous.matrix.pop();
  const result = await check(t, previous);
  assert.equal(result.exitCode, 1);
  assert.equal(result.summary.preservationFailures, 1);
  assert.equal(result.preservation.filter(m => !m.compared).length, 1);
});

test('a missing baseline file fails with ENOENT', async t => {
  await assert.rejects(check(t, null), { code: 'ENOENT' });
});

for (const [name, mutate, message] of [
  ['baseline runtime errors', b => { b.errors = ['baseline pageerror']; }, /Baseline errors/],
  ['missing baseline errors field', b => { delete b.errors; }, /Baseline errors/],
  ['non-array baseline errors field', b => { b.errors = {}; }, /Baseline errors/],
  ['case absent from current run', (b, a) => { a.matrix.pop(); }, /case key sets/],
  ['different case keys at equal counts', b => { b.matrix[0].route = '#/different'; }, /case key sets/],
  ['duplicate baseline case', b => { b.matrix.push(structuredClone(b.matrix[0])); }, /Duplicate baseline/],
  ['duplicate current case', (b, a) => { a.matrix.push(structuredClone(a.matrix[0])); }, /Duplicate current/],
  ['duplicate cases in both runs', (b, a) => { b.matrix.push(structuredClone(b.matrix[0])); a.matrix.push(structuredClone(a.matrix[0])); }, /Duplicate/],
  ['empty baseline matrix', b => { b.matrix = []; }, /case key sets/],
  ['empty current matrix', (b, a) => { a.matrix = []; }, /case key sets/],
  ['both matrices empty', (b, a) => { b.matrix = []; a.matrix = []; }, /case key sets/]
]) {
  test(`${name} fails the gate with a diagnostic`, async t => {
    const previous = record(), current = record();
    mutate(previous, current);
    const result = await check(t, previous, current);
    assert.equal(result.exitCode, 1);
    assert.ok(result.errors.some(error => message.test(error)), JSON.stringify(result.errors));
    assert.equal(result.summary.errors, result.errors.length);
  });
}

for (const field of ['geometry', 'content', 'colors']) {
  test(`changed ${field} still fails preservation`, async t => {
    const current = record();
    if (field === 'geometry') current.matrix[0].geometry = [];
    if (field === 'content') current.matrix[0].content = 'changed';
    if (field === 'colors') current.matrix[0].colors.bg = '#ffffff';
    const result = await check(t, record(), current);
    assert.equal(result.exitCode, 1);
    assert.equal(result.summary.preservationFailures, 1);
  });
}

test('missing static assets return one 404; the server keeps serving files and CSS', { timeout: 10000 }, async t => {
  const root = await tempDir(t);
  await fs.writeFile(path.join(root, 'index.html'), 'static fixture');
  const start = source.indexOf('const mime = ');
  const end = source.indexOf('\nawait new Promise(resolve => server.listen', start);
  assert.ok(start > 0 && end > start, 'CLI HTTP server block must be found');
  const server = new Function('http', 'fs', 'path', 'root', 'css', source.slice(start, end) + '\nreturn server;')(http, fs, path, root, '/* CSS override */');
  const handler = server.listeners('request')[0], handlerErrors = [], headers = [];
  // Keep real HTTP and filesystem I/O; observe async rejections instead of crashing the runner.
  server.removeAllListeners('request');
  server.on('request', (req, res) => {
    const writeHead = res.writeHead;
    res.writeHead = function (status, ...args) {
      headers.push([req.url, status]);
      return writeHead.call(this, status, ...args);
    };
    handler(req, res).catch(error => { handlerErrors.push(error.code || error.message); res.destroy(error); });
  });
  t.after(() => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const requests = [
    ['/js/missing.js', 404, ''], ['/css/missing.css', 404, ''], ['/img/missing.png', 404, ''],
    ['/css/styles.css', 200, '/* CSS override */'], ['/', 200, 'static fixture'],
    ['/docs/private.txt', 404, ''], ['/js/%E0%A4%A', 404, '']
  ];
  for (const [url, status, body] of requests) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${url}`, { signal: AbortSignal.timeout(2000) })
      .catch(error => assert.fail(`HTTP request failed: ${error.message}; handler errors: ${handlerErrors.join(', ')}`));
    assert.equal(response.status, status, url);
    assert.equal(await response.text(), body, url);
  }
  assert.deepEqual(handlerErrors, []);
  assert.deepEqual(headers, requests.map(([url, status]) => [url, status]));
});

test('CSSOM permits only the documented disabled-button opacity transition', async t => {
  const { chromium } = createRequire(import.meta.url)(process.env.PW_MODULE || 'playwright-core');
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  t.after(() => browser.close());
  const page = await browser.newPage();
  const marker = 'result.colorOnly = await page.evaluate(';
  const start = source.indexOf(marker) + marker.length;
  const end = source.indexOf(', { oldCSS: await fs.readFile', start);
  assert.ok(start >= marker.length && end > start, 'CLI CSSOM callback must be found');
  const compareCSS = new Function('return (' + source.slice(start, end) + ');')();
  const oldRule = '.cmp-add.disabled { opacity: .45; cursor: not-allowed; }';
  const newRule = '.cmp-add.disabled { color: gray; background-color: silver; cursor: not-allowed; }';
  for (const [name, oldCSS, newCSS, strict, passes, allowedAfter] of [
    ['opacity removed', oldRule, newRule, false, true, ''],
    ['opacity explicitly one', oldRule, newRule.replace('color: gray;', 'opacity: 1; color: gray;'), false, true, '1'],
    ['only colors changed', oldRule, oldRule.replace('cursor:', 'color: gray; cursor:'), true, true, null],
    ['unrelated opacity', '.other { opacity: .45; }', '.other { opacity: 1; }', false, false, null],
    ['unrelated opacity plus permitted change', oldRule + '.other { opacity: .45; }', newRule + '.other { opacity: 1; }', false, false, ''],
    ['selector prefix', '.panel ' + oldRule, '.panel ' + newRule, false, false, null],
    ['grouped selector', '.other, ' + oldRule, '.other, ' + newRule, false, false, null],
    ['wrong old opacity', oldRule.replace('.45', '.5'), newRule, false, false, null],
    ['wrong new opacity', oldRule, oldRule.replace('.45', '.9'), false, false, null],
    ['changed cursor', oldRule, newRule.replace('not-allowed', 'pointer'), false, false, ''],
    ['changed font size', oldRule, newRule.replace('cursor:', 'font-size: 20px; cursor:'), false, false, ''],
    ['duplicate exact selector', oldRule + oldRule, newRule + newRule, false, false, null],
    ['important opacity', oldRule.replace('.45', '.45 !important'), newRule, false, false, null],
    ['same media context', '@media (max-width: 600px) {' + oldRule + '}', '@media (max-width: 600px) {' + newRule + '}', false, true, ''],
    ['changed media context', '@media (max-width: 600px) {' + oldRule + '}', '@media (max-width: 700px) {' + newRule + '}', false, false, '']
  ]) {
    await t.test(name, async t => {
      const colorOnly = await page.evaluate(compareCSS, { oldCSS, newCSS });
      assert.equal(colorOnly.nonColorCSSUnchanged, strict);
      assert.equal(colorOnly.nonColorCSSUnchangedExceptAllowedPaint, passes);
      assert.deepEqual(colorOnly.allowedPaintExceptions, allowedAfter === null ? [] : [{
        selector: '.cmp-add.disabled', property: 'opacity', before: '0.45', after: allowedAfter,
        beforePriority: '', afterPriority: '', permitted: true
      }]);
      const current = record(); current.colorOnly = colorOnly;
      const result = await check(t, record(), current);
      assert.equal(result.summary.scopeFailures, passes ? 0 : 1);
      assert.equal(result.exitCode, passes ? 0 : 1);
    });
  }

  if (process.env.COLOR_EXISTING_EVIDENCE) {
    await t.test('recorded matrix and current real CSS pass without overwriting evidence', async t => {
      const evidence = path.resolve(process.env.COLOR_EXISTING_EVIDENCE);
      const previous = JSON.parse(await fs.readFile(path.join(evidence, 'before.json'), 'utf8'));
      const current = JSON.parse(await fs.readFile(path.join(evidence, 'after.json'), 'utf8'));
      current.colorOnly = await page.evaluate(compareCSS, {
        oldCSS: await fs.readFile(path.join(evidence, 'before.css'), 'utf8'),
        newCSS: await fs.readFile(new URL('../css/styles.css', import.meta.url), 'utf8')
      });
      const result = await check(t, previous, current);
      assert.equal(result.exitCode, 0);
      assert.equal(result.summary.cases, previous.matrix.length);
      t.diagnostic(JSON.stringify({ cases: result.summary.cases, errors: result.errors, colorOnly: result.colorOnly }));
    });
  }
});
