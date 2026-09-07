(function () {
  'use strict';
  var Core = window.Core, View = window.View;
  var NS = window.AppNS = window.AppNS || {};
  var CARD_TEST = NS.CARD_TEST, COMBO_BP_NOTE = NS.COMBO_BP_NOTE, abxIdByDrugText = NS.abxIdByDrugText, abxIdByName = NS.abxIdByName, biochemTestIdByName = NS.biochemTestIdByName, bpHasCombo = NS.bpHasCombo, bpThead = NS.bpThead, bpTierBadge = NS.bpTierBadge, bpTierLegend = NS.bpTierLegend, bpUrineChip = NS.bpUrineChip, compareCardSet = NS.compareCardSet, compareSet = NS.compareSet, el = NS.el, euHasZone = NS.euHasZone, eucastBadgeNodes = NS.eucastBadgeNodes, eucastCell = NS.eucastCell, eucastNoteNode = NS.eucastNoteNode, eucastZoneCell = NS.eucastZoneCell, imgV = NS.imgV, isFavorited = NS.isFavorited, mnHasName = NS.mnHasName, parseHash = NS.parseHash, toggleFavorite = NS.toggleFavorite;
  // ===== 示意图点击放大 =====
  // 示意图信息密度高，缩到手机宽度后标签仅约 8px；提供全屏查看，避免整页缩放的笨拙操作。
  var _zoomEl = null;
  function closeImageZoom() {
    if (!_zoomEl) { return; }
    document.removeEventListener('keydown', _zoomEsc);
    if (_zoomEl.parentNode) { _zoomEl.parentNode.removeChild(_zoomEl); }
    _zoomEl = null;
    document.body.classList.remove('zoom-open');
  }
  function _zoomEsc(e) { if (e.key === 'Escape') { closeImageZoom(); } }
  function openImageZoom(src, caption) {
    closeImageZoom();
    var img = el('img', { cls: 'zoom-img', src: src, alt: caption || '' });
    // 竖屏手机看横向示意图时，宽度只有约 340px，放大等于没放大；
    // 此时旋转 90° 改用屏幕长边显示，可得约 2.4 倍尺寸。
    img.addEventListener('load', function () {
      var landscape = img.naturalWidth > img.naturalHeight * 1.15;
      var portrait = window.innerHeight > window.innerWidth;
      if (landscape && portrait && _zoomEl) {
        _zoomEl.classList.add('rotate');
        var hint = _zoomEl.querySelector('.zoom-cap');
        if (hint) { hint.textContent = (caption ? caption + '　·　' : '') + '已横向显示以便阅读，点击任意处关闭'; }
      }
    });
    _zoomEl = el('div', {
      cls: 'zoom-overlay', role: 'dialog', 'aria-label': (caption || '示意图') + '（放大查看）',
      onClick: closeImageZoom
    }, [
      img,
      caption ? el('div', { cls: 'zoom-cap', text: caption }) : null,
      el('button', { cls: 'zoom-close', type: 'button', 'aria-label': '关闭', text: '×', onClick: closeImageZoom })
    ]);
    document.body.appendChild(_zoomEl);
    document.body.classList.add('zoom-open');
    document.addEventListener('keydown', _zoomEsc);
  }
  // 可放大的示意图（点击 / Enter / Space 均可打开）
  function zoomableImg(src, alt, caption) {
    return el('img', {
      cls: 'mechanism-img zoomable', src: src, alt: alt || '', title: '点击放大',
      onActivate: function () { openImageZoom(src, caption || alt); }
    });
  }

  // 形态图轮播：单图占位、高度受限（不喧宾夺主）；移动端靠 CSS scroll-snap 原生左右滑动，
  // 桌面端用左右按钮；底部圆点指示当前位置。图片懒加载。
  function buildPhotoCarousel(list) {
    var track = el('div', { cls: 'photo-track' });
    var hasAtlas = list.some(function (p) { return !p.PHIL; });
    list.forEach(function (p) {
      var isCDC = !!p.PHIL;
      var capEls = [ el('span', { cls: 'photo-cap-cn', text: p.说明 }) ];
      if (isCDC) {
        capEls.push(el('a', {
          cls: 'photo-src', href: 'https://wwwn.cdc.gov/PHIL/details.aspx?pid=' + p.PHIL,
          target: '_blank', rel: 'noopener noreferrer',
          title: (p.摄影 || p.供图 || 'CDC') + ' — 查看 PHIL 原始条目与授权说明',
          text: 'CDC PHIL #' + p.PHIL
        }));
      } else {
        capEls.push(el('span', {
          cls: 'photo-src photo-src-atlas',
          title: '《实用临床微生物学检验与图谱》人卫2025 · 仅供个人学习',
          text: '图谱'
        }));
      }
      track.appendChild(el('div', { cls: 'photo-slide' }, [
        el('img', {
          cls: 'photo-img zoomable', src: imgV(p.文件), alt: p.说明, loading: 'lazy',
          onActivate: (function (q) { return function () { openImageZoom(imgV(q.文件), q.说明 + (q.英文说明 ? '（' + q.英文说明 + '）' : '')); }; })(p),
          title: p.英文说明 || p.说明
        }),
        el('div', { cls: 'photo-cap' }, capEls)
      ]));
    });

    var single = list.length < 2;
    var dots = el('div', { cls: 'photo-dots' });
    var dotEls = [];
    function go(i) {
      var n = Math.max(0, Math.min(list.length - 1, i));
      // 直接赋值 scrollLeft；不用 scrollTo({behavior:'smooth'})——在 scroll-snap 容器上会静默失效。
      track.scrollLeft = n * track.clientWidth;
      sync(); // 程序化滚动不触发 scroll 事件，需手动同步圆点（手指滑动则由下方监听兜底）
    }
    function current() {
      return track.clientWidth ? Math.round(track.scrollLeft / track.clientWidth) : 0;
    }
    function sync() {
      var c = current();
      dotEls.forEach(function (d, i) {
        if (i === c) { d.classList.add('on'); d.setAttribute('aria-current', 'true'); }
        else { d.classList.remove('on'); d.removeAttribute('aria-current'); }
      });
    }
    if (!single) {
      list.forEach(function (p, i) {
        var d = el('button', {
          cls: 'photo-dot' + (i === 0 ? ' on' : ''), type: 'button',
          'aria-label': '第 ' + (i + 1) + '/' + list.length + ' 张：' + p.说明,
          onClick: function () { go(i); }
        });
        dotEls.push(d);
        dots.appendChild(d);
      });
      track.addEventListener('scroll', function () {
        if (track._t) { clearTimeout(track._t); }
        track._t = setTimeout(sync, 60);
      });
    }

    var viewport = el('div', { cls: 'photo-viewport' }, [ track ]);
    if (!single) {
      viewport.appendChild(el('button', {
        cls: 'photo-nav prev', type: 'button', 'aria-label': '上一张',
        onClick: function () { go(current() - 1); }, text: '‹'
      }));
      viewport.appendChild(el('button', {
        cls: 'photo-nav next', type: 'button', 'aria-label': '下一张',
        onClick: function () { go(current() + 1); }, text: '›'
      }));
    }

    return el('div', { cls: 'morphology photos' }, [
      el('div', { cls: 'morph-title' }, [
        document.createTextNode('真实形态图'),
        el('span', { cls: 'photo-count', text: list.length > 1 ? ('　' + list.length + ' 张 · 可左右滑动') : '' }),
        el('span', { cls: 'photo-lic', text: hasAtlas ? '图谱 · 人卫2025 ＋ CDC PHIL' : 'CDC PHIL · 公有领域' })
      ]),
      viewport,
      dots
    ]);
  }

  // ===== 详情页正文富渲染：分层 + 站内链接 =====
  // ① 长正文（>120 字或含「；」「。」分句）拆成要点列表，视觉分层；
  // ② 正文中出现库内菌名/药名时自动变为可点击链接（跳对应词条）。
  // 词典： microbes 名称→#/microbes/id；药物名→#/antibiotics/id；速查别名→#/microbe-names/<名>。
  var _linkDict = null;
  function linkDict() {
    if (_linkDict) { return _linkDict; }
    var dict = {};
    var DB = window.DB || {};
    (DB.microbes || []).forEach(function (m) { if (m.名称 && m.id) { dict[m.名称] = '#/microbes/' + m.id; } });
    (DB.antibiotics || []).forEach(function (a) {
      if (!a.名称 || !a.id || dict[a.名称]) { return; }
      dict[a.名称] = '#/antibiotics/' + a.id;
      // 复方药的连字符/全角斜杠变体也注册：正文写「阿莫西林-克拉维酸」时整串命中，
      // 避免只有前半成分成链、后半落空造成「半截复方」的破碎观感（诺卡菌药敏实测踩过）。
      if (/[\/／]/.test(a.名称)) {
        var parts = a.名称.split(/[\/／]/).map(function (x) { return x.trim(); }).filter(Boolean);
        ['- ', '／'].forEach(function (sep) {
          var variant = parts.join(sep.trim());
          if (variant && !dict[variant]) { dict[variant] = '#/antibiotics/' + a.id; }
        });
      }
    });
    // 药敏简写（白名单）：MEM=美罗培南等 34 个无歧义高频简写。不能全收——
    // CF（囊性纤维化）、CT（CT 扫描/霍乱肠毒素）、OXA（OXA 酶）等会误伤，实测踩过。
    var ABBR_OK = ['MEM','IPM','ETP','VAN','TEC','LZD','TZD','CZD','DAP','CIP','OFX','GEN','TOB','AZM','ERY','CLR','CLI','TGC','DOX','CHL','RIF','FOS','NIT','SXT','TZP','CST','AMB','FLU','VRC','POS','ISA','MCF','CAS','5FC'];
    (DB.antibiotics || []).forEach(function (a) {
      var ab = (a.药敏简写 || '').trim();
      if (ab && ABBR_OK.indexOf(ab) !== -1 && !dict[ab]) { dict[ab] = '#/antibiotics/' + a.id; }
    });
    // 菌群/耐药表型简写 → 对应词条（或模块）。均为约定俗成缩写，无正文歧义。
    // 注意：glossary 模块上线后 MRSA/VRE/CoNS 等已有专属术语条目，
    // 这张表退为「无术语条目时」的兜底代理（链接到最相关微生物/耐药条目）。
    [['VISA','staph-aureus'],['VRSA','staph-aureus'],['BLNAR','haemophilus-influenzae'],['NTM','mycobacterium-genus']].forEach(function (p) {
      if (!dict[p[0]] && (DB.microbes || []).some(function (m) { return m.id === p[1]; })) { dict[p[0]] = '#/microbes/' + p[1]; }
    });
    // 其他内容模块条目名：试验/培养基/染色/检测卡/耐药因素/术语——正文提到即链
    [['tests', 'tests'], ['media', 'media'], ['staining', 'staining'], ['cards', 'cards'], ['resistance', 'resistance'], ['virulence', 'virulence'], ['genetics', 'genetics'], ['glossary', 'glossary'], ['biochemTests', 'biochem-tests']].forEach(function (pair) {
      (DB[pair[0]] || []).forEach(function (t) { if (t.名称 && t.id && !dict[t.名称]) { dict[t.名称] = '#/' + pair[1] + '/' + t.id; } });
    });
    // 裸缩写注册：把条目名前缀的英文缩写（如「ESBL（超广谱β-内酰胺酶）」的 ESBL、
    // 「MHA / CAMHB（药敏培养基）」的 MHA 与 CAMHB）也注册为链接键——正文写裸缩写同样可跳。
    // 规则：名称以拉丁串开头且紧跟全角/半角括号；只收纯字母数字词（≥3 字符），
    // 用「/」分隔的多个缩写各自注册；后面已有全名条目占用的不覆盖。
    // 注意排除单字母（S/I/R 这类单字母上下文歧义太大，不注册）。
    [['tests', 'tests'], ['media', 'media'], ['staining', 'staining'], ['cards', 'cards'], ['resistance', 'resistance'], ['virulence', 'virulence'], ['genetics', 'genetics'], ['glossary', 'glossary'], ['biochemTests', 'biochem-tests']].forEach(function (pair) {
      (DB[pair[0]] || []).forEach(function (t) {
        if (!t.名称 || !t.id) { return; }
        var m = /^([A-Za-z][A-Za-z0-9][A-Za-z0-9\/\-\+ ]*?)\s*[（(]/.exec(t.名称);
        if (!m) { return; }
        m[1].split(/\s*\/\s*/).forEach(function (raw) {
          var ab = raw.trim();
          if (/^[A-Za-z][A-Za-z0-9-]+$/.test(ab) && ab.length >= 3 && !dict[ab]) { dict[ab] = '#/' + pair[1] + '/' + t.id; }
        });
      });
    });
    // 分类树属叶子名兜底：正文中「XX菌属」指到该属的 spp. 总览条目（无 spp. 则指第一个种）
    (DB.categories && DB.categories.microbes || []).forEach(function walkCat(n) {
      if (!n || !n.名称) { return; }
      if (n.子类 && n.子类.length) { n.子类.forEach(walkCat); return; }
      if (!dict[n.名称]) {
        var genusEntry = (DB.microbes || []).find(function (m) { return m.名称 === n.名称; });
        if (genusEntry) { dict[n.名称] = '#/microbes/' + genusEntry.id; }
      }
    });
    // 真菌形态结构名 → 术语·微生物结构「真菌菌丝与孢子」条目：
    // biochem.js 真菌条目的「大分生孢子」「厚壁孢子」「假菌丝」等项目高频出现，
    // 不是独立条目名，这里显式注册指向术语总览。
    [['大分生孢子','gloss-hypha-spore-fungi'],['小分生孢子','gloss-hypha-spore-fungi'],['厚壁孢子','gloss-hypha-spore-fungi'],['厚膜孢子','gloss-hypha-spore-fungi'],['假菌丝','gloss-hypha-spore-fungi'],['真假菌丝','gloss-hypha-spore-fungi'],['假根','gloss-hypha-spore-fungi'],['匍匐菌丝','gloss-hypha-spore-fungi'],['分生孢子','gloss-hypha-spore-fungi'],['分生孢子链','gloss-hypha-spore-fungi'],['关节孢子','gloss-hypha-spore-fungi'],['芽生孢子','gloss-hypha-spore-fungi'],['子囊孢子','gloss-hypha-spore-fungi'],['瓶梗','gloss-hypha-spore-fungi'],['帚状枝','gloss-hypha-spore-fungi'],['荚膜','gloss-capsule'],['芽孢','gloss-spore'],['异染颗粒','gloss-metachromatic']].forEach(function (p) {
      if (!dict[p[0]] && (DB.glossary || []).some(function (g) { return g.id === p[1]; })) { dict[p[0]] = '#/glossary/' + p[1]; }
    });
    (DB.microbeNames || []).forEach(function (n) {
      if (!n.别名) { return; }
      var target = dict[n.名称] || ('#/microbe-names/' + encodeURIComponent(n.名称));
      String(n.别名).split(/[/、,，]/).forEach(function (raw) {
        var a = raw.trim();
        // 别名太短会误伤正文（如「金葡」「肺链」这类只收长度 ≥3 且未被占用的）
        if (a.length >= 3 && !dict[a]) { dict[a] = target; }
      });
    });
    _linkDict = Object.keys(dict).sort(function (a, b) { return b.length - a.length; })
      .reduce(function (o, k) { o[k] = dict[k]; return o; }, {});
    return _linkDict;
  }

  // 把一段纯文本渲染为「带站内链接的行内节点数组」。匹配规则：长名优先，已命中区间不再嵌套匹配。
  function richInline(text) {
    var keys = linkDict();
    var out = [];
    var rest = String(text == null ? '' : text);
    var guard = 0;
    while (rest.length && guard++ < 4000) {
      var hit = null;
      for (var k in keys) {
        var at = rest.indexOf(k);
        if (at === 0 || (at > 0)) {
          // 纯拉丁字母词（药敏简写/菌群缩写）要求两侧词边界，防止 SXT 命中 SXTabc、MEM 命中 eMEMbers
          if (/^[A-Za-z0-9]+$/.test(k)) {
            var L = at > 0 ? rest.charAt(at - 1) : '';
            var R = rest.charAt(at + k.length) || '';
            if (/[A-Za-z0-9]/.test(L) || /[A-Za-z]/.test(R)) { continue; }
          }
          if (at === 0) { hit = { name: k, len: k.length }; break; }
          if (hit === null || at < hit.at) { hit = { name: k, len: k.length, at: at }; }
        }
      }
      if (!hit) { out.push(document.createTextNode(rest)); break; }
      var at = hit.at || 0;
      if (at > 0) { out.push(document.createTextNode(rest.slice(0, at))); }
      out.push(el('a', { cls: 'wiki-link', text: hit.name, href: keys[hit.name], title: '查看词条：' + hit.name }));
      rest = rest.slice(at + hit.len);
    }
    return out;
  }

  // 长正文分层：按中文分号/句号切句，超过 2 句且总长 >120 字时渲染为要点列表；括号引导语提亮。
  function richBody(text) {
    var s = String(text == null ? '' : text);
    var lines = [];
    // 先按换行分段（white-space:pre-wrap 时代的手动换行保留为段落）
    s.split(/\n+/).forEach(function (para) {
      para = para.trim();
      if (!para) { return; }
      var isBulleted = /^[•·\-\*]/.test(para);
      if (isBulleted) { lines.push({ t: 'li', text: para.replace(/^[•·\-\*]\s*/, '') }); return; }
      // 拆「；」分句（保留括号内嵌套——只在括号深度 0 时切）
      var depth = 0, buf = '', parts = [];
      for (var i = 0; i < para.length; i++) {
        var c = para[i];
        if (c === '（' || c === '(') { depth++; }
        if (c === '）' || c === ')') { depth = Math.max(0, depth - 1); }
        buf += c;
        if (depth === 0 && (c === '；' || c === '。')) { parts.push(buf.trim()); buf = ''; }
      }
      if (buf.trim()) { parts.push(buf.trim()); }
      var parenGroups = (para.match(/（/g) || []).length;
      if ((parts.length >= 3 || parenGroups >= 3) && para.length > 100) {
        if (parts.length >= 3) {
          parts.forEach(function (p) { lines.push({ t: 'li', text: p }); });
        } else {
          // 句子少但括号组多（罗列型长段）：按 顿号+括号组 边界再切一层
          var chunks = para.split(/(?<=）)、|(?<=）)，/);
          if (chunks.length >= 3) { chunks.forEach(function (p) { lines.push({ t: 'li', text: p }); }); }
          else { lines.push({ t: 'p', text: para }); }
        }
      } else {
        lines.push({ t: 'p', text: para });
      }
    });
    var nodes = [];
    if (lines.length === 1) {
      nodes.push(el('div', { cls: 'section-body' }, richInline(lines[0].text)));
      return nodes;
    }
    var lis = [];
    lines.forEach(function (ln) {
      if (ln.t === 'p') {
        lis.push(el('li', { cls: 'rich-p' }, [el('span', { cls: 'rich-p-text' }, richInline(ln.text))]));
      } else {
        lis.push(el('li', { cls: 'rich-li' }, [
          el('span', { cls: 'rich-li-dot', text: '·' }),
          el('span', { cls: 'rich-li-text' }, richInline(ln.text))
        ]));
      }
    });
    nodes.push(el('div', { cls: 'section-body rich-body' }, [ el('ul', { cls: 'rich-list' }, lis) ]));
    return nodes;
  }

  function buildIdentificationTables(groups) {
    if (!groups || !groups.length) { return null; }
    var children = [el('h3', { cls: 'ident-title', text: '分型鉴定表' })];
    groups.forEach(function (group) {
      var groupNodes = [el('h4', { cls: 'ident-group-title', text: group.标题 })];
      if (group.说明) { groupNodes.push(el('p', { cls: 'ident-intro', text: group.说明 })); }
      (group.表格 || []).forEach(function (item) {
        var heads = item.列.map(function (name) {
          var th = el('th', { text: name });
          th.setAttribute('scope', 'col');
          return th;
        });
        var rows = item.行.map(function (row) {
          var label = row.id ? el('a', { href: '#/microbes/' + row.id, text: row.名称 }) : document.createTextNode(row.名称);
          var th = el('th', {}, [label]);
          th.setAttribute('scope', 'row');
          return el('tr', {}, [th].concat(row.结果.map(function (value) {
            return el('td', { text: value });
          })));
        });
        groupNodes.push(el('div', {
          cls: 'table-scroll ident-scroll', tabindex: '0', role: 'region',
          'aria-label': item.标题 + '，可左右滚动'
        }, [el('table', { cls: 'ident-table', id: item.id }, [
          el('caption', { text: item.标题 }),
          el('thead', {}, [el('tr', {}, heads)]),
          el('tbody', {}, rows)
        ])]));
        if (item.说明 && item.说明.length) {
          groupNodes.push(el('ul', { cls: 'ident-notes' }, item.说明.map(function (note) {
            return el('li', { text: note });
          })));
        }
        if (item.来源 && item.来源.length) {
          groupNodes.push(el('div', { cls: 'ident-sources' }, [
            el('span', { text: '来源：' })
          ].concat(item.来源.map(function (source) {
            return source.url ? el('a', {
              text: source.名称, href: source.url, target: '_blank', rel: 'noopener noreferrer'
            }) : el('span', { text: source.名称 });
          }))));
        }
      });
      children.push(el('div', { cls: 'ident-group', id: group.id }, groupNodes));
    });
    return el('section', {
      cls: 'identification-tables', id: 'identification-tables', tabindex: '-1', 'aria-label': '分型鉴定表'
    }, children);
  }

  function buildDetail(vm) {
    if (!vm) { return [ el('div', { cls: 'empty', text: '请选择左侧的一个条目查看详情。' }) ]; }
    var nodes = [];
    var head = [ el('h2', { cls: 'detail-title', text: vm.名称 }) ];
    if (vm.类别) { head.push(el('span', { cls: 'badge', text: vm.类别 })); }
    if (vm.药敏简写) { head.push(el('span', { cls: 'abbr', title: '药敏试验简写', text: '药敏 ' + vm.药敏简写 })); }
    if (vm.id) { // ☆ 收藏（仅条目详情）
      var _fav = isFavorited(vm.id);
      head.push(el('button', {
        cls: 'fav-star' + (_fav ? ' favorited' : ''), type: 'button',
        'aria-label': _fav ? '取消收藏' : '收藏', 'aria-pressed': String(_fav),
        title: _fav ? '取消收藏' : '加入收藏', text: _fav ? '★' : '☆',
        onClick: function () { toggleFavorite(vm.id, parseHash().module, vm.名称); NS.renderRoute(); }
      }));
    }
    nodes.push(el('div', { cls: 'detail-head' }, head));
    if (vm.拉丁名) { nodes.push(el('div', { cls: 'latin', text: vm.拉丁名 })); }
    var identificationSection = buildIdentificationTables(vm.分型鉴定表);
    if (identificationSection) {
      nodes.push(el('button', {
        cls: 'ident-jump', type: 'button', text: '分型鉴定表 ↓', 'aria-controls': 'identification-tables',
        onClick: function () {
          identificationSection.focus({ preventScroll: true });
          identificationSection.scrollIntoView({ block: 'start' });
        }
      }));
    }
    if (vm.生物安全) {
      var bio = vm.生物安全;
      nodes.push(el('div', { cls: 'biosafety-alert', role: 'alert' }, [
        el('div', { cls: 'biosafety-head' }, [
          el('span', { cls: 'biosafety-icon', text: '⚠' }),
          el('span', { cls: 'biosafety-title', text: '生物安全警示' }),
          bio.级别 ? el('span', { cls: 'biosafety-level', text: bio.级别 }) : null
        ]),
        el('div', { cls: 'biosafety-body' }, richInline(bio.提示 || ''))
      ]));
    }
    if (vm.机制图) {
      var diagramMeta = ((window.DB || {}).sourceMetadata || {}).diagrams || {};
      var diagram = diagramMeta[vm.机制图];
      var diagramCaption = diagram ? diagram.标题 : vm.机制图说明;
      var figure = [ zoomableImg(imgV(vm.机制图), diagramCaption, diagramCaption) ];
      if (diagram) {
        figure.push(el('p', { cls: 'diagram-takeaway', text: diagram.核心命题 }));
        figure.push(el('details', { cls: 'diagram-guidance' }, [
          el('summary', { text: '适用范围与来源' }),
          el('p', { text: diagram.适用范围 }),
          el('ul', {}, diagram.来源.map(function (source) {
            return el('li', {}, [ source.url
              ? el('a', { href: source.url, target: '_blank', rel: 'noopener noreferrer', text: source.名称 })
              : el('span', { text: source.名称 })
            ]);
          })),
          el('p', { cls: 'mechanism-cap', text: '核心命题核对：' + diagram.核对日期 + '；不代表整图方法参数已全部复核。' })
        ]));
      }
      figure.push(el('figcaption', { cls: 'mechanism-cap', text: diagramCaption }));
      nodes.push(el('figure', { cls: 'mechanism-fig' }, figure));
    }

    if (vm.小节.length === 0) {
      nodes.push(el('div', { cls: 'empty-sm', text: '（暂无内容小节）' }));
    } else {
      vm.小节.forEach(function (s) {
        var card = [ el('div', { cls: 'section-title', text: s.标题 }) ];
        richBody(s.正文).forEach(function (n) { card.push(n); });
        nodes.push(el('div', { cls: 'section-card' }, card));
      });
    }

    // CLSI 质控/参考范围（质控菌株）——逐格转录自 CLSI M100/M45/M27M44S/M38M51S，双人独立转录并比对
    if (vm.质控范围 && vm.质控范围.length) {
      var isReference = /reference|参考/i.test(vm.质控用途 || 'QC');
      var hasMic = vm.质控范围.some(function (r) { return r.MIC; });
      var hasDisk = vm.质控范围.some(function (r) { return r.抑菌圈; });
      var hasNote = vm.质控范围.some(function (r) { return r.备注; });
      var hasMec = vm.质控范围.some(function (r) { return /MEC/i.test(r.终点 || ''); });
      var qcHead = [ el('th', { text: '抗菌药物' }) ];
      if (hasMic) { qcHead.push(el('th', { text: hasMec ? 'MIC / MEC (μg/mL)' : 'MIC (μg/mL)' })); }
      if (hasDisk) { qcHead.push(el('th', { text: '抑菌圈 (mm)' })); }
      if (hasNote) { qcHead.push(el('th', { text: '备注' })); }
      var drugCN = (window.DB && window.DB.drugCN) || {};
      var qcRows = vm.质控范围.map(function (r) {
        var cn = drugCN[r.药物] || '';
        var drugCell = cn
          ? el('td', { cls: 'bp-drug' }, [ el('span', { cls: 'qc-drug-cn', text: cn }), el('span', { cls: 'qc-drug-en', text: r.药物 }) ])
          : el('td', { cls: 'bp-drug', text: r.药物 });
        var cells = [ drugCell ];
        if (hasMic) {
          var micCell = el('td', { cls: 'bp-mic' });
          micCell.appendChild(document.createTextNode(r.MIC || '—'));
          if (/MEC/i.test(r.终点 || '')) { micCell.appendChild(el('span', { cls: 'qc-endpoint', title: '最低有效浓度（棘白菌素对霉菌的判读终点）', text: 'MEC' })); }
          cells.push(micCell);
        }
        if (hasDisk) { cells.push(el('td', { cls: 'bp-disk', text: r.抑菌圈 || '—' })); }
        if (hasNote) { cells.push(el('td', { cls: 'bp-comment', text: r.备注 || '' })); }
        return el('tr', {}, cells);
      });
      var qcHeadNodes = [
        el('span', { cls: 'bp-title', text: isReference ? 'CLSI 参考范围' : 'CLSI 可接受质控范围' }),
        el('span', { cls: 'qc-purpose ' + (isReference ? 'qc-ref' : 'qc-qc'), title: isReference ? '参考范围（Reference）' : '日常质控（QC）', text: isReference ? '参考 Reference' : '质控 QC' }),
        el('span', { cls: 'bp-source', text: vm.质控来源 || 'CLSI' })
      ];
      var methodBits = [];
      if (vm.质控方法) { methodBits.push('方法：' + vm.质控方法); }
      if (vm.质控培养基) { methodBits.push('培养基：' + vm.质控培养基); }
      if (vm.质控孵育) { methodBits.push('孵育：' + vm.质控孵育); }
      var qcChildren = [ el('div', { cls: 'bp-head' }, qcHeadNodes) ];
      if (methodBits.length) { qcChildren.push(el('div', { cls: 'qc-method', text: methodBits.join('　·　') })); }
      qcChildren.push(el('div', { cls: 'table-scroll' }, [
        el('table', { cls: 'bp-table' }, [ el('thead', {}, [ el('tr', {}, qcHead) ]), el('tbody', {}, qcRows) ])
      ]));
      qcChildren.push(el('div', { cls: 'bp-legend-note', text: isReference
        ? '参考范围用于评估试验体系与方法学，不等同于每批质控的在控/失控判定；结果超出时应结合试验目的、方法与文件说明分析。须以现行版 CLSI 原表为准。'
        : '质控范围为该标准株在规定方法下每次药敏跑批应落入的可接受区间（超出即失控）；须以现行版 CLSI 原表为准，并按你实验室采用的方法/培养基执行。' }));
      if (hasMec) { qcChildren.push(el('div', { cls: 'bp-legend-note', text: 'MEC = 最低有效浓度：棘白菌素类对霉菌以 MEC（而非 MIC）为判读终点。' })); }
      nodes.push(el('div', { cls: 'breakpoints qc-ranges' }, qcChildren));
    }

    if (vm.天然耐药) {
      var intrCard = [ el('div', { cls: 'intrinsic-title', text: '天然耐药' }) ];
      richBody(vm.天然耐药).forEach(function (n) { intrCard.push(n); });
      nodes.push(el('div', { cls: 'intrinsic' }, intrCard));
    }

    // 治疗要点（经验首选，来自 IDSA/CDC/Sanford 等指南）—— 富渲染（分层+站内药名/菌名链接）
    if (vm.治疗) {
      var treatCard = [ el('div', { cls: 'treatment-title', text: '治疗要点' }) ];
      richBody(vm.治疗).forEach(function (n) { treatCard.push(n); });
      nodes.push(el('div', { cls: 'treatment' }, treatCard));
    }

    if (vm.药物 && vm.药物.length) {
      var abxMap = abxIdByName();
      var drugChips = vm.药物.map(function (name) {
        var aid = abxMap[name];
        if (aid) { return el('a', { cls: 'chip chip-antibiotics', text: name, href: '#/antibiotics/' + aid }); }
        if (CARD_TEST[name]) { return el('a', { cls: 'chip chip-tests', text: name, href: '#/tests/' + CARD_TEST[name] }); }
        return el('span', { cls: 'chip chip-plain', text: name });
      });
      nodes.push(el('div', { cls: 'card-drugs' }, [
        el('div', { cls: 'card-drugs-head' }, [
          el('div', { cls: 'card-drugs-title', text: '包含药物 · ' + vm.药物.length }),
          (vm.id ? el('button', { cls: 'cmp-add', text: '加入对比', onClick: function () { compareCardSet[vm.id] = true; location.hash = '#/cardcompare'; } }) : null)
        ]),
        el('div', { cls: 'chips' }, drugChips)
      ]));
    }

    // ① 形态
    if (vm.形态) {
      var mNodes = [ el('div', { cls: 'morph-title', text: '培养与镜下形态' }) ];
      if (vm.形态.镜下) {
        mNodes.push(el('div', { cls: 'morph-row' }, [ el('span', { cls: 'morph-tag', text: '镜下' }), el('span', { cls: 'morph-rich' }, richInline(' ' + vm.形态.镜下)) ]));
      }
      (vm.形态.培养 || []).forEach(function (c) {
        mNodes.push(el('div', { cls: 'morph-row' }, [ el('span', { cls: 'morph-tag morph-med', text: c.培养基 }), el('span', { cls: 'morph-rich' }, richInline(' ' + c.形态)) ]));
      });
      nodes.push(el('div', { cls: 'morphology' }, mNodes));
    }

    // 真实形态学图片（图谱在人卫教材前、CDC PHIL 公有领域在后）——紧凑轮播：移动端左右滑动，桌面端左右按钮
    if (vm.形态图片 && vm.形态图片.length) {
      nodes.push(buildPhotoCarousel(vm.形态图片));
    }

    // ② 药敏折点（来自 CLSI M100）—— 药物名可跳转到对应抗生素条目
    if (vm.折点) {
      var bp = vm.折点;
      var eu = View.eucastVM(bp.菌组名, (window.DB || {}).eucastBreakpoints); // EUCAST 并排对照（无则不加列）
      var euZone = euHasZone(eu);
      var bpBodyRows = bp.药物.map(function (d) {
        var aid = abxIdByDrugText(d.药物);
        var drugCell = aid
          ? el('td', { cls: 'bp-drug' }, [ bpTierBadge(d.组别), bpUrineChip(d), el('strong', { text: d.简写 }), document.createTextNode(' '), el('a', { cls: 'bp-drug-link', text: d.药物, href: '#/antibiotics/' + aid }) ])
          : el('td', { cls: 'bp-drug' }, [ bpTierBadge(d.组别), bpUrineChip(d), el('strong', { text: d.简写 }), document.createTextNode(' ' + d.药物) ]);
        var cells = [ drugCell, el('td', { cls: 'bp-mic', text: d.MIC }), el('td', { cls: 'bp-disk', text: d.抑菌圈 }) ];
        if (eu) {
          cells.push(eucastCell(eu.drug[d.药物], d.MIC)); // EUCAST MIC 置于抑菌圈之后
          if (euZone) { cells.push(eucastZoneCell(eu.drug[d.药物])); }
        }
        cells.push(el('td', { cls: 'bp-comment', text: d.备注 || '' }));
        return el('tr', {}, cells);
      });
      nodes.push(el('div', { cls: 'breakpoints' }, [
        el('div', { cls: 'bp-head' }, [
          el('span', { cls: 'bp-title', text: '药敏折点' }),
          el('span', { cls: 'bp-source', text: (bp.来源 || 'CLSI M100 Ed36 (2026)') + '  |  ' + bp.CLSI表 })
        ].concat(eucastBadgeNodes())),
        el('div', { cls: 'table-scroll' }, [
          el('table', { cls: 'bp-table' }, [
            el('thead', {}, bpThead(eu)),
            el('tbody', {}, bpBodyRows)
          ])
        ]),
        bpTierLegend(bp.药物),
        el('div', { cls: 'bp-foot', text: bp.菌组名 + '  ·  MIC 折点：S≤(敏感) / I(中介/SDD) / R≥(耐药)；抑菌圈：S≥ / I / R≤  (mm)' + (bpHasCombo(bp.药物) ? '　·　' + COMBO_BP_NOTE : '') }),
        eucastNoteNode()
      ]));
    }

    // ②b 流行病学界值（ECV / ECOFF）—— 区分野生型(WT)/非野生型(NWT)，非临床折点
    if (vm.ECV && vm.ECV.药物 && vm.ECV.药物.length) {
      var ecv = vm.ECV;
      var ecvHasNote = ecv.药物.some(function (d) { return d.备注; });
      var ecvHead = [ el('th', { text: '抗菌药物' }), el('th', { text: 'ECV (μg/mL)' }), el('th', { text: '野生型 WT' }), el('th', { text: '非野生型 NWT' }) ];
      if (ecvHasNote) { ecvHead.push(el('th', { text: '备注' })); }
      var ecvRows = ecv.药物.map(function (d) {
        var aid = abxIdByDrugText(d.药物);
        var drugCell = aid
          ? el('td', { cls: 'bp-drug' }, [ el('strong', { text: d.简写 }), document.createTextNode(' '), el('a', { cls: 'bp-drug-link', text: d.药物, href: '#/antibiotics/' + aid }) ])
          : el('td', { cls: 'bp-drug' }, [ el('strong', { text: d.简写 }), document.createTextNode(' ' + d.药物) ]);
        var cells = [ drugCell, el('td', { cls: 'bp-mic', text: d.ECV }), el('td', { cls: 'bp-disk', text: d.WT }), el('td', { cls: 'bp-disk', text: d.NWT }) ];
        if (ecvHasNote) { cells.push(el('td', { cls: 'bp-comment', text: d.备注 || '' })); }
        return el('tr', {}, cells);
      });
      nodes.push(el('div', { cls: 'breakpoints' }, [
        el('div', { cls: 'bp-head' }, [
          el('span', { cls: 'bp-title', text: '流行病学界值 (ECV)' }),
          el('span', { cls: 'bp-source', text: ecv.来源 })
        ]),
        el('div', { cls: 'table-scroll' }, [
          el('table', { cls: 'bp-table' }, [
            el('thead', {}, [ el('tr', {}, ecvHead) ]),
            el('tbody', {}, ecvRows)
          ])
        ]),
        el('div', { cls: 'bp-legend-note', text: '⚠️ ECV 只区分野生型(WT，≤ECV)与非野生型(NWT，>ECV，提示获得性耐药机制)，' + (ecv.注 || '不是临床折点，不得按 S/I/R 报告。') })
      ]));
    }

    if (identificationSection) { nodes.push(identificationSection); }

    // ③ 相似菌与鉴别
    if (vm.鉴别 && vm.鉴别.length) {
      var diffItems = vm.鉴别.map(function (d) {
        var head;
        if (d.id) {
          head = el('a', { cls: 'diff-link', text: 'vs ' + d.名称, href: '#/microbes/' + d.id });
        } else if (mnHasName(d.名称)) {
          // 无详情页但菌名速查收录了（多为 #74 精简时移出微生物分类的菌）：
          // 链到速查，那里有拉丁名并可外链 NCBI/PubMed，好过点不动的死路。
          head = el('a', { cls: 'diff-link diff-link-mn', text: 'vs ' + d.名称, href: '#/microbe-names/' + encodeURIComponent(d.名称), title: '本库无详情页，去菌名速查查看：' + d.名称 });
        } else {
          // 「非结核分枝杆菌(NTM)」「肠侵袭性大肠埃希菌(EIEC)」这类群/型概念本就没有条目，保持纯文本
          head = el('span', { cls: 'diff-name', text: 'vs ' + d.名称 });
        }
        return el('div', { cls: 'diff-item' }, [
          el('div', { cls: 'diff-head' }, [ head ]),
          el('div', { cls: 'diff-line' }, [ el('span', { cls: 'diff-tag', text: '相似点' }), el('span', { cls: 'diff-rich' }, richInline(' ' + d.相似点)) ]),
          el('div', { cls: 'diff-line' }, [ el('span', { cls: 'diff-tag diff-key', text: '鉴别' }), el('span', { cls: 'diff-rich' }, richInline(' ' + d.鉴别)) ])
        ]);
      });
      nodes.push(el('div', { cls: 'differential' }, [ el('div', { cls: 'diff-title', text: '相似菌与鉴别' }) ].concat(diffItems)));
    }

    // ④ 生化反应 —— 项目名可跳转到对应生化试验条目；
    //    生化试验条目查不到时回落到站内链接词典（linkDict）：
    //    染色（革兰染色/抗酸染色）、药物（万古霉素/克林霉素纸片试验）、
    //    培养基（TCBS/麦康凯生长）、术语·微生物结构（大分生孢子/厚壁孢子/荚膜）等
    //    跨模块项目同样成链，直接跳各自词条。
    if (vm.生化反应 && vm.生化反应.length) {
      var bioTestMap = biochemTestIdByName();
      var dict = linkDict();
      var bioRows = vm.生化反应.map(function (b) {
        var tid = bioTestMap[b.项目];
        var keyEl;
        if (tid) {
          keyEl = el('a', { cls: 'biochem-key biochem-link', text: b.项目, href: '#/biochem-tests/' + tid });
        } else if (dict[b.项目]) {
          keyEl = el('a', { cls: 'biochem-key biochem-link', text: b.项目, href: dict[b.项目] });
        } else {
          keyEl = el('span', { cls: 'biochem-key', text: b.项目 });
        }
        return el('div', { cls: 'biochem-row' }, [ keyEl, el('span', { cls: 'biochem-val', text: b.结果 }) ]);
      });
      nodes.push(el('div', { cls: 'biochem' }, [
        el('div', { cls: 'biochem-head' }, [
          el('div', { cls: 'biochem-title', text: '生化反应' }),
          el('button', { cls: 'cmp-add', text: '加入对比', onClick: function () { if (vm.id) { compareSet[vm.id] = true; location.hash = '#/compare'; } } })
        ]),
        el('div', { cls: 'biochem-rows' }, bioRows)
      ]));
    }

    var relKids = [ el('div', { cls: 'relations-label', text: '关联' }) ];
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

    if (vm.链接 && vm.链接.length) {
      var refChips = vm.链接.map(function (l) {
        return el('a', {
          cls: 'ref-link', text: l.标题, href: l.url,
          target: '_blank', rel: 'noopener noreferrer', title: l.url
        });
      });
      nodes.push(el('div', { cls: 'refs' }, [
        el('div', { cls: 'refs-label', text: '综述 / 参考' })
      ].concat([ el('div', { cls: 'chips' }, refChips) ])));
    }
    return nodes;
  }

  Object.assign(NS, { _linkDict, _zoomEl, _zoomEsc, buildDetail, buildPhotoCarousel, closeImageZoom, linkDict, openImageZoom, richBody, richInline, zoomableImg });
})();
