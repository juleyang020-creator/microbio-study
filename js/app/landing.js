(function () {
  'use strict';
  var Core = window.Core, View = window.View;
  var NS = window.AppNS = window.AppNS || {};
  var el = NS.el;
  // 总览图置于模块首页最前；介绍、最近浏览与分类入口接在图后。
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
    glossary: [{ src: 'img/landing-glossary.svg', cap: '术语表总览' }],
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
    var data = NS.db(), entries = data[moduleKey] || [];
    function browse(index) {
      if (NS.isMobile()) { NS.setNavOpen(true); }
      var target = document.getElementById(index == null ? 'sidebar' : 'category-' + moduleKey + '-' + index);
      if (target) {
        target.focus({ preventScroll: true });
        if (index == null) { target.scrollTop = 0; }
        else { target.scrollIntoView({ block: 'start' }); }
      }
    }
    function entryLink(entry) {
      return el('a', { cls: 'landing-entry', href: '#/' + moduleKey + '/' + entry.id, text: entry.名称 });
    }
    var nodes = [ el('header', { cls: 'landing-head' }, [
      el('p', { cls: 'eyebrow', text: '知微 · 学习与速查' }),
      el('div', { cls: 'landing-title-row' }, [
        el('h1', { cls: 'landing-title', text: View.moduleLabel(moduleKey) }),
        el('span', { cls: 'landing-count', text: entries.length + ' 个条目' })
      ]),
      el('p', { cls: 'landing-intro', text: '按分类浏览，或用顶部搜索直达条目。中文名、拉丁名和常用简称均可检索。' }),
      el('div', { cls: 'landing-actions' }, [
        el('button', { cls: 'action-btn action-primary', type: 'button', text: '浏览分类目录', onClick: function () { browse(); } }),
        el('button', { cls: 'action-btn', type: 'button', text: '搜索条目 /', onClick: function () { document.getElementById('search-input').focus(); } })
      ])
    ]) ];
    var index = Core.buildIndex(data);
    var recent = NS.browseHistory().filter(function (h) { return index[h.id]; }).slice(0, 4);
    if (recent.length) {
      nodes.push(el('section', { cls: 'landing-recent' }, [
        el('h2', { cls: 'landing-section-title', text: '继续阅读' }),
        el('div', { cls: 'landing-recent-links' }, recent.map(function (h) {
          var hit = index[h.id];
          return el('a', { cls: 'recent-link', href: '#/' + hit.module + '/' + h.id, text: hit.entry.名称 + ' →' });
        }))
      ]));
    }
    var roots = NS.categories()[moduleKey] || [];
    var cards = roots.map(function (root, i) {
      var names = [];
      function collect(node) { names.push(node.名称); (node.子类 || []).forEach(collect); }
      collect(root);
      var items = entries.filter(function (e) { return names.indexOf(e.类别) !== -1; });
      if (!items.length) { return null; }
      return el('section', { cls: 'landing-category' }, [
        el('div', { cls: 'landing-category-head' }, [ el('h3', { text: root.名称 }), el('span', { text: items.length + ' 条' }) ]),
        el('div', { cls: 'landing-entry-list' }, items.slice(0, 4).map(entryLink)),
        el('button', { cls: 'category-browse', type: 'button', text: '浏览此分类 →', onClick: function () { browse(i); } })
      ]);
    }).filter(Boolean);
    if (!cards.length) { cards.push(el('div', { cls: 'landing-category' }, entries.slice(0, 8).map(entryLink))); }
    nodes.push(el('section', { cls: 'landing-catalogue' }, [
      el('h2', { cls: 'landing-section-title', text: '分类浏览' }),
      el('div', { cls: 'landing-grid' }, cards)
    ]));
    nodes.unshift(el('section', { cls: 'landing-diagrams' }, [
      el('h2', { cls: 'landing-section-title', text: '图示总览' }),
      el('p', { cls: 'landing-intro', text: '点击图片可放大阅读。' }),
      el('div', { cls: 'landing-figures' }, (LANDING[moduleKey] || []).map(function (g) {
        return el('figure', { cls: 'mechanism-fig' }, [
          NS.zoomableImg(NS.imgV(g.src), g.cap, g.cap),
          el('figcaption', { cls: 'mechanism-cap', text: g.cap })
        ]);
      }))
    ]));
    return [ el('div', { cls: 'landing' }, nodes) ];
  }
  Object.assign(NS, { LANDING, buildLanding });
})();
