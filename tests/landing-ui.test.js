'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, goto } = require('./dom-stub');

test('模块首页提供标题、真实条目数与有效的直接入口', () => {
  const app = loadApp();
  const index = app.win.Core.buildIndex(app.win.AppNS.db());
  app.win.Core.MODULE_KEYS.forEach(module => {
    goto(app, '#/' + module);
    const main = app.doc.getElementById('main');
    assert.equal(main.querySelector('.landing-title')?.textContent, app.win.View.moduleLabel(module));
    assert.ok(main.querySelector('.landing-count').textContent.includes(String(app.win.AppNS.db()[module].length)));
    const links = main.querySelectorAll('.landing-entry');
    assert.ok(links.length > 0, module + ' 首页没有条目入口');
    links.forEach(link => assert.ok(index[link.getAttribute('href').split('/')[2]], '入口必须来自现存条目'));
  });
});
