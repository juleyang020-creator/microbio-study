'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, goto } = require('./dom-stub.js');

const CONTENT_TITLES = '.section-title, .intrinsic-title, .treatment-title, .card-drugs-title, ' +
  '.morph-title, .bp-title, .ident-title, .diff-title, .biochem-title, .relations-label, .refs-label, figcaption';

function contentBlocks(main) {
  return main.children.filter((node) => node.querySelector(CONTENT_TITLES) && !node.querySelector('.empty-sm'));
}

function mountDetail(app, fields) {
  const main = app.doc.getElementById('main');
  main.replaceChildren(...app.win.AppNS.buildDetail({ 名称: '导航测试', 小节: [], 关联: [], ...fields }));
  return main;
}

test('真实长详情的速览逐项指向实际生成的顶层内容块', () => {
  const app = loadApp();
  for (const route of [
    '#/microbes/pseudomonas-aeruginosa', '#/microbes/salmonella-genus',
    '#/antibiotics/ampicillin', '#/qc-strains/qc-ecoli-25922'
  ]) {
    goto(app, route);
    const main = app.doc.getElementById('main');
    const blocks = contentBlocks(main);
    assert.ok(blocks.length >= 3, route + ' 必须使用有足够内容的真实详情');
    const nav = main.querySelector('nav.detail-toc');
    assert.ok(nav, '长详情应生成本页速览');
    assert.equal(nav.getAttribute('aria-label'), '本页速览');
    const buttons = nav.querySelectorAll('button.detail-toc-link');
    assert.equal(buttons.length, blocks.length, '不能漏掉已渲染正文，也不能为不存在的内容生成入口');
    buttons.forEach((button, index) => {
      assert.equal(button.getAttribute('type'), 'button');
      assert.ok(button.textContent.trim(), '入口必须有可读名称');
      const id = button.getAttribute('aria-controls');
      assert.ok(id, '入口必须声明所控制的目标');
      assert.ok(app.doc.getElementById(id) === blocks[index], '入口顺序与正文顺序一致，目标必须是顶层块');
      assert.ok(blocks[index].classList.contains('detail-anchor'));
      assert.equal(blocks[index].getAttribute('tabindex'), '-1');
    });
    const ids = main.querySelectorAll('*').map((node) => node.id).filter(Boolean);
    assert.equal(new Set(ids).size, ids.length, '详情内的 ID 必须唯一');
  }
});

test('点击速览先无滚动聚焦再定位正文，不写 hash 或浏览历史', () => {
  const app = loadApp();
  const route = '#/microbes/pseudomonas-aeruginosa';
  goto(app, route);
  const main = app.doc.getElementById('main');
  const buttons = main.querySelectorAll('button.detail-toc-link');
  assert.ok(buttons.length >= 3);
  let hash = app.win.location.hash;
  let hashWrites = 0;
  let historyWrites = 0;
  Object.defineProperty(app.win.location, 'hash', {
    get() { return hash; },
    set(value) { hashWrites++; hash = value; }
  });
  app.win.history.pushState = app.win.history.replaceState = () => { historyWrites++; };
  buttons.forEach((button) => {
    const target = app.doc.getElementById(button.getAttribute('aria-controls'));
    const calls = [];
    const focus = target.focus.bind(target);
    target.focus = (options) => { calls.push(['focus', { ...options }]); focus(options); };
    target.scrollIntoView = (options) => { calls.push(['scroll', { ...options }]); };
    button.click();
    assert.deepEqual(calls, [
      ['focus', { preventScroll: true }],
      ['scroll', { block: 'start' }]
    ], button.textContent + ' 必须先聚焦、再滚动');
    assert.ok(target.ownerDocument_activeElement, '点击后目标获得焦点');
    assert.equal(app.win.location.hash, route);
  });
  assert.equal(hashWrites, 0, '页内导航不能干扰基于 hash 的路由');
  assert.equal(historyWrites, 0, '页内导航不能产生或替换历史记录');
});

test('仅满三个内容块才显示速览，空详情与占位提示不产生假入口', () => {
  const app = loadApp();
  for (const count of [0, 1, 2, 3]) {
    const main = mountDetail(app, {
      小节: Array.from({ length: count }, (_, index) => ({ 标题: '小节 ' + index, 正文: '示例正文 ' + index }))
    });
    const nav = main.querySelector('nav.detail-toc');
    if (count < 3) {
      assert.equal(!!nav, false, count + ' 个内容块不应占用顶部显示目录');
      assert.equal(main.querySelectorAll('.detail-anchor').length, 0);
    } else {
      assert.ok(nav);
      assert.equal(nav.querySelectorAll('button.detail-toc-link').length, count, '空关联不能凑足目录数量');
    }
  }
  const main = app.doc.getElementById('main');
  main.replaceChildren(...app.win.AppNS.buildDetail(null));
  assert.equal(main.querySelector('.detail-toc'), null);
  assert.ok(main.querySelector('.empty'));
  goto(app, '#/microbes/no-such-id');
  assert.equal(main.querySelector('.detail-toc'), null, '未知条目的回落页不应生成目录');
});

