'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Common = require('../js/common-names');

// 排序占位数据，不代表医学名称或仪器编码规则。
test('自动排序按中文拼音、拉丁名或简写；空值后置、同值稳定且不改手动顺序', () => {
  const rows = Object.freeze([
    Object.freeze({ id: 'z', name: '中组', latin: 'Zeta', abbr: 'Code10' }),
    Object.freeze({ id: 'a', name: '阿组', latin: 'alpha', abbr: 'Code2' }),
    Object.freeze({ id: 'b', name: '波组', latin: '', abbr: '' }),
    Object.freeze({ id: 'same', name: '阿组', latin: 'ALPHA', abbr: 'code2' })
  ]);
  const ids = mode => Common.sortItems(rows, mode).map(x => x.id);
  assert.deepEqual(ids('name'), ['a', 'same', 'b', 'z']);
  assert.deepEqual(ids('latin'), ['a', 'same', 'z', 'b']);
  assert.deepEqual(ids('abbr'), ['a', 'same', 'z', 'b']);
  assert.deepEqual(ids('manual'), ['z', 'a', 'b', 'same']);
  assert.deepEqual(ids('unknown'), ['z', 'a', 'b', 'same']);
  assert.notEqual(Common.sortItems(rows, 'manual'), rows);
  assert.equal(rows[1].abbr, 'Code2');
  assert.deepEqual(Common.sortItems(null, 'name'), []);
});

function fixture() {
  const data = new Map();
  const storage = { getItem: key => data.has(key) ? data.get(key) : null, setItem: (key, value) => data.set(key, value) };
  const store = Common.createStore(storage);
  const rows = ['A', 'B', 'C'].map(letter => store.save({ name: '排序占位' + letter, latin: 'Example ' + letter, abbr: 'Keep-' + letter }).item);
  return { data, storage, store, rows };
}
const ids = store => store.load().items.map(x => x.id);

test('上移、下移、置顶只改顺序；重载、编辑和备份保留手动顺序', () => {
  const { store, storage, rows } = fixture();
  const [a, b, c] = rows.map(x => x.id);
  assert.equal(store.move(c, 'up', ids(store)).ok, true);
  assert.deepEqual(ids(store), [a, c, b]);
  assert.equal(store.move(b, 'top', ids(store)).ok, true);
  assert.deepEqual(ids(store), [b, a, c]);
  assert.equal(store.move(b, 'down', ids(store)).ok, true);
  assert.deepEqual(ids(store), [a, b, c]);
  assert.equal(store.move(c, 'top', ids(store)).ok, true);
  assert.deepEqual(ids(Common.createStore(storage)), [c, a, b]);
  assert.equal(store.save({ ...rows[0], abbr: 'Edited-case' }, rows[0]).ok, true);
  assert.deepEqual(ids(store), [c, a, b]);
  const backup = store.exportBackup();
  assert.equal(JSON.parse(backup.text).version, 1);
  const fresh = fixture(); fresh.data.delete(Common.STORAGE_KEY);
  assert.equal(fresh.store.importBackup(backup.text).ok, true);
  assert.deepEqual(fresh.store.load().items.map(x => x.name), ['排序占位C', '排序占位A', '排序占位B']);
  assert.equal(fresh.store.load().items[1].abbr, 'Edited-case');
});

test('排序偏好单独保存，不改名单格式；无效偏好回落手动且写失败不能报成功', () => {
  const { data, storage, store } = fixture();
  const original = data.get(Common.STORAGE_KEY);
  assert.equal(store.loadSortMode().mode, 'manual');
  assert.equal(store.saveSortMode('latin').ok, true);
  assert.equal(Common.createStore(storage).loadSortMode().mode, 'latin');
  assert.equal(data.get(Common.STORAGE_KEY), original);
  assert.equal(store.saveSortMode('constructor').ok, false);
  data.set(Common.SORT_KEY, 'unknown');
  assert.equal(store.loadSortMode().mode, 'manual');
  const denied = Common.createStore({ getItem: storage.getItem, setItem() { throw new Error('blocked'); } });
  assert.equal(denied.saveSortMode('name').ok, false);
  const silent = Common.createStore({ getItem: storage.getItem, setItem() {} });
  assert.equal(silent.saveSortMode('name').ok, false);
  const unreadable = Common.createStore({ getItem() { throw new Error('blocked'); } });
  assert.equal(unreadable.loadSortMode().ok, false);
  assert.equal(data.get(Common.STORAGE_KEY), original);
});

test('调序拒绝过期名单快照、未知条目和无效动作，保留其他页最新字段', () => {
  const { store, storage, rows } = fixture();
  const old = ids(store);
  const other = Common.createStore(storage);
  assert.equal(other.save({ ...rows[1], abbr: 'Other-page' }).ok, true);
  assert.equal(store.move(rows[1].id, 'top', old).ok, true);
  assert.equal(store.load().items[0].abbr, 'Other-page');
  const current = ids(store);
  assert.equal(store.move(rows[2].id, 'top', old).ok, false);
  assert.equal(store.move('missing', 'up', current).ok, false);
  assert.equal(store.move(rows[0].id, 'invalid', current).ok, false);
  assert.equal(store.move(rows[0].id, 'up').ok, false);
  assert.deepEqual(ids(store), current);
  assert.equal(store.move(current[0], 'up', current).ok, true);
  assert.deepEqual(ids(store), current);
});

