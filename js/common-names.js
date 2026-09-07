(function (factory) {
  'use strict';
  var CommonNames = factory();
  if (typeof module !== 'undefined' && module.exports) { module.exports = CommonNames; }
  if (typeof window !== 'undefined') { window.CommonNames = CommonNames; }
})(function () {
  'use strict';

  var STORAGE_KEY = 'zhiwei-common-names-v1';

  // 仅用于比较，不改变保存的字面值，也不使用 Core 的医学/仪器缩写扩展。
  function normalize(value) {
    return typeof value === 'string' ? value.replace(/[\uff01-\uff5e]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
    }).toLowerCase().replace(/[\s\u200b]+/g, ' ').trim() : '';
  }

  function list(value) { return Array.isArray(value) ? value : []; }

  function buildCatalog(nameRecords, microbes) {
    var details = list(microbes);
    var byLatin = new Map();
    var byName = new Map();
    function indexId(index, text, id) {
      var key = normalize(text);
      if (!key) { return; }
      if (!index.has(key)) { index.set(key, new Set()); }
      index.get(key).add(id);
    }
    details.forEach(function (detail) {
      if (!detail || typeof detail.id !== 'string' || !detail.id) { return; }
      indexId(byLatin, detail.拉丁名, detail.id);
      indexId(byName, detail.名称, detail.id);
    });
    var catalog = [];
    var pairs = new Map();
    list(nameRecords).concat(details).forEach(function (record) {
      if (!record || !normalize(record.名称)) { return; }
      var name = record.名称;
      var latin = typeof record.拉丁名 === 'string' ? record.拉丁名 : '';
      var key = JSON.stringify([normalize(name), normalize(latin)]);
      var entry = pairs.get(key);
      if (!entry) {
        // 拉丁名非空时只按拉丁名精确关联；绝不靠中文同名展开缩写属名。
        var ids = normalize(latin) ? byLatin.get(normalize(latin)) : byName.get(normalize(name));
        entry = { name: name, latin: latin, aliases: [], microbeId: ids && ids.size === 1 ? Array.from(ids)[0] : '' };
        pairs.set(key, entry);
        catalog.push(entry);
      }
      var aliases = Array.isArray(record.别名) ? record.别名 :
        (typeof record.别名 === 'string' ? record.别名.split('、') : []);
      aliases.forEach(function (alias) {
        if (normalize(alias) && !entry.aliases.some(function (old) { return normalize(old) === normalize(alias); })) {
          entry.aliases.push(alias);
        }
      });
    });
    return catalog;
  }

  function suggest(catalog, query, limit) {
    var term = normalize(query);
    var count = limit === undefined ? 8 : limit;
    if (!term || typeof query !== 'string' || query.length > 200 ||
      typeof count !== 'number' || !Number.isFinite(count) || count < 1) { return []; }
    var exact = [];
    var partial = [];
    list(catalog).forEach(function (item) {
      if (!item) { return; }
      var fields = [item.name, item.latin].concat(list(item.aliases)).map(normalize);
      if (fields.indexOf(term) !== -1) { exact.push(item); }
      else if (fields.some(function (field) { return field.indexOf(term) !== -1; })) { partial.push(item); }
    });
    return exact.concat(partial).slice(0, Math.floor(count));
  }

  function filter(items, query) {
    var term = normalize(query);
    return list(items).filter(function (item) {
      return item && (!term || [item.name, item.latin, item.abbr].some(function (field) {
        return normalize(field).indexOf(term) !== -1;
      }));
    });
  }

  var SORT_MODES = ['manual', 'name', 'latin', 'abbr'];
  var SORT_KEY = 'zhiwei-common-names-sort';
  var nameCollator = new Intl.Collator('zh-CN-u-co-pinyin', { numeric: true, sensitivity: 'base' });
  var codeCollator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  // 自动排序只生成显示副本；持久化数组始终保留手动顺序。
  function sortItems(items, mode) {
    if (mode === 'manual' || SORT_MODES.indexOf(mode) === -1) { return list(items).slice(); }
    var compare = mode === 'name' ? nameCollator.compare : codeCollator.compare;
    return list(items).map(function (item, index) { return { item: item, index: index, key: normalize(item && item[mode]) }; })
      .sort(function (a, b) {
        if (!a.key && b.key) { return 1; }
        if (a.key && !b.key) { return -1; }
        return compare(a.key, b.key) || a.index - b.index;
      }).map(function (row) { return row.item; });
  }

  var FORMAT = 'zhiwei-common-names';
  var ITEM_FIELDS = ['id', 'name', 'latin', 'abbr', 'microbeId'];
  var MAX_ITEMS = 500;
  var sequence = 0;

  function failure(error) { return { ok: false, error: error }; }
  function serialize(items) { return JSON.stringify({ format: FORMAT, version: 1, items: items }); }

  function validObject(value, fields) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) { return false; }
    var prototype = Object.getPrototypeOf(value);
    // iframe/VM 的 Object.prototype 不同，但纯对象的原型仍是原生 Object 的根原型。
    var constructor = prototype && Object.getOwnPropertyDescriptor(prototype, 'constructor');
    var plain = prototype === null || (Object.getPrototypeOf(prototype) === null && constructor &&
      typeof constructor.value === 'function' && constructor.value.prototype === prototype &&
      Function.prototype.toString.call(constructor.value) === Function.prototype.toString.call(Object));
    return !!plain && Object.getOwnPropertySymbols(value).length === 0 &&
      Object.getOwnPropertyNames(value).every(function (key) {
        return fields.indexOf(key) !== -1 &&
          Object.prototype.hasOwnProperty.call(Object.getOwnPropertyDescriptor(value, key), 'value');
      }) && fields.every(function (key) {
        return !(key in value) || Object.prototype.hasOwnProperty.call(value, key);
      });
  }

  function validateItem(input, complete) {
    if (!validObject(input, ITEM_FIELDS)) { return '条目格式无效或含不支持字段。'; }
    for (var i = 0; i < ITEM_FIELDS.length; i += 1) {
      var key = ITEM_FIELDS[i];
      var value = input[key];
      if (value === undefined && !complete && key !== 'name') { continue; }
      if (typeof value !== 'string') { return '条目字段 ' + key + ' 必须为文字。'; }
      if (value.length > (key === 'abbr' ? 80 : 200)) { return '条目字段 ' + key + ' 超过长度限制。'; }
    }
    if (!normalize(input.name)) { return '名称不能为空。'; }
    if (complete && !normalize(input.id)) { return '条目 ID 不能为空。'; }
    return '';
  }

  function newId(items) {
    var id;
    do {
      sequence += 1;
      id = 'cn-' + Date.now().toString(36) + '-' + sequence.toString(36);
    } while (items.some(function (item) { return item.id === id; }));
    return id;
  }

  function duplicateOf(items, candidate) {
    return items.find(function (item) {
      if (candidate.id && item.id === candidate.id) { return false; }
      var latin = normalize(item.latin);
      var otherLatin = normalize(candidate.latin);
      return latin && otherLatin ? latin === otherLatin : normalize(item.name) === normalize(candidate.name);
    });
  }

  function parseDocument(text) {
    if (typeof text !== 'string') { return failure('名单 JSON 必须为文字。'); }
    if (text.length > 3 * 1024 * 1024) { return failure('名单 JSON 超过大小限制。'); }
    var data;
    try { data = JSON.parse(text); }
    catch (error) { return failure('JSON 数据损坏，无法读取。'); }
    if (!validObject(data, ['format', 'version', 'items']) || data.format !== FORMAT) {
      return failure('名单格式无效。');
    }
    if (data.version !== 1) { return failure('不支持此名单版本。'); }
    if (!Array.isArray(data.items)) { return failure('名单 items 必须为数组。'); }
    if (data.items.length > MAX_ITEMS) { return failure('名单上限为 500 条。'); }
    var ids = new Set();
    for (var i = 0; i < data.items.length; i += 1) {
      var item = data.items[i];
      var error = validateItem(item, true);
      if (error) { return failure('第 ' + (i + 1) + ' 条：' + error); }
      if (ids.has(item.id)) { return failure('名单包含重复 ID。'); }
      ids.add(item.id);
    }
    return { ok: true, items: data.items };
  }

  function createStore(storage) {
    function readSnapshot() {
      var raw;
      try { raw = storage.getItem(STORAGE_KEY); }
      catch (error) { return failure('本地存储读取失败，请检查浏览器存储权限。'); }
      var result = raw === null ? { ok: true, items: [] } : parseDocument(raw);
      if (result.ok) { result.raw = raw; }
      return result;
    }

    function loadSortMode() {
      try {
        var mode = storage.getItem(SORT_KEY);
        return { ok: true, mode: SORT_MODES.indexOf(mode) !== -1 ? mode : 'manual' };
      } catch (error) { return failure('无法读取排序偏好，暂用手动顺序。'); }
    }
    function saveSortMode(mode) {
      if (SORT_MODES.indexOf(mode) === -1) { return failure('不支持此排序方式。'); }
      try {
        storage.setItem(SORT_KEY, mode);
        if (storage.getItem(SORT_KEY) !== mode) { return failure('排序偏好未能保存，请检查浏览器存储。'); }
        return { ok: true, mode: mode };
      } catch (error) { return failure('排序偏好未能保存，请检查浏览器存储。'); }
    }

    function load() {
      var snapshot = readSnapshot();
      return snapshot.ok ? { ok: true, items: snapshot.items } : snapshot;
    }

    function write(items, previousRaw) {
      var text = serialize(items);
      // localStorage 无事务；写前检查可发现读取期间的更新，但不是跨页原子锁。
      try {
        if (storage.getItem(STORAGE_KEY) !== previousRaw) {
          return failure('名单已被其他页面更新或发生变化，请重新读取后重试。');
        }
      } catch (error) { return failure('写入前读取存储失败，未能保存。'); }
      try { storage.setItem(STORAGE_KEY, text); }
      catch (error) {
        return failure(error && (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014) ?
          '本地存储配额不足，未能保存。' : '本地存储写入失败，未能保存。');
      }
      // 核对失败时不回滚：回滚可能覆盖另一页面在此期间保存的新名单。
      try {
        if (storage.getItem(STORAGE_KEY) !== text) { return failure('写入后核对不一致，无法确认保存成功，请重新读取名单。'); }
      } catch (error) { return failure('写入后读取核对失败，无法确认保存成功，请重新读取名单。'); }
      return { ok: true, items: items };
    }

    // save 是整条替换；省略的可选文本字段变为空串，id 省略或空串表示新增。
    function save(input, expectedItem) {
      var error = validateItem(input, false);
      if (error) { return failure(error); }
      var current = readSnapshot();
      if (!current.ok) { return current; }
      var index = current.items.findIndex(function (item) { return item.id === input.id; });
      if (input.id && index === -1) { return failure('条目 ID 不存在，无法编辑。'); }
      if (expectedItem !== undefined) {
        if (validateItem(expectedItem, true) || expectedItem.id !== input.id || index === -1) { return failure('编辑快照无效，请重新打开条目。'); }
        if (ITEM_FIELDS.some(function (key) { return current.items[index][key] !== expectedItem[key]; })) {
          return failure('该条目已被其他页面修改，请取消后重新编辑，避免覆盖新值。');
        }
      }
      var duplicate = duplicateOf(current.items, input);
      if (duplicate) { return { ok: false, error: '名单中已有重复条目。', duplicateId: duplicate.id }; }
      if (index === -1 && current.items.length >= MAX_ITEMS) { return failure('名单上限为 500 条。'); }
      var item = {
        id: input.id || newId(current.items), name: input.name,
        latin: input.latin === undefined ? '' : input.latin,
        abbr: input.abbr === undefined ? '' : input.abbr,
        microbeId: input.microbeId === undefined ? '' : input.microbeId
      };
      if (index === -1) { current.items.push(item); }
      else { current.items[index] = item; }
      var result = write(current.items, current.raw);
      if (result.ok) { result.item = item; }
      return result;
    }

    function remove(id) {
      var current = readSnapshot();
      if (!current.ok) { return current; }
      var index = current.items.findIndex(function (item) { return item.id === id; });
      if (index === -1) { return failure('条目 ID 不存在，无法删除。'); }
      current.items.splice(index, 1);
      return write(current.items, current.raw);
    }

    // 基于完整名单的 ID 顺序快照移动；不使用旧界面中的内容覆盖最新字段。
    function move(id, direction, expectedIds) {
      if (['up', 'down', 'top'].indexOf(direction) === -1 || !Array.isArray(expectedIds)) { return failure('排序操作无效。'); }
      var current = readSnapshot();
      if (!current.ok) { return current; }
      if (expectedIds.length !== current.items.length || current.items.some(function (item, index) { return expectedIds[index] !== item.id; })) {
        return failure('名单或顺序已被其他页面更新，请重新查看后再移动。');
      }
      var from = current.items.findIndex(function (item) { return item.id === id; });
      if (from === -1) { return failure('条目已不存在，无法移动。'); }
      var to = direction === 'top' ? 0 : Math.max(0, Math.min(current.items.length - 1, from + (direction === 'up' ? -1 : 1)));
      if (to === from) { return { ok: true, items: current.items, position: to }; }
      var item = current.items.splice(from, 1)[0];
      current.items.splice(to, 0, item);
      var result = write(current.items, current.raw);
      if (result.ok) { result.position = to; }
      return result;
    }

    function exportBackup() {
      var current = load();
      if (!current.ok) { return current; }
      return { ok: true, items: current.items, text: serialize(current.items) };
    }

    function importBackup(text) {
      var incoming = parseDocument(text);
      if (!incoming.ok) { return incoming; }
      var current = readSnapshot();
      if (!current.ok) { return current; }
      var items = current.items;
      var added = 0;
      var skipped = 0;
      incoming.items.forEach(function (input) {
        // 先移除导入 ID，避免它与现有 ID 相等时绕过去重或变成编辑。
        var item = { id: '', name: input.name, latin: input.latin, abbr: input.abbr, microbeId: input.microbeId };
        if (duplicateOf(items, item)) { skipped += 1; return; }
        item.id = newId(items.concat(incoming.items));
        items.push(item);
        added += 1;
      });
      if (items.length > MAX_ITEMS) { return failure('合并后超过 500 条上限，未导入任何条目。'); }
      var result = added ? write(items, current.raw) : { ok: true, items: items };
      if (result.ok) { result.added = added; result.skipped = skipped; }
      return result;
    }

    return { load: load, save: save, remove: remove, move: move, loadSortMode: loadSortMode, saveSortMode: saveSortMode, exportBackup: exportBackup, importBackup: importBackup };
  }

  return {
    STORAGE_KEY: STORAGE_KEY, buildCatalog: buildCatalog, suggest: suggest,
    filter: filter, createStore: createStore, sortItems: sortItems, SORT_MODES: SORT_MODES.slice(), SORT_KEY: SORT_KEY
  };
});
