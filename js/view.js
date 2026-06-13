(function (factory) {
  'use strict';
  var View = factory();
  if (typeof module !== 'undefined' && module.exports) { module.exports = View; }
  if (typeof window !== 'undefined') { window.View = View; }
})(function () {
  'use strict';

  var MODULE_LABEL = { microbes: '微生物', antibiotics: '抗微生物药', resistance: '耐药', cards: '药敏卡', tests: '试验' };

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
    '嘧啶类似物': 'img/mechanism-flucytosine.svg',
    // 耐药机制：按顶层机制大类（旁路代谢/生物膜按叶子区分，二者机制差异大）
    '产生灭活酶': 'img/resistance-enzyme.svg',
    '靶位改变': 'img/resistance-target.svg',
    '主动外排': 'img/resistance-efflux.svg',
    '膜通透性下降': 'img/resistance-permeability.svg',
    '旁路代谢': 'img/resistance-bypass.svg',
    '生物膜': 'img/resistance-biofilm.svg'
  };

  // 节点子树是否包含某叶子分类（支持任意层级）
  function nodeContainsLeaf(node, leafName) {
    if (node.子类 && node.子类.length) {
      return node.子类.some(function (c) { return nodeContainsLeaf(c, leafName); });
    }
    return node.名称 === leafName;
  }

  // 抗生素 / 耐药：按其类别所属的机制大类，映射到一张机制示意图
  function mechanismImageFor(moduleKey, entry, categories) {
    if (!entry || (moduleKey !== 'antibiotics' && moduleKey !== 'resistance')) { return null; }
    // 先按类别(叶子)直接匹配（抗真菌药、旁路代谢/生物膜按其类别区分）
    if (MECHANISM_IMAGE[entry.类别]) { return MECHANISM_IMAGE[entry.类别]; }
    // 再按所属顶层机制大类匹配（抗细菌药、其余耐药机制）
    var groups = (categories && categories[moduleKey]) ? categories[moduleKey] : [];
    for (var i = 0; i < groups.length; i++) {
      if (nodeContainsLeaf(groups[i], entry.类别)) { return MECHANISM_IMAGE[groups[i].名称] || null; }
    }
    return null;
  }

  // 去掉拉丁名中的括注与 spp. 后缀，得到适合检索的词条
  function cleanTerm(s) {
    return String(s || '').replace(/[（(].*$/, '').replace(/\s+spp\.?$/i, '').trim();
  }

  // 综述/参考链接：仅微生物与耐药机制。菌用拉丁名(→PubMed综述+维基)，耐药用英文术语(→PubMed综述)。
  function referenceLinks(moduleKey, entry) {
    if (!entry || (moduleKey !== 'microbes' && moduleKey !== 'resistance')) { return []; }
    var latin = cleanTerm(entry.拉丁名);
    var term = latin || entry.英文 || entry.名称 || '';
    if (!term) { return []; }
    var links = [{
      标题: 'PubMed 综述',
      url: 'https://pubmed.ncbi.nlm.nih.gov/?term=' + encodeURIComponent(term) + '&filter=pubt.review'
    }];
    if (latin) {
      links.push({
        标题: '维基百科',
        url: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(latin.replace(/\s+/g, '_'))
      });
    }
    return links;
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
      药物: entry.药物 || [],
      小节: (entry.小节 || []).map(function (s) {
        return { 标题: s.标题 || '', 正文: s.正文 || '' };
      }),
      链接: (extras.links || []).map(function (l) {
        return { 标题: l.标题 || '', url: l.url || '' };
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

  // 药敏卡对比：并排比较若干卡所含药物；cells 为布尔(是否含)，differs 标出各卡不一致的药物
  function buildCardComparison(nameById, drugsByCard, ids) {
    drugsByCard = drugsByCard || {};
    ids = (ids || []).filter(function (id) { return drugsByCard[id]; });
    var items = ids.map(function (id) { return { id: id, 名称: (nameById && nameById[id]) || id }; });
    var order = [], seen = {};
    ids.forEach(function (id) {
      drugsByCard[id].forEach(function (d) { if (!seen[d]) { seen[d] = true; order.push(d); } });
    });
    var rows = order.map(function (drug) {
      var cells = ids.map(function (id) { return drugsByCard[id].indexOf(drug) !== -1; });
      var has = cells.filter(Boolean).length;
      return { 药物: drug, cells: cells, differs: has > 0 && has < ids.length };
    });
    return { items: items, rows: rows };
  }

  return {
    moduleLabel: moduleLabel,
    mechanismImageFor: mechanismImageFor,
    referenceLinks: referenceLinks,
    detailVM: detailVM,
    sidebarVM: sidebarVM,
    searchVM: searchVM,
    buildComparison: buildComparison,
    buildCardComparison: buildCardComparison
  };
});
