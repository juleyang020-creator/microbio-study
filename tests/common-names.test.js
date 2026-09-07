'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const CommonNames = require('../js/common-names.js');

test('UMD 同时支持 Node require 与浏览器 window.CommonNames', () => {
  assert.equal(CommonNames.STORAGE_KEY, 'zhiwei-common-names-v1');
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/common-names.js'), 'utf8'), context);
  assert.equal(context.window.CommonNames.STORAGE_KEY, CommonNames.STORAGE_KEY);
});

function catalogFixture() {
  return CommonNames.buildCatalog([
    { 名称: '示例甲', 拉丁名: 'Example alpha', 别名: '甲旧名、甲既有别名', MALDI: '不要作为别名' },
    { 名称: '示例甲', 拉丁名: 'Example beta' },
    { 名称: '示例甲', 拉丁名: 'E.alpha' },
    { 名称: '示例甲', 拉丁名: 'Example alpha', 别名: ['既有代码'] },
    { 名称: '无详情名', 拉丁名: '' }
  ], [
    { id: 'example-a', 名称: '示例甲', 拉丁名: 'Example alpha', 别名: ['详情别名'] },
    { id: 'example-b', 名称: '示例甲', 拉丁名: 'Example beta' },
    { id: 'example-c', 名称: '示例乙', 拉丁名: 'Example gamma' }
  ]);
}

test('候选只合并相同中拉名称对，保留歧义和库中原有缩写，不推断详情链接', () => {
  const catalog = catalogFixture();
  assert.equal(catalog.length, 5);
  assert.deepEqual(catalog[0], {
    name: '示例甲', latin: 'Example alpha',
    aliases: ['甲旧名', '甲既有别名', '既有代码', '详情别名'], microbeId: 'example-a'
  });
  assert.equal(catalog.find(x => x.latin === 'Example beta').microbeId, 'example-b');
  assert.equal(catalog.find(x => x.latin === 'E.alpha').microbeId, '');
  assert.equal(catalog.find(x => x.name === '示例乙').microbeId, 'example-c');
  assert.equal(catalog.find(x => x.name === '无详情名').microbeId, '');
  assert.deepEqual(CommonNames.buildCatalog(null, null), []);
});

test('候选搜索按中文、拉丁名、已有别名匹配，精确优先并限制结果数', () => {
  const catalog = catalogFixture();
  assert.equal(CommonNames.suggest(catalog, 'ＥＸＡＭＰＬＥ　ＡＬＰＨＡ')[0], catalog[0]);
  assert.equal(CommonNames.suggest(catalog, '既有代码')[0], catalog[0]);
  assert.equal(CommonNames.suggest(catalog, '示例甲').length, 3);
  assert.equal(CommonNames.suggest(catalog, 'example', 1).length, 1);
  assert.deepEqual(CommonNames.suggest(catalog, '推断代码'), []);
  assert.deepEqual(CommonNames.suggest(catalog, 'E. beta'), []);
  assert.deepEqual(CommonNames.suggest(catalog, ' '), []);
  assert.deepEqual(CommonNames.suggest(catalog, 'x'.repeat(201)), []);
  assert.deepEqual(CommonNames.suggest(catalog, 'example', 0), []);
  assert.deepEqual(CommonNames.suggest(catalog, 'example', -1), []);
  assert.deepEqual(CommonNames.suggest(catalog, 'example', NaN), []);
  const many = Array.from({ length: 12 }, (_, i) => ({ name: '示例' + i, latin: '', aliases: [] }));
  assert.equal(CommonNames.suggest(many, '示例').length, 8);
  assert.equal(CommonNames.suggest(many, '示例', 2.8).length, 2);
  const ranked = [
    { name: '示例甲扩展', latin: '', aliases: [] },
    { name: '示例乙', latin: '', aliases: ['示例甲'] },
    { name: '示例甲', latin: '', aliases: [] }
  ];
  assert.deepEqual(CommonNames.suggest(ranked, '示例甲'), [ranked[1], ranked[2], ranked[0]]);
});

