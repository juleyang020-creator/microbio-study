(function () {
  'use strict';
  var NS = window.AppNS = window.AppNS || {};
  var returnFocus = null;
  function setToolsOpen(open) {
    document.body.classList.toggle('tools-open', !!open);
    var toggle = document.getElementById('tools-toggle');
    if (toggle) { toggle.setAttribute('aria-expanded', String(!!open)); }
  }
  function setNavOpen(open, restoreFocus) {
    open = !!open && NS.isMobile();
    var wasOpen = document.body.classList.contains('nav-open');
    if (open && !wasOpen) { returnFocus = document.activeElement; setToolsOpen(false); }
    document.body.classList.toggle('nav-open', open);
    var menu = document.getElementById('menu-btn');
    var sidebar = document.getElementById('sidebar');
    if (menu) { menu.setAttribute('aria-expanded', String(open)); }
    if (sidebar) { sidebar.inert = NS.isMobile() && !open; }
    Array.prototype.forEach.call(document.querySelectorAll('.topbar, .main, .site-footer'), function (node) { node.inert = open; });
    if (open && !wasOpen) {
      var close = document.getElementById('nav-close');
      if (close) { close.focus(); }
    } else if (wasOpen && !open && restoreFocus !== false) {
      var target = returnFocus && returnFocus.isConnected ? returnFocus : menu;
      if (target) { target.focus(); }
    }
  }
  function initNavigation() {
    var menu = document.getElementById('menu-btn');
    var close = document.getElementById('nav-close');
    var backdrop = document.getElementById('nav-backdrop');
    var toggle = document.getElementById('tools-toggle');
    if (menu) { menu.addEventListener('click', function () { setNavOpen(!document.body.classList.contains('nav-open')); }); }
    if (close) { close.addEventListener('click', function () { setNavOpen(false); }); }
    if (backdrop) { backdrop.addEventListener('click', function () { setNavOpen(false); }); }
    if (toggle) { toggle.addEventListener('click', function () { setToolsOpen(!document.body.classList.contains('tools-open')); }); }
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (tab) {
      tab.addEventListener('click', function () {
        NS.cancelSearchTimer();
        NS.syncSearchInput('');
        var hash = '#/' + tab.getAttribute('data-module');
        // 同一路由点击也刷新；否则从该模块的搜索状态或工具抽屉返回可能没有 hashchange。
        if (location.hash === hash) { NS.renderRoute(); } else { location.hash = hash; }
      });
    });
    var skip = document.querySelector('.skip-link');
    if (skip) { skip.addEventListener('click', function (ev) { ev.preventDefault(); document.getElementById('main').focus(); }); }
    var sidebar = document.getElementById('sidebar');
    if (sidebar) { sidebar.addEventListener('click', function (ev) { if (ev.target.closest && ev.target.closest('a')) { setNavOpen(false, false); } }); }
    document.addEventListener('click', function (ev) {
      if (document.body.classList.contains('tools-open') && ev.target.closest && !ev.target.closest('.nav-board-tools')) { setToolsOpen(false); }
      var link = ev.target.closest && ev.target.closest('a');
      var href = link && link.getAttribute('href');
      if (ev.defaultPrevented || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey || ev.button > 0 || !href || href.indexOf('#/') !== 0 || link.getAttribute('target') === '_blank') { return; }
      NS.cancelSearchTimer();
      setNavOpen(false, false);
      setToolsOpen(false);
      // 相同 hash 不会派发 hashchange，也必须取消输入中的查询并收起菜单。
      if (href === location.hash) { ev.preventDefault(); NS.renderRoute(); }
    });
    window.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') {
        if (document.body.classList.contains('nav-open')) { setNavOpen(false); ev.preventDefault(); }
        else if (document.body.classList.contains('tools-open')) { setToolsOpen(false); if (toggle) { toggle.focus(); } ev.preventDefault(); }
      }
      if (ev.key !== 'Tab' || !document.body.classList.contains('nav-open')) { return; }
      var targets = [close].concat(Array.prototype.slice.call(sidebar.querySelectorAll('a, button, input, select'))).filter(function (n) {
        return n && !n.disabled && n.getClientRects().length;
      });
      if (!targets.length) { return; }
      // 关闭按钮在 DOM 中位于目录之后；显式循环顺序，不能假设视觉顺序等于 DOM 顺序。
      var index = targets.indexOf(document.activeElement);
      var next = index < 0 ? (ev.shiftKey ? targets.length - 1 : 0) : (index + (ev.shiftKey ? -1 : 1) + targets.length) % targets.length;
      ev.preventDefault();
      targets[next].focus();
    });
    setNavOpen(false, false);
    NS.initScrollFades();
    window.addEventListener('resize', function () {
      if (!NS.isMobile()) { setNavOpen(false, false); setToolsOpen(false); }
      else if (!document.body.classList.contains('nav-open')) { setNavOpen(false, false); }
      Array.prototype.forEach.call(document.querySelectorAll('.tabs, .tools'), NS.syncScrollFade);
    });
  }
  Object.assign(NS, { initNavigation, setNavOpen, setToolsOpen });
})();
