(function () {
  'use strict';
  var Core = window.Core, View = window.View;
  var NS = window.AppNS = window.AppNS || {};
  var buildLanding = NS.buildLanding, buildDetail = NS.buildDetail, categories = NS.categories, db = NS.db, fill = NS.fill, isAboutRoute = NS.isAboutRoute, isAstAlertsRoute = NS.isAstAlertsRoute, isBreakpointsRoute = NS.isBreakpointsRoute, isCardCompareRoute = NS.isCardCompareRoute, isCompareRoute = NS.isCompareRoute, isIntrinsicRoute = NS.isIntrinsicRoute, isLabWorkflowRoute = NS.isLabWorkflowRoute, isMicrobeNamesRoute = NS.isMicrobeNamesRoute, mergeAtlasPhotos = NS.mergeAtlasPhotos, parseHash = NS.parseHash, recordHistory = NS.recordHistory, renderAbout = NS.renderAbout, renderAstAlerts = NS.renderAstAlerts, renderBreakpoints = NS.renderBreakpoints, renderCardCompare = NS.renderCardCompare, renderCompare = NS.renderCompare, renderIntrinsic = NS.renderIntrinsic, renderLabWorkflow = NS.renderLabWorkflow, renderMicrobeNames = NS.renderMicrobeNames, renderSidebar = NS.renderSidebar, setActiveTab = NS.setActiveTab;
  function renderRoute() {
    NS.cancelSearchTimer();
    NS.setNavOpen(false, false);
    NS.setToolsOpen(false);
    document.body.classList.toggle('route-mn', isMicrobeNamesRoute());
    if (NS.renderSearchRoute()) { return; }
    NS.syncSearchInput('');
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
      identificationTables: route.module === 'microbes' ? window.DB.identificationTables : [],
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

  function init() {
    NS.initSearch();
    NS.initNavigation();
    window.addEventListener('hashchange', renderRoute);
    renderRoute();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  Object.assign(NS, { MECH_CAPTION, init, renderRoute });
})();
