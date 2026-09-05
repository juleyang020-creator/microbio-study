(function () {
  'use strict';
  var Core = window.Core, View = window.View;
  var NS = window.AppNS = window.AppNS || {};
  var el = NS.el, fill = NS.fill, routeKey = NS.routeKey, setActiveTool = NS.setActiveTool;
  // ===== 生化鉴定（对比 + 结果查菌）=====
  var compareSet = {}; // 选中用于对比的微生物 id
  var compareFilter = ''; // 对比选择器的搜索过滤词
  var compareMode = 'compare'; // 'compare' | 'identify'
  var identifySel = {}; // 结果查菌：{ 归一项目: '阳性'|'阴性' }
  // 结果查菌常用生化项目（按归一名，与 View.normBioItem 对齐）
  var IDENTIFY_TESTS = [
    { 组: '基础', 项: ['革兰染色', '触酶', '氧化酶', '动力'] },
    { 组: '发酵 / 肠杆菌', 项: ['吲哚', '乳糖发酵', '葡萄糖发酵', '硝酸盐还原', 'VP', '枸橼酸盐', 'H2S', '脲酶', '苯丙氨酸脱氨酶', '鸟氨酸脱羧酶', '赖氨酸脱羧酶'] },
    { 组: '革兰阳性球菌', 项: ['凝固酶', 'PYR', '新生霉素', '胆汁七叶苷', '6.5%NaCl生长'] }
  ];

  // 生化对比选择器里排在前面的常见菌（顺序即临床常见度）。生化数据的原始顺序开头是
  // 猪链球菌、偶发分枝杆菌一类冷门菌，不排序则最常查的菌反而要翻很久。
  // 原为关系图的 GRAPH_COMMON，#74 删关系图时定义被一并删掉、这里的引用漏删 → #/compare 崩溃。
  var COMPARE_COMMON = [
    'staph-aureus', 'e-coli', 'klebsiella-pneumoniae', 'pseudomonas-aeruginosa',
    'strep-pneumoniae', 'strep-pyogenes', 'enterococcus-faecalis', 'enterococcus-faecium',
    'acinetobacter-baumannii', 'haemophilus-influenzae',
    'neisseria-meningitidis', 'neisseria-gonorrhoeae', 'candida-albicans', 'clostridioides-difficile',
    'staph-epidermidis', 'strep-agalactiae', 'enterobacter-cloacae', 'proteus-mirabilis',
    'helicobacter-pylori', 'moraxella-catarrhalis', 'listeria-monocytogenes',
    'stenotrophomonas-maltophilia', 'salmonella-typhi'
  ];
  // 预建名次表：比较器里逐次 indexOf 是 O(n·m)，而选择器每敲一个字就重排一次。
  var _commonRank = null;
  function commonRank(id) {
    if (!_commonRank) {
      _commonRank = {};
      COMPARE_COMMON.forEach(function (x, i) { _commonRank[x] = i; });
    }
    // 纯对象当 map 用：id 若是 'constructor' 之类会拿到原型上的值，故显式判自有属性
    return Object.prototype.hasOwnProperty.call(_commonRank, id) ? _commonRank[id] : 1e6;
  }

  function isCompareRoute() { return routeKey() === 'compare'; }
  function comparableIds() { return Object.keys((window.DB && window.DB.biochem) || {}); }
  // 缓存：window.DB 加载后不变，微生物名称映射只需建一次（同 abxIdByName 模式）
  var _microbeNameMap = null;
  function nameById() {
    if (_microbeNameMap) { return _microbeNameMap; }
    var m = {};
    ((window.DB && window.DB.microbes) || []).forEach(function (x) { m[x.id] = x.名称; });
    _microbeNameMap = m;
    return m;
  }
  function toggleCompare(id) {
    if (compareSet[id]) { delete compareSet[id]; } else { compareSet[id] = true; }
    if (isCompareRoute()) { renderCompare(); }
  }
  // 通用多选勾选面板（生化对比 / 药敏卡对比复用）：搜索框 + 可勾选按钮 + 局部重渲染。
  // descriptors 为 [{id, 名称, selected, onToggle}]，各功能只提供数据、不再各写一套 DOM。
  function pickerButtonNodes(descriptors, emptyText) {
    if (!descriptors.length) { return [ el('div', { cls: 'empty-sm', text: emptyText }) ]; }
    return descriptors.map(function (it) {
      return el('button', {
        cls: 'cmp-pick' + (it.selected ? ' sel' : ''), type: 'button',
        text: (it.selected ? '☑ ' : '☐ ') + (it.名称 || it.id),
        'aria-pressed': String(it.selected), onClick: it.onToggle
      });
    });
  }
  function renderPickerList(listId, descriptors, emptyText) {
    var listEl = document.getElementById(listId);
    if (listEl) { listEl.replaceChildren.apply(listEl, pickerButtonNodes(descriptors, emptyText)); }
  }
  function buildTogglePicker(groupLabel, listId, filterValue, onFilterInput) {
    var search = el('input', { cls: 'cmp-search', type: 'search', placeholder: '筛选…', value: filterValue });
    search.addEventListener('input', function () { onFilterInput(search.value); });
    return [ el('div', { cls: 'cat-group' }, [
      el('div', { cls: 'cat-group-name', text: groupLabel }),
      search,
      el('div', { cls: 'cmp-pick-list', id: listId })
    ]) ];
  }
  function compareItemDescriptors() {
    var names = nameById();
    var q = compareFilter.trim().toLowerCase();
    var ids = comparableIds().filter(function (id) {
      return !q || (names[id] || '').toLowerCase().indexOf(q) !== -1;
    });
    // 常见菌排前（按 COMPARE_COMMON 顺序），其余保持原数据顺序（Array#sort 自 ES2019 起稳定）
    ids.sort(function (a, b) { return commonRank(a) - commonRank(b); });
    return ids.map(function (id) {
      return { id: id, 名称: names[id] || id, selected: !!compareSet[id], onToggle: function () { toggleCompare(id); } };
    });
  }
  function renderComparePickerList() { renderPickerList('cmp-pick-list', compareItemDescriptors(), '无匹配的细菌'); }
  function buildComparePicker() {
    var nSel = Object.keys(compareSet).filter(function (k) { return compareSet[k]; }).length;
    // 规则是 ≥2 个才出结果，但勾 1 个时页面毫无反馈，用户不知道还差几个
    var title = nSel === 0 ? '勾选细菌（可多选）'
      : nSel === 1 ? '已选 1 个 · 再选 1 个开始对比'
      : '已选 ' + nSel + ' 个';
    return buildTogglePicker(title, 'cmp-pick-list', compareFilter, function (v) { compareFilter = v; renderComparePickerList(); });
  }
  function buildCompareView(vm) {
    var nodes = [];
    if (vm.items.length < 2) {
      nodes.push(el('div', { cls: 'empty', text: '在左侧勾选 2 个以上细菌进行对比。' }));
      return nodes;
    }
    var headCells = [ el('th', { text: '生化项目' }) ];
    vm.items.forEach(function (it) {
      headCells.push(el('th', {}, [ el('a', { cls: 'cmp-col', text: it.名称, href: '#/microbes/' + it.id }) ]));
    });
    var bodyRows = vm.rows.map(function (row) {
      var tds = [ el('td', { cls: 'cmp-item', text: row.项目 }) ];
      row.cells.forEach(function (c) { tds.push(el('td', { cls: 'cmp-cell', text: c })); });
      return el('tr', { cls: row.differs ? 'cmp-diff' : '' }, tds);
    });
    nodes.push(el('div', { cls: 'table-scroll' }, [ el('table', { cls: 'cmp' }, [
      el('thead', {}, [ el('tr', {}, headCells) ]),
      el('tbody', {}, bodyRows)
    ]) ]));
    nodes.push(el('div', { cls: 'cmp-hint', text: '黄色行 = 各菌结果存在差异（鉴别要点）。点列首菌名可跳转详情。' }));
    return nodes;
  }
  function compareModeToggle() {
    return el('div', { cls: 'bp-method-toggle', style: 'margin-bottom:14px;' }, [
      el('button', { cls: 'cmp-add' + (compareMode === 'compare' ? ' sel' : ''), text: '生化对比', onClick: function () { compareMode = 'compare'; renderCompare(); } }),
      el('button', { cls: 'cmp-add' + (compareMode === 'identify' ? ' sel' : ''), text: '结果查菌', onClick: function () { compareMode = 'identify'; renderCompare(); } })
    ]);
  }
  function renderCompare() {
    setActiveTool('compare');
    if (compareMode === 'identify') { renderIdentify(); return; }
    var names = nameById();
    fill(document.getElementById('sidebar'), buildComparePicker());
    renderComparePickerList();
    var selected = comparableIds().filter(function (id) { return compareSet[id]; });
    var nodes = [ el('h2', { cls: 'detail-title', text: '生化鉴定' }), compareModeToggle() ]
      .concat(buildCompareView(View.buildComparison(names, (window.DB && window.DB.biochem) || {}, selected)));
    fill(document.getElementById('main'), nodes);
  }
  function identifyResultsNodes() {
    var res = View.bioIdentify((window.DB && window.DB.biochem) || {}, nameById(), identifySel);
    var n = res.specifiedKeys.length;
    if (n === 0) { return [ el('div', { cls: 'empty', text: '在上方选择你观察到的生化结果（＋/－），下面按匹配度倒推候选菌种。' }) ]; }
    var out = [ el('div', { cls: 'cmp-hint', text: '已选 ' + n + ' 项 → 一致候选 ' + res.consistent.length + ' 个（无矛盾），另有 ' + res.near.length + ' 个部分匹配。' }) ];
    if (res.consistent.length) {
      out.push(el('div', { cls: 'identify-cands' }, res.consistent.slice(0, 30).map(function (r) {
        return el('a', { cls: 'identify-cand', href: '#/microbes/' + r.id, title: '匹配 ' + r.match + '/' + r.known + ' 项已记录' }, [
          el('span', { cls: 'identify-cand-nm', text: r.名称 }), el('span', { cls: 'identify-cand-sc', text: r.match + '/' + r.known })
        ]);
      })));
    } else {
      out.push(el('div', { cls: 'empty-sm', text: '没有与所选结果完全一致的菌；见下方部分匹配。' }));
    }
    if (res.near.length) {
      out.push(el('div', { cls: 'lw-sub', text: '部分匹配（含矛盾项，可能株间变异或数据不全）' }));
      out.push(el('div', { cls: 'identify-cands' }, res.near.slice(0, 12).map(function (r) {
        return el('a', { cls: 'identify-cand near', href: '#/microbes/' + r.id, title: '匹配 ' + r.match + '，矛盾 ' + r.contradict }, [
          el('span', { cls: 'identify-cand-nm', text: r.名称 }), el('span', { cls: 'identify-cand-sc', text: '✓' + r.match + ' ✗' + r.contradict })
        ]);
      })));
    }
    out.push(el('div', { cls: 'cmp-hint', text: '⚠️ 生化谱数据有限、存在株间差异，仅供鉴别参考，不能替代规范鉴定 / MALDI-TOF / 测序。' }));
    return out;
  }
  function idTriBtn(test, val) {
    var isSel = val === '' ? !identifySel[test] : identifySel[test] === val;
    return el('button', {
      cls: 'id-tri' + (isSel ? ' sel' : '') + (val === '阳性' ? ' pos' : (val === '阴性' ? ' neg' : '')),
      text: val === '阳性' ? '＋' : (val === '阴性' ? '－' : '不限'),
      title: test + '：' + (val || '不限'),
      onClick: function () {
        if (val === '') { delete identifySel[test]; }
        else if (identifySel[test] === val) { delete identifySel[test]; }
        else { identifySel[test] = val; }
        renderIdentify();
      }
    });
  }
  function renderIdentify() {
    fill(document.getElementById('sidebar'), [ el('div', { cls: 'cat-group' }, [
      el('div', { cls: 'cat-group-name', text: '结果查菌' }),
      el('div', { cls: 'cmp-hint', text: '填写观察到的生化结果，正文按匹配度倒推候选菌种。' })
    ]) ]);
    var formGroups = IDENTIFY_TESTS.map(function (g) {
      return el('div', { cls: 'id-group' }, [ el('div', { cls: 'id-group-h', text: g.组 }) ].concat(
        g.项.map(function (t) {
          return el('div', { cls: 'id-row' + (identifySel[t] ? ' set' : '') }, [
            el('span', { cls: 'id-test', text: t }),
            el('span', { cls: 'id-tri-wrap' }, [ idTriBtn(t, '阳性'), idTriBtn(t, '阴性'), idTriBtn(t, '') ])
          ]);
        })
      ));
    });
    var nodes = [
      el('h2', { cls: 'detail-title', text: '生化鉴定' }),
      compareModeToggle(),
      el('div', { cls: 'lw-note', text: '填写你观察到的生化反应结果（＋阳性 / －阴性 / 不限），按匹配度倒推候选菌种。数据来自本库 ' + Object.keys((window.DB && window.DB.biochem) || {}).length + ' 种菌的生化谱。' }),
      el('div', { cls: 'id-form-head' }, [ el('span', { cls: 'lw-sub', text: '生化结果' }), el('button', { cls: 'cmp-add', text: '清空', onClick: function () { identifySel = {}; renderIdentify(); } }) ]),
      el('div', { cls: 'id-form' }, formGroups),
      el('div', { cls: 'lw-h', text: '候选菌种' })
    ].concat(identifyResultsNodes());
    fill(document.getElementById('main'), nodes);
  }

  // ===== 药敏卡对比 =====
  var compareCardSet = {};
  var compareCardFilter = '';
  function isCardCompareRoute() { return routeKey() === 'cardcompare'; }
  // 缓存：药敏卡数据加载后不变，卡名 / 药物映射只需各建一次
  var _cardNameMap = null, _cardDrugMap = null;
  function cardNameById() { if (_cardNameMap) { return _cardNameMap; } var m = {}; ((window.DB && window.DB.cards) || []).forEach(function (c) { m[c.id] = c.名称; }); _cardNameMap = m; return m; }
  function drugsByCard() { if (_cardDrugMap) { return _cardDrugMap; } var m = {}; ((window.DB && window.DB.cards) || []).forEach(function (c) { m[c.id] = c.药物 || []; }); _cardDrugMap = m; return m; }
  // 仅药敏卡参与「药敏卡对比」：鉴定卡（合并入本模块）无药物组成，不可比
  function cardIds() {
    return ((window.DB && window.DB.cards) || [])
      .filter(function (c) { return c.药物 && c.药物.length; })
      .map(function (c) { return c.id; });
  }
  function toggleCardCompare(id) {
    if (compareCardSet[id]) { delete compareCardSet[id]; } else { compareCardSet[id] = true; }
    if (isCardCompareRoute()) { renderCardCompare(); }
  }
  function cardItemDescriptors() {
    var names = cardNameById();
    var q = compareCardFilter.trim().toLowerCase();
    var ids = cardIds().filter(function (id) { return !q || (names[id] || '').toLowerCase().indexOf(q) !== -1; });
    return ids.map(function (id) {
      return { id: id, 名称: names[id] || id, selected: !!compareCardSet[id], onToggle: function () { toggleCardCompare(id); } };
    });
  }
  function renderCardPickerList() { renderPickerList('card-pick-list', cardItemDescriptors(), '无匹配的卡片'); }
  function buildCardComparePicker() {
    return buildTogglePicker('勾选药敏卡（可多选）', 'card-pick-list', compareCardFilter, function (v) { compareCardFilter = v; renderCardPickerList(); });
  }
  function buildCardCompareView(vm) {
    var nodes = [ el('h2', { cls: 'detail-title', text: '药敏卡对比' }) ];
    if (vm.items.length < 2) {
      nodes.push(el('div', { cls: 'empty', text: '在左侧勾选 2 张以上药敏卡进行对比。' }));
      return nodes;
    }
    var headCells = [ el('th', { text: '药物 / 检测项' }) ];
    vm.items.forEach(function (it) {
      headCells.push(el('th', {}, [ el('a', { cls: 'cmp-col', text: it.名称, href: '#/cards/' + it.id }) ]));
    });
    var bodyRows = vm.rows.map(function (row) {
      var tds = [ el('td', { cls: 'cmp-item', text: row.药物 }) ];
      row.cells.forEach(function (has) { tds.push(el('td', { cls: 'cmp-cell', text: has ? '✓' : '' })); });
      return el('tr', { cls: row.differs ? 'cmp-diff' : '' }, tds);
    });
    nodes.push(el('div', { cls: 'table-scroll' }, [
      el('table', { cls: 'cmp' }, [ el('thead', {}, [ el('tr', {}, headCells) ]), el('tbody', {}, bodyRows) ])
    ]));
    nodes.push(el('div', { cls: 'cmp-hint', text: '✓ = 该卡含此药/检测项；黄色行 = 各卡不一致。点列首卡名可查看该卡详情。' }));
    return nodes;
  }
  function renderCardCompare() {
    setActiveTool('cardcompare');
    fill(document.getElementById('sidebar'), buildCardComparePicker());
    renderCardPickerList();
    var selected = cardIds().filter(function (id) { return compareCardSet[id]; });
    fill(document.getElementById('main'), buildCardCompareView(View.buildCardComparison(cardNameById(), drugsByCard(), selected)));
  }

  Object.assign(NS, { COMPARE_COMMON, IDENTIFY_TESTS, _cardNameMap, _commonRank, _microbeNameMap, buildCardComparePicker, buildCardCompareView, buildComparePicker, buildCompareView, buildTogglePicker, cardIds, cardItemDescriptors, cardNameById, commonRank, comparableIds, compareCardFilter, compareCardSet, compareFilter, compareItemDescriptors, compareMode, compareModeToggle, compareSet, drugsByCard, idTriBtn, identifyResultsNodes, identifySel, isCardCompareRoute, isCompareRoute, nameById, pickerButtonNodes, renderCardCompare, renderCardPickerList, renderCompare, renderComparePickerList, renderIdentify, renderPickerList, toggleCardCompare, toggleCompare });
})();
