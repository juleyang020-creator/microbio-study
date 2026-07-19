(function (factory) {
  'use strict';
  var Core = factory();
  if (typeof module !== 'undefined' && module.exports) { module.exports = Core; }
  if (typeof window !== 'undefined') { window.Core = Core; }
})(function () {
  'use strict';

  var MODULE_KEYS = ['microbes', 'antibiotics', 'resistance', 'cards', 'tests', 'media', 'staining', 'biochem-tests', 'qc-strains'];
  var SEARCH_ALIASES = {
    'ng': ['淋病奈瑟菌', '淋病', 'neisseria gonorrhoeae', 'gonococcus'],
    'gc': ['淋病奈瑟菌', '淋病', 'neisseria gonorrhoeae', 'gonococcus'],
    'eco': ['大肠埃希菌', 'escherichia coli', 'e coli', 'e. coli'],
    'kpn': ['肺炎克雷伯菌', 'klebsiella pneumoniae'],
    'kp': ['肺炎克雷伯菌', 'klebsiella pneumoniae'],
    'kox': ['产酸克雷伯菌', 'klebsiella oxytoca'],
    'aba': ['鲍曼不动杆菌', 'acinetobacter baumannii'],
    'pae': ['铜绿假单胞菌', 'pseudomonas aeruginosa'],
    'sau': ['金黄色葡萄球菌', 'staphylococcus aureus'],
    'efa': ['粪肠球菌', 'enterococcus faecalis'],
    'efm': ['屎肠球菌', 'enterococcus faecium'],
    'ecl': ['阴沟肠杆菌', 'enterobacter cloacae'],
    'cdiff': ['艰难梭菌', 'clostridioides difficile', 'clostridium difficile', 'c difficile', 'c. difficile', '伪膜性肠炎'],
    'c-diff': ['艰难梭菌', 'clostridioides difficile', 'clostridium difficile', 'c difficile', 'c. difficile', '伪膜性肠炎'],
    'c diff': ['艰难梭菌', 'clostridioides difficile', 'clostridium difficile', 'c difficile', 'c. difficile', '伪膜性肠炎'],
    'mrsa': ['耐甲氧西林金黄色葡萄球菌', '金黄色葡萄球菌', 'staphylococcus aureus', 'meca', 'pbp2a'],
    'vre': ['耐万古霉素肠球菌', '肠球菌', 'enterococcus', 'vana', 'vanb'],
    'cre': ['碳青霉烯耐药肠杆菌', '肠杆菌', '碳青霉烯酶', 'kpc', 'ndm', 'oxa-48'],
    'crab': ['碳青霉烯耐药鲍曼不动杆菌', '鲍曼不动杆菌', 'acinetobacter baumannii'],
    'sxt': ['复方新诺明', '复方磺胺甲噁唑', 'tmp-smx', 'trimethoprim-sulfamethoxazole', 'cotrimoxazole'],
    'tmp-smx': ['复方新诺明', '复方磺胺甲噁唑', 'sxt', 'trimethoprim-sulfamethoxazole', 'cotrimoxazole'],
    'tmp/smx': ['复方新诺明', '复方磺胺甲噁唑', 'sxt', 'trimethoprim-sulfamethoxazole', 'cotrimoxazole'],
    'tmpsmx': ['复方新诺明', '复方磺胺甲噁唑', 'sxt', 'trimethoprim-sulfamethoxazole', 'cotrimoxazole'],
    'h pylori': ['幽门螺杆菌', 'helicobacter pylori'],
    'hp': ['幽门螺杆菌', 'helicobacter pylori'],
    'bv': ['加德纳菌', 'gardnerella vaginalis', '细菌性阴道病'],
    'lemierre': ['坏死梭杆菌', 'fusobacterium necrophorum', 'lemierre'],
    'mssa': ['金黄色葡萄球菌', 'staphylococcus aureus'],
    'mrse': ['表皮葡萄球菌', 'staphylococcus epidermidis'],
    'cons': ['凝固酶阴性葡萄球菌', '表皮葡萄球菌', 'staphylococcus epidermidis'],
    'gbs': ['无乳链球菌', 'streptococcus agalactiae'],
    'gas': ['化脓性链球菌', 'streptococcus pyogenes'],
    'spn': ['肺炎链球菌', 'streptococcus pneumoniae'],
    'pneumococcus': ['肺炎链球菌', 'streptococcus pneumoniae'],
    'hflu': ['流感嗜血杆菌', 'haemophilus influenzae'],
    'hib': ['流感嗜血杆菌', 'haemophilus influenzae'],
    'tb': ['结核分枝杆菌', 'mycobacterium tuberculosis'],
    'mtb': ['结核分枝杆菌', 'mycobacterium tuberculosis'],
    'lm': ['李斯特菌', 'listeria monocytogenes'],
    'steno': ['嗜麦芽窄食单胞菌', 'stenotrophomonas maltophilia'],
    'smaltophilia': ['嗜麦芽窄食单胞菌', 'stenotrophomonas maltophilia'],
    'campy': ['空肠弯曲菌', 'campylobacter'],
    'pcp': ['耶氏肺孢子菌', 'pneumocystis'],
    'pjp': ['耶氏肺孢子菌', 'pneumocystis'],
    'gv': ['加德纳菌', 'gardnerella vaginalis', '细菌性阴道病'],
    'esbl': ['超广谱', 'esbl', '肺炎克雷伯菌', '大肠埃希菌'],
    'ampc': ['ampc', '头孢菌素酶', '阴沟肠杆菌'],
    'kpc': ['碳青霉烯', 'kpc'],
    'ndm': ['金属', 'ndm', '碳青霉烯'],
    'mdr': ['多重耐药', '泛耐药'],
    'xdr': ['泛耐药', '广泛耐药'],
    'hiv': ['人类免疫缺陷病毒', 'human immunodeficiency', '艾滋'],
    'hbv': ['乙型肝炎病毒', 'hepatitis b'],
    'hcv': ['丙型肝炎病毒', 'hepatitis c'],
    'hsv': ['单纯疱疹病毒', 'herpes simplex'],
    'cmv': ['巨细胞病毒', 'cytomegalovirus'],
    'ebv': ['eb 病毒', 'epstein', 'epstein-barr'],
    'vzv': ['水痘', '带状疱疹', 'varicella']
  };

  function aliasKeys(term) {
    return [
      term,
      term.replace(/\s+/g, '-'),
      term.replace(/[.\s-]+/g, ''),
      term.replace(/\//g, '-')
    ];
  }

  function aliasesFor(term) {
    var out = [];
    aliasKeys(term).forEach(function (key) {
      (SEARCH_ALIASES[key] || []).forEach(function (alias) { out.push(String(alias).toLowerCase()); });
    });
    return out;
  }

  function textHasTerm(text, term) {
    if (text.indexOf(term) !== -1) { return true; }
    return aliasesFor(term).some(function (alias) { return text.indexOf(alias) !== -1; });
  }

  function buildIndex(db) {
    var index = {};
    MODULE_KEYS.forEach(function (mod) {
      (db[mod] || []).forEach(function (entry) {
        index[entry.id] = { entry: entry, module: mod };
      });
    });
    return index;
  }

  // 反向关联索引：id → [引用它的条目 id...]。数据加载后不变，建一次可多处复用。
  // 与旧全库扫描的产出顺序一致（同样按 MODULE_KEYS→条目顺序累加）。
  function buildReverseIndex(db) {
    var reverse = {};
    MODULE_KEYS.forEach(function (mod) {
      (db[mod] || []).forEach(function (entry) {
        if (!Array.isArray(entry.关联)) { return; }
        entry.关联.forEach(function (rid) {
          if (rid === entry.id) { return; }
          (reverse[rid] = reverse[rid] || []).push(entry.id);
        });
      });
    });
    return reverse;
  }

  function getRelations(id, db, index, reverse) {
    var idx = index || buildIndex(db);
    var current = idx[id] ? idx[id].entry : null;
    var forwardIds = (current && Array.isArray(current.关联)) ? current.关联.slice() : [];

    // 反向关联：优先用预建索引（O(1) 查表），否则退回全库扫描（保持向后兼容）
    var reverseIds;
    if (reverse) {
      reverseIds = (reverse[id] || []).slice();
    } else {
      reverseIds = [];
      MODULE_KEYS.forEach(function (mod) {
        (db[mod] || []).forEach(function (entry) {
          if (entry.id === id) { return; }
          if (Array.isArray(entry.关联) && entry.关联.indexOf(id) !== -1) {
            reverseIds.push(entry.id);
          }
        });
      });
    }

    var seen = {};
    var result = [];
    function push(rid, direction) {
      if (seen[rid]) { return; }
      seen[rid] = true;
      var hit = idx[rid];
      result.push({
        id: rid,
        名称: hit ? hit.entry.名称 : rid,
        module: hit ? hit.module : null,
        exists: !!hit,
        direction: direction
      });
    }
    forwardIds.forEach(function (rid) { push(rid, 'forward'); });
    reverseIds.forEach(function (rid) { push(rid, 'reverse'); });
    return result;
  }

  function pushText(out, text) {
    if (text == null) { return; }
    if (Array.isArray(text)) {
      text.forEach(function (x) { pushText(out, x); });
      return;
    }
    if (typeof text === 'object') {
      Object.keys(text).forEach(function (k) { pushText(out, text[k]); });
      return;
    }
    out.push(String(text));
  }

  // 搜索 haystack 缓存：数据加载后条目不变，按条目对象缓存一次，避免每次击键全量重建
  var _hayCache = (typeof WeakMap !== 'undefined') ? new WeakMap() : null;
  function entrySearchText(db, mod, entry) {
    if (_hayCache && _hayCache.has(entry)) { return _hayCache.get(entry); }
    var hay = [];
    pushText(hay, [entry.名称, entry.拉丁名, entry.英文, entry.类别, entry.药敏简写, entry.天然耐药, entry.药物]);
    (entry.小节 || []).forEach(function (s) { pushText(hay, [s.标题, s.正文]); });

    if (mod === 'microbes') {
      pushText(hay, (db.morphology || {})[entry.id]);
      pushText(hay, (db.biochem || {})[entry.id]);
      pushText(hay, (db.differential || {})[entry.id]);
    }
    var text = hay.join(' ').toLowerCase();
    if (_hayCache) { _hayCache.set(entry, text); }
    return text;
  }

  function searchSummary(mod, entry) {
    if (mod === 'microbes') { return entry.拉丁名 || entry.类别 || ''; }
    if (mod === 'antibiotics') { return [entry.药敏简写, entry.类别].filter(Boolean).join(' · '); }
    if (mod === 'cards') { return [entry.类别, entry.药物 ? (entry.药物.length + ' 项') : ''].filter(Boolean).join(' · '); }
    return entry.类别 || '';
  }

  // 命中片段：优先取 名称/拉丁名/英文 命中处，否则取首个命中小节；命中词前后各 20 字，供搜索结果展示上下文
  function searchSnippet(entry, tokens) {
    var out = { 字段: '', 片段: '' };
    function scan(field, raw) {
      if (out.片段) { return; }
      var val = String(raw || '').toLowerCase();
      for (var i = 0; i < tokens.length; i++) {
        var t = tokens[i]; if (!t) { continue; }
        // 检索命中走别名（输入 mrsa 能命中「金黄色葡萄球菌」），取片段时也必须找别名，
        // 否则正文里没有 mrsa 字样、片段恒为空，白白丢掉上下文与高亮
        var terms = [t].concat(aliasesFor(t));
        for (var j = 0; j < terms.length; j++) {
          var idx = val.indexOf(terms[j]);
          if (idx !== -1) {
            var s = Math.max(0, idx - 20), e = Math.min(raw.length, idx + terms[j].length + 20);
            out.字段 = field;
            out.片段 = (s > 0 ? '…' : '') + String(raw).slice(s, e) + (e < raw.length ? '…' : '');
            return;
          }
        }
      }
    }
    scan('名称', entry.名称); scan('拉丁名', entry.拉丁名); scan('英文', entry.英文);
    if (!out.片段) { (entry.小节 || []).forEach(function (sct) { scan(sct.标题 || '', sct.正文); }); }
    return out;
  }

  function searchEntries(db, query) {
    var q = (query || '').trim().toLowerCase();
    if (!q) { return []; }
    // 分词检索：空白拆成多个词，要求全部命中（AND）。
    // 这样中英混输、缩写+种名（如 "staph aureus" / "大肠 coli"）都能匹配。
    var tokens = aliasesFor(q).length ? [q] : q.split(/\s+/).filter(Boolean);
    var results = [];
    MODULE_KEYS.forEach(function (mod) {
      (db[mod] || []).forEach(function (entry) {
        var hay = entrySearchText(db, mod, entry);
        var hit = tokens.every(function (t) { return textHasTerm(hay, t); });
        if (!hit) { return; }
        // 相关度：命中名称/拉丁名/英文名比命中正文得分更高，整串命中再加分
        var head = String((entry.名称 || '') + ' ' + (entry.拉丁名 || '') + ' ' + (entry.英文 || '')).toLowerCase();
        var score = 0;
        tokens.forEach(function (t) { if (textHasTerm(head, t)) { score += 2; } });
        if (textHasTerm(head, q)) { score += 3; }
        var snip = searchSnippet(entry, tokens);
        results.push({ id: entry.id, 名称: entry.名称, module: mod, 摘要: searchSummary(mod, entry), _score: score, 命中字段: snip.字段, 命中片段: snip.片段 });
      });
    });
    results.sort(function (a, b) { return b._score - a._score; });
    return results.map(function (r) { return { id: r.id, 名称: r.名称, module: r.module, 摘要: r.摘要, 命中字段: r.命中字段, 命中片段: r.命中片段 }; });
  }

  // 递归收集"叶子"分类名（无子类的节点），支持任意层级（如 大类→形态→属）
  function collectLeaves(nodes, out) {
    (nodes || []).forEach(function (node) {
      if (node.子类 && node.子类.length) { collectLeaves(node.子类, out); }
      else { out[node.名称] = true; }
    });
    return out;
  }

  function leafNames(categories, moduleKey) {
    return collectLeaves((categories && categories[moduleKey]) ? categories[moduleKey] : [], {});
  }

  function validateData(db, categories) {
    var problems = [];
    var idCount = {};
    MODULE_KEYS.forEach(function (mod) {
      (db[mod] || []).forEach(function (entry) {
        idCount[entry.id] = (idCount[entry.id] || 0) + 1;
      });
    });
    Object.keys(idCount).forEach(function (id) {
      if (idCount[id] > 1) {
        problems.push('重复的 id：' + id + '（出现 ' + idCount[id] + ' 次）');
      }
    });

    var index = buildIndex(db);
    MODULE_KEYS.forEach(function (mod) {
      var leaves = leafNames(categories, mod);
      (db[mod] || []).forEach(function (entry) {
        (entry.关联 || []).forEach(function (rid) {
          if (!index[rid]) {
            problems.push('悬空关联：' + entry.id + ' → ' + rid + '（目标不存在）');
          }
        });
        if (entry.类别 && !leaves[entry.类别]) {
          problems.push('未匹配分类：' + entry.id + ' 的类别 “' + entry.类别 + '” 不在分类树中');
        }
      });
    });
    return problems;
  }

  return {
    MODULE_KEYS: MODULE_KEYS,
    buildIndex: buildIndex,
    buildReverseIndex: buildReverseIndex,
    getRelations: getRelations,
    searchEntries: searchEntries,
    aliasesFor: aliasesFor,   // View.searchVM 高亮时要把别名一并标出
    validateData: validateData,
    collectLeaves: collectLeaves
  };
});