test('常用名单筛选仅按 name/latin/abbr，保留顺序与原文，空查询返回副本', () => {
  const items = [
    { name: '示例甲', latin: 'Example alpha', abbr: 'aB / 2', microbeId: '不要检索', id: '不要检索' },
    { name: '示例乙', latin: '', abbr: '' }
  ];
  assert.deepEqual(CommonNames.filter(items, '示例'), items);
  assert.deepEqual(CommonNames.filter(items, 'ＥＸＡＭＰＬＥ'), [items[0]]);
  assert.deepEqual(CommonNames.filter(items, 'Ａｂ / 2'), [items[0]]);
  assert.deepEqual(CommonNames.filter(items, '不要检索'), []);
  assert.deepEqual(CommonNames.filter(items, '不存在'), []);
  assert.deepEqual(CommonNames.filter(null, ''), []);
  assert.deepEqual(CommonNames.filter(items, ''), items);
  assert.notEqual(CommonNames.filter(items, ''), items);
  assert.equal(items[0].abbr, 'aB / 2');
});

function memoryStorage(initial = null) {
  let raw = initial;
  return {
    getItem(key) { assert.equal(key, CommonNames.STORAGE_KEY); return raw; },
    setItem(key, value) { assert.equal(key, CommonNames.STORAGE_KEY); raw = String(value); }
  };
}

function readRaw(storage) { return storage.getItem(CommonNames.STORAGE_KEY); }
function backup(items, version = 1) {
  return JSON.stringify({ format: 'zhiwei-common-names', version, items });
}
function entry(id, name = '示例甲', latin = '') {
  return { id, name, latin, abbr: '', microbeId: '' };
}
function assertFailure(result, message) {
  assert.equal(result.ok, false);
  assert.equal(typeof result.error, 'string');
  assert.ok(result.error.length > 0);
  if (message) assert.match(result.error, message);
}

test('本地 CRUD 往返保留字面字段，新增生成唯一 ID，编辑和删除按 ID', () => {
  const storage = memoryStorage();
  const store = CommonNames.createStore(storage);
  assert.deepEqual(store.load(), { ok: true, items: [] });
  const fields = { name: '  示例 甲  ', latin: 'ExAmple  Alpha', abbr: 'aB /  x-2', microbeId: 'example-a' };
  const added = store.save(fields);
  assert.equal(added.ok, true);
  assert.equal(typeof added.item.id, 'string');
  assert.ok(added.item.id.length > 0);
  assert.deepEqual(added.item, { id: added.item.id, ...fields });
  assert.deepEqual(store.load().items, [added.item]);
  assert.deepEqual(added.items, [added.item]);
  assert.deepEqual(JSON.parse(readRaw(storage)), JSON.parse(backup([added.item])));
  const second = store.save({ name: '示例乙' });
  assert.equal(second.ok, true);
  assert.notEqual(second.item.id, added.item.id);
  assert.deepEqual(second.item, entry(second.item.id, '示例乙'));
  const changed = store.save({ ...added.item, abbr: 'New  Mixed' });
  assert.equal(changed.ok, true);
  assert.equal(changed.item.id, added.item.id);
  assert.equal(changed.item.abbr, 'New  Mixed');
  assert.equal(store.load().items.length, 2);
  assertFailure(store.save({ id: 'missing', name: '不存在 ID' }), /不存在/);
  assertFailure(store.remove('missing'), /不存在/);
  const removed = store.remove(added.item.id);
  assert.equal(removed.ok, true);
  assert.deepEqual(removed.items, [second.item]);
  removed.items[0].name = '不应改变存储';
  assert.equal(CommonNames.createStore(storage).load().items[0].name, '示例乙');
});

