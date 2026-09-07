(function () {
  'use strict';
  var Core = window.Core, View = window.View;
  var NS = window.AppNS = window.AppNS || {};
  var el = NS.el;
  // 命中高亮：把文本按 token 拆成普通文本节点与 <mark> 节点（全程 textContent，无 innerHTML/XSS 面）
  function highlightNodes(text, tokens) {
    text = String(text || '');
    if (!text || !tokens || !tokens.length) { return [ document.createTextNode(text) ]; }
    var lower = text.toLowerCase(), matches = [];
    tokens.forEach(function (t) {
      if (!t) { return; }
      var idx = 0;
      while ((idx = lower.indexOf(t, idx)) !== -1) { matches.push({ start: idx, end: idx + t.length }); idx += t.length; }
    });
    if (!matches.length) { return [ document.createTextNode(text) ]; }
    matches.sort(function (a, b) { return a.start - b.start; });
    var merged = [ matches[0] ];
    for (var i = 1; i < matches.length; i++) {
      var last = merged[merged.length - 1];
      if (matches[i].start <= last.end) { last.end = Math.max(last.end, matches[i].end); }
      else { merged.push(matches[i]); }
    }
    var out = [], pos = 0;
    merged.forEach(function (m) {
      if (m.start > pos) { out.push(document.createTextNode(text.slice(pos, m.start))); }
      out.push(el('mark', { cls: 'search-hit', text: text.slice(m.start, m.end) }));
      pos = m.end;
    });
    if (pos < text.length) { out.push(document.createTextNode(text.slice(pos))); }
    return out;
  }
  function buildSearch(vm, moduleKey) {
    moduleKey = moduleKey || '';
    var counts = {};
    vm.items.forEach(function (r) { counts[r.module] = (counts[r.module] || 0) + 1; });
    var matches = vm.items.filter(function (r) { return !moduleKey || r.module === moduleKey; });
    var status = el('p', { cls: 'search-status', role: 'status', 'aria-live': 'polite' });
    var nodes = [ el('header', { cls: 'search-head' }, [
      el('p', { cls: 'eyebrow', text: '全库检索 · 按相关度排序' }),
      el('h1', { cls: 'search-title', text: '“' + vm.query + '”' }), status
    ]) ];
    var filters = [ { key: '', count: vm.items.length } ].concat(Core.MODULE_KEYS.filter(function (key) {
      return counts[key] || key === moduleKey;
    }).map(function (key) { return { key: key, count: counts[key] || 0 }; }));
    nodes.push(el('nav', { cls: 'search-filters', 'aria-label': '按模块筛选搜索结果' }, filters.map(function (f) {
      return el('button', { cls: 'search-filter' + (f.key === moduleKey ? ' active' : ''), type: 'button',
        'data-module': f.key, 'aria-pressed': String(f.key === moduleKey),
        text: (f.key ? View.moduleLabel(f.key) : '全部') + ' ' + f.count,
        onClick: function () { NS.runSearch(vm.query, f.key); }
      });
    })));
    var list = el('div', { cls: 'search-list', id: 'search-results-list' });
    var more = el('div', { cls: 'search-pagination' });
    var shown = 0, pageSize = 40;
    function appendPage(focusNew) {
      var first = null;
      matches.slice(shown, shown + pageSize).forEach(function (r) {
        var title = el('span', { cls: 'search-item-title' }, highlightNodes(r.名称, vm.tokens));
        var link = el('a', { cls: 'search-item', href: r.href, 'data-module': r.module }, [
          el('div', { cls: 'search-item-head' }, [ title, el('span', { cls: 'tag tag-' + r.module, text: View.moduleLabel(r.module) }) ])
        ]);
        if (r.命中片段) {
          var ctx = el('div', { cls: 'search-context' });
          if (r.命中字段) { ctx.appendChild(el('span', { cls: 'search-context-field', text: r.命中字段 + '：' })); }
          highlightNodes(r.命中片段, vm.tokens).forEach(function (n) { ctx.appendChild(n); });
          link.appendChild(ctx);
        } else if (r.摘要) { link.appendChild(el('span', { cls: 'search-summary', text: r.摘要 })); }
        list.appendChild(link);
        if (!first) { first = link; }
      });
      shown = Math.min(shown + pageSize, matches.length);
      status.textContent = (moduleKey ? View.moduleLabel(moduleKey) + ' · ' : '') + matches.length + ' 条结果' + (shown < matches.length ? ' · 已显示 ' + shown + ' 条' : '');
      more.replaceChildren();
      if (shown < matches.length) {
        more.appendChild(el('button', { cls: 'search-more action-btn', type: 'button', text: '继续显示 · 还有 ' + (matches.length - shown) + ' 条', onClick: function () { appendPage(true); } }));
      }
      if (focusNew && first) { first.focus(); }
    }
    appendPage(false);
    if (!matches.length) {
      nodes.push(el('section', { cls: 'search-empty' }, [
        el('h2', { text: '没有找到匹配条目' }),
        el('p', { text: moduleKey && vm.items.length ? '其他模块有匹配结果，试试切换到「全部」。' : '试试中文名、拉丁名或常用简称；多个关键词用空格分开，也可以减少限定词。' }),
        el('a', { cls: 'action-btn', href: '#/microbe-names/' + encodeURIComponent(vm.query), text: '到菌名速查继续查找 →' })
      ]));
    }
    nodes.push(list, more);
    return nodes;
  }

  var searchTimer = null, composing = false, searchIndex = null;
  // 返回位置属于浏览器中的每条搜索记录，不能由一个会被后续搜索覆盖的全局变量保存。
  function searchOrigin() {
    var origin = (window.history.state || {}).searchReturn;
    return typeof origin === 'string' && /^#\//.test(origin) && !/^#\/search(?:\/|$)/.test(origin) ? origin : '#/microbes';
  }
  function searchRoute() {
    if (!/^#\/search(?:\/|$)/.test(location.hash)) { return null; }
    var parts = location.hash.split('/');
    var query;
    try { query = decodeURIComponent(parts[2] || ''); } catch (e) { query = parts[2] || ''; }
    return { query: query, module: Core.MODULE_KEYS.indexOf(parts[3]) !== -1 ? parts[3] : '' };
  }
  function cancelSearchTimer() {
    if (searchTimer) { clearTimeout(searchTimer); searchTimer = null; }
  }
  function syncSearchInput(query) {
    document.getElementById('search-input').value = query;
    var clear = document.getElementById('search-clear');
    if (clear) { clear.hidden = !query; }
  }
  function renderSearchRoute() {
    var route = searchRoute();
    if (!route) { return false; }
    syncSearchInput(route.query);
    NS.setActiveTab(null);
    var main = document.getElementById('main');
    main.scrollTop = 0;
    if (!searchIndex) { searchIndex = Core.createSearchIndex(NS.db()); }
    NS.fill(main, buildSearch(View.searchVM(Core.searchIndex(searchIndex, route.query), route.query), route.module));
    NS.fill(document.getElementById('sidebar'), [
      el('div', { cls: 'search-guide' }, [
        el('p', { cls: 'eyebrow', text: '搜索指南' }),
        el('h2', { text: '更快找到需要的内容' }),
        el('p', { text: '名称、拉丁名、常用简称与正文均可检索。多个关键词用空格分开，结果需同时匹配。' }),
        el('p', { text: '先看名称命中，再用模块标签缩小范围。检索不自动改写菌名或推断医学结论。' }),
        el('button', { cls: 'action-btn', type: 'button', text: '退出搜索', onClick: closeSearch })
      ])
    ]);
    return true;
  }
  // 首次搜索留一个历史节点，后续输入与筛选只更新它：返回详情时不必逐字后退。
  function runSearch(query, moduleKey) {
    cancelSearchTimer();
    query = String(query || '').trim();
    if (!query) { closeSearch(); return; }
    var current = searchRoute();
    var origin = current ? searchOrigin() : (location.hash || '#/microbes');
    if (moduleKey == null) { moduleKey = current ? current.module : ''; }
    var hash = '#/search/' + encodeURIComponent(query) + (moduleKey ? '/' + moduleKey : '');
    window.history[current ? 'replaceState' : 'pushState']({ searchReturn: origin }, '', hash);
    NS.renderRoute();
  }
  function closeSearch() {
    cancelSearchTimer();
    syncSearchInput('');
    if (searchRoute()) { window.history.replaceState(null, '', searchOrigin()); }
    NS.renderRoute();
  }
  function initSearch() {
    var box = document.getElementById('search-input');
    function schedule() {
      cancelSearchTimer();
      if (composing) { return; }
      searchTimer = setTimeout(function () { runSearch(box.value); }, 150);
    }
    box.addEventListener('compositionstart', function () { composing = true; cancelSearchTimer(); });
    box.addEventListener('compositionend', function () { composing = false; schedule(); });
    box.addEventListener('input', schedule);
    var clear = document.getElementById('search-clear');
    if (clear) { clear.addEventListener('click', function () { closeSearch(); box.focus(); }); }
    window.addEventListener('keydown', function (ev) {
      if (ev.isComposing || composing || ev.keyCode === 229) { return; }
      var target = ev.target || {};
      var editable = /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName || '') || target.isContentEditable;
      if (((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') || (ev.key === '/' && !editable && !ev.ctrlKey && !ev.metaKey && !ev.altKey)) {
        if (document.body.classList.contains('zoom-open') || document.body.classList.contains('nav-open')) { return; }
        ev.preventDefault(); box.focus(); box.select(); return;
      }
      if (ev.key === 'Escape' && searchRoute() && !document.body.classList.contains('zoom-open') && !document.body.classList.contains('nav-open') && !document.body.classList.contains('tools-open')) {
        ev.preventDefault(); closeSearch(); box.focus(); return;
      }
      var onBox = target === box;
      var onResult = target.classList && target.classList.contains('search-item');
      if (!onBox && !onResult) { return; }
      if (ev.key === 'Enter' && onBox) { ev.preventDefault(); runSearch(box.value); return; }
      if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') { return; }
      if (onBox && searchTimer) { runSearch(box.value); }
      var links = Array.prototype.slice.call(document.querySelectorAll('.search-item'));
      if (!links.length) { return; }
      ev.preventDefault();
      var index = links.indexOf(target) + (ev.key === 'ArrowDown' ? 1 : -1);
      if (index < 0) { box.focus(); } else { links[Math.min(index, links.length - 1)].focus(); }
    });
  }

  Object.assign(NS, { buildSearch, highlightNodes, searchRoute, runSearch, renderSearchRoute, initSearch, cancelSearchTimer, syncSearchInput });
})();