test('形态图目录只显示标题，不把张数和授权说明塞入导航', () => {
  const app = loadApp();
  goto(app, '#/microbes/pseudomonas-aeruginosa');
  const main = app.doc.getElementById('main');
  const photos = main.querySelector('.photos');
  assert.ok(photos);
  const button = main.querySelectorAll('.detail-toc-link').find((node) => node.getAttribute('aria-controls') === photos.id);
  assert.ok(button);
  assert.equal(button.textContent, '真实形态图');
  assert.ok(photos.querySelector('.photo-count').textContent.trim(), '正文仍保留照片张数');
  assert.ok(photos.querySelector('.photo-lic').textContent.trim(), '正文仍保留授权说明');
});

test('生成的锚点避开块内既有 ID，重名小节仍有独立目标', () => {
  const app = loadApp();
  const { el, buildDetailToc } = app.win.AppNS;
  const blocks = Array.from({ length: 3 }, () => el('div', { cls: 'section-card' }, [
    el('div', { cls: 'section-title', text: '重复标题' }),
    el('div', { cls: 'section-body', text: '示例正文' })
  ]));
  blocks[0].appendChild(el('span', { id: 'detail-section-1', text: '既有标识' }));
  blocks[1].id = 'existing-section';
  const nav = buildDetailToc(blocks);
  const main = app.doc.getElementById('main');
  main.replaceChildren(nav, ...blocks);
  const ids = main.querySelectorAll('*').map((node) => node.id).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length, '新锚点不能与内容中已有的标识冲突');
  assert.equal(blocks[1].id, 'existing-section', '保留原有的块 ID');
  nav.querySelectorAll('button').forEach((button, index) => {
    assert.ok(app.doc.getElementById(button.getAttribute('aria-controls')) === blocks[index]);
  });
});

test('目录排在详情标题、拉丁名和生物安全警示之后，正文之前', () => {
  const app = loadApp();
  const entry = app.win.DB.microbes.find((item) => item.id === 'neisseria-meningitidis');
  assert.ok(entry && entry.生物安全, '必须覆盖真实带警示的条目');
  goto(app, '#/microbes/' + entry.id);
  const main = app.doc.getElementById('main');
  const nav = main.querySelector('nav.detail-toc');
  assert.ok(nav);
  const navIndex = main.children.indexOf(nav);
  for (const selector of ['.detail-head', '.latin', '.biosafety-alert']) {
    const node = main.querySelector(selector);
    assert.ok(node);
    assert.ok(main.children.indexOf(node) < navIndex, selector + ' 不可被目录挤到后面');
    assert.equal(node.classList.contains('detail-anchor'), false, '导航不应把警示或标题当正文入口');
  }
  assert.equal(main.querySelector('.biosafety-alert').getAttribute('role'), 'alert');
  assert.equal(main.querySelector('.biosafety-body').textContent, entry.生物安全.提示, '警示原文保持不变');
  assert.equal(main.children.indexOf(contentBlocks(main)[0]), navIndex + 1, '目录与正文之间不插入其他块');
});

test('重复渲染的锚点稳定，旧分型跳转仍控制原目标', () => {
  const app = loadApp();
  const route = '#/microbes/salmonella-genus';
  goto(app, route);
  const main = app.doc.getElementById('main');
  const targets = () => main.querySelectorAll('.detail-toc-link').map((button) => button.getAttribute('aria-controls'));
  const first = targets();
  assert.ok(first.length >= 3);
  goto(app, route);
  assert.deepEqual(targets(), first, '旧详情还在 DOM 中时也不能造成新 ID 漂移');
  goto(app, '#/antibiotics/ampicillin');
  goto(app, route);
  assert.deepEqual(targets(), first);
  const section = main.querySelector('.identification-tables');
  const oldJump = main.querySelector('.ident-jump');
  assert.ok(section && oldJump);
  assert.equal(section.id, 'identification-tables');
  assert.equal(oldJump.getAttribute('aria-controls'), section.id);
  assert.equal(first.filter((id) => id === section.id).length, 1, '分型表只收录一次，不把内部表格重复展开');
  oldJump.click();
  assert.ok(section.ownerDocument_activeElement);
  assert.equal(app.win.location.hash, route);
});
