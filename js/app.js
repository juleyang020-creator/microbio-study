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
    if (opts.style != null) { node.setAttribute('style', opts.style); }
    if (opts.onClick) { node.addEventListener('click', opts.onClick); }
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

    if (vm.生化反应 && vm.生化反应.length) {
      var bioRows = vm.生化反应.map(function (b) {
        return el('div', { cls: 'biochem-row' }, [
          el('span', { cls: 'biochem-key', text: b.项目 }),
          el('span', { cls: 'biochem-val', text: b.结果 })
        ]);
      });
      nodes.push(el('div', { cls: 'biochem' }, [
        el('div', { cls: 'biochem-title', text: '🧪 生化反应' }),
        el('div', { cls: 'biochem-rows' }, bioRows)
      ]));
    }

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
      nodes.push(el('div', { cls: 'differential' }, [ el('div', { cls: 'diff-title', text: '🔍 相似菌与鉴别' }) ].concat(diffItems)));
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
      biochem: (entry && window.DB.biochem) ? window.DB.biochem[entry.id] : null,
      differential: (entry && window.DB.differential) ? window.DB.differential[entry.id] : null
    };
    fill(document.getElementById('main'), buildDetail(View.detailVM(entry, rels, extras)));
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
