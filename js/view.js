(function (factory) {
  'use strict';
  var View = factory();
  if (typeof module !== 'undefined' && module.exports) { module.exports = View; }
  if (typeof window !== 'undefined') { window.View = View; }
})(function () {
  'use strict';

  var MODULE_LABEL = { microbes: '微生物', antibiotics: '抗生素', resistance: '耐药' };

  function moduleLabel(key) { return MODULE_LABEL[key] || '未知'; }

  var MECHANISM_IMAGE = {
    '抑制细胞壁合成': 'img/mechanism-cellwall.svg',
    '抑制蛋白质合成': 'img/mechanism-protein.svg',
    '抑制核酸合成': 'img/mechanism-nucleic.svg',
    '抑制叶酸代谢': 'img/mechanism-folate.svg',
    '破坏细胞膜': 'img/mechanism-membrane.svg'
  };

  // 仅抗生素：按其类别(子类)所属的机制大类，映射到一张机制示意图
  function mechanismImageFor(moduleKey, entry, categories) {
    if (moduleKey !== 'antibiotics' || !entry) { return null; }
    var groups = (categories && categories.antibiotics) ? categories.antibiotics : [];
    for (var i = 0; i < groups.length; i++) {
      var sub = groups[i].子类 || [];
      for (var j = 0; j < sub.length; j++) {
        if (sub[j].名称 === entry.类别) { return MECHANISM_IMAGE[groups[i].名称] || null; }
      }
    }
    return null;
  }

  function detailVM(entry, relations, mechanismImage) {
    if (!entry) { return null; }
    return {
      名称: entry.名称,
      类别: entry.类别 || '',
      拉丁名: entry.拉丁名 || '',
      药敏简写: entry.药敏简写 || '',
      机制图: mechanismImage || null,
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

  function sidebarVM(moduleKey, categories, entries, selectedId) {
    var groups = (categories && categories[moduleKey]) ? categories[moduleKey] : [];
    var leafSet = {};
    groups.forEach(function (g) {
      (g.子类 || []).forEach(function (l) { leafSet[l.名称] = true; });
    });

    function item(e) {
      return { id: e.id, 名称: e.名称, href: '#/' + moduleKey + '/' + e.id, selected: e.id === selectedId };
    }

    var byCat = {};
    var uncategorized = [];
    (entries || []).forEach(function (e) {
      if (leafSet[e.类别]) { (byCat[e.类别] = byCat[e.类别] || []).push(item(e)); }
      else { uncategorized.push(item(e)); }
    });

    return {
      groups: groups.map(function (g) {
        return {
          名称: g.名称,
          子类: (g.子类 || []).map(function (l) {
            return { 名称: l.名称, entries: byCat[l.名称] || [] };
          })
        };
      }),
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

  return {
    moduleLabel: moduleLabel,
    mechanismImageFor: mechanismImageFor,
    detailVM: detailVM,
    sidebarVM: sidebarVM,
    searchVM: searchVM
  };
});
