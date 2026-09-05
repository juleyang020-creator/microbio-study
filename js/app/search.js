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
  function buildSearch(vm) {
    var nodes = [ el('div', { cls: 'search-head', text: '搜索：“' + vm.query + '”' }) ];
    if (vm.items.length === 0) {
      nodes.push(el('div', { cls: 'empty', text: '没有找到匹配的条目。' }));
      return nodes;
    }
    var tokens = vm.tokens || [];
    var items = vm.items.map(function (r) {
      var link = el('a', { cls: 'search-item', href: r.href }, [
        el('span', { cls: 'tag tag-' + r.module, text: View.moduleLabel(r.module) }),
        document.createTextNode(' ')
      ]);
      highlightNodes(r.名称, tokens).forEach(function (n) { link.appendChild(n); }); // 名称高亮
      if (r.命中片段) { // 命中上下文片段（含来源字段）
        var ctx = el('div', { cls: 'search-context' });
        if (r.命中字段) { ctx.appendChild(el('span', { cls: 'search-context-field', text: r.命中字段 + '：' })); }
        highlightNodes(r.命中片段, tokens).forEach(function (n) { ctx.appendChild(n); });
        link.appendChild(ctx);
      } else if (r.摘要) {
        link.appendChild(el('span', { cls: 'search-summary', text: r.摘要 }));
      }
      return link;
    });
    nodes.push(el('div', { cls: 'search-list' }, items));
    return nodes;
  }

  Object.assign(NS, { buildSearch, highlightNodes });
})();
