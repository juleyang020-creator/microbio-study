'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./dom-stub');

test('手机目录的可见状态、aria-expanded 与键盘隔离保持同步', () => {
  const app = loadApp();
  app.win.matchMedia = () => ({ matches: true });
  app.win.AppNS.setNavOpen(false, false);
  assert.equal(app.doc.getElementById('sidebar').inert, true);
  app.win.AppNS.setNavOpen(true);
  assert.equal(app.doc.getElementById('sidebar').inert, false);
  assert.equal(app.doc.getElementById('menu-btn').getAttribute('aria-expanded'), 'true');
  app.win.AppNS.setNavOpen(false, false);
  assert.equal(app.doc.getElementById('menu-btn').getAttribute('aria-expanded'), 'false');
  app.win.matchMedia = () => ({ matches: false });
  app.win.AppNS.setNavOpen(false, false);
  assert.equal(app.doc.getElementById('sidebar').inert, false, '桌面目录始终可交互');
});
