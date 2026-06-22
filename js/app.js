(function () {
  'use strict';
  var Core = window.Core, View = window.View;
  var MODULES = Core.MODULE_KEYS;

  // 折点表药物名与抗菌药条目名的别名（模块级常量，避免每次调用重建）：
  // 折点表写「青霉素 (Penicillin)」、抗菌药条目写「青霉素G」——两条别名覆盖从折点表回查与直接按条目名查两种路径。
  var ABX_ALIAS = { '青霉素': 'penicillin-g', '青霉素G': 'penicillin-g', '复方磺胺甲噁唑': 'cotrimoxazole', '复方新诺明': 'cotrimoxazole' };

  function db() {
    var DB = window.DB || {};
    return { microbes: DB.microbes || [], antibiotics: DB.antibiotics || [], resistance: DB.resistance || [], idcards: DB.idcards || [], cards: DB.cards || [], tests: DB.tests || [], media: DB.media || [], staining: DB.staining || [], 'biochem-tests': DB.biochemTests || [] };
  }

  // 缓存：window.DB 加载后不变，名称→id 映射只需建一次
  var _abxNameMap = null;
  function abxIdByName() {
    if (_abxNameMap) { return _abxNameMap; }
    var m = {};
    ((window.DB && window.DB.antibiotics) || []).forEach(function (a) { m[a.名称] = a.id; });
    _abxNameMap = m;
    return m;
  }
  // 药物名 → 抗生素 id（支持从折点表中的药物名查找）
  function abxIdByDrugText(text) {
    if (!text) { return null; }
    var map = abxIdByName();
    // 直接匹配 药敏简写(名称) 模式中的名称部分
    if (map[text]) { return map[text]; }
    // 从 "药物 (English)" 格式中提取中文名匹配
    var m = text.match(/^([^(]+)/);
    if (m && map[m[1].trim()]) { return map[m[1].trim()]; }
    if (m && ABX_ALIAS[m[1].trim()]) { return ABX_ALIAS[m[1].trim()]; }
    // 遍历所有抗生素，按名称包含关系匹配
    var abxList = (window.DB && window.DB.antibiotics) || [];
    for (var i = 0; i < abxList.length; i++) {
      if (text.indexOf(abxList[i].名称) !== -1) { return abxList[i].id; }
    }
    return null;
  }
  // 生化试验名 → 生化试验 id（支持多种模糊匹配）。模块级缓存。
  var _biochemTestMap = null;
  function biochemTestIdByName() {
    if (_biochemTestMap) { return _biochemTestMap; }
    var m = {};
    var tests = (window.DB && window.DB.biochemTests) || [];

    // 显式别名词典：biochem.js 中的简名 → 模块条目 id
    var aliases = {
      '血浆凝固酶': 'bio-coagulase',
      '试管凝固酶': 'bio-coagulase',
      '玻片凝固酶': 'bio-coagulase',
      '新生霉素': 'novobiocin',
      '溶血型': 'hemolysis',
      '杆菌肽': 'bacitracin',
      'PYR': 'pyr-test',
      'Lancefield 群': 'lancefield',
      'Optochin': 'bio-optochin',
      '6.5%NaCl 生长': 'nacl-65',
      'VP': 'vp-test',
      '枸橼酸盐': 'citrate',
      'H2S': 'h2s',
      'H₂S': 'h2s',
      '绿脓菌素': 'pigment',
      '黄色素': 'pigment',
      '蔗糖': 'glucose-fermentation',
      '麦芽糖': 'glucose-fermentation',
      '葡萄糖': 'glucose-fermentation',
      '糖发酵': 'glucose-fermentation',
      '葡萄糖发酵': 'glucose-fermentation',
      'TCBS(蔗糖)': 'glucose-fermentation',
      '蔗糖发酵(TCBS)': 'glucose-fermentation',
      '麦芽糖氧化': 'oxidase',
      '明胶酶': 'gelatinase',
      'DNase': 'dnase',
      '迁徙生长': 'motility',
      '动力(25℃/37℃)': 'motility'
    };
    Object.keys(aliases).forEach(function (k) { m[k] = aliases[k]; });

    tests.forEach(function (t) {
      m[t.名称] = t.id;
      // 去掉"试验"后缀
      var s1 = t.名称.replace(/\s*试验$/, '').trim();
      if (s1 !== t.名称) { m[s1] = t.id; if (!m[s1 + '试验']) { m[s1 + '试验'] = t.id; } }
      // 去掉括号内容
      var s2 = t.名称.replace(/\([^)]*\)/g, '').trim();
      if (s2 !== t.名称) { m[s2] = t.id; }
      // 同时去括号+去后缀
      var s3 = s2.replace(/\s*试验$/, '').trim();
      if (s3 !== s2 && s3 !== s1) { m[s3] = t.id; }
    });
    _biochemTestMap = m;
    return m;
  }
  // 药敏卡上的耐药表型检测项 → 对应的试验条目
  var CARD_TEST = {
    'ESBL': 'esbl-test',
    '头孢西丁筛选': 'cefoxitin-screen',
    '诱导型克林霉素耐药': 'd-test',
    '庆大霉素高水平(协同)': 'hlar',
    '链霉素高水平(协同)': 'hlar'
  };
  function categories() { return (window.DB && window.DB.categories) || {}; }

  function appendChildNode(parent, child) {
    if (child == null || child === false) { return; }
    if (typeof child === 'string' || typeof child === 'number') {
      parent.appendChild(document.createTextNode(String(child)));
      return;
    }
    parent.appendChild(child);
  }

  // 安全建节点：文本一律走 textContent / TextNode，内容不会被当作标记解析
  function el(tag, opts, children) {
    var node = document.createElement(tag);
    opts = opts || {};
    if (opts.cls != null) { node.className = opts.cls; }
    if (opts.text != null) { node.textContent = opts.text; }
    if (opts.href != null) { node.setAttribute('href', opts.href); }
    if (opts.target != null) { node.setAttribute('target', opts.target); }
    if (opts.rel != null) { node.setAttribute('rel', opts.rel); }
    if (opts.src != null) { node.setAttribute('src', opts.src); }
    if (opts.alt != null) { node.setAttribute('alt', opts.alt); }
    if (opts.title != null) { node.setAttribute('title', opts.title); }
    if (opts.style != null) { node.setAttribute('style', opts.style); }
    if (opts.id != null) { node.id = opts.id; }
    if (opts.type != null) { node.setAttribute('type', opts.type); }
    if (opts.placeholder != null) { node.setAttribute('placeholder', opts.placeholder); }
    if (opts.value != null) { node.value = opts.value; }
    if (opts.onClick) { node.addEventListener('click', opts.onClick); }
    (children || []).forEach(function (c) { appendChildNode(node, c); });
    return node;
  }
  function fill(container, nodes) {
    container.replaceChildren.apply(container, nodes);
  }

  function parseHash() {
    var raw = (location.hash || '').replace(/^#\/?/, '');
    var parts = raw.split('/').filter(Boolean);
    var module = MODULES.indexOf(parts[0]) !== -1 ? parts[0] : MODULES[0];
    return { module: module, id: parts[1] || null };
  }
  // 当前路由的顶层 key（compare / cardcompare / intrinsic / graph / breakpoints / ast-alerts / 模块名）
  function routeKey() {
    return (location.hash || '').replace(/^#\/?/, '').split('/')[0];
  }

  var SVGNS = 'http://www.w3.org/2000/svg';
  // SVG 元素构造（与 el() 同风格，但用 createElementNS）
  function sg(tag, opts, children) {
    var node = document.createElementNS(SVGNS, tag);
    opts = opts || {};
    Object.keys(opts).forEach(function (k) {
      var v = opts[k];
      if (v == null) { return; }
      if (k === 'text') { node.textContent = v; return; }
      if (k === 'cls') { node.setAttribute('class', v); return; }
      node.setAttribute(k, v);
    });
    (children || []).forEach(function (c) { appendChildNode(node, c); });
    return node;
  }

  function setActiveTab(moduleKey) {
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) {
      var on = t.getAttribute('data-module') === moduleKey;
      t.classList.toggle('active', on);
      if (on) { t.setAttribute('aria-current', 'page'); } else { t.removeAttribute('aria-current'); }
    });
    Array.prototype.forEach.call(document.querySelectorAll('.tool-btn'), function (t) {
      t.classList.remove('active');
      t.removeAttribute('aria-current');
    });
  }

  function setActiveTool(toolKey) {
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) {
      t.classList.remove('active');
      t.removeAttribute('aria-current');
    });
    Array.prototype.forEach.call(document.querySelectorAll('.tool-btn'), function (t) {
      var on = t.getAttribute('data-tool') === toolKey;
      t.classList.toggle('active', on);
      if (on) { t.setAttribute('aria-current', 'page'); } else { t.removeAttribute('aria-current'); }
    });
  }

  var collapsed = {}; // path -> true 表示该分类节点已折叠（跨模块、跨重渲染保持）

  function toggleCollapse(key) {
    if (collapsed[key]) { delete collapsed[key]; } else { collapsed[key] = true; }
    renderSidebar();
  }

  // 递归渲染一个分类节点（任意层级，按深度缩进，可点击折叠/展开）
  function sidebarNodes(node, depth, parentPath) {
    var path = parentPath + '/' + node.名称;
    var collapsible = (node.children && node.children.length) || (node.entries && node.entries.length);
    var isCollapsed = !!collapsed[path];
    var labelCls = (depth === 0 ? 'cat-group-name' : 'cat-subgroup') + (collapsible ? ' collapsible' : '');
    var marker = collapsible ? (isCollapsed ? '▸ ' : '▾ ') : '';
    var out = [ el('div', {
      cls: labelCls,
      text: marker + node.名称,
      style: 'padding-left:' + (8 + depth * 14) + 'px',
      onClick: collapsible ? function () { toggleCollapse(path); } : null
    }) ];
    if (isCollapsed) { return out; }
    if (node.children && node.children.length) {
      node.children.forEach(function (c) {
        sidebarNodes(c, depth + 1, path).forEach(function (n) { out.push(n); });
      });
    } else {
      var epad = 'padding-left:' + (8 + (depth + 1) * 14) + 'px';
      node.entries.forEach(function (e) {
        out.push(el('a', { cls: 'entry-link' + (e.selected ? ' selected' : ''), text: e.名称, href: e.href, style: epad }));
      });
    }
    return out;
  }

  function buildSidebar(vm, moduleKey) {
    var nodes = [];
    vm.tree.forEach(function (root) {
      nodes.push(el('div', { cls: 'cat-group' }, sidebarNodes(root, 0, moduleKey)));
    });
    if (vm.未分类.length) {
      var uc = [ el('div', { cls: 'cat-group-name', text: '未分类' }) ];
      vm.未分类.forEach(function (e) {
        uc.push(el('a', { cls: 'entry-link' + (e.selected ? ' selected' : ''), text: e.名称, href: e.href }));
      });
      nodes.push(el('div', { cls: 'cat-group' }, uc));
    }
    if (!nodes.length) { nodes.push(el('div', { cls: 'empty-sm', text: '（暂无分类）' })); }
    return nodes;
  }

  function renderSidebar() {
    var route = parseHash();
    fill(document.getElementById('sidebar'),
      buildSidebar(View.sidebarVM(route.module, categories(), db()[route.module], route.id), route.module));
  }

  function buildDetail(vm) {
    if (!vm) { return [ el('div', { cls: 'empty', text: '请选择左侧的一个条目查看详情。' }) ]; }
    var nodes = [];
    var head = [ el('h2', { cls: 'detail-title', text: vm.名称 }) ];
    if (vm.类别) { head.push(el('span', { cls: 'badge', text: vm.类别 })); }
    if (vm.药敏简写) { head.push(el('span', { cls: 'abbr', title: '药敏试验简写', text: '药敏 ' + vm.药敏简写 })); }
    nodes.push(el('div', { cls: 'detail-head' }, head));
    if (vm.拉丁名) { nodes.push(el('div', { cls: 'latin', text: vm.拉丁名 })); }
    if (vm.机制图) {
      nodes.push(el('figure', { cls: 'mechanism-fig' }, [
        el('img', { cls: 'mechanism-img', src: vm.机制图, alt: vm.机制图说明 }),
        el('figcaption', { cls: 'mechanism-cap', text: vm.机制图说明 })
      ]));
    }

    if (vm.小节.length === 0) {
      nodes.push(el('div', { cls: 'empty-sm', text: '（暂无内容小节）' }));
    } else {
      vm.小节.forEach(function (s) {
        nodes.push(el('div', { cls: 'section-card' }, [
          el('div', { cls: 'section-title', text: s.标题 }),
          el('div', { cls: 'section-body', text: s.正文 })
        ]));
      });
    }

    if (vm.天然耐药) {
      nodes.push(el('div', { cls: 'intrinsic' }, [
        el('div', { cls: 'intrinsic-title', text: '天然耐药' }),
        el('div', { cls: 'intrinsic-body', text: vm.天然耐药 })
      ]));
    }

    // 治疗要点（经验首选，来自 IDSA/CDC/Sanford 等指南）
    if (vm.治疗) {
      nodes.push(el('div', { cls: 'treatment' }, [
        el('div', { cls: 'treatment-title', text: '治疗要点' }),
        el('div', { cls: 'treatment-body', text: vm.治疗 })
      ]));
    }

    if (vm.药物 && vm.药物.length) {
      var abxMap = abxIdByName();
      var drugChips = vm.药物.map(function (name) {
        var aid = abxMap[name];
        if (aid) { return el('a', { cls: 'chip chip-antibiotics', text: name, href: '#/antibiotics/' + aid }); }
        if (CARD_TEST[name]) { return el('a', { cls: 'chip chip-tests', text: name, href: '#/tests/' + CARD_TEST[name] }); }
        return el('span', { cls: 'chip chip-plain', text: name });
      });
      nodes.push(el('div', { cls: 'card-drugs' }, [
        el('div', { cls: 'card-drugs-head' }, [
          el('div', { cls: 'card-drugs-title', text: '包含药物 · ' + vm.药物.length }),
          (vm.id ? el('button', { cls: 'cmp-add', text: '加入对比', onClick: function () { compareCardSet[vm.id] = true; location.hash = '#/cardcompare'; } }) : null)
        ]),
        el('div', { cls: 'chips' }, drugChips)
      ]));
    }

    // ① 形态
    if (vm.形态) {
      var mNodes = [ el('div', { cls: 'morph-title', text: '形态' }) ];
      if (vm.形态.镜下) {
        mNodes.push(el('div', { cls: 'morph-row' }, [ el('span', { cls: 'morph-tag', text: '镜下' }), el('span', { text: ' ' + vm.形态.镜下 }) ]));
      }
      (vm.形态.培养 || []).forEach(function (c) {
        mNodes.push(el('div', { cls: 'morph-row' }, [ el('span', { cls: 'morph-tag morph-med', text: c.培养基 }), el('span', { text: ' ' + c.形态 }) ]));
      });
      nodes.push(el('div', { cls: 'morphology' }, mNodes));
    }

    // ② 药敏折点（来自 CLSI M100）—— 药物名可跳转到对应抗生素条目
    if (vm.折点) {
      var bp = vm.折点;
      var bpHeadRow = [ el('th', { text: '抗菌药物' }), el('th', { text: 'MIC (μg/mL)' }), el('th', { text: '抑菌圈 (mm)' }), el('th', { text: '备注' }) ];
      var bpBodyRows = bp.药物.map(function (d) {
        var aid = abxIdByDrugText(d.药物);
        var drugCell = aid
          ? el('td', { cls: 'bp-drug' }, [ el('strong', { text: d.简写 }), document.createTextNode(' '), el('a', { cls: 'bp-drug-link', text: d.药物, href: '#/antibiotics/' + aid }) ])
          : el('td', { cls: 'bp-drug' }, [ el('strong', { text: d.简写 }) ].concat([document.createTextNode(' ' + d.药物)]));
        return el('tr', {}, [
          drugCell,
          el('td', { cls: 'bp-mic', text: d.MIC }),
          el('td', { cls: 'bp-disk', text: d.抑菌圈 }),
          el('td', { cls: 'bp-comment', text: d.备注 || '' })
        ]);
      });
      nodes.push(el('div', { cls: 'breakpoints' }, [
        el('div', { cls: 'bp-head' }, [
          el('span', { cls: 'bp-title', text: '药敏折点' }),
          el('span', { cls: 'bp-source', text: (bp.来源 || 'CLSI M100 Ed36 (2026)') + '  |  ' + bp.CLSI表 })
        ]),
        el('div', { cls: 'table-scroll' }, [
          el('table', { cls: 'bp-table' }, [
            el('thead', {}, [ el('tr', {}, bpHeadRow) ]),
            el('tbody', {}, bpBodyRows)
          ])
        ]),
        el('div', { cls: 'bp-foot', text: bp.菌组名 + '  ·  MIC 折点：S≤(敏感) / I(中介/SDD) / R≥(耐药)；抑菌圈：S≥ / I / R≤  (mm)' })
      ]));
    }

    // ③ 相似菌与鉴别
    if (vm.鉴别 && vm.鉴别.length) {
      var diffItems = vm.鉴别.map(function (d) {
        var head = d.id
          ? el('a', { cls: 'diff-link', text: 'vs ' + d.名称, href: '#/microbes/' + d.id })
          : el('span', { cls: 'diff-name', text: 'vs ' + d.名称 });
        return el('div', { cls: 'diff-item' }, [
          el('div', { cls: 'diff-head' }, [ head ]),
          el('div', { cls: 'diff-line' }, [ el('span', { cls: 'diff-tag', text: '相似点' }), el('span', { text: ' ' + d.相似点 }) ]),
          el('div', { cls: 'diff-line' }, [ el('span', { cls: 'diff-tag diff-key', text: '鉴别' }), el('span', { text: ' ' + d.鉴别 }) ])
        ]);
      });
      nodes.push(el('div', { cls: 'differential' }, [ el('div', { cls: 'diff-title', text: '相似菌与鉴别' }) ].concat(diffItems)));
    }

    // ④ 生化反应 —— 项目名可跳转到对应生化试验条目
    if (vm.生化反应 && vm.生化反应.length) {
      var bioTestMap = biochemTestIdByName();
      var bioRows = vm.生化反应.map(function (b) {
        var tid = bioTestMap[b.项目];
        var keyEl = tid
          ? el('a', { cls: 'biochem-key biochem-link', text: b.项目, href: '#/biochem-tests/' + tid })
          : el('span', { cls: 'biochem-key', text: b.项目 });
        return el('div', { cls: 'biochem-row' }, [ keyEl, el('span', { cls: 'biochem-val', text: b.结果 }) ]);
      });
      nodes.push(el('div', { cls: 'biochem' }, [
        el('div', { cls: 'biochem-head' }, [
          el('div', { cls: 'biochem-title', text: '生化反应' }),
          el('button', { cls: 'cmp-add', text: '加入对比', onClick: function () { if (vm.id) { compareSet[vm.id] = true; location.hash = '#/compare'; } } })
        ]),
        el('div', { cls: 'biochem-rows' }, bioRows)
      ]));
    }

    var relKids = [ el('div', { cls: 'relations-label', text: '关联' }) ];
    if (vm.关联.length === 0) {
      relKids.push(el('span', { cls: 'empty-sm', text: '（暂无关联）' }));
    } else {
      var chips = vm.关联.map(function (r) {
        if (!r.exists) { return el('span', { cls: 'chip chip-missing', text: r.label, title: '目标不存在' }); }
        return el('a', { cls: 'chip chip-' + r.module, text: r.label, href: r.href });
      });
      relKids.push(el('div', { cls: 'chips' }, chips));
    }
    nodes.push(el('div', { cls: 'relations' }, relKids));

    if (vm.链接 && vm.链接.length) {
      var refChips = vm.链接.map(function (l) {
        return el('a', {
          cls: 'ref-link', text: l.标题, href: l.url,
          target: '_blank', rel: 'noopener noreferrer', title: l.url
        });
      });
      nodes.push(el('div', { cls: 'refs' }, [
        el('div', { cls: 'refs-label', text: '综述 / 参考' })
      ].concat([ el('div', { cls: 'chips' }, refChips) ])));
    }
    if (vm.结构图) {
      nodes.push(el('figure', { cls: 'mechanism-fig struct-fig' }, [
        el('img', { cls: 'mechanism-img', src: vm.结构图, alt: '分子结构' }),
        el('figcaption', { cls: 'mechanism-cap', text: '分子结构（数据来源 ChEMBL，RDKit 绘制）' })
      ]));
    }
    return nodes;
  }

  function buildSearch(vm) {
    var nodes = [ el('div', { cls: 'search-head', text: '搜索：“' + vm.query + '”' }) ];
    if (vm.items.length === 0) {
      nodes.push(el('div', { cls: 'empty', text: '没有找到匹配的条目。' }));
      return nodes;
    }
    var items = vm.items.map(function (r) {
      var link = el('a', { cls: 'search-item', href: r.href }, [
        el('span', { cls: 'tag tag-' + r.module, text: View.moduleLabel(r.module) })
      ]);
      link.appendChild(document.createTextNode(' ' + r.名称));
      if (r.摘要) { link.appendChild(el('span', { cls: 'search-summary', text: r.摘要 })); }
      return link;
    });
    nodes.push(el('div', { cls: 'search-list' }, items));
    return nodes;
  }

  // ===== 生化反应对比 =====
  var compareSet = {}; // 选中用于对比的微生物 id
  var compareFilter = ''; // 对比选择器的搜索过滤词

  function isCompareRoute() { return routeKey() === 'compare'; }
  function comparableIds() { return Object.keys((window.DB && window.DB.biochem) || {}); }
  function nameById() {
    var m = {};
    ((window.DB && window.DB.microbes) || []).forEach(function (x) { m[x.id] = x.名称; });
    return m;
  }
  function toggleCompare(id) {
    if (compareSet[id]) { delete compareSet[id]; } else { compareSet[id] = true; }
    if (isCompareRoute()) { renderCompare(); }
  }
  function comparePickItems() {
    var names = nameById();
    var q = compareFilter.trim().toLowerCase();
    var ids = comparableIds().filter(function (id) {
      return !q || (names[id] || '').toLowerCase().indexOf(q) !== -1;
    });
    var items = ids.map(function (id) {
      var sel = !!compareSet[id];
      return el('div', {
        cls: 'cmp-pick' + (sel ? ' sel' : ''),
        text: (sel ? '☑ ' : '☐ ') + (names[id] || id),
        onClick: function () { toggleCompare(id); }
      });
    });
    if (!items.length) { items = [ el('div', { cls: 'empty-sm', text: '无匹配的细菌' }) ]; }
    return items;
  }
  function renderComparePickerList() {
    var listEl = document.getElementById('cmp-pick-list');
    if (listEl) { listEl.replaceChildren.apply(listEl, comparePickItems()); }
  }
  function buildComparePicker() {
    var search = el('input', { cls: 'cmp-search', type: 'search', placeholder: '筛选…', value: compareFilter });
    search.addEventListener('input', function () { compareFilter = search.value; renderComparePickerList(); });
    return [ el('div', { cls: 'cat-group' }, [
      el('div', { cls: 'cat-group-name', text: '勾选细菌（可多选）' }),
      search,
      el('div', { cls: 'cmp-pick-list', id: 'cmp-pick-list' })
    ]) ];
  }
  function buildCompareView(vm) {
    var nodes = [ el('h2', { cls: 'detail-title', text: '生化反应对比' }) ];
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
  function renderCompare() {
    setActiveTab(null);
    var names = nameById();
    fill(document.getElementById('sidebar'), buildComparePicker());
    renderComparePickerList();
    var selected = comparableIds().filter(function (id) { return compareSet[id]; });
    fill(document.getElementById('main'), buildCompareView(View.buildComparison(names, (window.DB && window.DB.biochem) || {}, selected)));
  }

  // ===== 药敏卡对比 =====
  var compareCardSet = {};
  var compareCardFilter = '';
  function isCardCompareRoute() { return routeKey() === 'cardcompare'; }
  function cardNameById() { var m = {}; ((window.DB && window.DB.cards) || []).forEach(function (c) { m[c.id] = c.名称; }); return m; }
  function drugsByCard() { var m = {}; ((window.DB && window.DB.cards) || []).forEach(function (c) { m[c.id] = c.药物 || []; }); return m; }
  function cardIds() { return ((window.DB && window.DB.cards) || []).map(function (c) { return c.id; }); }
  function toggleCardCompare(id) {
    if (compareCardSet[id]) { delete compareCardSet[id]; } else { compareCardSet[id] = true; }
    if (isCardCompareRoute()) { renderCardCompare(); }
  }
  function cardPickItems() {
    var names = cardNameById();
    var q = compareCardFilter.trim().toLowerCase();
    var ids = cardIds().filter(function (id) { return !q || (names[id] || '').toLowerCase().indexOf(q) !== -1; });
    var items = ids.map(function (id) {
      var sel = !!compareCardSet[id];
      return el('div', { cls: 'cmp-pick' + (sel ? ' sel' : ''), text: (sel ? '☑ ' : '☐ ') + (names[id] || id), onClick: function () { toggleCardCompare(id); } });
    });
    if (!items.length) { items = [ el('div', { cls: 'empty-sm', text: '无匹配的卡片' }) ]; }
    return items;
  }
  function renderCardPickerList() {
    var listEl = document.getElementById('card-pick-list');
    if (listEl) { listEl.replaceChildren.apply(listEl, cardPickItems()); }
  }
  function buildCardComparePicker() {
    var search = el('input', { cls: 'cmp-search', type: 'search', placeholder: '筛选…', value: compareCardFilter });
    search.addEventListener('input', function () { compareCardFilter = search.value; renderCardPickerList(); });
    return [ el('div', { cls: 'cat-group' }, [
      el('div', { cls: 'cat-group-name', text: '勾选药敏卡（可多选）' }),
      search,
      el('div', { cls: 'cmp-pick-list', id: 'card-pick-list' })
    ]) ];
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
    setActiveTab(null);
    fill(document.getElementById('sidebar'), buildCardComparePicker());
    renderCardPickerList();
    var selected = cardIds().filter(function (id) { return compareCardSet[id]; });
    fill(document.getElementById('main'), buildCardCompareView(View.buildCardComparison(cardNameById(), drugsByCard(), selected)));
  }

  // ===== 工具 1：天然耐药速查 =====
  var intrinsicFilter = '';
  function isIntrinsicRoute() { return routeKey() === 'intrinsic'; }
  function renderIntrinsic() {
    setActiveTool('intrinsic');
    var search = el('input', { cls: 'cmp-search', type: 'search', placeholder: '筛选菌名/拉丁名/药名…', value: intrinsicFilter });
    search.addEventListener('input', function () { intrinsicFilter = search.value; renderIntrinsicMain(); });
    var sb = [ el('div', { cls: 'cat-group' }, [
      el('div', { cls: 'cat-group-name', text: '天然耐药速查' }),
      el('div', { cls: 'cmp-hint', text: '左侧筛选；右侧按菌属列出全部天然耐药条目。点菌名可跳转详情。' }),
      search
    ]) ];
    fill(document.getElementById('sidebar'), sb);
    renderIntrinsicMain();
  }
  function renderIntrinsicMain() {
    var vm = View.intrinsicVM(db(), intrinsicFilter);
    var nodes = [ el('h2', { cls: 'detail-title', text: '天然耐药速查' }) ];
    nodes.push(el('div', { cls: 'cmp-hint', text: '共 ' + vm.count + ' 条' + (intrinsicFilter ? '（已筛选）' : '') }));
    if (vm.groups.length === 0) {
      nodes.push(el('div', { cls: 'empty', text: '没有匹配的条目。' }));
    } else {
      vm.groups.forEach(function (g) {
        var items = g.items.map(function (it) {
          return el('div', { cls: 'intrinsic-card' }, [
            el('div', { cls: 'intrinsic-card-head' }, [
              el('a', { cls: 'intrinsic-link', text: it.名称, href: '#/microbes/' + it.id }),
              it.拉丁名 ? el('span', { cls: 'latin', text: it.拉丁名 }) : null
            ]),
            el('div', { cls: 'intrinsic-body', text: it.天然耐药 })
          ]);
        });
        nodes.push(el('div', { cls: 'intrinsic-group' }, [
          el('div', { cls: 'intrinsic-group-title', text: g.类别 + ' · ' + g.items.length }),
          el('div', { cls: 'intrinsic-list' }, items)
        ]));
      });
    }
    fill(document.getElementById('main'), nodes);
  }

  // ===== 工具 2：关联关系图 =====
  var graphFilter = '';
  var graphDepth = 1;
  function isGraphRoute() { return routeKey() === 'graph'; }
  function graphRouteId() {
    var parts = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
    return parts.length >= 3 ? { module: parts[1], id: parts[2] } : null;
  }
  function graphPickItems() {
    var q = graphFilter.trim().toLowerCase();
    var items = [];
    MODULES.forEach(function (mod) {
      (db()[mod] || []).forEach(function (e) {
        if (!q || (e.名称 || '').toLowerCase().indexOf(q) !== -1) {
          items.push({ id: e.id, 名称: e.名称, module: mod });
        }
      });
    });
    return items.slice(0, 200);
  }
  function renderGraphPicker() {
    var search = el('input', { cls: 'cmp-search', type: 'search', placeholder: '搜索条目作为图心…', value: graphFilter });
    search.addEventListener('input', function () {
      graphFilter = search.value;
      var list = document.getElementById('graph-pick-list');
      if (list) { list.replaceChildren.apply(list, graphPickItems().map(function (it) {
        return el('a', { cls: 'entry-link', text: it.名称, href: '#/graph/' + it.module + '/' + it.id });
      })); }
    });
    return [ el('div', { cls: 'cat-group' }, [
      el('div', { cls: 'cat-group-name', text: '选择图心' }),
      el('div', { cls: 'cmp-hint', text: '挑一个条目作为中心，画它的关联网络。' }),
      search,
      el('div', { cls: 'cmp-pick-list', id: 'graph-pick-list' })
    ]) ];
  }
  function renderGraphPickerList() {
    var list = document.getElementById('graph-pick-list');
    if (list) { list.replaceChildren.apply(list, graphPickItems().map(function (it) {
      return el('a', { cls: 'entry-link', text: it.名称, href: '#/graph/' + it.module + '/' + it.id });
    })); }
  }
  function nodeFill(module, isCenter) {
    if (isCenter) { return '#2e6b66'; }
    var map = {
      microbes: '#345f86', antibiotics: '#3f7a52', resistance: '#a85a2a',
      tests: '#8a6d1f', cards: '#4a6d8c', media: '#6b4e8a',
      staining: '#8a4a6b', 'biochem-tests': '#4a7a6b', idcards: '#7a5a3a'
    };
    return map[module] || '#8a8f98';
  }

  function graphLabelText(name, level) {
    var max = level === 0 ? 12 : (level === 1 ? 8 : 5);
    return name.length > max ? name.slice(0, max - 1) + '…' : name;
  }

  function graphTextWidth(text, fontSize) {
    var units = 0;
    String(text || '').split('').forEach(function (ch) {
      units += /[\x00-\x7F]/.test(ch) ? 0.56 : 1;
    });
    return Math.ceil(units * fontSize);
  }

  function graphLabelPlacement(node, radius, width, height) {
    if (node.level === 0) {
      return { x: 0, y: 4, anchor: 'middle', baseline: 'central' };
    }
    var dx = node.x - width / 2;
    var dy = node.y - height / 2;
    var gap = node.level === 1 ? 12 : 9;
    if (Math.abs(dx) < 42) {
      return {
        x: 0,
        y: dy < 0 ? -(radius + gap + 2) : (radius + gap + 6),
        anchor: 'middle',
        baseline: 'central'
      };
    }
    return {
      x: dx > 0 ? radius + gap : -(radius + gap),
      y: Math.max(-10, Math.min(10, dy * 0.04)),
      anchor: dx > 0 ? 'start' : 'end',
      baseline: 'central'
    };
  }

  function graphLabelGroup(node, radius, labelText, fontSize, width, height) {
    var p = graphLabelPlacement(node, radius, width, height);
    var textWidth = graphTextWidth(labelText, fontSize);
    var padX = 5, labelH = fontSize + 7, labelW = textWidth + padX * 2;
    var rectX = p.anchor === 'middle' ? p.x - labelW / 2 : (p.anchor === 'start' ? p.x - padX : p.x - labelW + padX);
    var rectY = p.y - labelH / 2;
    var g = sg('g', { cls: 'graph-label' + (node.level === 0 ? ' center-label' : (node.level > 1 ? ' secondary' : ' primary')) });
    if (node.level > 0) {
      g.appendChild(sg('rect', {
        cls: 'graph-label-bg',
        x: rectX, y: rectY, width: labelW, height: labelH, rx: 4, ry: 4
      }));
    }
    g.appendChild(sg('text', {
      cls: 'graph-label-text',
      x: p.x, y: p.y,
      'text-anchor': p.anchor,
      'dominant-baseline': p.baseline,
      'font-size': fontSize,
      'font-weight': node.level === 0 ? '600' : '500',
      fill: node.level === 0 ? '#ffffff' : '#3f464f'
    }, [labelText]));
    return g;
  }

  function buildGraphSVG(layout) {
    var W = layout.width, H = layout.height;

    // 边：先渲染（位于节点下方），淡入；记录两端 id 用于悬停聚焦
    var edgeData = layout.edges.map(function (e) {
      var line = sg('line', {
        x1: e.x1, y1: e.y1, x2: e.x2, y2: e.y2,
        stroke: e.direction === 'forward' ? '#cfe0db' : '#e7c9c0',
        'stroke-width': '1.6',
        'stroke-dasharray': e.direction === 'reverse' ? '5 3' : 'none',
        'stroke-linecap': 'round',
        cls: 'graph-edge' + (e.direction === 'reverse' ? ' reverse' : '')
      });
      return { el: line, fromId: e.fromId, toId: e.toId };
    });
    var edgeRefs = edgeData.map(function (d) { return d.el; });

    // 邻接表（节点 id → 邻居 id 集合），用于悬停聚焦
    var neighbors = {};
    layout.nodes.forEach(function (n) { neighbors[n.id] = {}; });
    edgeData.forEach(function (d) {
      if (neighbors[d.fromId]) { neighbors[d.fromId][d.toId] = true; }
      if (neighbors[d.toId]) { neighbors[d.toId][d.fromId] = true; }
    });

    // 节点：外层 g 用 transform 属性定位，内层 g 做 CSS 缩放/淡入
    var innerRefs = [];
    var nodeById = {};
    var nodeEls = layout.nodes.map(function (n, i) {
      var isCenter = n.level === 0;
      var r = isCenter ? 30 : (n.level === 1 ? 17 : 12);
      var fill = nodeFill(n.module, isCenter);
      var outer = sg('g', {
        transform: 'translate(' + n.x + ' ' + n.y + ')',
        cls: 'gnode',
        role: 'button',
        tabindex: '0',
        'aria-label': View.moduleLabel(n.module) + ' · ' + n.名称 + (isCenter ? '（点击查看详情）' : '（点击设为图心）')
      });
      var inner = sg('g', { cls: 'graph-node-inner' + (isCenter ? ' center' : '') });
      outer.appendChild(sg('title', { text: View.moduleLabel(n.module) + ' · ' + n.名称 + (isCenter ? '（点击查看详情）' : '（点击设为图心）') }));
      // 阶梯延迟：中心 0s，一级 0.08s 起每项 +8ms，二级 0.25s 起每项 +6ms
      var delay = isCenter ? 0 : (n.level === 1 ? (0.08 + i * 0.008) : (0.25 + i * 0.006));
      inner.style.transitionDelay = delay + 's';

      inner.appendChild(sg('circle', {
        cx: 0, cy: 0, r: r, fill: fill,
        'fill-opacity': isCenter ? '1' : '0.92',
        stroke: '#ffffff', 'stroke-width': '2.5'
      }));
      var fontSize = isCenter ? '12' : '10.5';
      inner.appendChild(graphLabelGroup(n, r, graphLabelText(n.名称, n.level), fontSize, W, H));

      outer.style.cursor = 'pointer';
      // 悬停聚焦：高亮该节点与其邻居/连线，淡化其余，并显示邻居标签
      outer.addEventListener('mouseenter', function () { focusNode(n.id); });
      outer.addEventListener('mouseleave', clearFocus);
      // 键盘聚焦同样触发高亮，便于不用鼠标的用户
      outer.addEventListener('focus', function () { focusNode(n.id); });
      outer.addEventListener('blur', clearFocus);
      function activate() {
        // 图心：跳转到该条目详情页；其余节点：以该节点为新图心
        location.hash = isCenter ? ('#/' + n.module + '/' + n.id) : ('#/graph/' + n.module + '/' + n.id);
      }
      outer.addEventListener('click', activate);
      outer.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
          ev.preventDefault();
          activate();
        }
      });
      outer.appendChild(inner);
      innerRefs.push({ el: inner, delay: delay });
      nodeById[n.id] = outer;
      return outer;
    });

    // 显式 width/height（防 height:auto 在部分浏览器计算为 0）；viewBox 保持等比缩放
    var svg = sg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, cls: 'graph-svg' });
    edgeRefs.forEach(function (e) { svg.appendChild(e); });
    nodeEls.forEach(function (n) { svg.appendChild(n); });

    function focusNode(id) {
      svg.classList.add('focusing');
      var on = {}; on[id] = true;
      var nb = neighbors[id] || {};
      Object.keys(nb).forEach(function (k) { on[k] = true; });
      layout.nodes.forEach(function (nd) {
        var g = nodeById[nd.id];
        if (g) { g.classList.toggle('adj', !!on[nd.id]); }
      });
      edgeData.forEach(function (d) { d.el.classList.toggle('adj', d.fromId === id || d.toId === id); });
    }
    function clearFocus() {
      svg.classList.remove('focusing');
      Object.keys(nodeById).forEach(function (k) { nodeById[k].classList.remove('adj'); });
      edgeData.forEach(function (d) { d.el.classList.remove('adj'); });
    }

    // 挂到 DOM 后下一帧加 .visible 触发入场过渡；后台标签页可能暂停 RAF，定时器兜底保证图不会保持透明。
    var shown = false;
    function showGraph() {
      if (shown) { return; }
      shown = true;
      innerRefs.forEach(function (item) { item.el.classList.add('visible'); });
      edgeRefs.forEach(function (e) { e.classList.add('visible'); });
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(showGraph);
    });
    setTimeout(showGraph, 80);
    return svg;
  }
  function renderGraph() {
    setActiveTool('graph');
    var route = graphRouteId();
    if (!route) {
      fill(document.getElementById('sidebar'), renderGraphPicker());
      renderGraphPickerList();
      fill(document.getElementById('main'), [
        el('h2', { cls: 'detail-title', text: '关联关系图' }),
        el('div', { cls: 'empty', text: '在左侧搜索并选择一个条目作为图心，查看其关联网络。' })
      ]);
      return;
    }
    var data = db();
    var graph = Core.buildGraph(data, route.module, route.id, graphDepth);
    if (!graph) {
      fill(document.getElementById('sidebar'), renderGraphPicker());
      renderGraphPickerList();
      fill(document.getElementById('main'), [ el('div', { cls: 'empty', text: '找不到该条目。' }) ]);
      return;
    }
    // 2 层时节点多，放大画布留出间距（节点半径固定 → 相对更小、更不挤）
    var nodeCount = graph.nodes.length;
    var canvas = (graphDepth >= 2) ? Math.min(1040, 720 + Math.max(0, nodeCount - 24) * 7) : 720;
    var layout = View.graphLayoutVM(graph, canvas, canvas);

    // 侧栏：图心信息 + 深度切换 + 关联列表
    var depthToggle = el('div', { cls: 'graph-controls' }, [
      el('span', { cls: 'graph-ctrl-label', text: '深度' }),
      el('button', { cls: 'cmp-add' + (graphDepth === 1 ? ' sel' : ''), text: '1 层', onClick: function () { graphDepth = 1; renderGraph(); } }),
      el('button', { cls: 'cmp-add' + (graphDepth === 2 ? ' sel' : ''), text: '2 层', onClick: function () { graphDepth = 2; renderGraph(); } })
    ]);
    var relList = graph.nodes.filter(function (n) { return n.level > 0; }).map(function (n) {
      return el('a', {
        cls: 'entry-link chip chip-' + n.module,
        text: View.moduleLabel(n.module) + ' · ' + n.名称,
        href: '#/graph/' + n.module + '/' + n.id
      });
    });
    var sidebarNodes = [ el('div', { cls: 'cat-group' }, [
      el('div', { cls: 'cat-group-name', text: '图心' }),
      el('div', { cls: 'graph-center-info' }, [
        el('a', { cls: 'intrinsic-link', text: graph.center.名称, href: '#/' + route.module + '/' + route.id }),
        el('span', { cls: 'badge', text: View.moduleLabel(route.module) })
      ]),
      depthToggle,
      el('div', { cls: 'cat-group-name', text: '关联 (' + (graph.nodes.length - 1) + ')' }),
      el('div', { cls: 'chips', style: 'flex-direction:column;align-items:flex-start;gap:4px;' }, relList)
    ]) ];
    fill(document.getElementById('sidebar'), sidebarNodes);

    // 主区：图例 + SVG
    var main = [ el('h2', { cls: 'detail-title', text: '关联关系图' }) ];
    main.push(el('div', { cls: 'graph-legend' }, [
      el('span', { cls: 'graph-legend-item' }, [ el('span', { cls: 'graph-legend-line solid' }), '正向关联' ]),
      el('span', { cls: 'graph-legend-item' }, [ el('span', { cls: 'graph-legend-line dashed' }), '反向关联' ]),
      el('span', { cls: 'graph-legend-item' }, [ el('span', { cls: 'graph-legend-dot center' }), '图心' ]),
      el('span', { cls: 'graph-legend-item' }, [ el('span', { cls: 'graph-legend-dot l1' }), '一级关联' ]),
      el('span', { cls: 'graph-legend-item' }, [ el('span', { cls: 'graph-legend-dot l2' }), '二级关联' ])
    ]));
    main.push(el('div', { cls: 'graph-wrap' + (graphDepth >= 2 ? ' graph-dense' : '') }, [ buildGraphSVG(layout) ]));
    main.push(el('div', { cls: 'cmp-hint', text: '桌面端悬停任一节点：高亮它的关联、显示邻居名称、淡化其余。点击节点以它为新图心（手机端逐层下钻），点侧栏关联项可跳转。' }));
    fill(document.getElementById('main'), main);
  }

  // ===== 工具 3：折点独立查询 + MIC 判读 =====
  var bpMode = 'lookup'; // 'lookup' | 'judge'
  var bpGroupFilter = '';
  var bpDrugFilter = '';
  var bpJudgeGroup = '';
  var bpJudgeDrug = '';
  var bpJudgeMIC = '';
  function isBreakpointsRoute() { return routeKey() === 'breakpoints'; }
  function bpGroups() { return (window.DB && window.DB.breakpoints) || []; }
  function bpGroupByName(name) {
    return bpGroups().filter(function (g) { return g.菌组名 === name; })[0] || null;
  }
  function renderBreakpoints() {
    setActiveTool('breakpoints');
    // 侧栏：模式切换 +（judge 模式下）菌组列表
    var modeToggle = el('div', { cls: 'graph-controls' }, [
      el('button', { cls: 'cmp-add' + (bpMode === 'lookup' ? ' sel' : ''), text: '折点查询', onClick: function () { bpMode = 'lookup'; renderBreakpoints(); } }),
      el('button', { cls: 'cmp-add' + (bpMode === 'judge' ? ' sel' : ''), text: 'MIC 判读', onClick: function () { bpMode = 'judge'; renderBreakpoints(); } })
    ]);
    var sbNodes = [ el('div', { cls: 'cat-group' }, [
      el('div', { cls: 'cat-group-name', text: '折点工具' }),
      modeToggle
    ]) ];
    if (bpMode === 'judge') {
      var groupItems = bpGroups().map(function (g) {
        return el('div', {
          cls: 'cmp-pick' + (bpJudgeGroup === g.菌组名 ? ' sel' : ''),
          text: g.菌组名,
          onClick: function () {
            bpJudgeGroup = g.菌组名;
            bpJudgeDrug = (g.药物 && g.药物[0]) ? g.药物[0].药物 : '';
            bpJudgeMIC = '';
            renderBreakpoints();
          }
        });
      });
      sbNodes.push(el('div', { cls: 'cat-group' }, [
        el('div', { cls: 'cat-group-name', text: '菌组 (' + bpGroups().length + ')' }),
        el('div', { cls: 'bp-group-list' }, groupItems)
      ]));
    } else {
      sbNodes.push(el('div', { cls: 'cmp-hint', text: '在右侧按菌组名 / 药物名筛选，查看 CLSI 折点表。切到「MIC 判读」可输入数值自动判读 S/I/R。' }));
    }
    fill(document.getElementById('sidebar'), sbNodes);
    renderBreakpointsMain();
  }
  function renderBreakpointsMain() {
    var nodes = [ el('h2', { cls: 'detail-title', text: bpMode === 'lookup' ? '折点查询' : 'MIC 判读' }) ];
    if (bpMode === 'lookup') {
      // 顶部筛选
      var gf = el('input', { cls: 'cmp-search', type: 'search', placeholder: '按菌组名筛选…', value: bpGroupFilter, style: 'display:inline-block;width:auto;margin-right:8px;' });
      gf.addEventListener('input', function () { bpGroupFilter = gf.value; renderBreakpointsMain(); });
      var df = el('input', { cls: 'cmp-search', type: 'search', placeholder: '按药物名/简写筛选…', value: bpDrugFilter, style: 'display:inline-block;width:auto;' });
      df.addEventListener('input', function () { bpDrugFilter = df.value; renderBreakpointsMain(); });
      nodes.push(el('div', { cls: 'bp-filters' }, [ gf, df ]));
      var groups = View.breakpointLookupVM(bpGroups(), bpGroupFilter, bpDrugFilter);
      if (groups.length === 0) {
        nodes.push(el('div', { cls: 'empty', text: '没有匹配的折点。' }));
      } else {
        groups.forEach(function (g) {
          nodes.push(el('div', { cls: 'bp-group' }, [
            el('div', { cls: 'bp-group-head' }, [
              el('span', { cls: 'bp-title', text: g.菌组名 }),
              el('span', { cls: 'bp-source', text: (g.来源 || 'CLSI M100 Ed36 (2026)') + '  |  ' + g.CLSI表 + '  |  ' + g.菌种.length + ' 菌种' })
            ]),
            buildBpTable(g.药物)
          ]));
        });
      }
    } else {
      // MIC 判读表单
      var group = bpJudgeGroup ? bpGroupByName(bpJudgeGroup) : null;
      var groupSelect = el('select', { cls: 'bp-select' });
      groupSelect.appendChild(el('option', { value: '', text: '— 选择菌组 —' }));
      bpGroups().forEach(function (g) {
        var opt = el('option', { value: g.菌组名, text: g.菌组名 });
        if (g.菌组名 === bpJudgeGroup) { opt.selected = true; }
        groupSelect.appendChild(opt);
      });
      groupSelect.addEventListener('change', function () {
        bpJudgeGroup = groupSelect.value;
        var gg = bpJudgeGroup ? bpGroupByName(bpJudgeGroup) : null;
        bpJudgeDrug = (gg && gg.药物 && gg.药物[0]) ? gg.药物[0].药物 : '';
        bpJudgeMIC = '';
        renderBreakpointsMain();
      });

      var drugSelect = el('select', { cls: 'bp-select' });
      drugSelect.appendChild(el('option', { value: '', text: '— 选择药物 —' }));
      if (group) {
        group.药物.forEach(function (d) {
          var opt = el('option', { value: d.药物, text: d.药物 + ' (' + d.简写 + ')' });
          if (d.药物 === bpJudgeDrug) { opt.selected = true; }
          drugSelect.appendChild(opt);
        });
      }
      drugSelect.addEventListener('change', function () { bpJudgeDrug = drugSelect.value; bpJudgeMIC = ''; renderBreakpointsMain(); });

      var micInput = el('input', { cls: 'cmp-search', type: 'number', placeholder: '输入 MIC 值 (μg/mL)', value: bpJudgeMIC, step: '0.01', min: '0', style: 'width:200px;' });
      micInput.addEventListener('input', function () { bpJudgeMIC = micInput.value; renderJudgeResult(); });

      nodes.push(el('div', { cls: 'bp-judge-form' }, [
        el('div', { cls: 'bp-judge-row' }, [ el('label', { text: '菌组' }), groupSelect ]),
        el('div', { cls: 'bp-judge-row' }, [ el('label', { text: '药物' }), drugSelect ]),
        el('div', { cls: 'bp-judge-row' }, [ el('label', { text: 'MIC' }), micInput ])
      ]));

      var resultBox = el('div', { cls: 'bp-judge-result', id: 'bp-judge-result' });
      nodes.push(resultBox);
      fill(document.getElementById('main'), nodes);
      // fill 是同步的，DOM 已就位，直接渲染判读结果
      renderJudgeResult();
      return;
    }
    fill(document.getElementById('main'), nodes);
  }
  function buildBpTable(drugs) {
    var headRow = [ el('th', { text: '抗菌药物' }), el('th', { text: 'MIC (μg/mL)' }), el('th', { text: '抑菌圈 (mm)' }), el('th', { text: '备注' }) ];
    var bodyRows = drugs.map(function (d) {
      var aid = abxIdByDrugText(d.药物);
      var drugCell = aid
        ? el('td', { cls: 'bp-drug' }, [ el('strong', { text: d.简写 }), document.createTextNode(' '), el('a', { cls: 'bp-drug-link', text: d.药物, href: '#/antibiotics/' + aid }) ])
        : el('td', { cls: 'bp-drug' }, [ el('strong', { text: d.简写 }), document.createTextNode(' ' + d.药物) ]);
      return el('tr', {}, [
        drugCell,
        el('td', { cls: 'bp-mic', text: [d.MIC_S, d.MIC_I, d.MIC_R].filter(Boolean).join(' / ') }),
        el('td', { cls: 'bp-disk', text: [d.抑菌圈_S, d.抑菌圈_I, d.抑菌圈_R].filter(Boolean).join(' / ') }),
        el('td', { cls: 'bp-comment', text: d.备注 || '' })
      ]);
    });
    return el('div', { cls: 'table-scroll' }, [
      el('table', { cls: 'bp-table' }, [
        el('thead', {}, [ el('tr', {}, headRow) ]),
        el('tbody', {}, bodyRows)
      ])
    ]);
  }
  function renderJudgeResult() {
    var box = document.getElementById('bp-judge-result');
    if (!box) { return; }
    if (!bpJudgeGroup || !bpJudgeDrug) {
      box.replaceChildren(el('div', { cls: 'empty-sm', text: '请选择菌组与药物，并输入 MIC 值。' }));
      return;
    }
    var group = bpGroupByName(bpJudgeGroup);
    var drug = (group && group.药物 || []).filter(function (d) { return d.药物 === bpJudgeDrug; })[0];
    if (!drug) {
      box.replaceChildren(el('div', { cls: 'empty-sm', text: '该菌组未找到此药物。' }));
      return;
    }
    // 显示该药折点
    var bpInfo = el('div', { cls: 'bp-judge-bp' }, [
      el('span', { text: '折点：S ' + (drug.MIC_S || '—') + ' / I ' + (drug.MIC_I || '—') + ' / R ' + (drug.MIC_R || '—') + ' (μg/mL)' })
    ]);
    if (!bpJudgeMIC || bpJudgeMIC === '') {
      box.replaceChildren(bpInfo, el('div', { cls: 'empty-sm', text: '输入 MIC 值后自动判读。' }));
      return;
    }
    var verdict = View.judgeMIC(bpJudgeMIC, drug.MIC_S, drug.MIC_I, drug.MIC_R);
    var cls = 'bp-verdict ' + (verdict.result === 'S' ? 'v-s' : (verdict.result === 'R' ? 'v-r' : (verdict.result === 'I' ? 'v-i' : 'v-unknown')));
    box.replaceChildren(bpInfo, el('div', { cls: cls }, [
      el('span', { cls: 'bp-verdict-tag', text: verdict.result === 'invalid' ? '无效' : verdict.result }),
      el('span', { cls: 'bp-verdict-reason', text: verdict.reason })
    ]));
    if (drug.备注) {
      box.appendChild(el('div', { cls: 'bp-judge-note', text: '备注：' + drug.备注 }));
    }
  }

  // ===== 工具 4：异常药敏 / 修正规则 =====
  var astFilter = '';
  var astLevel = 'all';
  function isAstAlertsRoute() { return routeKey() === 'ast-alerts'; }
  function astAlerts() { return (window.DB && window.DB.astAlerts) || []; }
  function astSources() { return (window.DB && window.DB.astAlertSources) || []; }
  function levelLabel(level) { return level === 'all' ? '全部' : level; }
  function astLevelClass(level) {
    if (level === '必须修正') { return 'ast-level ast-critical'; }
    if (level === '需复核') { return 'ast-level ast-review'; }
    if (level === '限制报告') { return 'ast-level ast-limit'; }
    return 'ast-level';
  }
  function renderAstAlerts() {
    setActiveTool('ast-alerts');
    var vm = View.astAlertsVM(astAlerts(), { filter: astFilter, level: astLevel });
    var levelBtns = vm.levels.map(function (lv) {
      return el('button', {
        cls: 'cmp-add' + (astLevel === lv ? ' sel' : ''),
        text: levelLabel(lv),
        onClick: function () { astLevel = lv; renderAstAlerts(); }
      });
    });
    var search = el('input', { cls: 'cmp-search', type: 'search', placeholder: '筛选菌名/药物/机制…', value: astFilter });
    search.addEventListener('input', function () { astFilter = search.value; renderAstAlertsMain(); });
    fill(document.getElementById('sidebar'), [
      el('div', { cls: 'cat-group' }, [
        el('div', { cls: 'cat-group-name', text: '异常药敏' }),
        el('div', { cls: 'cmp-hint', text: '用于发现“看起来敏感但不应直接报告”的组合。正式报告以本院 SOP 和当前标准为准。' }),
        el('div', { cls: 'graph-controls ast-filter-controls' }, levelBtns),
        search
      ])
    ]);
    renderAstAlertsMain();
  }
  function renderAstAlertsMain() {
    var vm = View.astAlertsVM(astAlerts(), { filter: astFilter, level: astLevel });
    var nodes = [
      el('div', { cls: 'detail-head' }, [
        el('h2', { cls: 'detail-title', text: '异常药敏 / 修正规则' }),
        el('span', { cls: 'badge', text: vm.count + ' 条' })
      ]),
      el('div', { cls: 'cmp-hint ast-disclaimer', text: '定位常见矛盾结果、固有耐药、限制报告和需要补充试验的场景；不替代最终审核。' })
    ];
    if (vm.groups.length === 0) {
      nodes.push(el('div', { cls: 'empty', text: '没有匹配的异常药敏规则。' }));
    } else {
      vm.groups.forEach(function (group) {
        nodes.push(el('section', { cls: 'ast-group' }, [
          el('div', { cls: 'ast-group-title', text: group.类别 + ' · ' + group.items.length }),
          el('div', { cls: 'ast-list' }, group.items.map(buildAstCard))
        ]));
      });
    }
    var refs = astSources().map(function (src) {
      return el('a', { cls: 'ref-link', text: src.名称, href: src.链接, target: '_blank', rel: 'noopener noreferrer' });
    });
    if (refs.length) {
      nodes.push(el('div', { cls: 'refs' }, [
        el('div', { cls: 'refs-label', text: '参考口径' }),
        el('div', { cls: 'chips' }, refs)
      ]));
    }
    fill(document.getElementById('main'), nodes);
  }
  function astLine(label, text) {
    return el('div', { cls: 'ast-line' }, [
      el('span', { cls: 'ast-line-label', text: label }),
      el('span', { cls: 'ast-line-text', text: text || '—' })
    ]);
  }
  function buildAstCard(item) {
    var tags = (item.关键词 || []).slice(0, 7).map(function (tag) {
      return el('span', { cls: 'morph-tag', text: tag });
    });
    return el('article', { cls: 'ast-card' }, [
      el('div', { cls: 'ast-card-head' }, [
        el('span', { cls: astLevelClass(item.等级), text: item.等级 }),
        el('h3', { cls: 'ast-title', text: item.标题 })
      ]),
      astLine('触发', item.触发),
      astLine('异常', item.异常结果),
      astLine('处理', item.处理),
      astLine('依据', item.依据),
      tags.length ? el('div', { cls: 'chips ast-tags' }, tags) : null
    ]);
  }

  function isAboutRoute() { return routeKey() === 'about'; }

  // 关于 / 免责声明 / 隐私政策（上架与合规所需）
  function renderAbout() {
    setActiveTab(null);
    renderSidebar();
    function card(title, lines) {
      return el('div', { cls: 'about-card' }, [ el('h3', { cls: 'about-h' , text: title }) ].concat(
        lines.map(function (t) { return el('p', { cls: 'about-p', text: t }); })
      ));
    }
    var nodes = [
      el('h2', { cls: 'detail-title', text: '关于 · 免责声明 · 隐私政策' }),
      card('免责声明', [
        '本软件为临床微生物学习与速查工具，所载形态、鉴别、生化、药敏折点、治疗要点等内容仅供医学教育与专业人员查询参考，不构成任何诊断、治疗或用药建议。',
        '任何临床决策（含用药选择、剂量、疗程）必须由具备资质的医务人员，结合患者具体情况、本地药敏结果与现行权威指南独立判断。开发者不对依据本软件内容所作决策导致的任何后果负责。',
        '药敏折点依据 CLSI（M100 / M45 / M60 等）整理，可能随版本更新而变化；请以最新官方标准为准。'
      ]),
      card('隐私政策', [
        '本软件为纯本地/离线应用，所有数据内置于程序中。',
        '本软件不收集、不上传、不存储任何个人信息或使用数据，无账号体系，无第三方统计或广告 SDK。',
        '「综述/参考」中的外部链接（PubMed、NCBI、LPSN、CDC、默沙东诊疗手册等）由用户主动点击后在浏览器打开，跳转后的网站隐私政策由对应站点负责。'
      ]),
      card('内容来源', [
        '微生物学与临床内容综合整理自公认权威来源：CLSI 药敏标准、IDSA / CDC 指南、Sanford 抗微生物治疗指南、StatPearls、默沙东诊疗手册、LPSN / NCBI 分类等。',
        '各条目底部「综述/参考」提供对应权威来源的检索入口，便于核对与延伸阅读。'
      ]),
      card('版本与版权', [
        '名称：临床微生物学习与速查系统',
        '版本：V1.0',
        '© 2026 著作权所有。免费供个人学习与教学公益使用；未经许可不得用于商业用途或二次分发。'
      ])
    ];
    fill(document.getElementById('main'), nodes);
  }

  function renderRoute() {
    if (isAboutRoute()) { renderAbout(); return; }
    if (isCompareRoute()) { renderCompare(); return; }
    if (isCardCompareRoute()) { renderCardCompare(); return; }
    if (isIntrinsicRoute()) { renderIntrinsic(); return; }
    if (isGraphRoute()) { renderGraph(); return; }
    if (isBreakpointsRoute()) { renderBreakpoints(); return; }
    if (isAstAlertsRoute()) { renderAstAlerts(); return; }
    var route = parseHash();
    var data = db();
    setActiveTab(route.module);
    renderSidebar();

    var entry = null, rels = [], mechImg = null;
    if (route.id) {
      var hit = Core.buildIndex(data)[route.id];
      entry = hit ? hit.entry : null;
      rels = entry ? Core.getRelations(route.id, data) : [];
      mechImg = View.mechanismImageFor(route.module, entry, categories());
    }
    var extras = {
      mechanismImage: mechImg,
      mechCaption: route.module === 'tests' ? '试验示意图' : (route.module === 'staining' ? '染色示意图' : (route.module === 'biochem-tests' ? '生化反应示意图' : '作用机制示意图')),
      structImage: (route.module === 'antibiotics' && entry && window.DB.structures && window.DB.structures[entry.id]) ? ('img/struct-' + entry.id + '.svg') : null,
      morphology: (entry && window.DB.morphology) ? window.DB.morphology[entry.id] : null,
      treatment: (entry && window.DB.treatment) ? window.DB.treatment[entry.id] : null,
      biochem: (entry && window.DB.biochem) ? window.DB.biochem[entry.id] : null,
      differential: (entry && window.DB.differential) ? window.DB.differential[entry.id] : null,
      links: View.referenceLinks(route.module, entry),
      breakpoints: (route.module === 'microbes' && route.id) ? View.breakpointVM(route.id, window.DB.breakpoints) : null
    };
    var vm = View.detailVM(entry, rels, extras);
    fill(document.getElementById('main'), vm ? buildDetail(vm) : buildLanding(route.module));
  }

  // 未选条目时的着陆页：微生物模块展示「细菌形态总览」图，其余模块仅提示
  // 各模块主界面（未选条目）的总览图
  var LANDING = {
    microbes: [
      { src: 'img/morphology-overview.svg', cap: '细菌形态总览（按形态与排列）' },
      { src: 'img/morphology-fungi.svg', cap: '真菌形态总览（酵母相 / 菌丝相 / 产孢结构）' },
      { src: 'img/morphology-virus.svg', cap: '病毒结构总览（基本结构 / 衣壳对称 / 包膜外形）' }
    ],
    antibiotics: [{ src: 'img/landing-antibiotics.svg', cap: '抗微生物药作用机制总览' }],
    resistance: [{ src: 'img/landing-resistance.svg', cap: '细菌耐药机制总览' }],
    idcards: [{ src: 'img/landing-idcards.svg', cap: 'VITEK 2 鉴定卡原理与选卡总览' }],
    cards: [{ src: 'img/landing-cards.svg', cap: '药敏卡与判读总览' }],
    tests: [{ src: 'img/landing-tests.svg', cap: '实验室试验总览' }],
    staining: [{ src: 'img/landing-staining.svg', cap: '染色方法总览' }],
    media: [{ src: 'img/landing-media.svg', cap: '培养基总览' }],
    'biochem-tests': [{ src: 'img/landing-biochem.svg', cap: '生化反应总览（按类别 · 颜色示阳性结果）' }]
  };

  function buildLanding(moduleKey) {
    var nodes = [];
    (LANDING[moduleKey] || []).forEach(function (g) {
      nodes.push(el('figure', { cls: 'mechanism-fig' }, [
        el('img', { cls: 'mechanism-img', src: g.src, alt: g.cap }),
        el('figcaption', { cls: 'mechanism-cap', text: g.cap })
      ]));
    });
    nodes.push(el('div', { cls: 'empty', text: '请选择左侧的一个条目查看详情。' }));
    return nodes;
  }

  function runSearch(query) {
    fill(document.getElementById('main'), buildSearch(View.searchVM(Core.searchEntries(db(), query), query)));
  }

  function init() {
    var isMobile = function () { return window.matchMedia('(max-width: 760px)').matches; };
    var openNav = function () { document.body.classList.add('nav-open'); };
    var closeNav = function () { document.body.classList.remove('nav-open'); };

    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) {
      t.addEventListener('click', function () {
        document.getElementById('search-input').value = '';
        location.hash = '#/' + t.getAttribute('data-module');
        if (isMobile()) { closeNav(); }   // 切换模块时收起抽屉，露出该模块总览图；点 ☰ 再手动展开分类
      });
    });

    // 移动端抽屉：汉堡开合、点遮罩/选中条目后关闭
    var menuBtn = document.getElementById('menu-btn');
    if (menuBtn) { menuBtn.addEventListener('click', function () { document.body.classList.toggle('nav-open'); }); }
    var backdrop = document.getElementById('nav-backdrop');
    if (backdrop) { backdrop.addEventListener('click', closeNav); }
    var sb = document.getElementById('sidebar');
    if (sb) { sb.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a')) { closeNav(); } }); }
    var cmpBtn = document.querySelector('.compare-btn');
    if (cmpBtn) { cmpBtn.addEventListener('click', function () { if (isMobile()) { openNav(); } }); }

    var box = document.getElementById('search-input');
    box.addEventListener('input', function () {
      var q = box.value.trim();
      if (q) { runSearch(q); } else { renderRoute(); }
    });

    window.addEventListener('hashchange', function () {
      var s = document.getElementById('search-input');
      if (s.value.trim()) { s.value = ''; }
      renderRoute();
    });

    renderRoute();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