test('保存严格校验字段、类型与长度，拒绝原型字段但不改变合法文字格式', () => {
  const storage = memoryStorage();
  const store = CommonNames.createStore(storage);
  const invalid = [null, [], '示例甲', {}, { name: '' }, { name: '　\u200b ' },
    { name: 3 }, { name: '甲', latin: null }, { name: '甲', abbr: 1 },
    { name: '甲', microbeId: {} }, { name: '甲', id: 4 },
    { name: '甲'.repeat(201) }, { name: '甲', latin: 'x'.repeat(201) },
    { name: '甲', abbr: 'x'.repeat(81) }, { name: '甲', microbeId: 'x'.repeat(201) },
    { name: '甲', extra: '不支持字段' }, { name: '甲', constructor: {} },
    JSON.parse('{"name":"甲","__proto__":{"polluted":true}}'),
    Object.create({ name: '原型上的名称' })];
  invalid.forEach(value => {
    assertFailure(store.save(value));
    assert.equal(readRaw(storage), null);
  });
  assert.equal({}.polluted, undefined);
  const legal = { name: '甲'.repeat(200), latin: 'L'.repeat(200), abbr: 'a'.repeat(80), microbeId: '' };
  assert.equal(store.save(legal).ok, true);
  const literal = { name: '<b>字面名称</b>', latin: 'Ｅx  AmPle', abbr: '  xY /\tZ  ' };
  const result = store.save(literal);
  assert.equal(result.ok, true);
  assert.equal(result.item.name, literal.name);
  assert.equal(result.item.latin, literal.latin);
  assert.equal(result.item.abbr, literal.abbr);
});

test('按拉丁名优先去重；缺拉丁名时同名去重，不能合并不同拉丁名的同名项', () => {
  const storage = memoryStorage();
  const store = CommonNames.createStore(storage);
  const a = store.save({ name: '示例甲', latin: 'Example alpha', abbr: 'keepCase' }).item;
  const before = readRaw(storage);
  const duplicate = store.save({ name: '另一个中文名', latin: 'ＥＸＡＭＰＬＥ  ＡＬＰＨＡ', abbr: '不要覆盖' });
  assertFailure(duplicate, /重复/);
  assert.equal(duplicate.duplicateId, a.id);
  assert.equal(readRaw(storage), before);
  const different = store.save({ name: '示例甲', latin: 'Example beta' });
  assert.equal(different.ok, true);
  const missingLatin = store.save({ name: '示例甲', abbr: '不要覆盖' });
  assertFailure(missingLatin, /重复/);
  assert.equal(missingLatin.duplicateId, a.id);
  const editDuplicate = store.save({ ...different.item, latin: 'example alpha' });
  assertFailure(editDuplicate, /重复/);
  assert.equal(editDuplicate.duplicateId, a.id);
  assert.equal(store.save({ ...a, abbr: 'Updated' }).ok, true);
  const withoutLatin = store.save({ name: '只录名称' }).item;
  assert.equal(store.save({ name: '只录名称', latin: 'Example gamma' }).duplicateId, withoutLatin.id);
  assert.equal(store.load().items.length, 3);
});

test('名单最多 500 条，满额仍可编辑删除，拒绝新增时不写存储', () => {
  const items = Array.from({ length: 500 }, (_, i) => entry('old-' + i, '占位名称' + i));
  const storage = memoryStorage(backup(items));
  const store = CommonNames.createStore(storage);
  assert.equal(store.load().items.length, 500);
  const before = readRaw(storage);
  assertFailure(store.save({ name: '第 501 项' }), /500/);
  assert.equal(readRaw(storage), before);
  assert.equal(store.save({ ...items[0], abbr: 'editable' }).ok, true);
  assert.equal(store.remove(items[1].id).ok, true);
  assert.equal(store.save({ name: '补入项' }).ok, true);
  assert.equal(store.load().items.length, 500);
});

test('损坏或不支持的本地存储整体报错，所有变更保留损坏原文', () => {
  const invalid = ['{broken', '', 'null', '[]', '{}', backup([], 2),
    JSON.stringify({ format: 'other', version: 1, items: [] }),
    backup([entry('same'), entry('same', '示例乙')]),
    backup([{ ...entry('a'), name: '' }]), backup([{ id: 'a', name: '甲' }]),
    backup(Array.from({ length: 501 }, (_, i) => entry('id-' + i, '名称' + i))),
    '{"format":"zhiwei-common-names","version":1,"items":[],"__proto__":{"polluted":true}}'];
  invalid.forEach(raw => {
    const storage = memoryStorage(raw);
    const store = CommonNames.createStore(storage);
    assertFailure(store.load());
    assertFailure(store.save({ name: '新条目' }));
    assertFailure(store.remove('old'));
    assert.equal(readRaw(storage), raw);
  });
  assertFailure(CommonNames.createStore(memoryStorage(backup([], 99))).load(), /版本/);
  assert.equal({}.polluted, undefined);
});

