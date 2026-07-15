(function (factory) {
  'use strict';
  var View = factory();
  if (typeof module !== 'undefined' && module.exports) { module.exports = View; }
  if (typeof window !== 'undefined') { window.View = View; }
})(function () {
  'use strict';

  var MODULE_LABEL = { microbes: '微生物', antibiotics: '抗微生物药', resistance: '耐药', idcards: '鉴定卡', cards: '药敏卡', tests: '试验', media: '培养基', staining: '染色', 'biochem-tests': '生化反应', 'qc-strains': '质控菌株' };

  function moduleLabel(key) { return MODULE_LABEL[key] || '未知'; }

  var MECHANISM_IMAGE = {
    // 抗细菌药：按顶层机制大类
    '抑制细胞壁合成': 'img/mechanism-cellwall.svg',
    '抑制蛋白质合成': 'img/mechanism-protein.svg',
    '抑制核酸合成': 'img/mechanism-nucleic.svg',
    '抑制叶酸代谢': 'img/mechanism-folate.svg',
    '破坏细胞膜': 'img/mechanism-membrane.svg',
    // 抗真菌药：按类别（机制各异）
    '唑类': 'img/mechanism-azole.svg',
    '多烯类': 'img/mechanism-polyene.svg',
    '棘白菌素类': 'img/mechanism-echinocandin.svg',
    '嘧啶类似物': 'img/mechanism-flucytosine.svg',
    // 耐药机制：按顶层机制大类（旁路代谢/生物膜按叶子区分，二者机制差异大）
    '产生灭活酶': 'img/resistance-enzyme.svg',
    '靶位改变': 'img/resistance-target.svg',
    '主动外排': 'img/resistance-efflux.svg',
    '膜通透性下降': 'img/resistance-permeability.svg',
    '旁路代谢': 'img/resistance-bypass.svg',
    '生物膜': 'img/resistance-biofilm.svg'
  };

  // 试验：按条目 id 映射到示意图
  var TEST_IMAGE = {
    'd-test': 'img/test-d.svg',
    'mcim': 'img/test-mcim.svg',
    'ecim': 'img/test-ecim.svg',
    'esbl-test': 'img/test-esbl.svg',
    'cefoxitin-screen': 'img/test-cefoxitin.svg',
    'hlar': 'img/test-hlar.svg',
    'beta-lactamase-test': 'img/test-betalactamase.svg',
    'colistin-bmd': 'img/test-colistin.svg',
    'coagulase': 'img/test-coagulase.svg',
    'catalase': 'img/test-catalase.svg',
    'oxidase': 'img/test-oxidase.svg',
    'optochin': 'img/test-optochin.svg',
    'camp-test': 'img/test-camp.svg',
    'bile-solubility': 'img/test-bile.svg',
    'kb-test': 'img/test-kb.svg',
    'e-test': 'img/test-etest.svg'
  };

  // 染色：按条目 id 映射到示意图
  var STAIN_IMAGE = {
    'gram-stain': 'img/stain-gram.svg',
    'acid-fast-zn': 'img/stain-acidfast.svg',
    'india-ink': 'img/stain-indiaink.svg',
    'spore-stain': 'img/stain-spore.svg',
    'flagella-stain': 'img/stain-flagella.svg',
    'metachromatic-granule': 'img/stain-granule.svg',
    'lpcb': 'img/stain-lpcb.svg',
    'giemsa': 'img/stain-giemsa.svg',
    'auramine': 'img/stain-auramine.svg'
  };

  // 生化反应：按条目 id 映射到示意图（部分复用 test-*.svg）
  var BIOCHEM_IMAGE = {
    'bio-catalase': 'img/test-catalase.svg',
    'bio-oxidase': 'img/test-oxidase.svg',
    'bio-coagulase': 'img/test-coagulase.svg',
    'bio-optochin': 'img/test-optochin.svg',
    'bio-camp': 'img/test-camp.svg',
    'bio-bile-solubility': 'img/test-bile.svg',
    'urease': 'img/biochem-urease.svg',
    'indole': 'img/biochem-indole.svg',
    'h2s': 'img/biochem-h2s.svg',
    'citrate': 'img/biochem-citrate.svg',
    'glucose-fermentation': 'img/biochem-sugar.svg',
    'lactose-fermentation': 'img/biochem-sugar.svg',
    'mannitol-fermentation': 'img/biochem-sugar.svg',
    'decarboxylase': 'img/biochem-decarboxylase.svg',
    'lysine-decarboxylase': 'img/biochem-decarboxylase.svg',
    'ornithine-decarboxylase': 'img/biochem-decarboxylase.svg',
    'nitrate-reduction': 'img/biochem-nitrate.svg',
    'mr-test': 'img/biochem-mr.svg',
    'vp-test': 'img/biochem-vp.svg',
    'pyr-test': 'img/biochem-pyr.svg',
    'dnase': 'img/biochem-dnase.svg',
    'phenylalanine-deaminase': 'img/biochem-pda.svg',
    'gelatinase': 'img/biochem-gelatin.svg',
    'hippurate': 'img/biochem-hippurate.svg',
    'motility': 'img/biochem-motility.svg',
    'nacl-65': 'img/biochem-nacl.svg',
    'bile-esculin': 'img/biochem-esculin.svg',
    'pigment': 'img/biochem-pigment.svg',
    'bacitracin': 'img/biochem-disk.svg',
    'novobiocin': 'img/biochem-disk.svg',
    'hemolysis': 'img/biochem-hemolysis.svg',
    'lancefield': 'img/biochem-lancefield.svg'
  };

  // 节点子树是否包含某叶子分类（支持任意层级）
  function nodeContainsLeaf(node, leafName) {
    if (node.子类 && node.子类.length) {
      return node.子类.some(function (c) { return nodeContainsLeaf(c, leafName); });
    }
    return node.名称 === leafName;
  }

  // 抗生素 / 耐药：按其类别所属的机制大类，映射到一张机制示意图
  function mechanismImageFor(moduleKey, entry, categories) {
    if (!entry) { return null; }
    if (moduleKey === 'tests') { return TEST_IMAGE[entry.id] || null; }
    if (moduleKey === 'staining') { return STAIN_IMAGE[entry.id] || null; }
    if (moduleKey === 'biochem-tests') { return BIOCHEM_IMAGE[entry.id] || null; }
    if (moduleKey !== 'antibiotics' && moduleKey !== 'resistance') { return null; }
    // 先按类别(叶子)直接匹配（抗真菌药、旁路代谢/生物膜按其类别区分）
    if (MECHANISM_IMAGE[entry.类别]) { return MECHANISM_IMAGE[entry.类别]; }
    // 再按所属顶层机制大类匹配（抗细菌药、其余耐药机制）
    var groups = (categories && categories[moduleKey]) ? categories[moduleKey] : [];
    for (var i = 0; i < groups.length; i++) {
      if (nodeContainsLeaf(groups[i], entry.类别)) { return MECHANISM_IMAGE[groups[i].名称] || null; }
    }
    return null;
  }

  // 去掉拉丁名中的括注与 spp. 后缀，得到适合检索的词条
  function cleanTerm(s) {
    return String(s || '').replace(/[（(].*$/, '').replace(/\s+spp\.?$/i, '').trim();
  }

  // 微生物大类判别（按 类别 关键字）：细菌/真菌/病毒/寄生虫
  function microbeKind(cat) {
    cat = String(cat || '');
    if (/病毒/.test(cat)) { return 'virus'; }
    if (/疟原虫|弓形虫|寄生|原虫|绦虫|线虫|吸虫|阿米巴|贾第|隐孢子|毛滴虫|疥|虱|棘球|血吸虫|肺孢子/.test(cat)) { return 'parasite'; }
    if (/念珠|隐球|曲霉|毛癣|毛霉|根霉|镰刀|马拉色|孢子菌|酵母|真菌|皮炎芽生|组织胞浆|球孢子|癣菌|青霉|科达菌/.test(cat)) { return 'fungus'; }
    return 'bacteria';
  }

  // 综述/参考链接（权威优先）：菌用拉丁名 → PubMed 综述 + NCBI 书架(StatPearls 同行评议临床专论)
  //   + 命名/分类权威(细菌 LPSN，其余 NCBI 分类)。耐药机制用英文术语 → 仅 PubMed 综述。
  function referenceLinks(moduleKey, entry) {
    if (!entry || (moduleKey !== 'microbes' && moduleKey !== 'resistance')) { return []; }
    var latin = cleanTerm(entry.拉丁名);
    var term = latin || entry.英文 || entry.名称 || '';
    if (!term) { return []; }
    var enc = encodeURIComponent(term);
    var links = [{
      标题: 'PubMed 综述',
      url: 'https://pubmed.ncbi.nlm.nih.gov/?term=' + enc + '&filter=pubt.review'
    }];
    if (moduleKey === 'microbes' && latin) {
      // 同行评议临床专论（NCBI 书架，含 StatPearls）—— 比维基更权威
      links.push({
        标题: 'NCBI 书架 (StatPearls)',
        url: 'https://www.ncbi.nlm.nih.gov/books/?term=' + enc
      });
      // 中文权威临床手册（默沙东诊疗手册专业版，按中文名检索）
      if (entry.名称) {
        links.push({
          标题: '默沙东诊疗手册',
          url: 'https://www.msdmanuals.cn/professional/SearchResults?query=' + encodeURIComponent(entry.名称)
        });
      }
      // CDC 公共卫生/临床（含寄生虫 DPDx、病毒、细菌专题）
      links.push({ 标题: 'CDC', url: 'https://search.cdc.gov/search/?query=' + enc + '&affiliate=cdc-main' });
      // 命名/分类权威：细菌用 LPSN（DSMZ 法定命名），其余用 NCBI 分类
      if (microbeKind(entry.类别) === 'bacteria') {
        links.push({ 标题: 'LPSN 命名法', url: 'https://lpsn.dsmz.de/search?word=' + enc });
      } else {
        links.push({ 标题: 'NCBI 分类', url: 'https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?name=' + enc });
      }
    }
    return links;
  }

  function detailVM(entry, relations, extras) {
    if (!entry) { return null; }
    extras = extras || {};
    return {
      id: entry.id,
      名称: entry.名称,
      类别: entry.类别 || '',
      拉丁名: entry.拉丁名 || '',
      药敏简写: entry.药敏简写 || '',
      结构图: extras.structImage || '',
      机制图: extras.mechanismImage || null,
      机制图说明: extras.mechCaption || '示意图',
      形态: extras.morphology || null,
      治疗: extras.treatment || null,
      生化反应: extras.biochem || [],
      鉴别: extras.differential || [],
      药物: entry.药物 || [],
      天然耐药: entry.天然耐药 || '',
      小节: (entry.小节 || []).map(function (s) {
        return { 标题: s.标题 || '', 正文: s.正文 || '' };
      }),
      链接: (extras.links || []).map(function (l) {
        return { 标题: l.标题 || '', url: l.url || '' };
      }),
      折点: extras.breakpoints || null,
      ECV: extras.ecv || null,
      质控范围: entry.质控范围 || null,
      质控来源: entry.质控来源 || '',
      关联: (relations || []).map(function (r) {
        return {
          id: r.id,
          名称: r.名称,
          module: r.module,
          exists: r.exists,
          label: r.exists ? (moduleLabel(r.module) + ' · ' + r.名称) : (r.id + ' ?'),
          href: r.exists ? ('#/' + r.module + '/' + r.id) : null
        };
      })
    };
  }

  function collectLeafSet(nodes, out) {
    (nodes || []).forEach(function (node) {
      if (node.子类 && node.子类.length) { collectLeafSet(node.子类, out); }
      else { out[node.名称] = true; }
    });
    return out;
  }

  function sidebarVM(moduleKey, categories, entries, selectedId) {
    var roots = (categories && categories[moduleKey]) ? categories[moduleKey] : [];
    var leafSet = collectLeafSet(roots, {});

    function item(e) {
      return { id: e.id, 名称: e.名称, href: '#/' + moduleKey + '/' + e.id, selected: e.id === selectedId };
    }

    var byCat = {};
    var uncategorized = [];
    (entries || []).forEach(function (e) {
      if (leafSet[e.类别]) { (byCat[e.类别] = byCat[e.类别] || []).push(item(e)); }
      else { uncategorized.push(item(e)); }
    });

    function buildNode(node) {
      var hasChildren = node.子类 && node.子类.length;
      return {
        名称: node.名称,
        children: hasChildren ? node.子类.map(buildNode) : [],
        entries: hasChildren ? [] : (byCat[node.名称] || [])
      };
    }

    return {
      tree: roots.map(buildNode),
      未分类: uncategorized
    };
  }

  function searchVM(results, query) {
    return {
      query: query,
      items: (results || []).map(function (r) {
        return { id: r.id, 名称: r.名称, module: r.module, 摘要: r.摘要 || '', href: '#/' + r.module + '/' + r.id };
      })
    };
  }

  // 生化反应对比：并排比较若干菌；rows 取所有项目的并集，differs 标出结果不一致的项目
  function buildComparison(nameById, biochemMap, ids) {
    biochemMap = biochemMap || {};
    ids = (ids || []).filter(function (id) { return biochemMap[id]; });
    var items = ids.map(function (id) { return { id: id, 名称: (nameById && nameById[id]) || id }; });
    var order = [], seen = {};
    ids.forEach(function (id) {
      biochemMap[id].forEach(function (b) { if (!seen[b.项目]) { seen[b.项目] = true; order.push(b.项目); } });
    });
    var rows = order.map(function (项目) {
      var cells = ids.map(function (id) {
        var hit = biochemMap[id].filter(function (b) { return b.项目 === 项目; })[0];
        return hit ? hit.结果 : '—';
      });
      var distinct = {};
      cells.forEach(function (c) { distinct[c] = true; });
      return { 项目: 项目, cells: cells, differs: Object.keys(distinct).length > 1 };
    });
    return { items: items, rows: rows };
  }

  // 药敏卡对比：并排比较若干卡所含药物；cells 为布尔(是否含)，differs 标出各卡不一致的药物
  function buildCardComparison(nameById, drugsByCard, ids) {
    drugsByCard = drugsByCard || {};
    ids = (ids || []).filter(function (id) { return drugsByCard[id]; });
    var items = ids.map(function (id) { return { id: id, 名称: (nameById && nameById[id]) || id }; });
    var order = [], seen = {};
    ids.forEach(function (id) {
      drugsByCard[id].forEach(function (d) { if (!seen[d]) { seen[d] = true; order.push(d); } });
    });
    var rows = order.map(function (drug) {
      var cells = ids.map(function (id) { return drugsByCard[id].indexOf(drug) !== -1; });
      var has = cells.filter(Boolean).length;
      return { 药物: drug, cells: cells, differs: has > 0 && has < ids.length };
    });
    return { items: items, rows: rows };
  }

  function retiredText(obj) {
    return [obj && obj.菌组名, obj && obj.CLSI表, obj && obj.备注].filter(Boolean).join(' ');
  }

  function isRetiredBreakpointGroup(group) {
    return /已撤销|历史参考/.test(retiredText(group));
  }

  function isRetiredBreakpointDrug(drug) {
    return /已撤销|历史参考/.test(retiredText(drug));
  }

  function judgeableBreakpointGroups(breakpoints) {
    return (breakpoints || []).filter(function (group) {
      return !isRetiredBreakpointGroup(group);
    }).map(function (group) {
      var copy = {
        菌组名: group.菌组名,
        CLSI表: group.CLSI表,
        来源: group.来源 || '',
        菌种: group.菌种 || [],
        药物: (group.药物 || []).filter(function (drug) {
          return !isRetiredBreakpointDrug(drug) && (drug.MIC_S || drug.MIC_I || drug.MIC_R);
        })
      };
      return copy;
    }).filter(function (group) {
      return group.药物.length > 0;
    });
  }

  // 折点：按微生物 id 查找所属菌组的折点表
  function breakpointGroup(microbeId, breakpoints) {
    breakpoints = breakpoints || [];
    for (var i = 0; i < breakpoints.length; i++) {
      if (breakpoints[i].菌种.indexOf(microbeId) !== -1) { return breakpoints[i]; }
    }
    return null;
  }

  // 将折点数据转为视图模型（适于 detailVM 的 extras 传入）
  function breakpointVM(microbeId, breakpoints) {
    var group = breakpointGroup(microbeId, breakpoints);
    if (!group) { return null; }
    return {
      菌组名: group.菌组名,
      CLSI表: group.CLSI表,
      来源: group.来源 || '',
      药物: group.药物.map(function (d) {
        return {
          药物: d.药物,
          简写: d.简写,
          组别: d.组别 || '',
          MIC: [d.MIC_S, d.MIC_I, d.MIC_R].filter(Boolean).join(' / '),
          抑菌圈: [d.抑菌圈_S, d.抑菌圈_I, d.抑菌圈_R].filter(Boolean).join(' / '),
          备注: d.备注 || ''
        };
      })
    };
  }

  // ECV（流行病学界值）：按微生物 id 查找所属 ECV 组
  function ecvGroup(microbeId, ecvs) {
    ecvs = ecvs || [];
    for (var i = 0; i < ecvs.length; i++) {
      if (ecvs[i].菌种 && ecvs[i].菌种.indexOf(microbeId) !== -1) { return ecvs[i]; }
    }
    return null;
  }

  function ecvVM(microbeId, ecvs) {
    var group = ecvGroup(microbeId, ecvs);
    if (!group) { return null; }
    return {
      组名: group.组名,
      来源: group.来源 || '',
      注: group.注 || '',
      药物: (group.药物 || []).map(function (d) {
        return {
          药物: d.药物, 简写: d.简写 || '',
          ECV: d.ECV || '', WT: d.WT || '', NWT: d.NWT || '', 备注: d.备注 || ''
        };
      })
    };
  }

  // 天然耐药速查：聚合所有有"天然耐药"字段的微生物，支持按菌名/拉丁名/耐药文本模糊过滤。
  function intrinsicVM(db, filter) {
    var q = (filter || '').trim().toLowerCase();
    var list = (db.microbes || []).filter(function (m) { return m.天然耐药 && String(m.天然耐药).length; });
    if (q) {
      list = list.filter(function (m) {
        return [m.名称, m.拉丁名, m.天然耐药].some(function (s) {
          return s && String(s).toLowerCase().indexOf(q) !== -1;
        });
      });
    }
    var byCat = {};
    list.forEach(function (m) {
      var cat = m.类别 || '其他';
      (byCat[cat] = byCat[cat] || []).push({
        id: m.id, 名称: m.名称, 拉丁名: m.拉丁名 || '', 天然耐药: m.天然耐药
      });
    });
    return {
      count: list.length,
      groups: Object.keys(byCat).map(function (k) { return { 类别: k, items: byCat[k] }; })
    };
  }

  // 关系图布局：把 Core.buildGraph 的结果按同心圆分层放到 width×height 画布上。
  // 二级节点采用「径向树」分组：每个二级节点归到它的一级父节点，并沿父节点角度成簇排布，
  // 使连线呈放射状、显著减少交叉，便于在 2 层时阅读。
  function graphLayoutVM(graph, width, height) {
    if (!graph) { return null; }
    var cx = width / 2, cy = height / 2;
    var minWH = Math.min(width, height);
    var r1 = minWH * 0.30;
    var r2 = minWH * 0.43;

    var byLevel = { 0: [], 1: [], 2: [] };
    graph.nodes.forEach(function (n) {
      var lv = n.level || 0;
      (byLevel[lv] = byLevel[lv] || []).push(n);
    });

    var levelOf = {};
    graph.nodes.forEach(function (n) { levelOf[n.id] = n.level || 0; });
    // 二级节点的父节点 = 与之相连的某个一级节点
    var parentOf = {};
    graph.edges.forEach(function (e) {
      var lf = levelOf[e.from], lt = levelOf[e.to];
      if (lf === 1 && lt === 2 && !parentOf[e.to]) { parentOf[e.to] = e.from; }
      else if (lt === 1 && lf === 2 && !parentOf[e.from]) { parentOf[e.from] = e.to; }
    });

    var pos = {};
    (byLevel[0] || []).forEach(function (n) { pos[n.id] = { x: cx, y: cy }; });

    // 一级：均匀分布在内环，并记录角度
    var l1 = byLevel[1] || [];
    var angleOf = {};
    l1.forEach(function (node, i) {
      var a = (i / Math.max(1, l1.length)) * 2 * Math.PI - Math.PI / 2;
      angleOf[node.id] = a;
      pos[node.id] = { x: cx + r1 * Math.cos(a), y: cy + r1 * Math.sin(a) };
    });

    // 二级：按父节点角度分组排序后均匀放到外环（同一父节点的子节点相邻成簇）
    var l2 = byLevel[2] || [];
    if (l2.length) {
      l2.forEach(function (node) {
        var pid = parentOf[node.id];
        node.__parentId = pid || null;
        node.__pa = (pid != null && angleOf[pid] != null) ? angleOf[pid] : -Math.PI / 2;
      });
      var sorted = l2.slice().sort(function (a, b) {
        if (a.__pa !== b.__pa) { return a.__pa - b.__pa; }
        return a.id < b.id ? -1 : 1;
      });
      var M = sorted.length;
      sorted.forEach(function (node, i) {
        var a = (i / M) * 2 * Math.PI - Math.PI / 2;
        pos[node.id] = { x: cx + r2 * Math.cos(a), y: cy + r2 * Math.sin(a) };
      });
    }

    return {
      width: width, height: height,
      center: { id: graph.center.id, 名称: graph.center.名称, module: graph.center.module, x: cx, y: cy },
      nodes: graph.nodes.map(function (n) {
        var p = pos[n.id] || { x: cx, y: cy };
        return { id: n.id, 名称: n.名称, module: n.module, level: n.level, x: p.x, y: p.y, parentId: n.__parentId || null };
      }),
      edges: graph.edges.map(function (e) {
        var from = pos[e.from] || { x: cx, y: cy };
        var to = pos[e.to] || { x: cx, y: cy };
        return { x1: from.x, y1: from.y, x2: to.x, y2: to.y, direction: e.direction, fromId: e.from, toId: e.to };
      })
    };
  }

  // ===== 折点解析与 MIC 判读（CLSI M100 风格） =====
  function numPattern() {
    return '([\\d.]+)(?:\\s*/\\s*[\\d.]+)?';
  }

  // 解析单个折点字符串："≤0.06"→{type:'le',val:0.06}；"≥2"→{type:'ge',val:2}；
  // "0.12–1" / "32/4–64/4"→{type:'range',lo,hi}；"16/4"→{type:'value',val:16}；"—"/""→null。
  // 复方药只取斜线前的主药 MIC 数值，与页面上的单个 MIC 输入保持一致。
  function parseBP(s) {
    if (s == null) { return null; }
    s = String(s).trim();
    if (!s || s === '—' || s === '-') { return null; }
    // 去掉尾部说明性括注（如 "16/4 (SDD)"）—只取主数值部分
    s = s.replace(/\s*\(.*\)$/, '').trim();
    var n = numPattern();
    var m;
    if ((m = s.match(new RegExp('^' + n + '\\s*[–-]\\s*' + n)))) { return { type: 'range', lo: parseFloat(m[1]), hi: parseFloat(m[2]) }; }
    if ((m = s.match(new RegExp('^≤\\s*' + n)))) { return { type: 'le', val: parseFloat(m[1]) }; }
    if ((m = s.match(new RegExp('^≥\\s*' + n)))) { return { type: 'ge', val: parseFloat(m[1]) }; }
    if ((m = s.match(new RegExp('^>\\s*' + n)))) { return { type: 'gt', val: parseFloat(m[1]) }; }
    if ((m = s.match(new RegExp('^<\\s*' + n)))) { return { type: 'lt', val: parseFloat(m[1]) }; }
    if ((m = s.match(new RegExp('^' + n)))) { return { type: 'value', val: parseFloat(m[1]) }; }
    return null;
  }

  // MIC 判读：输入数值 + S/I/R 三段折点字符串，返回 {result, reason}。
  // result ∈ {'S','I','R','SDD','unknown','invalid'}。SDD 视为 I 的剂量依赖子类。
  function judgeMIC(micInput, bpS, bpI, bpR) {
    var val = parseFloat(micInput);
    if (isNaN(val) || val < 0) { return { result: 'invalid', reason: 'MIC 输入无效（请输入非负数字）' }; }
    var s = parseBP(bpS), i = parseBP(bpI), r = parseBP(bpR);

    // R：≥ 阈值
    if (r && r.type === 'ge' && val >= r.val) {
      return { result: 'R', reason: 'MIC ≥ ' + r.val + '（耐药折点）' };
    }
    // S：≤ 阈值
    if (s && s.type === 'le' && val <= s.val) {
      return { result: 'S', reason: 'MIC ≤ ' + s.val + '（敏感折点）' };
    }
    // I：区间或单值（含 SDD）
    if (i) {
      if (i.type === 'range' && val >= i.lo && val <= i.hi) {
        return { result: 'I', reason: 'MIC 在 ' + i.lo + '–' + i.hi + ' 区间（中介/SDD）' };
      }
      if (i.type === 'value' && val === i.val) {
        return { result: 'I', reason: 'MIC = ' + i.val + '（中介）' };
      }
      // 黏菌素等仅 I≤x：val 落在 S 无 / R≥x 之间也算 I
      if (i.type === 'le' && val <= i.val) {
        return { result: 'I', reason: 'MIC ≤ ' + i.val + '（中介/剂量依赖）' };
      }
    }
    // 折点不完整（如某些药只有 S≤x，无 R≥x）
    if (!s && !r) { return { result: 'unknown', reason: '该药物无完整 S/I/R 折点，无法判读' }; }
    return { result: 'unknown', reason: 'MIC 不在任何折点区间内' };
  }

  // 折点查询：按菌组名/药物名筛选
  function breakpointLookupVM(breakpoints, groupFilter, drugFilter) {
    var gq = (groupFilter || '').trim().toLowerCase();
    var dq = (drugFilter || '').trim().toLowerCase();
    return (breakpoints || []).filter(function (g) {
      return !gq || (g.菌组名 || '').toLowerCase().indexOf(gq) !== -1;
    }).map(function (g) {
      var drugs = (g.药物 || []).filter(function (d) {
        return !dq || (d.药物 || '').toLowerCase().indexOf(dq) !== -1 ||
               (d.简写 || '').toLowerCase().indexOf(dq) !== -1;
      });
      return {
        菌组名: g.菌组名, CLSI表: g.CLSI表, 来源: g.来源 || '',
        菌种: g.菌种 || [], 药物: drugs
      };
    }).filter(function (g) { return g.药物.length > 0; });
  }

  // 异常药敏/修正规则：支持按等级、类别、关键词筛选，并按类别分组。
  function astAlertsVM(alerts, opts) {
    opts = opts || {};
    var q = (opts.filter || '').trim().toLowerCase();
    var level = opts.level || 'all';
    var list = (alerts || []).filter(function (item) {
      var levelOk = level === 'all' || item.等级 === level;
      if (!levelOk) { return false; }
      if (!q) { return true; }
      var hay = [
        item.类别, item.等级, item.标题, item.触发, item.异常结果,
        item.处理, item.依据, item.关键词, item.来源
      ].join(' ').toLowerCase();
      return hay.indexOf(q) !== -1;
    });
    var byCat = {};
    list.forEach(function (item) {
      var cat = item.类别 || '其他';
      (byCat[cat] = byCat[cat] || []).push(item);
    });
    return {
      count: list.length,
      levels: ['all', '必须修正', '需复核', '限制报告'],
      groups: Object.keys(byCat).map(function (cat) {
        return { 类别: cat, items: byCat[cat] };
      })
    };
  }

  return {
    moduleLabel: moduleLabel,
    mechanismImageFor: mechanismImageFor,
    referenceLinks: referenceLinks,
    detailVM: detailVM,
    sidebarVM: sidebarVM,
    searchVM: searchVM,
    buildComparison: buildComparison,
    buildCardComparison: buildCardComparison,
    breakpointGroup: breakpointGroup,
    breakpointVM: breakpointVM,
    ecvGroup: ecvGroup,
    ecvVM: ecvVM,
    isRetiredBreakpointGroup: isRetiredBreakpointGroup,
    isRetiredBreakpointDrug: isRetiredBreakpointDrug,
    judgeableBreakpointGroups: judgeableBreakpointGroups,
    intrinsicVM: intrinsicVM,
    graphLayoutVM: graphLayoutVM,
    parseBP: parseBP,
    judgeMIC: judgeMIC,
    breakpointLookupVM: breakpointLookupVM,
    astAlertsVM: astAlertsVM
  };
});
