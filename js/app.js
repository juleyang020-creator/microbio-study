(function () {
  'use strict';
  var Core = window.Core, View = window.View;
  var MODULES = Core.MODULE_KEYS;

  function db() {
    var DB = window.DB || {};
    return { microbes: DB.microbes || [], antibiotics: DB.antibiotics || [], resistance: DB.resistance || [] };
  }
  function categories() { return (window.DB && window.DB.categories) || {}; }

  // 安全建节点：文本一律走 textContent，内容不会被当作标记解析
  function el(tag, opts, children) {
    var node = document.createElement(tag);
    opts = opts || {};
    if (opts.cls != null) { node.className = opts.cls; }
    if (opts.text != null) { node.textContent = opts.text; }
    if (opts.href != null) { node.setAttribute('href', opts.href); }
    if (opts.src != null) { node.setAttribute('src', opts.src); }
    if (opts.alt != null) { node.setAttribute('alt', opts.alt); }
    if (opts.title != null) { node.setAttribute('title', opts.title); }
    (children || []).forEach(function (c) { if (c) { node.appendChild(c); } });
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

  function setActiveTab(moduleKey) {
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) {
      t.classList.toggle('active', t.getAttribute('data-module') === moduleKey);
    });
  }

  function buildSidebar(vm) {
    var nodes = [];
    vm.groups.forEach(function (g) {
      var kids = [ el('div', { cls: 'cat-group-name', text: g.名称 }) ];
      g.子类.forEach(function (leaf) {
        kids.push(el('div', { cls: 'cat-leaf', text: leaf.名称 }));
        leaf.entries.forEach(function (e) {
          kids.push(el('a', { cls: 'entry-link' + (e.selected ? ' selected' : ''), text: e.名称, href: e.href }));
        });
      });
      nodes.push(el('div', { cls: 'cat-group' }, kids));
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
        el('img', { cls: 'mechanism-img', src: vm.机制图, alt: '作用机制示意图' }),
        el('figcaption', { cls: 'mechanism-cap', text: '作用机制示意图' })
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

    var relKids = [ el('div', { cls: 'relations-label', text: '🔗 关联' }) ];
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
      return link;
    });
    nodes.push(el('div', { cls: 'search-list' }, items));
    return nodes;
  }

  function renderRoute() {
    var route = parseHash();
    var data = db();
    setActiveTab(route.module);
    fill(document.getElementById('sidebar'), buildSidebar(View.sidebarVM(route.module, categories(), data[route.module], route.id)));

    var entry = null, rels = [], mechImg = null;
    if (route.id) {
      var hit = Core.buildIndex(data)[route.id];
      entry = hit ? hit.entry : null;
      rels = entry ? Core.getRelations(route.id, data) : [];
      mechImg = View.mechanismImageFor(route.module, entry, categories());
    }
    fill(document.getElementById('main'), buildDetail(View.detailVM(entry, rels, mechImg)));
  }

  function runSearch(query) {
    fill(document.getElementById('main'), buildSearch(View.searchVM(Core.searchEntries(db(), query), query)));
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) {
      t.addEventListener('click', function () {
        document.getElementById('search-input').value = '';
        location.hash = '#/' + t.getAttribute('data-module');
      });
    });

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
