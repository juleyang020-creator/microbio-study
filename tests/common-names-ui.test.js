'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, goto } = require('./dom-stub');

function fillForm(app, name, latin, abbr) {
  app.doc.getElementById('common-name').value = name;
  app.doc.getElementById('common-latin').value = latin;
  app.doc.getElementById('common-abbr').value = abbr;
  app.doc.getElementById('common-form').dispatch('submit');
}

test('常见菌工具支持手工保存、刷新恢复、编辑简写及确认移除', () => {
  const app = loadApp();
  goto(app, '#/common-names');
  const main = app.doc.getElementById('main');
  assert.ok(main.querySelector('#common-form'), '应进入独立常见菌工具，而非微生物首页');
  fillForm(app, '示例菌 A', 'Example alpha', 'aBc-01');
  assert.equal(main.querySelectorAll('.common-row').length, 1);
  const store = app.win.CommonNames.createStore(app.win.localStorage);
  assert.equal(store.load().items[0].abbr, 'aBc-01');
  goto(app, '#/microbes');
  goto(app, '#/common-names');
  assert.equal(main.querySelectorAll('.common-row').length, 1);
  main.querySelector('.common-edit').click();
  assert.equal(app.doc.getElementById('common-abbr').value, 'aBc-01');
  fillForm(app, '示例菌 A', 'Example alpha', 'New-code');
  assert.equal(store.load().items.length, 1);
  assert.equal(store.load().items[0].abbr, 'New-code');
  main.querySelector('.common-remove').click();
  assert.equal(store.load().items.length, 1, '首次移除只应显示确认');
  main.querySelector('.common-remove-confirm').click();
  assert.equal(store.load().items.length, 0);
});

test('输入菌名显示候选，选中后补全名称而不生成仪器简写，改名清除旧补全', () => {
  const app = loadApp();
  goto(app, '#/common-names');
  const name = app.doc.getElementById('common-name');
  name.value = '金黄色葡萄球菌'; name.dispatch('input');
  const choice = app.doc.querySelectorAll('.common-option').find(n => n.textContent.includes('Staphylococcus aureus'));
  assert.ok(choice, '应从现有菌名库提供补全候选');
  choice.click();
  assert.equal(app.doc.getElementById('common-latin').value, 'Staphylococcus aureus');
  assert.equal(app.doc.getElementById('common-abbr').value, '');
  name.value = '示例手工名称'; name.dispatch('input');
  assert.equal(app.doc.getElementById('common-latin').value, '', '不能把上一个菌的补全留给新的名称');
});

test('详情和完整菌名库可加入常用，重复加入不覆盖手填简写', () => {
  const app = loadApp();
  const store = app.win.CommonNames.createStore(app.win.localStorage);
  goto(app, '#/microbes/staph-aureus');
  assert.ok(app.doc.querySelector('.common-add-btn'), '菌种详情应有加入常用入口');
  app.doc.querySelector('.common-add-btn').click();
  assert.equal(store.load().items.length, 1);
  const entry = store.load().items[0];
  assert.equal(entry.name, '金黄色葡萄球菌');
  assert.equal(store.save({ ...entry, abbr: 'MyCode' }).ok, true);
  goto(app, '#/microbe-names/' + encodeURIComponent('金黄色葡萄球菌'));
  const main = app.doc.getElementById('main');
  assert.ok(main.querySelector('.common-add-btn'));
  main.querySelector('.common-add-btn').click();
  assert.equal(store.load().items.length, 1);
  assert.equal(store.load().items[0].abbr, 'MyCode');
  assert.equal(main.querySelector('.mn-item').querySelectorAll('button').length, 0, '不能在菌名链接里嵌套添加按钮');
  goto(app, '#/antibiotics/ampicillin');
  assert.equal(app.doc.getElementById('main').querySelectorAll('.common-add-btn').length, 0, '不要把药物加入菌名名单');
});

test('一键复制保留字面值，权限失败提供手工复制而不假报成功', async () => {
  const app = loadApp();
  let copied = '';
  app.win.navigator.clipboard = { writeText: async text => { copied = text; } };
  goto(app, '#/common-names');
  fillForm(app, '示例菌', 'Example alpha', 'AbC-02');
  assert.ok(app.doc.querySelector('.common-copy-abbr'));
  app.doc.querySelector('.common-copy-abbr').click();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(copied, 'AbC-02');
  assert.match(app.doc.getElementById('common-status').textContent, /已复制/);
  app.win.navigator.clipboard.writeText = async () => { throw new Error('denied'); };
  app.doc.querySelector('.common-copy-latin').click();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.doc.querySelector('.common-copy-fallback').value, 'Example alpha');
  assert.doesNotMatch(app.doc.getElementById('common-status').textContent, /已复制/);
});

