(function () {
  'use strict';
  var Core = window.Core, View = window.View;
  var NS = window.AppNS = window.AppNS || {};
  var APP_VERSION = NS.APP_VERSION, el = NS.el, fill = NS.fill, renderSidebar = NS.renderSidebar, routeKey = NS.routeKey, setActiveTab = NS.setActiveTab, setActiveTool = NS.setActiveTool;
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

  // ===== 工具：菌名速查 =====
  // 跳转分三级（均为权威来源、国内可达；不再使用百度百科）：
  //   ① 本库已收录 → 应用内详情页（离线、已校对）
  //   ② 未收录但为全写拉丁名 → NCBI Taxonomy 精确条目
  //   ③ 缩写属名/仅属名/其他 → PubMed 文献检索（分类库无法精确命中时仍能给出可用结果）
  function isMicrobeNamesRoute() { return routeKey() === 'microbe-names'; }
  var mnFilter = '';
  function mnLetter(lat) { var c = (lat || '').charAt(0).toUpperCase(); return /[A-Z]/.test(c) ? c : '#'; }
  // 革兰大类徽章（数据来自 Bruker MBT 主库的分类列）。缩到 1–2 字，否则会挤掉菌名。
  var MN_KIND_SHORT = { '革兰阳性': 'G+', '革兰阴性': 'G−', '酵母菌': '酵母', '丝状真菌': '霉', '分枝杆菌': '分枝' };
  var MN_KIND_CLS = { '革兰阳性': 'gp', '革兰阴性': 'gn', '酵母菌': 'y', '丝状真菌': 'm', '分枝杆菌': 'tb' };
  var _mnLibIndex = null;
  function mnNorm(s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  // 菌名速查收录的名称集合（含别名），供「相似菌与鉴别」判断该不该给链接。建一次即可。
  var _mnNameSet = null;
  function mnHasName(name) {
    if (!_mnNameSet) {
      _mnNameSet = {};
      ((window.DB && window.DB.microbeNames) || []).forEach(function (m) {
        if (m.名称) { _mnNameSet[mnNorm(m.名称)] = true; }
        String(m.别名 || '').split('、').forEach(function (a) { if (a) { _mnNameSet[mnNorm(a)] = true; } });
      });
    }
    return !!_mnNameSet[mnNorm(name)];
  }
  // 本库微生物索引：中文名 / 拉丁名 → id
  function mnLibIndex() {
    if (_mnLibIndex) { return _mnLibIndex; }
    var idx = {};
    ((window.DB && window.DB.microbes) || []).forEach(function (m) {
      if (m.名称) { idx[mnNorm(m.名称)] = m.id; }
      if (m.拉丁名) { idx[mnNorm(m.拉丁名)] = m.id; }
    });
    _mnLibIndex = idx;
    return idx;
  }
  // 返回 { href, external, title, tag }
  function mnTarget(m) {
    var id = mnLibIndex()[mnNorm(m.名称)] || mnLibIndex()[mnNorm(m.拉丁名)];
    if (id) {
      return { href: '#/microbes/' + id, external: false, title: '本库已收录，查看详情：' + m.名称, tag: '本库' };
    }
    // 中国 CDC《人间传染的病原微生物目录》优先：中文界面，直出危害程度分类 / BSL 等级 / 运输包装——
    // 检验科拿到陌生菌最先要查的就是这些。命中条件（按序）：
    // ① 中文名与目录条目全等；② 拉丁属名全拼在目录属集合；③ 缩写式拉丁名（B. abortus）用中文属词根消歧
    //    ——中文名含词根、且缩写首字母与词根对应属一致；短词根（≤2 字）要求「词根+菌」连写，
    //    防「布鲁塞尔酒香酵母(Brettanomyces)」「马来布鲁丝虫(Brugia)」这类同首字母误伤。
    // 目录未收的（环境菌、非管制菌如曲霉/念珠菌多数种）回落 NCBI / PubMed。
    var nprc = (window.DB && window.DB.nprcCatalogue) || null;
    if (nprc) {
      var hitCn = nprc.中文.indexOf(m.名称) !== -1;
      // 属名后允许串尾（裸属名「Brucella」也要能命中），不强制后跟空格/点
      var g = String(m.拉丁名 || '').trim().match(/^([A-Z][a-z]+)(?:[\s.]|$)/);
      var hitGenus = !!(g && nprc.拉丁属.indexOf(g[1]) !== -1);
      var rootGenus = null;
      if (!hitCn && !hitGenus && /^[A-Z]\.\s?\S/.test(String(m.拉丁名 || '').trim())) {
        var roots = nprc.属词根 || {};
        for (var k in roots) {
          if (!Object.prototype.hasOwnProperty.call(roots, k)) { continue; }
          if (m.名称.indexOf(k) === -1 || roots[k].charAt(0) !== String(m.拉丁名).charAt(0)) { continue; }
          if (k.length <= 2 && m.名称.indexOf(k + '菌') === -1) { continue; }
          rootGenus = roots[k]; break;
        }
      }
      if (hitCn || hitGenus || rootGenus) {
        // 搜索词必须保证 NPRC 有结果（目录仅 513 条，种名未必在列，搜种名会落到「暂无相关数据」空页）：
        // 中文名精确命中 → 搜中文名（直出该条目）；属级命中 → 只搜拉丁属名全拼——
        // 属名必能命中目录的模糊匹配（该属的种级/属级 spp. 条目全部带出）。
        var genus = g ? g[1] : rootGenus;
        var term = hitCn ? m.名称 : genus;
        var cls = hitCn ? (nprc.分类[m.名称] || '') : '';
        return {
          href: 'https://www.nprc.org.cn/#/DiseaseSearch?selectall=' + encodeURIComponent(term),
          external: true,
          title: '在中国 CDC 病原微生物目录查询：' + m.名称 + (cls ? '（' + cls + '）' : (genus ? '（按属检索：' + genus + '）' : '')),
          tag: 'CDC目录'
        };
      }
    }
    var lat = String(m.拉丁名 || '').trim();
    if (/^[A-Z][a-z]{2,}\s+\S/.test(lat)) { // 全写「属 种」→ NCBI 分类可精确命中
      return {
        href: 'https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?name=' + encodeURIComponent(lat),
        external: true, title: '在 NCBI Taxonomy 查看：' + lat, tag: ''
      };
    }
    // 缩写属名/仅属名：分类库无法精确命中，回落 PubMed 文献检索
    var term = lat || m.名称 || '';
    return {
      href: 'https://pubmed.ncbi.nlm.nih.gov/?term=' + encodeURIComponent(term),
      external: true, title: '在 PubMed 检索：' + term, tag: ''
    };
  }
  var mnTimer = null;
  function renderMicrobeNames() {
    setActiveTool('microbe-names');
    // 支持 #/microbe-names/<关键词> 直接带词进来。用途：详情页「相似菌与鉴别」里那些
    // 已从微生物分类精简移除、没有详情页的菌（如空肠弯曲菌），链到这里而不是变成死路。
    // URL 即唯一来源：带词就填词，不带就清空。否则筛选词会跨路由粘住，
    // 用户从别处回到速查时看到一个自己没输过的过滤结果。
    mnFilter = decodeURIComponent((location.hash || '').replace(/^#\/?/, '').split('/').slice(1).join('/') || '');
    var list = (window.DB && window.DB.microbeNames) || [];
    // 侧栏保持精简：仅说明，不放搜索框（搜索移到正文，手机端搜索与结果同屏）
    fill(document.getElementById('sidebar'), [ el('div', { cls: 'cat-group' }, [
      el('div', { cls: 'cat-group-name', text: '菌名速查' }),
      el('div', { cls: 'cmp-hint', text: '微生物名称索引（按拉丁名字母序）。本库已收录者跳应用内详情，其余跳 NCBI Taxonomy / PubMed。' })
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
      el('div', { cls: 'lw-note', text: '微生物名称索引（中文 + 拉丁，共 ' + list.length + ' 条，按拉丁名字母顺序）——标「本库」者跳应用内详情页（离线）；标「CDC目录」者跳中国 CDC《人间传染的病原微生物目录》（中文，含危害程度分类 / BSL 等级 / 运输包装）；其余跳 NCBI Taxonomy（全写拉丁名）或 PubMed 文献检索。' }),
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
    // 别名要参与检索：Bruker 软件打印的中文名常与本库首选名不同（「分散」vs「散布」不动杆菌），
    // 不搜别名的话，照着 MALDI 报告去查反而查不到。
    var filtered = q ? list.filter(function (m) {
      return (m.名称 + ' ' + (m.拉丁名 || '') + ' ' + (m.别名 || '')).toLowerCase().indexOf(q) !== -1;
    }) : list;
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
      var t = mnTarget(m);
      var opts = { cls: 'mn-item' + (t.tag ? ' mn-item-lib' : ''), href: t.href, title: t.title };
      if (t.external) { opts.target = '_blank'; opts.rel = 'noopener noreferrer'; }
      var kids = [ el('span', { cls: 'mn-nm', text: m.名称 }), el('span', { cls: 'mn-lt', text: m.拉丁名 || '' }) ];
      if (m.类) { kids.push(el('span', { cls: 'mn-kind mn-kind-' + MN_KIND_CLS[m.类], text: MN_KIND_SHORT[m.类] || m.类 })); }
      if (t.tag) { kids.push(el('span', { cls: 'mn-tag', text: t.tag })); }
      grid.appendChild(el('a', opts, kids));
    });
    if (filtered.length === 0) { nodes.push(el('div', { cls: 'empty', text: '没有匹配的菌名。' })); }
    fill(document.getElementById('mn-results'), nodes);
  }

  Object.assign(NS, { MN_KIND_CLS, MN_KIND_SHORT, _mnLibIndex, _mnNameSet, cacheStatusLine, isAboutRoute, isLabWorkflowRoute, isMicrobeNamesRoute, lwList, mnFilter, mnHasName, mnLetter, mnLibIndex, mnNorm, mnTarget, mnTimer, renderAbout, renderLabWorkflow, renderMicrobeNames, renderMicrobeNamesResults, sourceMetadataLines });
})();
