(function () {
  'use strict';
  var Core = window.Core, View = window.View;
  var MODULES = Core.MODULE_KEYS;
  // 正常由 index.html 内联脚本注入；此兜底值随发布一起更新（见发布清单）
  var APP_VERSION = window.APP_VERSION || '20260702-43';
  // 给图片 URL 追加版本号，保证内容更新后手机端不会命中旧缓存（图片本身无 ?v= 时浏览器/SW 会一直返回旧图）
  function imgV(p) { return p ? (p + (p.indexOf('?') < 0 ? '?v=' : '&v=') + APP_VERSION) : p; }

  // CLSI M100 Ed36 报告分层（Table 1A–1J：Tier 1–4 + 仅尿路）
  var BP_TIER_LABELS = {
    '1': 'Tier 1 · 常规首选检测并报告',
    '2': 'Tier 2 · 常规检测，按本机构级联规则报告',
    '3': 'Tier 3 · 高 MDRO 风险机构常规/按需检测，按级联规则报告',
    '4': 'Tier 4 · 临床申请或其他层不适用时检测报告'
  };
  var BP_TIER_ORDER = ['1', '2', '3', '4'];
  function bpTierBadge(tier) {
    if (!tier || !BP_TIER_LABELS[tier]) { return null; }
    return el('span', { cls: 'bp-tier bp-tier-' + tier, title: 'CLSI M100 Ed36 报告分层 ' + BP_TIER_LABELS[tier], text: tier });
  }
  function bpUrineChip(d) {
    if (!d || !d.仅尿路) { return null; }
    return el('span', { cls: 'bp-urine', title: '仅适用于尿路分离株的报告限制', text: '尿' });
  }
  // 图例：仅列出该菌组中实际出现的分层
  function bpTierLegend(drugs) {
    var present = {}, hasUrine = false;
    (drugs || []).forEach(function (d) { if (d.组别 && BP_TIER_LABELS[d.组别]) { present[d.组别] = 1; } if (d.仅尿路) { hasUrine = true; } });
    var tiers = BP_TIER_ORDER.filter(function (t) { return present[t]; });
    if (!tiers.length && !hasUrine) { return null; }
    var kids = [ el('span', { cls: 'bp-legend-lead', text: '报告分层（CLSI M100 Ed36）：' }) ];
    tiers.forEach(function (t) {
      kids.push(el('span', { cls: 'bp-legend-item' }, [
        el('span', { cls: 'bp-tier bp-tier-' + t, text: t }),
        el('span', { cls: 'bp-legend-txt', text: BP_TIER_LABELS[t] })
      ]));
    });
    if (hasUrine) {
      kids.push(el('span', { cls: 'bp-legend-item' }, [ el('span', { cls: 'bp-urine', text: '尿' }), el('span', { cls: 'bp-legend-txt', text: '仅尿路分离株报告' }) ]));
    }
    return el('div', {}, [
      el('div', { cls: 'bp-legend' }, kids),
      el('div', { cls: 'bp-legend-note', text: '分层为选择性报告参考：Tier 1 应常规报告，Tier 2–4 通常在上层耐药、深部/重症感染或临床需要时按机构级联规则报告。本地实验室应结合本机构药物目录与级联报告规则，并以现行版 CLSI 原表为准。' })
    ]);
  }

  // 折点表药物名与抗菌药条目名的别名（模块级常量，避免每次调用重建）：
  // 折点表写「青霉素 (Penicillin)」、抗菌药条目写「青霉素G」——两条别名覆盖从折点表回查与直接按条目名查两种路径。
  var ABX_ALIAS = { '青霉素': 'penicillin-g', '青霉素G': 'penicillin-g', '氨苄西林/阿莫西林': 'ampicillin', '复方磺胺甲噁唑': 'cotrimoxazole', '复方新诺明': 'cotrimoxazole' };

  function db() {
    var DB = window.DB || {};
    return { microbes: DB.microbes || [], antibiotics: DB.antibiotics || [], resistance: DB.resistance || [], idcards: DB.idcards || [], cards: DB.cards || [], tests: DB.tests || [], media: DB.media || [], staining: DB.staining || [], 'biochem-tests': DB.biochemTests || [], 'qc-strains': DB['qc-strains'] || [] };
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
    '庆大霉素高水平': 'hlar',
    '链霉素高水平': 'hlar',
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
    if (opts.name != null) { node.setAttribute('name', opts.name); }
    if (opts.min != null) { node.setAttribute('min', opts.min); }
    if (opts.max != null) { node.setAttribute('max', opts.max); }
    if (opts.step != null) { node.setAttribute('step', opts.step); }
    if (opts.colspan != null) { node.setAttribute('colspan', opts.colspan); }
    if (opts.role != null) { node.setAttribute('role', opts.role); }
    if (opts.tabindex != null) { node.setAttribute('tabindex', opts.tabindex); }
    if (opts['for'] != null) { node.setAttribute('for', opts['for']); }
    if (opts.selected) { node.selected = true; }
    if (opts.disabled) { node.disabled = true; }
    if (opts.checked) { node.checked = true; }
    if (opts.placeholder != null) { node.setAttribute('placeholder', opts.placeholder); }
    if (opts.value != null) { node.value = opts.value; }
    Object.keys(opts).forEach(function (key) {
      if ((key.indexOf('aria-') === 0 || key.indexOf('data-') === 0) && opts[key] != null) { node.setAttribute(key, opts[key]); }
    });
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
    var out = [ el(collapsible ? 'button' : 'div', {
      cls: labelCls + (collapsible ? ' cat-toggle' : ''),
      text: marker + node.名称,
      type: collapsible ? 'button' : null,
      style: 'padding-left:' + (8 + depth * 14) + 'px',
      'aria-expanded': collapsible ? String(!isCollapsed) : null,
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
    if (vm.生物安全) {
      var bio = vm.生物安全;
      nodes.push(el('div', { cls: 'biosafety-alert', role: 'alert' }, [
        el('div', { cls: 'biosafety-head' }, [
          el('span', { cls: 'biosafety-icon', text: '⚠' }),
          el('span', { cls: 'biosafety-title', text: '生物安全警示' }),
          bio.级别 ? el('span', { cls: 'biosafety-level', text: bio.级别 }) : null
        ]),
        el('div', { cls: 'biosafety-body', text: bio.提示 || '' })
      ]));
    }
    if (vm.机制图) {
      nodes.push(el('figure', { cls: 'mechanism-fig' }, [
        el('img', { cls: 'mechanism-img', src: imgV(vm.机制图), alt: vm.机制图说明 }),
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

    // CLSI 质控/参考范围（质控菌株）——逐格转录自 CLSI M100/M45/M27M44S/M38M51S，双人独立转录并比对
    if (vm.质控范围 && vm.质控范围.length) {
      var isReference = /reference|参考/i.test(vm.质控用途 || 'QC');
      var hasMic = vm.质控范围.some(function (r) { return r.MIC; });
      var hasDisk = vm.质控范围.some(function (r) { return r.抑菌圈; });
      var hasNote = vm.质控范围.some(function (r) { return r.备注; });
      var hasMec = vm.质控范围.some(function (r) { return /MEC/i.test(r.终点 || ''); });
      var qcHead = [ el('th', { text: '抗菌药物' }) ];
      if (hasMic) { qcHead.push(el('th', { text: hasMec ? 'MIC / MEC (μg/mL)' : 'MIC (μg/mL)' })); }
      if (hasDisk) { qcHead.push(el('th', { text: '抑菌圈 (mm)' })); }
      if (hasNote) { qcHead.push(el('th', { text: '备注' })); }
      var drugCN = (window.DB && window.DB.drugCN) || {};
      var qcRows = vm.质控范围.map(function (r) {
        var cn = drugCN[r.药物] || '';
        var drugCell = cn
          ? el('td', { cls: 'bp-drug' }, [ el('span', { cls: 'qc-drug-cn', text: cn }), el('span', { cls: 'qc-drug-en', text: r.药物 }) ])
          : el('td', { cls: 'bp-drug', text: r.药物 });
        var cells = [ drugCell ];
        if (hasMic) {
          var micCell = el('td', { cls: 'bp-mic' });
          micCell.appendChild(document.createTextNode(r.MIC || '—'));
          if (/MEC/i.test(r.终点 || '')) { micCell.appendChild(el('span', { cls: 'qc-endpoint', title: '最低有效浓度（棘白菌素对霉菌的判读终点）', text: 'MEC' })); }
          cells.push(micCell);
        }
        if (hasDisk) { cells.push(el('td', { cls: 'bp-disk', text: r.抑菌圈 || '—' })); }
        if (hasNote) { cells.push(el('td', { cls: 'bp-comment', text: r.备注 || '' })); }
        return el('tr', {}, cells);
      });
      var qcHeadNodes = [
        el('span', { cls: 'bp-title', text: isReference ? 'CLSI 参考范围' : 'CLSI 可接受质控范围' }),
        el('span', { cls: 'qc-purpose ' + (isReference ? 'qc-ref' : 'qc-qc'), title: isReference ? '参考范围（Reference）' : '日常质控（QC）', text: isReference ? '参考 Reference' : '质控 QC' }),
        el('span', { cls: 'bp-source', text: vm.质控来源 || 'CLSI' })
      ];
      var methodBits = [];
      if (vm.质控方法) { methodBits.push('方法：' + vm.质控方法); }
      if (vm.质控培养基) { methodBits.push('培养基：' + vm.质控培养基); }
      if (vm.质控孵育) { methodBits.push('孵育：' + vm.质控孵育); }
      var qcChildren = [ el('div', { cls: 'bp-head' }, qcHeadNodes) ];
      if (methodBits.length) { qcChildren.push(el('div', { cls: 'qc-method', text: methodBits.join('　·　') })); }
      qcChildren.push(el('div', { cls: 'table-scroll' }, [
        el('table', { cls: 'bp-table' }, [ el('thead', {}, [ el('tr', {}, qcHead) ]), el('tbody', {}, qcRows) ])
      ]));
      qcChildren.push(el('div', { cls: 'bp-legend-note', text: isReference
        ? '参考范围用于评估试验体系与方法学，不等同于每批质控的在控/失控判定；结果超出时应结合试验目的、方法与文件说明分析。须以现行版 CLSI 原表为准。'
        : '质控范围为该标准株在规定方法下每次药敏跑批应落入的可接受区间（超出即失控）；须以现行版 CLSI 原表为准，并按你实验室采用的方法/培养基执行。' }));
      if (hasMec) { qcChildren.push(el('div', { cls: 'bp-legend-note', text: 'MEC = 最低有效浓度：棘白菌素类对霉菌以 MEC（而非 MIC）为判读终点。' })); }
      nodes.push(el('div', { cls: 'breakpoints qc-ranges' }, qcChildren));
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
          ? el('td', { cls: 'bp-drug' }, [ bpTierBadge(d.组别), bpUrineChip(d), el('strong', { text: d.简写 }), document.createTextNode(' '), el('a', { cls: 'bp-drug-link', text: d.药物, href: '#/antibiotics/' + aid }) ])
          : el('td', { cls: 'bp-drug' }, [ bpTierBadge(d.组别), bpUrineChip(d), el('strong', { text: d.简写 }), document.createTextNode(' ' + d.药物) ]);
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
        bpTierLegend(bp.药物),
        el('div', { cls: 'bp-foot', text: bp.菌组名 + '  ·  MIC 折点：S≤(敏感) / I(中介/SDD) / R≥(耐药)；抑菌圈：S≥ / I / R≤  (mm)' + (bpHasCombo(bp.药物) ? '　·　' + COMBO_BP_NOTE : '') }),
        el('div', { cls: 'bp-curated', text: CURATED_BP_NOTE })
      ]));
    }

    // ②b 流行病学界值（ECV / ECOFF）—— 区分野生型(WT)/非野生型(NWT)，非临床折点
    if (vm.ECV && vm.ECV.药物 && vm.ECV.药物.length) {
      var ecv = vm.ECV;
      var ecvHasNote = ecv.药物.some(function (d) { return d.备注; });
      var ecvHead = [ el('th', { text: '抗菌药物' }), el('th', { text: 'ECV (μg/mL)' }), el('th', { text: '野生型 WT' }), el('th', { text: '非野生型 NWT' }) ];
      if (ecvHasNote) { ecvHead.push(el('th', { text: '备注' })); }
      var ecvRows = ecv.药物.map(function (d) {
        var aid = abxIdByDrugText(d.药物);
        var drugCell = aid
          ? el('td', { cls: 'bp-drug' }, [ el('strong', { text: d.简写 }), document.createTextNode(' '), el('a', { cls: 'bp-drug-link', text: d.药物, href: '#/antibiotics/' + aid }) ])
          : el('td', { cls: 'bp-drug' }, [ el('strong', { text: d.简写 }), document.createTextNode(' ' + d.药物) ]);
        var cells = [ drugCell, el('td', { cls: 'bp-mic', text: d.ECV }), el('td', { cls: 'bp-disk', text: d.WT }), el('td', { cls: 'bp-disk', text: d.NWT }) ];
        if (ecvHasNote) { cells.push(el('td', { cls: 'bp-comment', text: d.备注 || '' })); }
        return el('tr', {}, cells);
      });
      nodes.push(el('div', { cls: 'breakpoints' }, [
        el('div', { cls: 'bp-head' }, [
          el('span', { cls: 'bp-title', text: '流行病学界值 (ECV)' }),
          el('span', { cls: 'bp-source', text: ecv.来源 })
        ]),
        el('div', { cls: 'table-scroll' }, [
          el('table', { cls: 'bp-table' }, [
            el('thead', {}, [ el('tr', {}, ecvHead) ]),
            el('tbody', {}, ecvRows)
          ])
        ]),
        el('div', { cls: 'bp-legend-note', text: '⚠️ ECV 只区分野生型(WT，≤ECV)与非野生型(NWT，>ECV，提示获得性耐药机制)，' + (ecv.注 || '不是临床折点，不得按 S/I/R 报告。') })
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
        el('img', { cls: 'mechanism-img', src: imgV(vm.结构图), alt: '分子结构' }),
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
    // 常见菌排前（按 GRAPH_COMMON 顺序），其余保持原数据顺序
    ids.sort(function (a, b) {
      var ia = GRAPH_COMMON.indexOf(a); if (ia === -1) { ia = 1e6; }
      var ib = GRAPH_COMMON.indexOf(b); if (ib === -1) { ib = 1e6; }
      return ia - ib;
    });
    return ids.map(function (id) {
      return { id: id, 名称: names[id] || id, selected: !!compareSet[id], onToggle: function () { toggleCompare(id); } };
    });
  }
  function renderComparePickerList() { renderPickerList('cmp-pick-list', compareItemDescriptors(), '无匹配的细菌'); }
  function buildComparePicker() {
    return buildTogglePicker('勾选细菌（可多选）', 'cmp-pick-list', compareFilter, function (v) { compareFilter = v; renderComparePickerList(); });
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
  function cardIds() { return ((window.DB && window.DB.cards) || []).map(function (c) { return c.id; }); }
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
  function intrinsicResistanceCard(r) {
    var nameEl = r.id
      ? el('a', { cls: 'intrinsic-link', text: r.名称, href: '#/microbes/' + r.id })
      : el('strong', { text: r.名称 });
    var children = [el('div', { cls: 'ir-card-head' }, [nameEl, el('span', { cls: 'latin', text: r.拉丁 })])];
    if ((r.耐药 || []).length) {
      children.push(el('div', { cls: 'ir-card-drugs' }, r.耐药.map(function (d) {
        return el('span', { cls: 'ir-drug-chip', text: d });
      })));
      if (r.备注) { children.push(el('div', { cls: 'ir-card-note', text: r.备注 })); }
    } else {
      children.push(el('div', { cls: 'ir-card-none', text: r.备注 || '对所列药物无固有耐药' }));
    }
    return el('article', { cls: 'ir-card' }, children);
  }
  function intrinsicMatrixNodes(filter) {
    var data = (window.DB && window.DB.intrinsicResistance) || null;
    if (!data) { return []; }
    var q = (filter || '').trim().toLowerCase();
    var out = [];
    (data.分组 || []).forEach(function (grp) {
      var rows = (grp.行 || []).filter(function (r) {
        if (!q) { return true; }
        var hay = [r.名称, r.拉丁, r.备注].concat(r.耐药 || []).join(' ').toLowerCase();
        return hay.indexOf(q) !== -1;
      });
      if (rows.length === 0) { return; }
      // 桌面：药名×菌种矩阵；手机：按菌列出「只显示其耐药药物」的卡片（见 CSS 断点切换）
      var head = el('tr', {}, [el('th', { text: '菌种' })]
        .concat((grp.药物列 || []).map(function (d) { return el('th', { cls: 'ir-drug-col', text: d }); }))
        .concat([el('th', { text: '备注' })]));
      var body = rows.map(function (r) {
        var nameCell = r.id
          ? el('td', {}, [el('a', { cls: 'intrinsic-link', text: r.名称, href: '#/microbes/' + r.id }), el('span', { cls: 'latin', text: r.拉丁 })])
          : el('td', {}, [el('strong', { text: r.名称 }), el('span', { cls: 'latin', text: r.拉丁 })]);
        var cells = [nameCell].concat((grp.药物列 || []).map(function (d) {
          var isR = (r.耐药 || []).indexOf(d) !== -1;
          return el('td', { cls: 'ir-cell' }, [isR ? el('span', { cls: 'ir-chip', title: '固有耐药', text: '耐' }) : el('span', { cls: 'ir-dash', text: '—' })]);
        }));
        cells.push(el('td', { cls: 'ir-note', text: r.备注 || '' }));
        return el('tr', {}, cells);
      });
      var block = [el('div', { cls: 'ir-block-title', text: grp.界 })];
      if (grp.备注) { block.push(el('div', { cls: 'ir-block-note', text: grp.备注 })); }
      block.push(el('div', { cls: 'ir-matrix-view' }, [
        el('div', { cls: 'ir-table-wrap' }, [el('table', { cls: 'ir-table' }, [el('thead', {}, [head]), el('tbody', {}, body)])])
      ]));
      block.push(el('div', { cls: 'ir-card-view' }, rows.map(intrinsicResistanceCard)));
      out.push(el('div', { cls: 'ir-block' }, block));
    });
    if (out.length === 0) { return []; }
    return [el('div', { cls: 'ir-section' }, [
      el('div', { cls: 'ir-section-head' }, [
        el('span', { cls: 'ir-section-title', text: '固有耐药速查（CLSI 结构化 · 细菌 + 真菌）' }),
        el('span', { cls: 'ir-section-src', text: data.来源 })
      ]),
      el('div', { cls: 'ir-legend', text: data.说明 })
    ].concat(out))];
  }

  function renderIntrinsicMain() {
    var vm = View.intrinsicVM(db(), intrinsicFilter);
    var nodes = [ el('h2', { cls: 'detail-title', text: '天然耐药速查' }) ];
    nodes = nodes.concat(intrinsicMatrixNodes(intrinsicFilter));
    nodes.push(el('div', { cls: 'cmp-hint', text: '按菌属列出的文字条目：共 ' + vm.count + ' 条' + (intrinsicFilter ? '（已筛选）' : '') }));
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
  // 关系图选图心：常见菌提前（越靠前越常见），其余微生物按数据顺序，非微生物条目排最后
  var GRAPH_COMMON = [
    'staph-aureus', 'e-coli', 'klebsiella-pneumoniae', 'pseudomonas-aeruginosa',
    'strep-pneumoniae', 'strep-pyogenes', 'enterococcus-faecalis', 'enterococcus-faecium',
    'acinetobacter-baumannii', 'mycobacterium-tuberculosis', 'haemophilus-influenzae',
    'neisseria-meningitidis', 'neisseria-gonorrhoeae', 'candida-albicans', 'clostridioides-difficile',
    'staph-epidermidis', 'strep-agalactiae', 'enterobacter-cloacae', 'proteus-mirabilis',
    'helicobacter-pylori', 'moraxella-catarrhalis', 'listeria-monocytogenes',
    'stenotrophomonas-maltophilia', 'salmonella-typhi'
  ];
  function graphPickPriority(it) {
    if (it.module === 'microbes') {
      var i = GRAPH_COMMON.indexOf(it.id);
      return i >= 0 ? i : 500;
    }
    return 1000;
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
    items.forEach(function (it, i) { it._o = i; });
    items.sort(function (a, b) { return graphPickPriority(a) - graphPickPriority(b) || a._o - b._o; });
    return items.slice(0, 200);
  }
  function renderGraphPicker() {
    var search = el('input', { cls: 'cmp-search', type: 'search', placeholder: '搜索条目作为图心…', value: graphFilter });
    search.addEventListener('input', function () { graphFilter = search.value; renderGraphPickerList(); });
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
  var bpJudgeMethod = 'mic'; // 'mic' | 'zone'
  // 某折点药物是否有可判读的纸片抑菌圈折点
  function drugHasZone(d) { return !!(d && (View.parseBP(d.抑菌圈_S) || View.parseBP(d.抑菌圈_R))); }
  function isBreakpointsRoute() { return routeKey() === 'breakpoints'; }
  function bpGroups() { return (window.DB && window.DB.breakpoints) || []; }
  function judgeableBpGroups() { return View.judgeableBreakpointGroups(bpGroups()); }
  function bpGroupByName(name) {
    return bpGroups().filter(function (g) { return g.菌组名 === name; })[0] || null;
  }
  function judgeableBpGroupByName(name) {
    return judgeableBpGroups().filter(function (g) { return g.菌组名 === name; })[0] || null;
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
      var groupItems = judgeableBpGroups().map(function (g) {
        return el('button', {
          cls: 'cmp-pick' + (bpJudgeGroup === g.菌组名 ? ' sel' : ''),
          type: 'button',
          text: g.菌组名,
          'aria-pressed': String(bpJudgeGroup === g.菌组名),
          onClick: function () {
            bpJudgeGroup = g.菌组名;
            bpJudgeDrug = (g.药物 && g.药物[0]) ? g.药物[0].药物 : '';
            bpJudgeMIC = '';
            renderBreakpoints();
          }
        });
      });
      sbNodes.push(el('div', { cls: 'cat-group' }, [
        el('div', { cls: 'cat-group-name', text: '可判读菌组 (' + judgeableBpGroups().length + ')' }),
        el('div', { cls: 'cmp-hint', text: '已撤销或仅作历史参考的折点不进入 MIC 自动判读。' }),
        el('div', { cls: 'bp-group-list' }, groupItems)
      ]));
    } else {
      sbNodes.push(el('div', { cls: 'cmp-hint', text: '在右侧按菌组名 / 药物名筛选，查看 CLSI 折点表。切到「MIC 判读」可输入数值自动判读 S/I/R。' }));
    }
    fill(document.getElementById('sidebar'), sbNodes);
    renderBreakpointsMain();
  }
  // 念珠菌标本部位报告限制（M27M44S App A）——仅当查询结果含抗真菌(念珠菌)组时展示
  function bpSiteReportingNodes(shownGroups) {
    var data = (window.DB && window.DB.siteReporting) || null;
    if (!data) { return []; }
    var hasAntifungal = (shownGroups || []).some(function (g) {
      return /M27M44S/.test(g.来源 || '') || /M27M44S/.test(g.CLSI表 || '') || /念珠菌|隐球菌/.test(g.菌组名 || '');
    });
    if (!hasAntifungal) { return []; }
    var blocks = (data.分组 || []).map(function (grp) {
      var rows = (grp.规则 || []).map(function (r) {
        return el('tr', {}, [
          el('td', { cls: 'sr-site', text: r.部位 }),
          el('td', { cls: 'sr-report', text: r.报告 }),
          el('td', { cls: 'sr-note', text: r.说明 || '' })
        ]);
      });
      return el('div', { cls: 'sr-block' }, [
        el('div', { cls: 'sr-block-title', text: grp.药类 }),
        el('div', { cls: 'sr-table-wrap' }, [el('table', { cls: 'sr-table' }, [
          el('thead', {}, [el('tr', {}, [el('th', { text: '标本部位' }), el('th', { text: '报告规则' }), el('th', { text: '说明' })])]),
          el('tbody', {}, rows)
        ])])
      ]);
    });
    return [el('div', { cls: 'sr-section' }, [
      el('div', { cls: 'sr-section-head' }, [
        el('span', { cls: 'sr-section-title', text: '念珠菌标本部位报告限制' }),
        el('span', { cls: 'sr-section-src', text: data.来源 })
      ]),
      el('div', { cls: 'sr-legend', text: data.说明 })
    ].concat(blocks))];
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
      nodes.push(el('div', { cls: 'bp-curated bp-curated-tool', text: CURATED_BP_NOTE }));
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
        bpSiteReportingNodes(groups).forEach(function (n) { nodes.push(n); });
      }
    } else {
      // MIC 判读表单
      var judgeGroups = judgeableBpGroups();
      var group = bpJudgeGroup ? judgeableBpGroupByName(bpJudgeGroup) : null;
      if (bpJudgeGroup && !group) {
        bpJudgeGroup = '';
        bpJudgeDrug = '';
        group = null;
      }
      var groupSelect = el('select', { cls: 'bp-select' });
      groupSelect.id = 'bp-judge-group';
      groupSelect.appendChild(el('option', { value: '', text: '— 选择菌组 —' }));
      judgeGroups.forEach(function (g) {
        var opt = el('option', { value: g.菌组名, text: g.菌组名 });
        if (g.菌组名 === bpJudgeGroup) { opt.selected = true; }
        groupSelect.appendChild(opt);
      });
      groupSelect.addEventListener('change', function () {
        bpJudgeGroup = groupSelect.value;
        var gg = bpJudgeGroup ? judgeableBpGroupByName(bpJudgeGroup) : null;
        bpJudgeDrug = (gg && gg.药物 && gg.药物[0]) ? gg.药物[0].药物 : '';
        bpJudgeMIC = '';
        renderBreakpointsMain();
      });

      var drugSelect = el('select', { cls: 'bp-select' });
      drugSelect.id = 'bp-judge-drug';
      drugSelect.appendChild(el('option', { value: '', text: '— 选择药物 —' }));
      if (group) {
        group.药物.forEach(function (d) {
          var opt = el('option', { value: d.药物, text: d.药物 + ' (' + d.简写 + ')' });
          if (d.药物 === bpJudgeDrug) { opt.selected = true; }
          drugSelect.appendChild(opt);
        });
      }
      drugSelect.addEventListener('change', function () { bpJudgeDrug = drugSelect.value; bpJudgeMIC = ''; bpJudgeMethod = 'mic'; renderBreakpointsMain(); });

      // 当前所选药物是否支持纸片抑菌圈判读
      var curDrug = (group && group.药物 || []).filter(function (d) { return d.药物 === bpJudgeDrug; })[0];
      var zoneAvail = drugHasZone(curDrug);
      if (bpJudgeMethod === 'zone' && !zoneAvail) { bpJudgeMethod = 'mic'; }
      var isZone = bpJudgeMethod === 'zone';

      // 方法切换：MIC / 抑菌圈（仅当该药有纸片折点时可选）
      var methodBtns = el('div', { cls: 'bp-method-toggle' }, [
        el('button', { cls: 'cmp-add' + (!isZone ? ' sel' : ''), text: 'MIC (μg/mL)', onClick: function () { bpJudgeMethod = 'mic'; bpJudgeMIC = ''; renderBreakpointsMain(); } }),
        el('button', {
          cls: 'cmp-add' + (isZone ? ' sel' : '') + (zoneAvail ? '' : ' disabled'),
          title: zoneAvail ? '按纸片扩散法抑菌圈判读' : '该药物无纸片抑菌圈折点',
          text: '抑菌圈 (mm)',
          onClick: function () { if (zoneAvail) { bpJudgeMethod = 'zone'; bpJudgeMIC = ''; renderBreakpointsMain(); } }
        })
      ]);

      var valInput = el('input', {
        cls: 'cmp-search', type: 'number', value: bpJudgeMIC, min: '0', style: 'width:200px;',
        placeholder: isZone ? '输入抑菌圈直径 (mm)' : '输入 MIC 值 (μg/mL)',
        step: isZone ? '1' : '0.01'
      });
      valInput.id = 'bp-judge-mic';
      valInput.addEventListener('input', function () { bpJudgeMIC = valInput.value; renderJudgeResult(); });

      nodes.push(el('div', { cls: 'bp-judge-form' }, [
        el('div', { cls: 'bp-judge-row' }, [ el('label', { text: '菌组', 'for': 'bp-judge-group' }), groupSelect ]),
        el('div', { cls: 'bp-judge-row' }, [ el('label', { text: '药物', 'for': 'bp-judge-drug' }), drugSelect ]),
        el('div', { cls: 'bp-judge-row' }, [ el('label', { text: '方法' }), methodBtns ]),
        el('div', { cls: 'bp-judge-row' }, [ el('label', { text: isZone ? '抑菌圈' : 'MIC', 'for': 'bp-judge-mic' }), valInput ])
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
  // 复方制剂（β-内酰胺/酶抑制剂等）是单一药物、单一折点：CLSI 记法「活性成分/固定抑制剂浓度」中，
  // 斜线后的数字是固定不变的抑制剂浓度，并非第二个折点。判读只看活性成分（斜线前）的值。
  var COMBO_BP_NOTE = '复方制剂为单一药物、按单一折点判读：斜线后的数字是固定配比的另一成分浓度（如酶抑制剂或第二组分），并非第二个折点。';
  // 本模块采用「精选常用折点」范围（方案 B）：并非完整复制 CLSI 原表，仅收录教学与临床常用药物。
  var CURATED_BP_NOTE = '本模块为教学与临床常用的「精选常用折点」，并非 CLSI 原表的完整复制；未列出某药物不代表 CLSI 未建立折点，完整数据请查阅对应版本原表（M100 / M45 / M27M44S / M38M51S）。';
  // 仅"数字/数字"才算复方记法；详情页折点经 breakpointVM 合并为 "≤8/4 / 16/8 / ≥32/16"，
  // 用 \d/\d 可避开 " / " 分隔符的误判，同时兼容原始 MIC_S/I/R 字段。
  function bpHasCombo(drugs) {
    return (drugs || []).some(function (d) {
      var s = String(d.MIC_S || '') + ' ' + String(d.MIC_I || '') + ' ' + String(d.MIC_R || '') + ' ' + String(d.MIC || '');
      return /\d\/\d/.test(s); // 复方记法"数字/数字"无空格；VM 合并串的 " / " 分隔有空格，故不会误判
    });
  }
  function buildBpTable(drugs) {
    var headRow = [ el('th', { text: '抗菌药物' }), el('th', { text: 'MIC (μg/mL)' }), el('th', { text: '抑菌圈 (mm)' }), el('th', { text: '备注' }) ];
    var bodyRows = drugs.map(function (d) {
      var aid = abxIdByDrugText(d.药物);
      var drugCell = aid
        ? el('td', { cls: 'bp-drug' }, [ bpTierBadge(d.组别), bpUrineChip(d), el('strong', { text: d.简写 }), document.createTextNode(' '), el('a', { cls: 'bp-drug-link', text: d.药物, href: '#/antibiotics/' + aid }) ])
        : el('td', { cls: 'bp-drug' }, [ bpTierBadge(d.组别), bpUrineChip(d), el('strong', { text: d.简写 }), document.createTextNode(' ' + d.药物) ]);
      return el('tr', {}, [
        drugCell,
        el('td', { cls: 'bp-mic', text: [d.MIC_S, d.MIC_I, d.MIC_R].filter(Boolean).join(' / ') }),
        el('td', { cls: 'bp-disk', text: [d.抑菌圈_S, d.抑菌圈_I, d.抑菌圈_R].filter(Boolean).join(' / ') }),
        el('td', { cls: 'bp-comment', text: d.备注 || '' })
      ]);
    });
    var tableWrap = el('div', { cls: 'table-scroll' }, [
      el('table', { cls: 'bp-table' }, [
        el('thead', {}, [ el('tr', {}, headRow) ]),
        el('tbody', {}, bodyRows)
      ])
    ]);
    var legend = bpTierLegend(drugs);
    if (!legend && !bpHasCombo(drugs)) { return tableWrap; }
    return el('div', {}, [ tableWrap, legend, bpHasCombo(drugs) ? el('div', { cls: 'bp-foot', text: COMBO_BP_NOTE }) : null ]);
  }
  function renderJudgeResult() {
    var box = document.getElementById('bp-judge-result');
    if (!box) { return; }
    var isZone = bpJudgeMethod === 'zone';
    if (!bpJudgeGroup || !bpJudgeDrug) {
      box.replaceChildren(el('div', { cls: 'empty-sm', text: '请选择菌组与药物，并输入' + (isZone ? '抑菌圈直径' : ' MIC 值') + '。' }));
      return;
    }
    var group = judgeableBpGroupByName(bpJudgeGroup);
    var drug = (group && group.药物 || []).filter(function (d) { return d.药物 === bpJudgeDrug; })[0];
    if (!drug) {
      box.replaceChildren(el('div', { cls: 'empty-sm', text: '该菌组未找到此药物。' }));
      return;
    }
    // 显示该药折点（按当前方法）
    var bpS = isZone ? drug.抑菌圈_S : drug.MIC_S;
    var bpMid = isZone ? drug.抑菌圈_I : drug.MIC_I;
    var bpR = isZone ? drug.抑菌圈_R : drug.MIC_R;
    var unit = isZone ? 'mm' : 'μg/mL';
    var bpInfoKids = [
      el('span', { text: (isZone ? '抑菌圈折点：S ' : '折点：S ') + (bpS || '—') + ' / I ' + (bpMid || '—') + ' / R ' + (bpR || '—') + ' (' + unit + ')' })
    ];
    if (!isZone && /\//.test(String(drug.MIC_S || '') + String(drug.MIC_I || '') + String(drug.MIC_R || ''))) {
      bpInfoKids.push(el('div', { cls: 'bp-judge-note', text: '复方制剂：单一药物、单一折点；斜线后为固定配比的另一成分浓度（非第二折点）。请输入活性成分（斜线前）的 MIC。' }));
    }
    var bpInfo = el('div', { cls: 'bp-judge-bp' }, bpInfoKids);
    if (!bpJudgeMIC || bpJudgeMIC === '') {
      box.replaceChildren(bpInfo, el('div', { cls: 'empty-sm', text: '输入' + (isZone ? '抑菌圈直径' : ' MIC 值') + '后自动判读。' }));
      return;
    }
    var verdict = isZone ? View.judgeZone(bpJudgeMIC, bpS, bpMid, bpR) : View.judgeMIC(bpJudgeMIC, bpS, bpMid, bpR);
    var clsMap = { S: 'v-s', R: 'v-r', SDD: 'v-sdd', I: 'v-i', NS: 'v-ns' };
    var cls = 'bp-verdict ' + (clsMap[verdict.result] || 'v-unknown');
    box.replaceChildren(bpInfo, el('div', { cls: cls }, [
      el('span', { cls: 'bp-verdict-tag', text: verdict.result === 'invalid' ? '无效' : verdict.result }),
      el('span', { cls: 'bp-verdict-reason', text: verdict.reason })
    ]));
    if (verdict.adjusted) {
      box.appendChild(el('div', { cls: 'bp-judge-note', text: '⚠️ 输入值非标准二倍稀释点，已向上归入 ' + verdict.interpretedValue + ' μg/mL 判读（未静默修正原始输入）。' }));
    }
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
  function astLevelIcon(level) {
    if (level === '必须修正') { return '⚠'; }
    if (level === '需复核') { return '⟳'; }
    if (level === '限制报告') { return '⊘'; }
    return '•';
  }
  function astLevelDesc(level) {
    if (level === '必须修正') { return '结果达修正条件，须按规则改判 / 加注后报告'; }
    if (level === '需复核') { return '先核实鉴定 / 方法 / 重测，再决定发报'; }
    if (level === '限制报告') { return '结果不宜直接报告，需限制或补充试验'; }
    return '';
  }
  function astLevelChip(level) {
    return el('span', { cls: astLevelClass(level) }, [
      el('span', { cls: 'ast-level-ic', 'aria-hidden': 'true', text: astLevelIcon(level) }),
      el('span', { text: level })
    ]);
  }
  function astLegend() {
    return el('div', { cls: 'ast-legend' }, ['必须修正', '需复核', '限制报告'].map(function (lv) {
      return el('div', { cls: 'ast-legend-item' }, [
        astLevelChip(lv),
        el('span', { cls: 'ast-legend-desc', text: astLevelDesc(lv) })
      ]);
    }));
  }
  function renderAstAlertsMain() {
    var vm = View.astAlertsVM(astAlerts(), { filter: astFilter, level: astLevel });
    var nodes = [
      el('div', { cls: 'detail-head' }, [
        el('h2', { cls: 'detail-title', text: '异常药敏 / 修正规则' }),
        el('span', { cls: 'badge', text: vm.count + ' 条' })
      ]),
      el('div', { cls: 'cmp-hint ast-disclaimer', text: '定位常见矛盾结果、固有耐药、限制报告和需要补充试验的场景；点行展开详情。不替代最终审核。' }),
      astLegend()
    ];
    if (!vm.list.length) {
      nodes.push(el('div', { cls: 'empty', text: '没有匹配的异常药敏规则。' }));
    } else {
      nodes.push(buildAstTable(vm.list));
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
  function toggleAstRow(sumRow, detailRow, caret, btn) {
    var open = detailRow.style.display !== 'none';
    detailRow.style.display = open ? 'none' : '';
    sumRow.classList.toggle('open', !open);
    btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    caret.textContent = open ? '▸' : '▾';
  }
  function buildAstTable(list) {
    var head = el('tr', {}, [
      el('th', { cls: 'ast-th-level', text: '等级' }),
      el('th', { cls: 'ast-th-cat', text: '类别' }),
      el('th', { text: '异常药敏情形' }),
      el('th', { cls: 'ast-th-toggle', 'aria-label': '展开' })
    ]);
    var body = [];
    list.forEach(function (item) {
      var tags = (item.关键词 || []).slice(0, 8).map(function (tag) {
        return el('span', { cls: 'morph-tag', text: tag });
      });
      var detailInner = [
        astLine('触发', item.触发),
        astLine('异常', item.异常结果),
        astLine('处理', item.处理),
        astLine('依据', item.依据)
      ];
      if (tags.length) { detailInner.push(el('div', { cls: 'chips ast-tags' }, tags)); }
      var detailId = 'ast-d-' + item.id;
      var detailRow = el('tr', { cls: 'ast-detail-row', id: detailId }, [
        el('td', { colspan: '4' }, [el('div', { cls: 'ast-detail' }, detailInner)])
      ]);
      detailRow.style.display = 'none';
      // 真实 <button> 承载可访问的展开控件（保留 tr 的行语义，避免 role=button 破坏表格结构）
      var caret = el('span', { cls: 'ast-caret', 'aria-hidden': 'true', text: '▸' });
      var btn = el('button', { cls: 'ast-toggle-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': detailId, 'aria-label': item.标题 + '：展开/收起详情' }, [caret]);
      var sumRow = el('tr', { cls: 'ast-row' }, [
        el('td', { cls: 'ast-cell-level' }, [astLevelChip(item.等级)]),
        el('td', { cls: 'ast-cell-cat', text: item.类别 }),
        el('td', { cls: 'ast-cell-title' }, [
          el('span', { cls: 'ast-row-cat-inline', text: item.类别 }),
          el('span', { cls: 'ast-row-title', text: item.标题 })
        ]),
        el('td', { cls: 'ast-cell-toggle' }, [btn])
      ]);
      // 整行可点（鼠标便利）；键盘/读屏经内部 button（其 click 冒泡到本行，单次切换）
      sumRow.addEventListener('click', function () { toggleAstRow(sumRow, detailRow, caret, btn); });
      body.push(sumRow);
      body.push(detailRow);
    });
    return el('div', { cls: 'ast-table-wrap' }, [
      el('table', { cls: 'ast-table' }, [el('thead', {}, [head]), el('tbody', {}, body)])
    ]);
  }

  function isAboutRoute() { return routeKey() === 'about'; }

  function cacheStatusLine() {
    if (!('serviceWorker' in navigator) || location.protocol.indexOf('http') !== 0) {
      return '离线缓存：当前以本地文件方式运行，页面直接读取内置资源；PWA 离线缓存仅在 http(s) 链接下启用。';
    }
    if (navigator.serviceWorker.controller) {
      return '离线缓存：已启用，刷新后会优先获取新入口页并更新本地缓存。';
    }
    return '离线缓存：首次访问或正在注册，刷新一次后通常会完成接管。';
  }

  function sourceMetadataLines() {
    var meta = (window.DB && window.DB.sourceMetadata) || {};
    var keys = ['breakpoints', 'treatment', 'taxonomy'];
    var lines = [];
    keys.forEach(function (key) {
      var item = meta[key] || {};
      if (!item.口径 && !item.版本 && !item.最近校对日期) { return; }
      var label = key === 'breakpoints' ? '药敏折点' : (key === 'treatment' ? '治疗要点' : '分类命名');
      lines.push(label + '：' + [item.口径, item.版本, item.最近校对日期].filter(Boolean).join(' · '));
      // 折点：展开结构化标准来源（按细菌/酵母/丝状真菌分列，含版次、年份、状态）
      if (key === 'breakpoints' && item.标准) {
        Object.keys(item.标准).forEach(function (cat) {
          var docs = (item.标准[cat] || []).map(function (d) {
            return d.文件 + ' Ed' + d.版次 + '（' + d.年份 + '）' + (d.状态 ? '，' + d.状态 : '');
          }).join('；');
          lines.push('　· ' + cat + '：' + docs);
        });
      }
    });
    return lines.length ? lines : ['内容来源已内置，后续版本会继续细化到条目级来源。'];
  }

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
        '本软件为微生物学习与速查工具，所载形态、鉴别、生化、药敏折点、治疗要点等内容仅供医学教育与专业人员查询参考，不构成任何诊断、治疗或用药建议。',
        '任何临床决策（含用药选择、剂量、疗程）必须由具备资质的医务人员，结合患者具体情况、本地药敏结果与现行权威指南独立判断。开发者不对依据本软件内容所作决策导致的任何后果负责。',
        '药敏折点依据 CLSI 现行标准整理：细菌 M100 Ed36（2026）与 M45 Ed3（2018），酵母 M27M44S Ed3（2022），丝状真菌 M38M51S Ed3（2022）；M60 Ed2（2020）已被 M27M44S 取代、仅作历史对照。折点可能随版本更新而变化，请以最新官方标准为准。'
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
      card('内容版本', sourceMetadataLines()),
      card('运行状态', [
        '资源版本：' + APP_VERSION,
        cacheStatusLine()
      ]),
      card('版本与版权', [
        '名称：知微 · 微生物学习手册（全称：知微微生物学习手册）',
        '版本：V1.0',
        '© 2026 著作权所有。免费供个人学习与教学公益使用；未经许可不得用于商业用途或二次分发。'
      ])
    ];
    fill(document.getElementById('main'), nodes);
  }

  // ===== 工具：标本与实验室流程（MCM 12th ed）=====
  function isLabWorkflowRoute() { return routeKey() === 'lab-workflow'; }
  function lwList(items) {
    return el('ul', { cls: 'lw-list' }, (items || []).map(function (t) { return el('li', { text: t }); }));
  }
  function renderLabWorkflow() {
    setActiveTool('lab-workflow');
    fill(document.getElementById('sidebar'), [ el('div', { cls: 'cat-group' }, [
      el('div', { cls: 'cat-group-name', text: '标本与实验室流程' }),
      el('div', { cls: 'cmp-hint', text: '标本→染色→培养→鉴定→药敏→报告的实验室流程教学参考（MCM 第12版）。' })
    ]) ]);
    var wf = (window.DB && window.DB.labWorkflow) || null;
    var nodes = [ el('h2', { cls: 'detail-title', text: '标本与实验室流程' }) ];
    if (!wf) {
      nodes.push(el('div', { cls: 'empty', text: '数据未加载。' }));
      fill(document.getElementById('main'), nodes);
      return;
    }
    nodes.push(el('div', { cls: 'lw-src', text: '来源：' + (wf.来源 || 'MCM 12th ed') }));
    nodes.push(el('div', { cls: 'lw-note', text: wf.说明 || '' }));

    // ① 教学工作流路径
    if (wf.教学流程 && wf.教学流程.length) {
      var pathKids = [];
      wf.教学流程.forEach(function (n, i) {
        if (i > 0) { pathKids.push(el('span', { cls: 'lw-path-sep', text: '→' })); }
        pathKids.push(n.href
          ? el('a', { cls: 'lw-path-node', href: n.href, text: n.阶段 })
          : el('span', { cls: 'lw-path-node plain', text: n.阶段 }));
      });
      nodes.push(el('div', { cls: 'lw-section' }, [
        el('div', { cls: 'lw-h', text: '教学工作流' }),
        el('div', { cls: 'lw-path' }, pathKids)
      ]));
    }

    // ② 标本采集、运输与拒收
    var sm = wf.标本管理 || {};
    var smKids = [ el('div', { cls: 'lw-h', text: '标本采集、运输与拒收' }) ];
    if (sm.通则 && sm.通则.length) { smKids.push(el('div', { cls: 'lw-sub', text: '总则' }), lwList(sm.通则)); }
    if (sm.拒收 && sm.拒收.length) { smKids.push(el('div', { cls: 'lw-sub', text: '拒收标准' }), lwList(sm.拒收)); }
    if (sm.常见标本 && sm.常见标本.length) {
      smKids.push(el('div', { cls: 'lw-sub', text: '常见标本采集与转运' }));
      smKids.push(el('div', { cls: 'lw-table-wrap' }, [ el('table', { cls: 'lw-table' }, [
        el('thead', {}, [ el('tr', {}, [ el('th', { text: '标本' }), el('th', { text: '采集' }), el('th', { text: '转运' }), el('th', { text: '说明' }) ]) ]),
        el('tbody', {}, sm.常见标本.map(function (s) {
          return el('tr', {}, [ el('td', { 'data-label': '标本', text: s.name }), el('td', { 'data-label': '采集', text: s.collection }), el('td', { 'data-label': '转运', text: s.transport }), el('td', { 'data-label': '说明', text: s.note || '' }) ]);
        }))
      ]) ]));
    }
    nodes.push(el('div', { cls: 'lw-section' }, smKids));

    // ③ 阳性血培养处理流程
    var bc = wf.血培养 || {};
    var bcKids = [ el('div', { cls: 'lw-h', text: '阳性血培养处理流程' }) ];
    if (bc.采集 && bc.采集.length) { bcKids.push(el('div', { cls: 'lw-sub', text: '采集关键因素（血量 · 套数 · 时机 · 消毒）' }), lwList(bc.采集)); }
    if (bc.流程 && bc.流程.length) {
      bcKids.push(el('div', { cls: 'lw-sub', text: '阳性瓶处理步骤' }));
      bcKids.push(el('div', { cls: 'lw-flow' }, bc.流程.map(function (st, i) {
        return el('div', { cls: 'lw-step' }, [
          el('span', { cls: 'lw-step-n', text: String(i + 1) }),
          el('div', { cls: 'lw-step-b' }, [ el('div', { cls: 'lw-step-t', text: st.step }), el('div', { cls: 'lw-step-d', text: st.detail || '' }) ])
        ]);
      })));
    }
    if (bc.污染判断 && bc.污染判断.length) { bcKids.push(el('div', { cls: 'lw-sub', text: '污染菌判断' }), lwList(bc.污染判断)); }
    nodes.push(el('div', { cls: 'lw-section' }, bcKids));

    // ④ 鉴定方法与局限
    var idm = wf.鉴定方法 || {};
    var idKids = [ el('div', { cls: 'lw-h', text: '鉴定方法与局限' }) ];
    if (idm.方法 && idm.方法.length) {
      idKids.push(el('div', { cls: 'lw-table-wrap' }, [ el('table', { cls: 'lw-table' }, [
        el('thead', {}, [ el('tr', {}, [ el('th', { text: '方法' }), el('th', { text: '原理' }), el('th', { text: '适用' }), el('th', { text: '局限' }) ]) ]),
        el('tbody', {}, idm.方法.map(function (m) {
          return el('tr', {}, [ el('td', { 'data-label': '方法', text: m.name }), el('td', { 'data-label': '原理', text: m.principle }), el('td', { 'data-label': '适用', text: m.use }), el('td', { 'data-label': '局限', text: m.limitation }) ]);
        }))
      ]) ]));
    }
    if (idm.局限 && idm.局限.length) { idKids.push(el('div', { cls: 'lw-sub', text: '总体局限与常见误鉴定陷阱' }), lwList(idm.局限)); }
    nodes.push(el('div', { cls: 'lw-section' }, idKids));

    fill(document.getElementById('main'), nodes);
  }

  // ===== 工具：菌名速查（全部菌名 → 百度百科）=====
  function isMicrobeNamesRoute() { return routeKey() === 'microbe-names'; }
  var mnFilter = '';
  function mnLetter(lat) { var c = (lat || '').charAt(0).toUpperCase(); return /[A-Z]/.test(c) ? c : '#'; }
  var mnTimer = null;
  function renderMicrobeNames() {
    setActiveTool('microbe-names');
    var list = (window.DB && window.DB.microbeNames) || [];
    // 侧栏保持精简：仅说明，不放搜索框（搜索移到正文，手机端搜索与结果同屏）
    fill(document.getElementById('sidebar'), [ el('div', { cls: 'cat-group' }, [
      el('div', { cls: 'cat-group-name', text: '菌名速查' }),
      el('div', { cls: 'cmp-hint', text: '微生物名称索引（按拉丁名字母序），点击跳转百度百科；含已从「微生物分类」详情精简移除的菌种。' })
    ]) ]);
    // 正文：标题 + 说明 + 粘性头（搜索 + A–Z）+ 结果容器（仅结果重渲染，搜索框不丢焦点）
    var search = el('input', { cls: 'mn-search', type: 'search', enterkeyhint: 'search', autocomplete: 'off', placeholder: '搜索中文名 / 拉丁名…', value: mnFilter });
    search.addEventListener('input', function () {
      mnFilter = search.value;
      if (mnTimer) { clearTimeout(mnTimer); }
      mnTimer = setTimeout(renderMicrobeNamesResults, 150);
    });
    fill(document.getElementById('main'), [
      el('h2', { cls: 'detail-title', text: '菌名速查' }),
      el('div', { cls: 'lw-note', text: '微生物名称索引（中文 + 拉丁，共 ' + list.length + ' 条，按拉丁名字母顺序）——点击任一菌名跳转百度百科；含已从「微生物分类」详情模块精简移除的菌种。' }),
      el('div', { cls: 'mn-head' }, [
        el('div', { cls: 'mn-searchwrap' }, [ search, el('span', { cls: 'mn-count', id: 'mn-count' }) ]),
        el('div', { cls: 'mn-az', id: 'mn-az' })
      ]),
      el('div', { id: 'mn-results' })
    ]);
    renderMicrobeNamesResults();
  }
  function renderMicrobeNamesResults() {
    var list = (window.DB && window.DB.microbeNames) || [];
    var q = mnFilter.trim().toLowerCase();
    var filtered = q ? list.filter(function (m) { return (m.名称 + ' ' + (m.拉丁名 || '')).toLowerCase().indexOf(q) !== -1; }) : list;
    // 计数反馈
    var cnt = document.getElementById('mn-count');
    if (cnt) { cnt.textContent = q ? ('共 ' + filtered.length + ' 条') : ''; }
    // A–Z 跳转条（筛选时隐藏）
    var az = document.getElementById('mn-az');
    if (az) {
      az.style.display = q ? 'none' : '';
      if (!q) {
        var letters = [], seenL = {};
        filtered.forEach(function (m) { var L = mnLetter(m.拉丁名); if (!seenL[L]) { seenL[L] = true; letters.push(L); } });
        fill(az, letters.map(function (L) {
          return el('a', { cls: 'mn-az-l', href: '#/microbe-names', text: L, onClick: function (e) { e.preventDefault(); var t = document.getElementById('mn-' + L); if (t) { t.scrollIntoView({ block: 'start' }); } } });
        }));
      }
    }
    // 结果分节（只重渲染结果，不动搜索框）
    var nodes = [], curL = null, grid = null;
    filtered.forEach(function (m) {
      var L = mnLetter(m.拉丁名);
      if (L !== curL) {
        curL = L;
        grid = el('div', { cls: 'mn-grid' });
        nodes.push(el('div', { cls: 'mn-section', id: 'mn-' + L }, [ el('div', { cls: 'lw-h', text: L }), grid ]));
      }
      grid.appendChild(el('a', {
        cls: 'mn-item', href: 'https://baike.baidu.com/item/' + encodeURIComponent(m.名称),
        target: '_blank', rel: 'noopener noreferrer', title: '在百度百科查看：' + m.名称
      }, [ el('span', { cls: 'mn-nm', text: m.名称 }), el('span', { cls: 'mn-lt', text: m.拉丁名 || '' }) ]));
    });
    if (filtered.length === 0) { nodes.push(el('div', { cls: 'empty', text: '没有匹配的菌名。' })); }
    fill(document.getElementById('mn-results'), nodes);
  }

  function renderRoute() {
    document.body.classList.toggle('route-mn', isMicrobeNamesRoute());
    if (isMicrobeNamesRoute()) { renderMicrobeNames(); return; }
    if (isLabWorkflowRoute()) { renderLabWorkflow(); return; }
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
      var index = Core.buildIndex(data);
      var hit = index[route.id];
      entry = hit ? hit.entry : null;
      rels = entry ? Core.getRelations(route.id, data, index) : [];
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
      breakpoints: (route.module === 'microbes' && route.id) ? View.breakpointVM(route.id, window.DB.breakpoints) : null,
      ecv: (route.module === 'microbes' && route.id) ? View.ecvVM(route.id, window.DB.ecv) : null
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
    'biochem-tests': [{ src: 'img/landing-biochem.svg', cap: '生化反应总览（按类别 · 颜色示阳性结果）' }],
    'qc-strains': [{ src: 'img/landing-qc-strains.svg', cap: '质控菌株总览（4 类 · 在控/失控）' }]
  };

  function buildLanding(moduleKey) {
    var nodes = [];
    (LANDING[moduleKey] || []).forEach(function (g) {
      nodes.push(el('figure', { cls: 'mechanism-fig' }, [
        el('img', { cls: 'mechanism-img', src: imgV(g.src), alt: g.cap }),
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
    var menuBtn = document.getElementById('menu-btn');
    var openNav = function () { setNavOpen(true); };
    var closeNav = function () { setNavOpen(false); };
    function setNavOpen(open) {
      document.body.classList.toggle('nav-open', open);
      if (menuBtn) { menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    }

    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) {
      t.addEventListener('click', function () {
        document.getElementById('search-input').value = '';
        location.hash = '#/' + t.getAttribute('data-module');
        if (isMobile()) { closeNav(); }   // 切换模块时收起抽屉，露出该模块总览图；点 ☰ 再手动展开分类
      });
    });

    // 移动端抽屉：汉堡开合、点遮罩/选中条目后关闭
    if (menuBtn) { menuBtn.addEventListener('click', function () { setNavOpen(!document.body.classList.contains('nav-open')); }); }
    var backdrop = document.getElementById('nav-backdrop');
    if (backdrop) { backdrop.addEventListener('click', closeNav); }
    var sb = document.getElementById('sidebar');
    if (sb) { sb.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a')) { closeNav(); } }); }
    var cmpBtn = document.querySelector('.compare-btn');
    if (cmpBtn) { cmpBtn.addEventListener('click', function () { if (isMobile()) { openNav(); } }); }

    var box = document.getElementById('search-input');
    var searchTimer = null;
    box.addEventListener('input', function () {
      if (searchTimer) { clearTimeout(searchTimer); }
      searchTimer = setTimeout(function () {
        var q = box.value.trim();
        if (q) { runSearch(q); } else { renderRoute(); }
      }, 150);
    });

    window.addEventListener('hashchange', function () {
      var s = document.getElementById('search-input');
      if (s.value.trim()) { s.value = ''; }
      renderRoute();
    });
    window.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { closeNav(); }
    });

    setNavOpen(false);
    renderRoute();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
