(function (factory) {
  'use strict';
  var Core = factory();
  if (typeof module !== 'undefined' && module.exports) { module.exports = Core; }
  if (typeof window !== 'undefined') { window.Core = Core; }
})(function () {
  'use strict';

  var MODULE_KEYS = ['microbes', 'antibiotics', 'resistance', 'cards', 'tests', 'media'];

  function buildIndex(db) {
    var index = {};
    MODULE_KEYS.forEach(function (mod) {
      (db[mod] || []).forEach(function (entry) {
        index[entry.id] = { entry: entry, module: mod };
      });
    });
    return index;
  }

  function getRelations(id, db) {
    var index = buildIndex(db);
    var current = index[id] ? index[id].entry : null;
    var forwardIds = (current && Array.isArray(current.关联)) ? current.关联.slice() : [];

    var reverseIds = [];
    MODULE_KEYS.forEach(function (mod) {
      (db[mod] || []).forEach(function (entry) {
        if (entry.id === id) { return; }
        if (Array.isArray(entry.关联) && entry.关联.indexOf(id) !== -1) {
          reverseIds.push(entry.id);
        }
      });
    });

    var seen = {};
    var result = [];
    function push(rid, direction) {
      if (seen[rid]) { return; }
      seen[rid] = true;
      var hit = index[rid];
      result.push({
        id: rid,
        名称: hit ? hit.entry.名称 : rid,
        module: hit ? hit.module : null,
        exists: !!hit,
        direction: direction
      });
    }
    forwardIds.forEach(function (rid) { push(rid, 'forward'); });
    reverseIds.forEach(function (rid) { push(rid, 'reverse'); });
    return result;
  }

  function searchEntries(db, query) {
    var q = (query || '').trim().toLowerCase();
    if (!q) { return []; }
    var results = [];
    MODULE_KEYS.forEach(function (mod) {
      (db[mod] || []).forEach(function (entry) {
        var hay = [entry.名称 || '', entry.拉丁名 || ''];
        (entry.小节 || []).forEach(function (s) { hay.push(s.正文 || ''); });
        var matched = hay.some(function (text) {
          return String(text).toLowerCase().indexOf(q) !== -1;
        });
        if (matched) { results.push({ id: entry.id, 名称: entry.名称, module: mod }); }
      });
    });
    return results;
  }

  // 递归收集"叶子"分类名（无子类的节点），支持任意层级（如 大类→形态→属）
  function collectLeaves(nodes, out) {
    (nodes || []).forEach(function (node) {
      if (node.子类 && node.子类.length) { collectLeaves(node.子类, out); }
      else { out[node.名称] = true; }
    });
    return out;
  }

  function leafNames(categories, moduleKey) {
    return collectLeaves((categories && categories[moduleKey]) ? categories[moduleKey] : [], {});
  }

  function validateData(db, categories) {
    var problems = [];
    var idCount = {};
    MODULE_KEYS.forEach(function (mod) {
      (db[mod] || []).forEach(function (entry) {
        idCount[entry.id] = (idCount[entry.id] || 0) + 1;
      });
    });
    Object.keys(idCount).forEach(function (id) {
      if (idCount[id] > 1) {
        problems.push('重复的 id：' + id + '（出现 ' + idCount[id] + ' 次）');
      }
    });

    var index = buildIndex(db);
    MODULE_KEYS.forEach(function (mod) {
      var leaves = leafNames(categories, mod);
      (db[mod] || []).forEach(function (entry) {
        (entry.关联 || []).forEach(function (rid) {
          if (!index[rid]) {
            problems.push('悬空关联：' + entry.id + ' → ' + rid + '（目标不存在）');
          }
        });
        if (entry.类别 && !leaves[entry.类别]) {
          problems.push('未匹配分类：' + entry.id + ' 的类别 “' + entry.类别 + '” 不在分类树中');
        }
      });
    });
    return problems;
  }

  return {
    MODULE_KEYS: MODULE_KEYS,
    buildIndex: buildIndex,
    getRelations: getRelations,
    searchEntries: searchEntries,
    validateData: validateData
  };
});
