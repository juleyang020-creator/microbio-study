(function (factory) {
  'use strict';
  var View = factory();
  if (typeof module !== 'undefined' && module.exports) { module.exports = View; }
  if (typeof window !== 'undefined') { window.View = View; }
})(function () {
  'use strict';

  var MODULE_LABEL = { microbes: '微生物', antibiotics: '抗微生物药', resistance: '耐药' };

  function moduleLabel(key) { return MODULE_LABEL[key] || '未知'; }

  var MECHANISM_IMAGE = {
    // 抗细菌药：按顶层机制大类
    '抑制细胞壁合成': 'img/mechanism-cellwall.svg',
    '抑制蛋白质合成': 'img/mechanism-protein.svg',
    '抑制核酸合成': 'img/mechanism-nucleic.svg',
    '抑制叶酸代谢': 'img/mechanism-folate.svg',
    '破坏细胞膜': 'img/mechanism-membrane.svg',
    // 抗真菌药：按类别（机制各异）
    '唑类': 'img/mechanism-azole.svg',
    '多烯类': 'img/mechanism-polyene.svg',
    '棘白菌素类': 'img/mechanism-echinocandin.svg',
    '嘧啶类似物': 'img/mechanism-flucytosine.svg'
  };

  // 节点子树是否包含某叶子分类（支持任意层级）
  function nodeContainsLeaf(node, leafName) {
    if (node.子类 && node.子类.length) {
      return node.子类.some(function (c) { return nodeContainsLeaf(c, leafName); });
    }
    return node.名称 === leafName;
  }

  // 仅抗生素：按其类别所属的机制大类，映射到一张机制示意图
  function mechanismImageFor(moduleKey, entry, categories) {
    if (moduleKey !== 'antibiotics' || !entry) { return null; }
    // 先按类别(叶子)直接匹配（抗真菌药机制按其类别区分）
    if (MECHANISM_IMAGE[entry.类别]) { return MECHANISM_IMAGE[entry.类别]; }
    // 再按所属顶层机制大类匹配（抗细菌药）
    var groups = (categories && categories.antibiotics) ? categories.antibiotics : [];
    for (var i = 0; i < groups.length; i++) {
      if (nodeContainsLeaf(groups[i], entry.类别)) { return MECHANISM_IMAGE[groups[i].名称] || null; }
    }
    return null;
  }

  function detailVM(entry, relations, extras) {
    if (!entry) { return null; }
    extras = extras || {};
    return {
      id: entry.id,
      名称: entry.名称,
      类别: entry.类别 || '',
      拉丁名: entry.拉丁名 || '',
      药敏简写: entry.药敏简写 || '',
      机制图: extras.mechanismImage || null,
      形态: extras.morphology || null,
      生化反应: extras.biochem || [],
      鉴别: extras.differential || [],
      小节: (entry.小节 || []).map(function (s) {
        return { 标题: s.标题 || '', 正文: s.正文 || '' };
      }),
      关联: (relations || []).map(function (r) {
        return {
          id: r.id,
          名称: r.名称,
          module: r.module,
          exists: r.exists,
          label: r.exists ? (moduleLabel(r.module) + ' · ' + r.名称) : (r.id + ' ?'),
          href: r.exists ? ('#/' + r.module + '/' + r.id) : null
        };
      })
    };
  }

  function collectLeafSet(nodes, out) {
    (nodes || []).forEach(function (node) {
      if (node.子类 && node.子类.length) { collectLeafSet(node.子类, out); }
      else { out[node.名称] = true; }
    });
    return out;
  }

  function sidebarVM(moduleKey, categories, entries, selectedId) {
    var roots = (categories && categories[moduleKey]) ? categories[moduleKey] : [];
    var leafSet = collectLeafSet(roots, {});

    function item(e) {
      return { id: e.id, 名称: e.名称, href: '#/' + moduleKey + '/' + e.id, selected: e.id === selectedId };
    }

    var byCat = {};
    var uncategorized = [];
    (entries || []).forEach(function (e) {
      if (leafSet[e.类别]) { (byCat[e.类别] = byCat[e.类别] || []).push(item(e)); }
      else { uncategorized.push(item(e)); }
    });

    function buildNode(node) {
      var hasChildren = node.子类 && node.子类.length;
      return {
        名称: node.名称,
        children: hasChildren ? node.子类.map(buildNode) : [],
        entries: hasChildren ? [] : (byCat[node.名称] || [])
      };
    }

    return {
      tree: roots.map(buildNode),
      未分类: uncategorized
    };
  }

  function searchVM(results, query) {
    return {
      query: query,
      items: (results || []).map(function (r) {
        return { id: r.id, 名称: r.名称, module: r.module, href: '#/' + r.module + '/' + r.id };
      })
    };
  }

  // 生化反应对比：并排比较若干菌；rows 取所有项目的并集，differs 标出结果不一致的项目
  function buildComparison(nameById, biochemMap, ids) {
    biochemMap = biochemMap || {};
    ids = (ids || []).filter(function (id) { return biochemMap[id]; });
    var items = ids.map(function (id) { return { id: id, 名称: (nameById && nameById[id]) || id }; });
    var order = [], seen = {};
    ids.forEach(function (id) {
      biochemMap[id].forEach(function (b) { if (!seen[b.项目]) { seen[b.项目] = true; order.push(b.项目); } });
    });
    var rows = order.map(function (项目) {
      var cells = ids.map(function (id) {
        var hit = biochemMap[id].filter(function (b) { return b.项目 === 项目; })[0];
        return hit ? hit.结果 : '—';
      });
      var distinct = {};
      cells.forEach(function (c) { distinct[c] = true; });
      return { 项目: 项目, cells: cells, differs: Object.keys(distinct).length > 1 };
    });
    return { items: items, rows: rows };
  }

  return {
    moduleLabel: moduleLabel,
    mechanismImageFor: mechanismImageFor,
    detailVM: detailVM,
    sidebarVM: sidebarVM,
    searchVM: searchVM,
    buildComparison: buildComparison
  };
});