test('读取失败、写入失败与配额不足必须返回错误而不是假报保存成功', () => {
  const noRead = CommonNames.createStore({ getItem() { throw new Error('denied'); } });
  assertFailure(noRead.load(), /读取/);
  assertFailure(noRead.save({ name: '甲' }), /读取/);
  assertFailure(noRead.remove('old'), /读取/);
  assertFailure(CommonNames.createStore(null).load(), /存储/);
  for (const name of ['Error', 'QuotaExceededError']) {
    const raw = backup([entry('old')]);
    const storage = memoryStorage(raw);
    storage.setItem = () => { const error = new Error('write denied'); error.name = name; throw error; };
    const store = CommonNames.createStore(storage);
    const pattern = name === 'QuotaExceededError' ? /配额/ : /写入/;
    assertFailure(store.save({ name: '乙' }), pattern);
    assertFailure(store.remove('old'), pattern);
    assert.equal(readRaw(storage), raw);
  }
});

test('写入后必须读回逐字核对：静默写失败与读回异常都不能成功', () => {
  const raw = backup([entry('old')]);
  const storage = memoryStorage(raw);
  storage.setItem = () => {};
  const store = CommonNames.createStore(storage);
  assertFailure(store.save({ name: '乙' }), /核对/);
  assertFailure(store.remove('old'), /核对/);
  assert.equal(readRaw(storage), raw);
  let written = false;
  const cannotVerify = CommonNames.createStore({
    getItem() { if (written) throw new Error('read-back denied'); return raw; },
    setItem() { written = true; }
  });
  assertFailure(cannotVerify.save({ name: '乙' }), /核对/);
});

test('备份往返使用固定格式，导入合并去重并重分配 ID、保留已有简写', () => {
  const source = CommonNames.createStore(memoryStorage());
  const a = source.save({ id: '', name: '示例甲', latin: 'Example alpha', abbr: 'Keep  Ab', microbeId: '' }).item;
  const b = source.save({ name: '示例甲', latin: 'Example beta', abbr: 'lower' }).item;
  const exported = source.exportBackup();
  assert.equal(exported.ok, true);
  assert.deepEqual(JSON.parse(exported.text), JSON.parse(backup([a, b])));
  const targetStorage = memoryStorage();
  const target = CommonNames.createStore(targetStorage);
  const imported = target.importBackup(exported.text);
  assert.equal(imported.ok, true);
  assert.equal(imported.added, 2);
  assert.equal(imported.skipped, 0);
  assert.deepEqual(imported.items.map(({ id, ...rest }) => rest), [a, b].map(({ id, ...rest }) => rest));
  assert.ok(imported.items.every(item => ![a.id, b.id].includes(item.id)));
  const before = readRaw(targetStorage);
  const again = target.importBackup(exported.text);
  assert.equal(again.added, 0);
  assert.equal(again.skipped, 2);
  assert.equal(readRaw(targetStorage), before);
  const merged = target.importBackup(backup([
    { ...a, id: imported.items[0].id, abbr: '不要覆盖' },
    { ...entry(imported.items[1].id, '示例乙', 'Example gamma'), abbr: 'mixed Case' },
    { ...entry('duplicate-in-backup', '另一名称', 'example gamma'), abbr: '不要覆盖' }
  ]));
  assert.equal(merged.ok, true);
  assert.equal(merged.added, 1);
  assert.equal(merged.skipped, 2);
  assert.equal(merged.items.length, 3);
  assert.equal(merged.items[0].abbr, 'Keep  Ab');
  assert.equal(merged.items[2].abbr, 'mixed Case');
  assert.ok(merged.items[2].id !== imported.items[1].id);
  const empty = CommonNames.createStore(memoryStorage());
  assert.deepEqual(JSON.parse(empty.exportBackup().text), JSON.parse(backup([])));
  assert.deepEqual(empty.importBackup(backup([])), { ok: true, items: [], added: 0, skipped: 0 });
});