test('备份可导出并在另一浏览器合并导入，坏文件不改变名单', async () => {
  const app = loadApp();
  goto(app, '#/common-names');
  fillForm(app, '示例备份菌', 'Example backup', 'KeepCase');
  assert.ok(app.doc.querySelector('.common-export'));
  app.doc.querySelector('.common-export').click();
  const backup = app.doc.querySelector('.common-backup-text').value;
  assert.equal(JSON.parse(backup).format, 'zhiwei-common-names');
  const other = loadApp();
  goto(other, '#/common-names');
  const input = other.doc.getElementById('common-import');
  input.files = [{ size: Buffer.byteLength(backup), text: async () => backup }];
  input.dispatch('change');
  await new Promise(resolve => setImmediate(resolve));
  const store = other.win.CommonNames.createStore(other.win.localStorage);
  assert.equal(store.load().items.length, 1);
  assert.equal(store.load().items[0].abbr, 'KeepCase');
  input.files = [{ size: 3, text: async () => 'bad' }];
  input.dispatch('change');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(store.load().items.length, 1);
  assert.ok(other.doc.getElementById('common-status').classList.contains('is-error'));
});

test('修改手工菌名不删除原有手工拉丁名', () => {
  const app = loadApp(); goto(app, '#/common-names');
  fillForm(app, '示例原名称', 'Example manual', '');
  app.doc.querySelector('.common-edit').click();
  const name = app.doc.getElementById('common-name'); name.value = '示例修订名称'; name.dispatch('input');
  assert.equal(app.doc.getElementById('common-latin').value, 'Example manual');
  app.doc.getElementById('common-form').dispatch('submit');
  assert.equal(app.win.AppNS.commonNameStore().load().items[0].latin, 'Example manual');
});

test('名称变化后沿用旧简写必须明确确认', () => {
  const app = loadApp(); goto(app, '#/common-names');
  fillForm(app, '示例原名称', 'Example alpha', 'Original-code');
  app.doc.querySelector('.common-edit').click();
  const name = app.doc.getElementById('common-name'); name.value = '示例新名称'; name.dispatch('input');
  app.doc.getElementById('common-form').dispatch('submit');
  assert.equal(app.win.AppNS.commonNameStore().load().items[0].name, '示例原名称');
  const confirm = app.doc.getElementById('common-keep-code');
  assert.ok(confirm);
  confirm.checked = true;
  app.doc.getElementById('common-form').dispatch('submit');
  const saved = app.win.AppNS.commonNameStore().load().items[0];
  assert.equal(saved.name, '示例新名称'); assert.equal(saved.abbr, 'Original-code');
});

test('旧编辑草稿不能覆盖另一页已保存的简写', () => {
  const app = loadApp(); goto(app, '#/common-names');
  fillForm(app, '示例名称', 'Example alpha', 'Old-code');
  app.doc.querySelector('.common-edit').click();
  const store = app.win.AppNS.commonNameStore();
  const latest = store.load().items[0];
  assert.equal(store.save({ ...latest, abbr: 'Other-page-code' }).ok, true);
  app.doc.getElementById('common-form').dispatch('submit');
  assert.equal(store.load().items[0].abbr, 'Other-page-code', '不能静默覆盖新值');
  assert.ok(app.doc.getElementById('common-status').classList.contains('is-error'));
  assert.equal(app.doc.getElementById('common-abbr').value, 'Old-code', '保留草稿供用户处理');
});

test('导入期间离开再返回，完成后刷新当前页面而非旧实例', async () => {
  const app = loadApp(); goto(app, '#/common-names');
  fillForm(app, '示例第一条', 'Example alpha', 'A');
  const store = app.win.AppNS.commonNameStore();
  const backup = JSON.parse(store.exportBackup().text);
  backup.items = [{ ...backup.items[0], id: 'incoming', name: '示例第二条', latin: 'Example beta', abbr: 'B' }];
  let complete;
  const waiting = new Promise(resolve => { complete = resolve; });
  const input = app.doc.getElementById('common-import');
  input.files = [{ size: 1000, text: () => waiting }]; input.dispatch('change');
  goto(app, '#/microbes'); goto(app, '#/common-names');
  complete(JSON.stringify(backup));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(store.load().items.length, 2);
  assert.equal(app.doc.querySelectorAll('.common-row').length, 2);
  assert.match(app.doc.getElementById('common-status').textContent, /新增 1 条/);
});

test('选择其他候选保留手写简写并要求核对，不静默删除输入', () => {
  const app = loadApp(); goto(app, '#/common-names');
  fillForm(app, '示例原名称', 'Example alpha', 'Handwritten-code');
  app.doc.querySelector('.common-edit').click();
  const name = app.doc.getElementById('common-name'); name.value = '金黄色葡萄球菌'; name.dispatch('input');
  app.doc.querySelectorAll('.common-option').find(n => n.textContent.includes('Staphylococcus aureus')).click();
  assert.equal(app.doc.getElementById('common-abbr').value, 'Handwritten-code');
  app.doc.getElementById('common-form').dispatch('submit');
  assert.equal(app.win.AppNS.commonNameStore().load().items[0].name, '示例原名称');
  assert.ok(!app.doc.querySelector('.common-code-confirm').hidden);
});
