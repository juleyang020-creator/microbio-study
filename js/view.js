(function (factory) {
  'use strict';
  var View = factory();
  if (typeof module !== 'undefined' && module.exports) { module.exports = View; }
  if (typeof window !== 'undefined') { window.View = View; }
})(function () {
  'use strict';

  var MODULE_LABEL = { microbes: '微生物', antibiotics: '抗生素', resistance: '耐药' };

  function moduleLabel(key) { return MODULE_LABEL[key] || '未知'; }

  function detailVM(entry, relations) {
    if (!entry) { return null; }
    return {
      名称: entry.名称,
      类别: entry.类别 || '',
      拉丁名: entry.拉丁名 || '',
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
    detailVM: detailVM,
    sidebarVM: sidebarVM,
    searchVM: searchVM
  };
});