test('导入严格校验整个文档及每个字段，任一项无效不得部分写入', () => {
  const storage = memoryStorage(backup([entry('kept', '原有名单')]));
  const store = CommonNames.createStore(storage);
  const good = entry('imported', '新名称');
  const invalidItems = [null, [], { name: '缺字段' }, { ...good, id: '' },
    { ...good, id: 7 }, { ...good, name: '' }, { ...good, latin: null },
    { ...good, abbr: [] }, { ...good, microbeId: false },
    { ...good, name: 'x'.repeat(201) }, { ...good, latin: 'x'.repeat(201) },
    { ...good, abbr: 'x'.repeat(81) }, { ...good, microbeId: 'x'.repeat(201) },
    { ...good, id: 'x'.repeat(201) }, { ...good, extra: '不支持字段' },
    { ...good, constructor: { prototype: { polluted: true } } },
    JSON.parse('{"id":"evil","name":"恶意字段","latin":"","abbr":"","microbeId":"","__proto__":{"polluted":true}}')];
  const badDocuments = ['{', '', 'null', '[]', '{}', backup([], 2), backup([], '1'),
    JSON.stringify({ format: 'other', version: 1, items: [] }),
    JSON.stringify({ format: 'zhiwei-common-names', version: 1, items: {} }),
    JSON.stringify({ format: 'zhiwei-common-names', version: 1, items: [], extra: 1 }),
    '{"format":"zhiwei-common-names","version":1,"items":[],"__proto__":{"polluted":true}}',
    backup([entry('same'), entry('same', '乙')]),
    backup(Array.from({ length: 501 }, (_, i) => entry('id-' + i, '占位' + i))),
    ' '.repeat(3 * 1024 * 1024) + backup([]),
    { toString() { return backup([good]); } },
    ...invalidItems.map(item => backup([entry('valid-first', '本不应写入'), item]))];
  const before = readRaw(storage);
  badDocuments.forEach(text => {
    assertFailure(store.importBackup(text));
    assert.equal(readRaw(storage), before);
  });
  assert.equal({}.polluted, undefined);
});

test('导入合并后超过 500 条整体拒绝，不覆盖原名单；满额导入重复项允许跳过', () => {
  const items = Array.from({ length: 500 }, (_, i) => entry('old-' + i, '占位名称' + i));
  const storage = memoryStorage(backup(items));
  const store = CommonNames.createStore(storage);
  const before = readRaw(storage);
  assertFailure(store.importBackup(backup([entry('new', '新增名称')])), /500/);
  assert.equal(readRaw(storage), before);
  const duplicateOnly = store.importBackup(backup([{ ...items[0], abbr: '不要覆盖' }]));
  assert.equal(duplicateOnly.ok, true);
  assert.equal(duplicateOnly.added, 0);
  assert.equal(duplicateOnly.skipped, 1);
  assert.equal(readRaw(storage), before);
});

test('保存接受跨 realm 纯对象，仍拒绝类实例与自定义继承原型', () => {
  const store = CommonNames.createStore(memoryStorage());
  const input = vm.runInNewContext('({ id: "", name: "跨 realm 名称", latin: "", abbr: "Mixed", microbeId: "" })', { Object, JSON });
  assert.equal(store.save(input).ok, true);
  assert.equal(store.load().items[0].abbr, 'Mixed');
  class NotPlain { constructor() { this.name = '类实例'; } }
  [new NotPlain(), new Date(), Object.assign(Object.create({ abbr: '继承字段' }), { name: '继承名称' }),
    Object.assign(Object.create(Object.create(null)), { name: '自定义空原型链' })]
    .forEach(value => assertFailure(store.save(value)));
});

