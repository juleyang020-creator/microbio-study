'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, goto } = require('./dom-stub');

test('示意图有可切换的原图亮度，切换不改图片来源或关闭灯箱', () => {
  const app = loadApp();
  goto(app, '#/antibiotics/piperacillin');
  const preview = app.doc.querySelector('.mechanism-img');
  assert.ok(preview.classList.contains('diagram-image'));
  preview.click();
  const overlay = app.doc.querySelector('.zoom-overlay');
  const image = overlay.querySelector('.zoom-img');
  const src = image.getAttribute('src');
  const toggle = overlay.querySelector('.zoom-brightness');
  assert.ok(toggle);
  assert.equal(toggle.getAttribute('aria-pressed'), 'false');
  toggle.click();
  assert.ok(overlay.classList.contains('zoom-original'));
  assert.equal(image.getAttribute('src'), src);
  assert.equal(toggle.getAttribute('aria-pressed'), 'true');
  toggle.click();
  assert.ok(!overlay.classList.contains('zoom-original'));
  assert.ok(app.doc.querySelector('.zoom-overlay'));
});

test('临床照片不进入示意图降亮度路径', () => {
  const app = loadApp();
  goto(app, '#/microbes/pseudomonas-aeruginosa');
  const photo = app.doc.querySelector('.photo-img');
  assert.ok(photo && !photo.classList.contains('diagram-image'));
  photo.click();
  assert.ok(!app.doc.querySelector('.zoom-img').classList.contains('diagram-image'));
  assert.equal(app.doc.querySelectorAll('.zoom-brightness').length, 0);
});
