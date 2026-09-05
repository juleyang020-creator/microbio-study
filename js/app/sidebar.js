(function () {
  'use strict';
  var Core = window.Core, View = window.View;
  var NS = window.AppNS = window.AppNS || {};
  var categories = NS.categories, db = NS.db, el = NS.el, fill = NS.fill, parseHash = NS.parseHash;
  var collapsed = {}; // path -> true 表示该分类节点已折叠（跨模块、跨重渲染保持）

  function toggleCollapse(key) {
    if (collapsed[key]) { delete collapsed[key]; } else { collapsed[key] = true; }
    renderSidebar();
  }

  // 递归渲染一个分类节点（任意层级，按深度缩进）。
  // 属节点双控件：标题本身可点（有同名属级条目时直达属介绍），独立小箭头负责折叠/展开种列表。
  function sidebarNodes(node, depth, parentPath) {
    var path = parentPath + '/' + node.名称;
    var collapsible = (node.children && node.children.length) || (node.entries && node.entries.length);
    var isCollapsed = !!collapsed[path];
    // 属级条目折叠：叶子分类下唯一条目与属同名（批11~17 的属级条目），树上会两层重复——
    // 直接渲染为链接（点开即属介绍），不再挂子条目。
    if (!node.children.length && node.entries.length === 1 && node.entries[0].名称 === node.名称) {
      var only = node.entries[0];
      return [ el('a', {
        cls: 'cat-subgroup entry-link cat-genus-link' + (only.selected ? ' selected' : ''),
        text: node.名称,
        href: only.href,
        style: 'padding-left:' + (8 + depth * 14) + 'px',
        title: '查看' + node.名称 + '介绍'
      }) ];
    }
    // 「大属」：分类节点存在同名条目（如批32+ 的链球菌属 spp. 条目）且还有其他子条目——
    // 标题渲染为可点击链接（直达属介绍），折叠箭头独立放在标题行内，两者互不干扰。
    var genusEntry = collapsible ? (node.entries || []).find(function (e) { return e.名称 === node.名称; }) : null;
    var labelCls = (depth === 0 ? 'cat-group-name' : 'cat-subgroup') + (collapsible ? ' collapsible' : '');
    var marker = collapsible ? (isCollapsed ? '▸' : '▾') : '';
    var pad = 'padding-left:' + (8 + depth * 14) + 'px';
    var out;
    if (genusEntry) {
      // 标题=链接 + 独立箭头按钮（flex 行：箭头 | 属名链接）
      var rowKids = [];
      if (collapsible) {
        rowKids.push(el('button', {
          cls: 'cat-toggle genus-arrow', text: marker, type: 'button',
          'aria-expanded': String(!isCollapsed), title: isCollapsed ? '展开种列表' : '折叠种列表',
          onClick: function () { toggleCollapse(path); }
        }));
      }
      rowKids.push(el('a', {
        cls: 'cat-genus-title entry-link' + (genusEntry.selected ? ' selected' : ''),
        text: node.名称, href: genusEntry.href, title: '查看' + node.名称 + '总览'
      }));
      out = [ el('div', { cls: 'genus-row', style: pad }, rowKids) ];
    } else {
      out = [ el(collapsible ? 'button' : 'div', {
        cls: labelCls + (collapsible ? ' cat-toggle' : ''),
        text: (marker ? marker + ' ' : '') + node.名称,
        type: collapsible ? 'button' : null,
        style: pad,
        'aria-expanded': collapsible ? String(!isCollapsed) : null,
        onClick: collapsible ? function () { toggleCollapse(path); } : null
      }) ];
    }
    if (isCollapsed) { return out; }
    if (node.children && node.children.length) {
      node.children.forEach(function (c) {
        sidebarNodes(c, depth + 1, path).forEach(function (n) { out.push(n); });
      });
    } else {
      var epad = 'padding-left:' + (8 + (depth + 1) * 14) + 'px';
      node.entries.forEach(function (e) {
        // 标题行已是属介绍链接（genus-row），展开的子条目列表跳过同名条目，避免两层重复。
        // 去重发生在渲染层而非 VM 层——VM 必须保留同名条目供 genusEntry 查找（见 view.js buildNode 注释）。
        if (genusEntry && e.id === genusEntry.id) { return; }
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

  // ===== 本地存储：收藏夹 + 浏览历史（localStorage，跨会话保留、仅本设备，不上传）=====
  function lsLoad(key) { try { var v = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function lsSave(key, list) { try { localStorage.setItem(key, JSON.stringify(list)); } catch (e) {} }

  var FAV_KEY = 'zhiwei-favorites', FAV_MAX = 50;
  var _favCache = null;
  function favorites() { if (!_favCache) { _favCache = lsLoad(FAV_KEY); } return _favCache; }
  function isFavorited(id) { return favorites().some(function (f) { return f.id === id; }); }
  function toggleFavorite(id, module, 名称) {
    if (!id || !module) { return; }
    var list = favorites().slice();
    var i = -1;
    for (var k = 0; k < list.length; k++) { if (list[k].id === id) { i = k; break; } }
    if (i >= 0) { list.splice(i, 1); }
    else { list.push({ id: id, module: module, 名称: 名称, ts: Date.now() }); if (list.length > FAV_MAX) { list.shift(); } }
    _favCache = list; lsSave(FAV_KEY, list);
  }

  // HIST_MAX 是存多少（供「清空」前回溯），HIST_SHOW 是侧栏露出多少。
  // 侧栏还要放分类树，最近浏览占太多行会把分类挤下去，故只露 5 条。
  var HIST_KEY = 'zhiwei-history', HIST_MAX = 30, HIST_SHOW = 5;
  var _histCache = null;
  function browseHistory() { if (!_histCache) { _histCache = lsLoad(HIST_KEY); } return _histCache; }
  function recordHistory(id, module, 名称) {
    if (!id || !module) { return; }
    var list = browseHistory().filter(function (h) { return h.id !== id; }); // 去重：重复访问移到最前
    list.unshift({ id: id, module: module, 名称: 名称, ts: Date.now() });
    if (list.length > HIST_MAX) { list = list.slice(0, HIST_MAX); }
    _histCache = list; lsSave(HIST_KEY, list);
  }
  function clearHistory() { _histCache = []; lsSave(HIST_KEY, []); }

  // 侧栏顶部的「我的收藏」+「最近浏览」区（名称实时取 DB，改名后不过期；取不到用快照名）
  function favHistNodes(route) {
    var out = [];
    var index = Core.buildIndex(db());
    var favs = favorites();
    if (favs.length) {
      var favItems = favs.slice().reverse().map(function (f) { // 最新收藏在前
        var hit = index[f.id];
        return el('a', {
          cls: 'entry-link fav-item' + (f.id === route.id ? ' selected' : ''),
          text: '★ ' + (hit ? hit.entry.名称 : f.名称), href: '#/' + f.module + '/' + f.id
        });
      });
      out.push(el('div', { cls: 'cat-group fav-section' },
        [ el('div', { cls: 'cat-group-name', text: '我的收藏 (' + favs.length + ')' }) ].concat(favItems)));
    }
    var hist = browseHistory();
    if (hist.length) {
      var histItems = hist.slice(0, HIST_SHOW).map(function (h) {
        var hit = index[h.id];
        return el('a', {
          cls: 'entry-link history-item' + (h.id === route.id ? ' selected' : ''),
          text: hit ? hit.entry.名称 : h.名称, href: '#/' + h.module + '/' + h.id
        });
      });
      out.push(el('div', { cls: 'cat-group history-section' }, [
        el('div', { cls: 'cat-group-name history-head' }, [
          el('span', { text: '最近浏览' }),
          el('button', { cls: 'hist-clear', type: 'button', text: '清空', onClick: function () { clearHistory(); renderSidebar(); } })
        ])
      ].concat(histItems)));
    }
    return out;
  }

  // 与 CSS 的抽屉断点保持一致。定义在模块作用域：renderSidebar 等模块级函数也要用，
  // 放进 init() 会让它们拿不到（曾因此抛 ReferenceError 使整条渲染中断）。
  function isMobile() { return window.matchMedia('(max-width: 760px)').matches; }

  function renderSidebar() {
    var route = parseHash();
    var sidebar = document.getElementById('sidebar');
    var nodes = favHistNodes(route).concat(
      buildSidebar(View.sidebarVM(route.module, categories(), db()[route.module], route.id), route.module));
    fill(sidebar, nodes);
    // 分类树很长（微生物模块 186 项、约 9 屏），从搜索结果点进详情后，当前条目往往在
    // 视野外，用户看不出自己在树里的哪个位置。渲染后把选中项滚进来。
    // 用 block:'nearest' 而不是 'center'：已在视野内时不动，避免每次渲染都跳一下。
    // 必须排除收藏/最近浏览里的同名项——它们也带 .entry-link.selected，且恒在侧栏顶部，
    // 选到它们的话 scrollIntoView 永远认为"已在视野内"，这个修复就成了空操作。
    var sel = sidebar && sidebar.querySelector('.entry-link.selected:not(.fav-item):not(.history-item)');
    if (sel && sel.scrollIntoView) {
      // 移动端侧栏是抽屉，未打开时滚动没有意义（且会连带滚动 body）
      if (!isMobile() || document.body.classList.contains('nav-open')) {
        sel.scrollIntoView({ block: 'nearest' });
      }
    }
  }

  Object.assign(NS, { FAV_KEY, HIST_KEY, _favCache, _histCache, browseHistory, buildSidebar, clearHistory, collapsed, favHistNodes, favorites, isFavorited, isMobile, lsLoad, lsSave, recordHistory, renderSidebar, sidebarNodes, toggleCollapse, toggleFavorite });
})();
