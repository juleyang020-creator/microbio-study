'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, goto } = require('./dom-stub');

test('搜索结果显示真实总数，模块筛选只呈现当前模块并分页', () => {
  const app = loadApp();
  const results = Array.from({ length: 55 }, (_, i) => ({ id: 'item-' + i, 名称: '测试条目' + i, module: i < 45 ? 'microbes' : 'glossary' }));
  const main = app.doc.getElementById('main');
  main.replaceChildren(...app.win.AppNS.buildSearch(app.win.View.searchVM(results, '测试'), 'microbes'));
  assert.match(main.querySelector('.search-status')?.textContent || '', /45/);
  assert.equal(main.querySelectorAll('.search-item').length, 40);
  assert.ok(main.querySelectorAll('.search-item').every(n => n.getAttribute('data-module') === 'microbes'));
  main.querySelector('.search-more').click();
  assert.equal(main.querySelectorAll('.search-item').length, 45);
  assert.equal(main.querySelector('.search-more'), null);
});

test('搜索是可恢复的路由：中文词和模块从地址恢复，坏编码不崩溃', () => {
  const app = loadApp();
  goto(app, '#/search/' + encodeURIComponent('葡萄球菌') + '/microbes');
  assert.equal(app.doc.getElementById('search-input').value, '葡萄球菌');
  const main = app.doc.getElementById('main');
  assert.ok(main.querySelectorAll('.search-item').length > 0);
  assert.ok(main.querySelectorAll('.search-item').every(n => n.getAttribute('data-module') === 'microbes'));
  assert.doesNotThrow(() => goto(app, '#/search/%E0%A4%A/no-such-module'));
});

test('连续搜索复用一次预建索引，视图高亮使用同一套别名与全角规则', () => {
  const app = loadApp();
  const core = app.win.Core;
  const create = core.createSearchIndex;
  let builds = 0;
  core.createSearchIndex = data => { builds++; return create(data); };
  goto(app, '#/search/' + encodeURIComponent('金葡'));
  goto(app, '#/search/' + encodeURIComponent('葡萄球菌'));
  assert.equal(builds, 1, '不能对每个新建的 db() 包装对象重新拼接全文');
  const tokens = Array.from(app.win.View.searchVM([], 'ＭＲＳＡ 凝固酶').tokens);
  assert.ok(tokens.includes('mrsa'));
  assert.ok(tokens.includes('金黄色葡萄球菌'));
  assert.ok(tokens.includes('凝固酶'));
});
