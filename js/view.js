(function (factory) {
  'use strict';
  var View = factory();
  if (typeof module !== 'undefined' && module.exports) { module.exports = View; }
  if (typeof window !== 'undefined') { window.View = View; }
})(function () {
  'use strict';

  var MODULE_LABEL = { microbes: '微生物', antibiotics: '抗微生物药', resistance: '耐药', cards: '检测卡', tests: '试验', media: '培养基', staining: '染色', 'biochem-tests': '生化反应', 'qc-strains': '质控菌株' };

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
    '生物膜': 'img/resistance-biofilm.svg',
    // 新增机制大类
    '抗真菌耐药': 'img/resistance-target.svg',
    '靶位基因突变': 'img/resistance-target.svg',
    '多黏菌素耐药': 'img/resistance-permeability.svg'
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
    'e-test': 'img/test-etest.svg',
    'bmd': 'img/test-bmd.svg',
    'maldi-tof': 'img/test-maldi.svg',
    'cefiderocol-ast': 'img/test-cefiderocol.svg',
    'cbde-colistin': 'img/test-colistin.svg',
    'satellitism': 'img/test-satellitism.svg'
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
      生物安全: entry.生物安全 || null,
      药敏简写: entry.药敏简写 || '',
      机制图: extras.mechanismImage || null,
      机制图说明: extras.mechCaption || '示意图',
      形态: extras.morphology || null,
      形态图片: extras.photos || null,
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
      质控用途: entry.质控用途 || 'QC',
      质控方法: entry.质控方法 || '',
      质控培养基: entry.质控培养基 || '',
      质控孵育: entry.质控孵育 || '',
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

  function sidebarVM(moduleKey, categories, entries, selectedId) {
    var roots = (categories && categories[moduleKey]) ? categories[moduleKey] : [];
    var leafSet = window.Core.collectLeaves(roots, {});

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
    var tokens = (query || '').trim().toLowerCase().split(/\s+/).filter(Boolean); // 用于结果高亮
    return {
      query: query,
      tokens: tokens,
      items: (results || []).map(function (r) {
        return {
          id: r.id, 名称: r.名称, module: r.module, 摘要: r.摘要 || '',
          命中字段: r.命中字段 || '', 命中片段: r.命中片段 || '',
          href: '#/' + r.module + '/' + r.id
        };
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

  // ===== 生化反查（填结果 → 倒推候选菌）=====
  // 生化项目名归一：去括注/空白，合并常见同义或异体写法
  var BIO_ALIAS = { '血浆凝固酶': '凝固酶', '过氧化氢酶': '触酶', '甘露醇发酵': '甘露醇' };
  function normBioItem(s) {
    var k = String(s == null ? '' : s).replace(/[（(].*?[)）]/g, '').replace(/（.*?）/g, '').replace(/H₂S/g, 'H2S').replace(/\s+/g, '').trim();
    return BIO_ALIAS[k] || k;
  }
  // 结果字符串 → 极性：'阳性' | '阴性' | '可变' | '其他'
  function bioPolarity(r) {
    r = String(r == null ? '' : r);
    var head = r.slice(0, 6);
    if (/可变|不定|迟缓|偶|不一|多变/.test(head)) { return '可变'; }
    if (/^[+＋]/.test(r) || /^阳性/.test(r)) { return '阳性'; }
    if (/^[-−–]/.test(r) || /^阴性/.test(r)) { return '阴性'; }
    if (/弱阳/.test(head)) { return '可变'; }
    if (/阳性/.test(head)) { return '阳性'; }
    if (/阴性/.test(head)) { return '阴性'; }
    return '其他';
  }
  // 每菌归一化生化谱：{ id: { 归一项目: 极性 } }
  function bioProfiles(biochemMap) {
    var out = {};
    Object.keys(biochemMap || {}).forEach(function (id) {
      var m = {};
      (biochemMap[id] || []).forEach(function (x) { m[normBioItem(x.项目)] = bioPolarity(x.结果); });
      out[id] = m;
    });
    return out;
  }
  // 反查：specified = { 归一项目: '阳性'|'阴性' }。返回一致候选（无矛盾）与部分匹配（有矛盾）两组，按匹配数排序。
  function bioIdentify(biochemMap, nameById, specified) {
    var profiles = bioProfiles(biochemMap);
    var keys = Object.keys(specified || {}).filter(function (k) { return specified[k] === '阳性' || specified[k] === '阴性'; });
    var all = Object.keys(profiles).map(function (id) {
      var prof = profiles[id], match = 0, contradict = 0, known = 0, hits = [], miss = [];
      keys.forEach(function (k) {
        var p = prof[k];
        if (p === '阳性' || p === '阴性') { known++; if (p === specified[k]) { match++; hits.push(k); } else { contradict++; miss.push(k); } }
      });
      return { id: id, 名称: (nameById && nameById[id]) || id, match: match, contradict: contradict, known: known, hits: hits, miss: miss };
    });
    var consistent = all.filter(function (r) { return r.contradict === 0 && r.match > 0; })
      .sort(function (a, b) { return b.match - a.match || a.known - b.known || (a.名称 > b.名称 ? 1 : -1); });
    var near = all.filter(function (r) { return r.contradict > 0 && r.match > 0; })
      .sort(function (a, b) { return (b.match - b.contradict) - (a.match - a.contradict) || b.match - a.match; });
    return { specifiedKeys: keys, consistent: consistent, near: near };
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
          仅尿路: d.仅尿路 || false,
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

  // 天然耐药速查里"常见/临床重要"的属排序（越靠前越常见）；未列出的属按数据顺序排其后。
  var INTRINSIC_PRIORITY = [
    '埃希菌属', '克雷伯菌属', '肠杆菌属', '假单胞菌属', '葡萄球菌属', '肠球菌属',
    '不动杆菌属', '变形杆菌属', '窄食单胞菌属', '沙雷菌属', '弧菌属', '嗜血杆菌属',
    '奈瑟菌属', '链球菌属', '沙门菌属', '志贺菌属', '弯曲菌属', '伯克霍尔德菌属',
    '柠檬酸杆菌属', '摩根菌属', '普罗威登斯菌属', '耶尔森菌属', '拟杆菌属', '梭菌属',
    '念珠菌属', '曲霉属', '隐球菌属', '毛霉属', '根霉属'
  ];

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
    // 常见/临床重要的属排前，其余按数据(分类)顺序在后
    var keys = Object.keys(byCat);
    var orig = {};
    keys.forEach(function (k, i) { orig[k] = i; });
    keys.sort(function (a, b) {
      var ia = INTRINSIC_PRIORITY.indexOf(a); if (ia < 0) { ia = 1000 + orig[a]; }
      var ib = INTRINSIC_PRIORITY.indexOf(b); if (ib < 0) { ib = 1000 + orig[b]; }
      return ia - ib;
    });
    return {
      count: list.length,
      groups: keys.map(function (k) { return { 类别: k, items: byCat[k] }; })
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

  // ===== 判读引擎（结构化，CLSI M100 风格）=====
  // 结果类别：S=敏感, I=中介, SDD=剂量依赖性敏感, R=耐药,
  //   NS=非敏感（仅设敏感折点且高于折点，按 CLSI 报为 nonsusceptible）,
  //   unknown=折点不完整或落入未定义间隙, invalid=输入非法。
  // 标准二倍稀释梯度（μg/mL）：把非梯度 MIC 输入按 CLSI 规则向上归入的目标点。
  var DILUTIONS = [0.008, 0.015, 0.03, 0.06, 0.12, 0.25, 0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
  function nextDilution(val) {
    for (var k = 0; k < DILUTIONS.length; k++) { if (val <= DILUTIONS[k] + 1e-9) { return DILUTIONS[k]; } }
    return null;
  }
  // 把 S / 中段 / R 三段折点字符串规整为结构化判读规格。
  //   midKind: 中段实际类别（字符串含 SDD → 'SDD'，否则 'I'）。
  //   susceptibleOnly: 仅设敏感折点（无中段、无耐药折点）——高于 S 折点判为 NS。
  function normalizeSpec(bpS, bpMid, bpR) {
    var S = parseBP(bpS), mid = parseBP(bpMid), R = parseBP(bpR);
    return { S: S, mid: mid, R: R, midKind: /SDD/i.test(String(bpMid || '')) ? 'SDD' : 'I', susceptibleOnly: !!S && !mid && !R };
  }
  function midLabel(kind) { return kind === 'SDD' ? '剂量依赖性敏感 SDD' : '中介 I'; }
  // 谓词求值：折点谓词 p 命中数值 val 时返回 true（含 ≤ < ≥ > = 与区间，容差 1e-9）。
  function bpHit(p, val) {
    if (!p) { return false; }
    switch (p.type) {
      case 'le': return val <= p.val + 1e-9;
      case 'lt': return val < p.val - 1e-9;
      case 'ge': return val >= p.val - 1e-9;
      case 'gt': return val > p.val + 1e-9;
      case 'value': return Math.abs(val - p.val) < 1e-9;
      case 'range': return val >= p.lo - 1e-9 && val <= p.hi + 1e-9;
      default: return false;
    }
  }
  // 分类 MIC（不做梯度归一）。返回 {result, reason}。判读优先级：R → S → 中段 → NS/间隙。
  function classifyMIC(val, spec) {
    if (bpHit(spec.R, val)) { return { result: 'R', reason: 'MIC ' + (spec.R.type === 'gt' ? '> ' : '≥ ') + spec.R.val + '（耐药折点）' }; }
    if (bpHit(spec.S, val)) { return { result: 'S', reason: 'MIC ' + (spec.S.type === 'lt' ? '< ' : '≤ ') + spec.S.val + '（敏感折点）' }; }
    var m = spec.mid;
    if (m && (m.type === 'range' || m.type === 'value' || m.type === 'le') && bpHit(m, val)) {
      var seg = m.type === 'range' ? ('在 ' + m.lo + '–' + m.hi) : (m.type === 'le' ? ('≤ ' + m.val) : ('= ' + m.val));
      return { result: spec.midKind, reason: 'MIC ' + seg + '（' + midLabel(spec.midKind) + '）' };
    }
    if (spec.susceptibleOnly) {
      return { result: 'NS', reason: '高于敏感折点（' + (spec.S.type === 'lt' ? '<' : '≤') + spec.S.val + '），且该药仅设敏感折点、未建立 I/R；按 CLSI 报告为非敏感(NS)，不能判为耐药，建议结合 MIC 分布/参比实验室' };
    }
    if (!spec.S && !spec.R && !(spec.mid && spec.mid.type === 'le')) { return { result: 'unknown', reason: '该药物无完整 S/I/R 折点，无法判读' }; }
    return { result: 'unknown', reason: 'MIC 不在任何折点区间内' };
  }
  // 分类抑菌圈（纸片法，方向相反：圈越大越敏感）。S 段为 ≥、R 段为 ≤、中段为区间。
  function classifyZone(val, spec) {
    if (bpHit(spec.S, val)) { return { result: 'S', reason: '抑菌圈 ' + (spec.S.type === 'gt' ? '> ' : '≥ ') + spec.S.val + ' mm（敏感折点）' }; }
    if (bpHit(spec.R, val)) { return { result: 'R', reason: '抑菌圈 ' + (spec.R.type === 'lt' ? '< ' : '≤ ') + spec.R.val + ' mm（耐药折点）' }; }
    if (spec.mid && spec.mid.type === 'range' && bpHit(spec.mid, val)) { return { result: spec.midKind, reason: '抑菌圈在 ' + spec.mid.lo + '–' + spec.mid.hi + ' mm（' + midLabel(spec.midKind) + '）' }; }
    if (spec.susceptibleOnly && spec.S && spec.S.type === 'ge' && val < spec.S.val - 1e-9) { return { result: 'NS', reason: '抑菌圈小于敏感折点，且仅设敏感折点 → 非敏感(NS)' }; }
    return { result: 'unknown', reason: '抑菌圈不在任何折点区间内' };
  }
  // MIC 判读（对外）：输入数值 + S/中段(可含 SDD)/R 折点字符串。非标准梯度值按 CLSI 向上归入后重判。
  function judgeMIC(micInput, bpS, bpMid, bpR) {
    var val = parseFloat(micInput);
    if (isNaN(val) || val < 0) { return { result: 'invalid', reason: 'MIC 输入无效（请输入非负数字）' }; }
    var spec = normalizeSpec(bpS, bpMid, bpR);
    var res = classifyMIC(val, spec);
    if (res.result !== 'unknown') { return res; }
    // 非标准梯度值：按 CLSI 规则向上归入下一较高的二倍稀释点后重判
    var up = nextDilution(val);
    if (up != null && Math.abs(up - val) > 1e-9) {
      var res2 = classifyMIC(up, spec);
      if (res2.result !== 'unknown') {
        res2.adjusted = true;
        res2.interpretedValue = up;
        res2.originalValue = val;
        res2.reason = '输入 MIC ' + val + ' 非标准二倍稀释点，按 CLSI 向上归入 ' + up + ' μg/mL → ' + res2.reason;
        return res2;
      }
    }
    return res;
  }
  // 抑菌圈判读（对外）：输入 mm 值 + S/I/R 抑菌圈折点字符串。圈直径为整数、不做梯度归一。
  function judgeZone(zoneInput, zS, zMid, zR) {
    var val = parseFloat(zoneInput);
    if (isNaN(val) || val < 0) { return { result: 'invalid', reason: '抑菌圈输入无效（请输入非负整数，单位 mm）' }; }
    return classifyZone(val, normalizeSpec(zS, zMid, zR));
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
    // 严重度排序：必须修正 > 需复核 > 限制报告；同级按类别聚拢、保持原相对顺序
    var rank = { '必须修正': 0, '需复核': 1, '限制报告': 2 };
    var sorted = list.map(function (item, i) { return { item: item, i: i }; }).sort(function (a, b) {
      var ra = rank[a.item.等级]; if (ra == null) { ra = 9; }
      var rb = rank[b.item.等级]; if (rb == null) { rb = 9; }
      if (ra !== rb) { return ra - rb; }
      var ca = a.item.类别 || '其他', cb = b.item.类别 || '其他';
      if (ca !== cb) { return ca < cb ? -1 : 1; }
      return a.i - b.i;
    }).map(function (x) { return x.item; });
    return {
      count: list.length,
      levels: ['all', '必须修正', '需复核', '限制报告'],
      list: sorted,
      groups: Object.keys(byCat).map(function (cat) {
        return { 类别: cat, items: byCat[cat] };
      })
    };
  }

  // ===== EUCAST 折点（与 CLSI 并排对照）=====
  // 按菌组名查 EUCAST 折点，返回 { 来源, drug: {药物名 → {MIC_S,MIC_R,括注}} }；无则 null
  function eucastVM(菌组名, list) {
    var g = (list || []).filter(function (x) { return x.菌组名 === 菌组名; })[0];
    if (!g) { return null; }
    var map = {};
    (g.药物 || []).forEach(function (d) { map[d.药物] = d; });
    return { 来源: g.来源, drug: map };
  }
  // 从字符串里取第一个数值（用于比较 CLSI 与 EUCAST 的 S/R 界值是否不同）
  function firstNum(s) { var m = String(s == null ? '' : s).match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null; }
  // CLSI MIC "≤8 / 16 / ≥32" 的 S(首段)、R(末段) 与 EUCAST S≤/R> 是否不同
  function micDiffers(clsiMIC, euS, euR) {
    if (!clsiMIC || clsiMIC === '—') { return false; }
    var segs = String(clsiMIC).split(' / '); // S/I/R 以 " / " 分隔；复方内部的 "/" 无空格，不会误切
    var cS = firstNum(segs[0]), cR = firstNum(segs[segs.length - 1]);
    var eS = firstNum(euS), eR = firstNum(euR);
    if (eS != null && cS != null && eS !== cS) { return true; }
    if (eR != null && cR != null && eR !== cR) { return true; }
    return false;
  }


  return {
    moduleLabel: moduleLabel,
    mechanismImageFor: mechanismImageFor,
    referenceLinks: referenceLinks,
    detailVM: detailVM,
    sidebarVM: sidebarVM,
    searchVM: searchVM,
    buildComparison: buildComparison,
    normBioItem: normBioItem,
    bioPolarity: bioPolarity,
    bioIdentify: bioIdentify,
    buildCardComparison: buildCardComparison,
    breakpointGroup: breakpointGroup,
    breakpointVM: breakpointVM,
    ecvGroup: ecvGroup,
    ecvVM: ecvVM,
    isRetiredBreakpointGroup: isRetiredBreakpointGroup,
    isRetiredBreakpointDrug: isRetiredBreakpointDrug,
    judgeableBreakpointGroups: judgeableBreakpointGroups,
    intrinsicVM: intrinsicVM,
    parseBP: parseBP,
    normalizeSpec: normalizeSpec,
    classifyMIC: classifyMIC,
    judgeMIC: judgeMIC,
    judgeZone: judgeZone,
    breakpointLookupVM: breakpointLookupVM,
    astAlertsVM: astAlertsVM,
    eucastVM: eucastVM,
    micDiffers: micDiffers
  };
});