test('导入导出同样不能绕过损坏存储、读取错误、写入错误或读回核对', () => {
  for (const raw of ['{broken', backup([], 9)]) {
    const storage = memoryStorage(raw);
    const store = CommonNames.createStore(storage);
    assertFailure(store.exportBackup());
    assertFailure(store.importBackup(backup([entry('new')])));
    assertFailure(store.importBackup(backup([])));
    assert.equal(readRaw(storage), raw);
  }
  const noRead = CommonNames.createStore({ getItem() { throw new Error('read denied'); } });
  assertFailure(noRead.exportBackup(), /读取/);
  assertFailure(noRead.importBackup(backup([entry('new')])), /读取/);
  const raw = backup([entry('old', '已有项')]);
  const failedWrite = memoryStorage(raw);
  failedWrite.setItem = () => { const error = new Error('quota'); error.name = 'QuotaExceededError'; throw error; };
  assertFailure(CommonNames.createStore(failedWrite).importBackup(backup([entry('new')])), /配额/);
  assert.equal(readRaw(failedWrite), raw);
  const silentWrite = memoryStorage(raw);
  silentWrite.setItem = () => {};
  assertFailure(CommonNames.createStore(silentWrite).importBackup(backup([entry('new')])), /核对/);
  assert.equal(readRaw(silentWrite), raw);
});

test('跨实例每次变更读取最新名单，不让旧 load 结果覆盖他人的新增、编辑或删除', () => {
  const storage = memoryStorage();
  const first = CommonNames.createStore(storage);
  const second = CommonNames.createStore(storage);
  const stale = first.load();
  const a = second.save({ name: '甲', abbr: 'a' }).item;
  const b = first.save({ name: '乙' }).item;
  assert.deepEqual(second.load().items.map(x => x.id), [a.id, b.id]);
  assert.deepEqual(stale.items, []);
  second.save({ ...a, abbr: 'newCase' });
  first.save({ ...b, abbr: 'b' });
  assert.equal(first.load().items[0].abbr, 'newCase');
  const imported = second.importBackup(backup([entry('new', '丙')]));
  assert.equal(imported.items.length, 3);
  first.remove(b.id);
  assert.equal(second.load().items.length, 2);
  assertFailure(second.save({ ...b, name: '被删除的乙' }), /不存在/);
  assert.equal(JSON.parse(first.exportBackup().text).items.length, 2);
});

test('读完到写入前发现另一实例更新或损坏时中止写入，保留最新原文', () => {
  for (const latest of [backup([entry('other', '其他页面的新名单')]), '{now-corrupt']) {
    for (const operation of ['save', 'remove', 'importBackup']) {
      const original = backup([entry('old', '原有项')]);
      let raw = original;
      let reads = 0;
      let writes = 0;
      const store = CommonNames.createStore({
        getItem() { reads += 1; if (reads === 2) raw = latest; return raw; },
        setItem(key, text) { writes += 1; raw = text; }
      });
      const result = operation === 'save' ? store.save({ name: '新增项' }) :
        operation === 'remove' ? store.remove('old') : store.importBackup(backup([entry('incoming')]));
      assertFailure(result, /更新|变化|重试/);
      assert.equal(writes, 0);
      assert.equal(raw, latest);
    }
  }
});

test('严格纯对象校验不接受伪造根原型、继承字段、隐藏字段或字段访问器', () => {
  const storage = memoryStorage();
  const store = CommonNames.createStore(storage);
  const fakeRoot = Object.assign(Object.create(null), { constructor: Object, name: '继承名称' });
  const inheritedNative = vm.runInNewContext('Object.prototype.name = "继承字段"; ({})');
  const hidden = Object.defineProperty({ name: '隐藏字段' }, '__proto__', { value: { polluted: true } });
  let reads = 0;
  const accessor = { get name() { reads += 1; return '访问器名称'; } };
  const symbolField = { name: '符号字段', [Symbol('extra')]: '不应存在' };
  for (const value of [Object.create(fakeRoot), inheritedNative, hidden, accessor, symbolField]) {
    assertFailure(store.save(value));
    assert.equal(readRaw(storage), null);
  }
  assert.equal(reads, 0);
});