const { loadApp, goto } = require('./dom-stub');
function appFixture() {
  const app = loadApp();
  const store = app.win.AppNS.commonNameStore();
  for (const [name, latin, abbr] of [['中组', 'Zeta', 'C10'], ['阿组', 'Alpha', 'C2'], ['波组', 'Beta', '']]) {
    store.save({ name, latin, abbr });
  }
  goto(app, '#/common-names');
  return { app, store };
}
function visibleNames(app) { return app.doc.querySelectorAll('.common-row').map(row => row.querySelector('h2').textContent); }
function changeMode(app, mode) { const select = app.doc.getElementById('common-sort'); select.value = mode; select.dispatch('change'); }

test('界面可切换并记住自动排序，手动置顶即时保存且自动排序不破坏手动结果', () => {
  const { app, store } = appFixture();
  assert.ok(app.doc.getElementById('common-sort'));
  changeMode(app, 'name');
  assert.deepEqual(visibleNames(app), ['阿组', '波组', '中组']);
  assert.deepEqual(store.load().items.map(x => x.name), ['中组', '阿组', '波组']);
  goto(app, '#/microbes'); goto(app, '#/common-names');
  assert.equal(app.doc.getElementById('common-sort').value, 'name');
  changeMode(app, 'manual');
  app.doc.querySelector('.common-arrange-toggle').click();
  app.doc.querySelectorAll('.common-row')[2].querySelector('.common-move-top').click();
  assert.deepEqual(visibleNames(app), ['波组', '中组', '阿组']);
  changeMode(app, 'latin');
  assert.deepEqual(visibleNames(app), ['阿组', '波组', '中组']);
  changeMode(app, 'manual');
  assert.deepEqual(visibleNames(app), ['波组', '中组', '阿组']);
  assert.deepEqual(store.load().items.map(x => x.name), ['波组', '中组', '阿组']);
});

test('筛选期间禁止移动，过期界面调序不覆盖最新名单', () => {
  const { app, store } = appFixture();
  app.doc.querySelector('.common-arrange-toggle').click();
  const oldButton = app.doc.querySelectorAll('.common-row')[2].querySelector('.common-move-top');
  const latestIds = ids(store);
  store.move(latestIds[1], 'top', latestIds);
  oldButton.click();
  assert.deepEqual(store.load().items.map(x => x.name), ['阿组', '中组', '波组']);
  assert.ok(app.doc.getElementById('common-status').classList.contains('is-error'));
  const filter = app.doc.getElementById('common-filter'); filter.value = '波组'; filter.dispatch('input');
  const move = app.doc.querySelector('.common-move-top');
  assert.equal(move.disabled, true);
  move.click();
  assert.deepEqual(store.load().items.map(x => x.name), ['阿组', '中组', '波组']);
});

test('排序偏好写失败仍能临时排序并报错，其他标签页的偏好能同步到当前列表', () => {
  const { app, store } = appFixture();
  const originalSet = app.win.localStorage.setItem;
  app.win.localStorage.setItem = (key, value) => { if (key === app.win.CommonNames.SORT_KEY) { throw new Error('denied'); } originalSet(key, value); };
  changeMode(app, 'name');
  assert.deepEqual(visibleNames(app), ['阿组', '波组', '中组']);
  assert.ok(app.doc.getElementById('common-status').classList.contains('is-error'));
  assert.equal(store.loadSortMode().mode, 'manual');
  app.win.localStorage.setItem = originalSet;
  store.saveSortMode('abbr');
  app.win.dispatch('storage', { key: app.win.CommonNames.SORT_KEY });
  assert.equal(app.doc.getElementById('common-sort').value, 'abbr');
  assert.deepEqual(visibleNames(app), ['阿组', '中组', '波组']);
  assert.deepEqual(store.load().items.map(x => x.name), ['中组', '阿组', '波组']);
});

test('移动写入失败时保留顺序，并恢复到新渲染的操作按钮', () => {
  const { app, store } = appFixture();
  app.doc.querySelector('.common-arrange-toggle').click();
  const oldButton = app.doc.querySelectorAll('.common-row')[2].querySelector('.common-move-top');
  app.win.localStorage.setItem = () => { throw new Error('blocked'); };
  oldButton.click();
  assert.deepEqual(store.load().items.map(x => x.name), ['中组', '阿组', '波组']);
  assert.ok(app.doc.getElementById('common-status').classList.contains('is-error'));
  const newButton = app.doc.querySelectorAll('.common-row')[2].querySelector('.common-move-top');
  assert.notEqual(newButton, oldButton);
  assert.ok(newButton.ownerDocument_activeElement, '不能把焦点留在已经删除的旧按钮');
});
