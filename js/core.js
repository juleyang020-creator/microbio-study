(function (factory) {
  'use strict';
  var Core = factory();
  if (typeof module !== 'undefined' && module.exports) { module.exports = Core; }
  if (typeof window !== 'undefined') { window.Core = Core; }
})(function () {
  'use strict';

  var MODULE_KEYS = ['microbes', 'antibiotics', 'resistance', 'virulence', 'genetics', 'glossary', 'cards', 'tests', 'media', 'staining', 'biochem-tests', 'qc-strains'];
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
    // 中文简称依据东莞市疾控公开释名；仅作检索扩展，不作表型或耐药推断。
    '金葡': ['金黄色葡萄球菌', 'staphylococcus aureus'],
    '金葡菌': ['金黄色葡萄球菌', 'staphylococcus aureus'],
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

  // 只折叠全角 ASCII 与空白；不做 NFKC，避免把上标等专业符号改成别的字符。
  function normalizeSearchText(value) {
    return String(value == null ? '' : value).replace(/[\uff01-\uff5e]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
    }).toLowerCase().replace(/[\s\u200b]+/g, ' ').trim();
  }

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
    aliasKeys(normalizeSearchText(term)).forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(SEARCH_ALIASES, key)) { return; }
      SEARCH_ALIASES[key].forEach(function (alias) { out.push(String(alias).toLowerCase()); });
    });
    return out;
  }

  function termPosition(text, term) {
    var at = text.indexOf(term.text);
    while (at !== -1) {
      if (!term.wholeWord || (!/[a-z0-9]/.test(text.charAt(at - 1)) && !/[a-z0-9]/.test(text.charAt(at + term.text.length)))) { return at; }
      at = text.indexOf(term.text, at + 1);
    }
    return -1;
  }

  function textHasTerms(text, terms) {
    return terms.some(function (term) { return termPosition(text, term) !== -1; });
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

  function entrySearchText(db, mod, entry) {
    var hay = [];
    pushText(hay, [entry.名称, entry.拉丁名, entry.英文, entry.类别, entry.药敏简写, entry.天然耐药, entry.药物]);
    (entry.小节 || []).forEach(function (s) { pushText(hay, [s.标题, s.正文]); });

    if (mod === 'microbes') {
      pushText(hay, (db.morphology || {})[entry.id]);
      pushText(hay, (db.biochem || {})[entry.id]);
      pushText(hay, (db.differential || {})[entry.id]);
    }
    return normalizeSearchText(hay.join(' '));
  }

  function searchSummary(mod, entry) {
    if (mod === 'microbes') { return entry.拉丁名 || entry.类别 || ''; }
    if (mod === 'antibiotics') { return [entry.药敏简写, entry.类别].filter(Boolean).join(' · '); }
    if (mod === 'cards') { return [entry.类别, entry.药物 ? (entry.药物.length + ' 项') : ''].filter(Boolean).join(' · '); }
    return entry.类别 || '';
  }

  function snippetField(field, raw) {
    var item = { field: field, raw: raw, text: normalizeSearchText(raw) };
    // 只有长度改变时才保存偏移；折叠长空白后仍截取原文，不篡改显示内容。
    if (item.text.length !== raw.length || raw.toLowerCase().length !== raw.length) {
      item.starts = []; item.ends = [];
      var pattern = /[\s\u200b]+|[^\s\u200b]/g;
      var match;
      while ((match = pattern.exec(raw))) {
        var space = /^[\s\u200b]/.test(match[0]);
        if (space && !item.starts.length) { continue; }
        var length = space ? 1 : match[0].toLowerCase().length;
        for (var i = 0; i < length; i++) {
          item.starts.push(match.index);
          item.ends.push(match.index + match[0].length);
        }
      }
    }
    return item;
  }

  function entrySnippetFields(entry) {
    var fields = [];
    function add(field, value) {
      var raw = String(value == null ? '' : value);
      if (raw) { fields.push(snippetField(field, raw)); }
    }
    add('名称', entry.名称); add('拉丁名', entry.拉丁名); add('英文', entry.英文); add('药敏简写', entry.药敏简写);
    (entry.小节 || []).forEach(function (section) { add(section.标题 || '', section.正文); });
    return fields;
  }

  // 名称字段优先，其次正文；使用预建字段与本次查询的 OR 词组，不重新读取/拼接源数据。
  function searchSnippet(fields, groups) {
    for (var f = 0; f < fields.length; f++) {
      var field = fields[f];
      for (var i = 0; i < groups.length; i++) {
        for (var j = 0; j < groups[i].length; j++) {
          var term = groups[i][j];
          var idx = termPosition(field.text, term);
          if (idx !== -1) {
            var start = field.starts ? field.starts[idx] : idx;
            var end = field.ends ? field.ends[idx + term.text.length - 1] : idx + term.text.length;
            var s = Math.max(0, start - 20), e = Math.min(field.raw.length, end + 20);
            return { 字段: field.field, 片段: (s > 0 ? '…' : '') + field.raw.slice(s, e) + (e < field.raw.length ? '…' : '') };
          }
        }
      }
    }
    return { 字段: '', 片段: '' };
  }

  var _searchCache = (typeof WeakMap !== 'undefined') ? new WeakMap() : null;

  // 索引是数据快照；静态数据加载完后建一次。数据改变时显式重建，不跨 db 共享条目缓存。
  // 返回值供 searchIndex 使用，调用方不依赖其内部结构。重建同时刷新兼容入口的缓存。
  function createSearchIndex(db) {
    var index = { entries: [] };
    MODULE_KEYS.forEach(function (mod) {
      (db[mod] || []).forEach(function (entry) {
        var names = [entry.名称, entry.拉丁名, entry.英文, entry.药敏简写].filter(Boolean).map(normalizeSearchText);
        index.entries.push({
          id: entry.id, 名称: entry.名称, module: mod, 摘要: searchSummary(mod, entry),
          names: names, head: names.join(' '), text: entrySearchText(db, mod, entry),
          snippets: entrySnippetFields(entry)
        });
      });
    });
    if (_searchCache) { _searchCache.set(db, index); }
    return index;
  }

  var SEARCH_PHRASES = Object.keys(SEARCH_ALIASES).filter(function (key) { return key.indexOf(' ') !== -1; })
    .sort(function (a, b) { return b.length - a.length; });

  function queryTokens(q) {
    var words = q.split(/\s+/).filter(Boolean);
    var tokens = [];
    for (var i = 0; i < words.length; i++) {
      var phrase = SEARCH_PHRASES.find(function (key) {
        return words.slice(i, i + key.split(' ').length).join(' ') === key;
      });
      tokens.push(phrase || words[i]);
      if (phrase) { i += phrase.split(' ').length - 1; }
    }
    return tokens;
  }

  function searchGroups(q) {
    return queryTokens(q).map(function (token) {
      return [token].concat(aliasesFor(token)).filter(function (term, i, terms) { return terms.indexOf(term) === i; });
    });
  }

  // 给视图高亮用：与检索共享分组规则，展平去重；长词优先，避免短词抢先截断别名。
  function searchTokens(query) {
    var terms = [];
    searchGroups(normalizeSearchText(query)).forEach(function (group) {
      group.forEach(function (term) { if (terms.indexOf(term) === -1) { terms.push(term); } });
    });
    return terms.sort(function (a, b) { return b.length - a.length; });
  }

  function searchIndex(index, query) {
    var q = normalizeSearchText(query);
    if (!q) { return []; }
    // 已知短语别名作为一个 OR 分组，其余空白分词；分组之间全部命中（AND）。
    var groups = searchGroups(q).map(function (group) {
      return group.map(function (term, i) {
        // 已知英文缩写不能靠其他英文单词的内部子串命中；扩展名称仍按包含检索。
        return { text: term, wholeWord: i === 0 && group.length > 1 && /^[a-z0-9]+$/.test(term) };
      });
    });
    var exactAliases = groups.length === 1 ? groups[0].slice(1).map(function (term) { return term.text; }) : [];
    var phraseTerms = groups.length === 1 ? groups[0] : [{ text: q, wholeWord: false }];
    var results = [];
    index.entries.forEach(function (entry, order) {
      if (!groups.every(function (terms) { return textHasTerms(entry.text, terms); })) { return; }
      var score = entry.names.indexOf(q) !== -1 ? 100 : (exactAliases.some(function (alias) { return entry.names.indexOf(alias) !== -1; }) ? 60 : 0);
      groups.forEach(function (terms) { if (textHasTerms(entry.head, terms)) { score += 2; } });
      if (textHasTerms(entry.head, phraseTerms)) { score += 3; }
      var snip = searchSnippet(entry.snippets, groups);
      results.push({ entry: entry, score: score, order: order, snippet: snip });
    });
    results.sort(function (a, b) { return b.score - a.score || a.order - b.order; });
    return results.map(function (r) {
      return { id: r.entry.id, 名称: r.entry.名称, module: r.entry.module, 摘要: r.entry.摘要, 命中字段: r.snippet.字段, 命中片段: r.snippet.片段 };
    });
  }

  function searchEntries(db, query) {
    if (!normalizeSearchText(query)) { return []; }
    var index = _searchCache && _searchCache.get(db);
    return searchIndex(index || createSearchIndex(db), query);
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
    createSearchIndex: createSearchIndex,
    searchIndex: searchIndex,
    searchTokens: searchTokens,
    aliasesFor: aliasesFor,   // View.searchVM 高亮时要把别名一并标出
    validateData: validateData,
    collectLeaves: collectLeaves
  };
});
