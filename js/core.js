(function (factory) {
  'use strict';
  var Core = factory();
  if (typeof module !== 'undefined' && module.exports) { module.exports = Core; }
  if (typeof window !== 'undefined') { window.Core = Core; }
})(function () {
  'use strict';

  var MODULE_KEYS = ['microbes', 'antibiotics', 'resistance', 'idcards', 'cards', 'tests', 'media', 'staining', 'biochem-tests'];

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

  function pushText(out, text) {
    if (text == null) { return; }
    if (Array.isArray(text)) {
      text.forEach(function (x) { pushText(out, x); });
      return;
    }
    if (typeof text === 'object') {
      Object.keys(text).forEach(function (k) { pushText(out, text[k]); });
      return;
    }
    out.push(String(text));
  }

  function entrySearchText(db, mod, entry) {
    var hay = [];
    pushText(hay, [entry.名称, entry.拉丁名, entry.英文, entry.类别, entry.药敏简写, entry.天然耐药, entry.药物]);
    (entry.小节 || []).forEach(function (s) { pushText(hay, [s.标题, s.正文]); });

    if (mod === 'microbes') {
      pushText(hay, (db.morphology || {})[entry.id]);
      pushText(hay, (db.biochem || {})[entry.id]);
      pushText(hay, (db.differential || {})[entry.id]);
    }
    return hay.join(' ').toLowerCase();
  }

  function searchSummary(mod, entry) {
    if (mod === 'microbes') { return entry.拉丁名 || entry.类别 || ''; }
    if (mod === 'antibiotics') { return [entry.药敏简写, entry.类别].filter(Boolean).join(' · '); }
    if (mod === 'cards') { return [entry.类别, entry.药物 ? (entry.药物.length + ' 项') : ''].filter(Boolean).join(' · '); }
    return entry.类别 || '';
  }

  function searchEntries(db, query) {
    var q = (query || '').trim().toLowerCase();
    if (!q) { return []; }
    var results = [];
    MODULE_KEYS.forEach(function (mod) {
      (db[mod] || []).forEach(function (entry) {
        if (entrySearchText(db, mod, entry).indexOf(q) !== -1) {
          results.push({ id: entry.id, 名称: entry.名称, module: mod, 摘要: searchSummary(mod, entry) });
        }
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

  // 关系图构建：以 (moduleKey, id) 为中心，BFS 收集 depth 层关联（forward + reverse 去重）。
  // 返回 { center, nodes: [{id,名称,module,level}], edges: [{from,to,direction}] }；找不到中心返回 null。
  function buildGraph(db, moduleKey, id, depth) {
    var index = buildIndex(db);
    var center = index[id];
    if (!center) { return null; }
    depth = depth || 1;

    var nodes = {};
    var edges = {};
    nodes[id] = { id: id, 名称: center.entry.名称, module: center.module, level: 0 };

    function edgeKey(from, to, dir) { return from + '|' + to + '|' + dir; }

    function collect(targetId) {
      var rels = getRelations(targetId, db);
      var out = [];
      rels.forEach(function (r) {
        if (!r.exists) { return; }
        // 同一对节点正反向都算同一条边，避免重复绘制
        var k1 = edgeKey(targetId, r.id, r.direction);
        var k2 = edgeKey(r.id, targetId, r.direction === 'forward' ? 'reverse' : 'forward');
        if (!edges[k1] && !edges[k2]) {
          edges[k1] = { from: targetId, to: r.id, direction: r.direction };
        }
        out.push(r);
      });
      return out;
    }

    var frontier = [id];
    for (var lv = 1; lv <= depth; lv++) {
      var next = [];
      frontier.forEach(function (fid) {
        collect(fid).forEach(function (r) {
          if (!nodes[r.id]) {
            nodes[r.id] = { id: r.id, 名称: r.名称, module: r.module, level: lv };
            next.push(r.id);
          }
        });
      });
      frontier = next;
    }

    return {
      center: { id: id, 名称: center.entry.名称, module: center.module },
      nodes: Object.keys(nodes).map(function (k) { return nodes[k]; }),
      edges: Object.keys(edges).map(function (k) { return edges[k]; })
    };
  }

  return {
    MODULE_KEYS: MODULE_KEYS,
    buildIndex: buildIndex,
    getRelations: getRelations,
    searchEntries: searchEntries,
    validateData: validateData,
    buildGraph: buildGraph
  };
});
