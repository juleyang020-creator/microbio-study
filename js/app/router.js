(function () {
  'use strict';
  var Core = window.Core, View = window.View;
  var NS = window.AppNS = window.AppNS || {};
  var buildDetail = NS.buildDetail, buildSearch = NS.buildSearch, categories = NS.categories, db = NS.db, el = NS.el, fill = NS.fill, imgV = NS.imgV, initScrollFades = NS.initScrollFades, isAboutRoute = NS.isAboutRoute, isAstAlertsRoute = NS.isAstAlertsRoute, isBreakpointsRoute = NS.isBreakpointsRoute, isCardCompareRoute = NS.isCardCompareRoute, isCompareRoute = NS.isCompareRoute, isIntrinsicRoute = NS.isIntrinsicRoute, isLabWorkflowRoute = NS.isLabWorkflowRoute, isMicrobeNamesRoute = NS.isMicrobeNamesRoute, isMobile = NS.isMobile, mergeAtlasPhotos = NS.mergeAtlasPhotos, parseHash = NS.parseHash, recordHistory = NS.recordHistory, renderAbout = NS.renderAbout, renderAstAlerts = NS.renderAstAlerts, renderBreakpoints = NS.renderBreakpoints, renderCardCompare = NS.renderCardCompare, renderCompare = NS.renderCompare, renderIntrinsic = NS.renderIntrinsic, renderLabWorkflow = NS.renderLabWorkflow, renderMicrobeNames = NS.renderMicrobeNames, renderSidebar = NS.renderSidebar, setActiveTab = NS.setActiveTab, syncScrollFade = NS.syncScrollFade, zoomableImg = NS.zoomableImg;
  function renderRoute() {
    document.body.classList.toggle('route-mn', isMicrobeNamesRoute());
    if (isMicrobeNamesRoute()) { renderMicrobeNames(); return; }
    if (isLabWorkflowRoute()) { renderLabWorkflow(); return; }
    if (isAboutRoute()) { renderAbout(); return; }
    if (isCompareRoute()) { renderCompare(); return; }
    if (isCardCompareRoute()) { renderCardCompare(); return; }
    if (isIntrinsicRoute()) { renderIntrinsic(); return; }
    if (isBreakpointsRoute()) { renderBreakpoints(); return; }
    if (isAstAlertsRoute()) { renderAstAlerts(); return; }
    var route = parseHash();
    var data = db();
    setActiveTab(route.module);
    // 详情/着陆页都在视口顶部，切换条目或模块后若停在原滚动位置，新页内容会被
    // 「错过」大半屏。无论从链接跳转还是手动选侧栏/模块，都先把主区滚回顶部。
    // exceptions（mn-az 跳转、着色页内锚点）各自在自身渲染函数内处理，不经此路径。
    var mainEl = document.getElementById('main');
    if (mainEl) { mainEl.scrollTop = 0; }

    var entry = null, rels = [], mechImg = null;
    if (route.id) {
      var index = Core.buildIndex(data);
      var hit = index[route.id];
      entry = hit ? hit.entry : null;
      rels = entry ? Core.getRelations(route.id, data, index) : [];
      mechImg = View.mechanismImageFor(route.module, entry, categories());
    }
    if (entry && route.id) { recordHistory(route.id, route.module, entry.名称); }
    renderSidebar(); // 放在记录历史之后，使当前条目在「最近浏览」中即时高亮
    var extras = {
      mechanismImage: mechImg,
      mechCaption: MECH_CAPTION[route.module] || '作用机制示意图',
      morphology: (entry && window.DB.morphology) ? window.DB.morphology[entry.id] : null,
      photos: (route.module === 'microbes' && entry && window.DB.photos) ? mergeAtlasPhotos(entry.id) : null,
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

  // 条目详情页里那张示意图的图注（按模块，缺省为作用机制）
  var MECH_CAPTION = {
    tests: '试验示意图',
    staining: '染色示意图',
    'biochem-tests': '生化反应示意图',
    media: '培养基示意图',
    glossary: '结构示意图',
    virulence: '致病机制示意图',
    genetics: '遗传变异示意图'
  };

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
    virulence: [{ src: 'img/landing-virulence.svg', cap: '病原毒力因子总览（按感染进程）' }],
    genetics: [{ src: 'img/landing-genetics.svg', cap: '微生物遗传与变异总览（突变与水平转移两条来路）' }],
    glossary: [{ src: 'img/landing-glossary.svg', cap: '术语表总览（8 大类 66 条 · 正文缩写都有落地页）' }],
    cards: [
      { src: 'img/landing-cards.svg', cap: '药敏卡与判读总览' },
      { src: 'img/landing-idcards.svg', cap: 'VITEK 2 鉴定卡原理与选卡总览' }
    ],
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
        zoomableImg(imgV(g.src), g.cap, g.cap),
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
    initScrollFades();
    // 视口变化会改变是否溢出（如横竖屏切换），须重算
    window.addEventListener('resize', function () {
      Array.prototype.forEach.call(document.querySelectorAll('.tabs, .tools'), syncScrollFade);
    });
    renderRoute();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  Object.assign(NS, { LANDING, MECH_CAPTION, buildLanding, init, renderRoute, runSearch });
})();
