'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../js/core.js');

const ids = results => results.map(result => result.id);

// 只用检索占位词或既有别名表，不在测试中编写医学知识。
test('精确名称、拉丁名、英文名优先于名称包含，正文提及最后', () => {
  const db = {
    glossary: [
      { id: 'body', 名称: 'Other', 小节: [{ 标题: 'Text', 正文: 'Alpha' }] },
      { id: 'partial', 名称: 'Alpha overview' },
      { id: 'name', 名称: 'Alpha' },
      { id: 'latin', 名称: 'Latin entry', 拉丁名: 'Alpha' },
      { id: 'english', 名称: 'English entry', 英文: 'ALPHA' }
    ]
  };
  assert.deepEqual(ids(Core.searchEntries(db, 'alpha')), ['name', 'latin', 'english', 'partial', 'body']);
});

test('原词精确名称优先，已知别名精确名称仍优先于名称包含和正文', () => {
  const alias = Core.aliasesFor('eco')[0];
  const db = {
    glossary: [
      { id: 'body', 名称: 'Other', 小节: [{ 标题: 'Text', 正文: alias }] },
      { id: 'partial', 名称: alias + ' overview' },
      { id: 'expanded', 名称: alias },
      { id: 'literal', 名称: 'ECO' }
    ]
  };
  assert.deepEqual(ids(Core.searchEntries(db, 'eco')), ['literal', 'expanded', 'partial', 'body']);
});

test('多词查询保留短语别名的 OR 分组，附加词与其他分组之间为 AND', () => {
  const alias = Core.aliasesFor('c diff')[0];
  const db = {
    glossary: [
      { id: 'both', 名称: alias, 小节: [{ 标题: 'Text', 正文: 'alpha' }] },
      { id: 'alias-only', 名称: alias },
      { id: 'word-only', 名称: 'alpha' },
      { id: 'split-phrase', 名称: 'c separate diff alpha' }
    ]
  };
  assert.deepEqual(ids(Core.searchEntries(db, 'c diff alpha')), ['both']);
  assert.deepEqual(ids(Core.searchEntries(db, 'alpha c diff')), ['both']);
  assert.deepEqual(ids(Core.searchEntries(db, 'c diff missing')), []);
});

test('查询与来源都归一全角 ASCII、大小写和常见复制空白', () => {
  const db = { glossary: [
    { id: 'partial', 名称: 'Alpha beta overview' },
    { id: 'exact', 名称: 'Ａｌｐｈａ\u00a0\t\nＢｅｔａ' }
  ] };
  for (const query of ['alpha beta', '\u3000ＡＬＰＨＡ\u200b\tＢＥＴＡ\u00a0']) {
    assert.deepEqual(ids(Core.searchEntries(db, query)), ['exact', 'partial']);
  }
  const aliasDb = { glossary: [{ id: 'alias', 名称: Core.aliasesFor('c diff')[0] }] };
  assert.deepEqual(ids(Core.searchEntries(aliasDb, '\u3000Ｃ\u00a0\tＤＩＦＦ\n')), ['alias']);
  assert.deepEqual(Core.aliasesFor('　ＥＣＯ　'), Core.aliasesFor('eco'));
  assert.deepEqual(Core.searchEntries(db, '\u200b\u00a0\u3000\ufeff'), []);
});

test('对象原型键只作为普通查询词，不读取别名表的继承属性', () => {
  for (const name of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
    assert.deepEqual(Core.aliasesFor(name), []);
    assert.deepEqual(ids(Core.searchEntries({ glossary: [{ id: 'literal', 名称: name }] }, name)), ['literal']);
  }
});

test('可复用索引查询不再读取源名称、正文或扩展数据，返回对象保持兼容', () => {
  assert.equal(typeof Core.createSearchIndex, 'function');
  assert.equal(typeof Core.searchIndex, 'function');
  let reads = 0;
  const entry = {
    id: 'entry', 类别: 'Category',
    get 名称() { reads++; return 'Alpha'; },
    小节: [{ 标题: 'Text', get 正文() { reads++; return 'body-token'; } }]
  };
  const db = { microbes: [entry], morphology: {
    entry: { get note() { reads++; return 'extra-token'; } }
  } };
  const index = Core.createSearchIndex(db);
  const readsAfterBuild = reads;
  assert.ok(readsAfterBuild > 0);
  const expected = [{ id: 'entry', 名称: 'Alpha', module: 'microbes', 摘要: 'Category', 命中字段: '名称', 命中片段: 'Alpha' }];
  for (let i = 0; i < 3; i++) {
    assert.deepEqual(Core.searchIndex(index, 'alpha'), expected);
    assert.deepEqual(ids(Core.searchIndex(index, 'body-token')), ['entry']);
    assert.deepEqual(ids(Core.searchIndex(index, 'extra-token')), ['entry']);
  }
  assert.equal(reads, readsAfterBuild);
  assert.deepEqual(Core.searchEntries(db, 'alpha'), expected);
  assert.equal(reads, readsAfterBuild, '兼容入口应复用当前 db 已构建的索引');
});

test('searchTokens 导出与检索一致的归一高亮词，逐组扩展别名且去重', () => {
  assert.equal(typeof Core.searchTokens, 'function');
  const tokens = Core.searchTokens('　ＥＣＯ\talpha eco　');
  assert.deepEqual(new Set(tokens), new Set(['eco', 'alpha', ...Core.aliasesFor('eco')]));
  assert.equal(tokens.length, new Set(tokens).size);
  assert.ok(tokens.every((token, i) => i === 0 || tokens[i - 1].length >= token.length));
  assert.deepEqual(new Set(Core.searchTokens('c diff alpha')), new Set(['c diff', 'alpha', ...Core.aliasesFor('c diff')]));
  assert.deepEqual(Core.searchTokens('e c o'), ['e', 'c', 'o'], '禁止把不同查询词拼成一个缩写');
  assert.deepEqual(Core.searchTokens('\u200b　\n'), []);
});

test('归一后的片段位置映射回原文，不因长空白而截掉真实命中', () => {
  for (const matched of ['ＡＬＰＨＡ', 'Ｃ' + '\u00a0'.repeat(40) + 'ＤＩＦＦ']) {
    const raw = 'prefix '.repeat(8) + '\t '.repeat(40) + matched + ' suffix'.repeat(8);
    const query = matched.startsWith('Ｃ') ? 'c diff' : 'alpha';
    const db = { glossary: [{ id: 'entry', 名称: 'Other', 小节: [{ 标题: 'Text', 正文: raw }] }] };
    const result = Core.searchEntries(db, query)[0];
    const start = raw.indexOf(matched);
    assert.equal(result.命中字段, 'Text');
    assert.equal(result.命中片段, '…' + raw.slice(start - 20, start + matched.length + 20) + '…');
  }
});

test('药敏简写作为精确别名优先于正文提及，并提供原文片段', () => {
  const db = {
    microbes: [{ id: 'body', 名称: 'Other', 小节: [{ 标题: 'Text', 正文: 'ZXQ' }] }],
    antibiotics: [{ id: 'code', 名称: 'Example', 药敏简写: 'ZXQ' }]
  };
  const results = Core.searchEntries(db, 'zxq');
  assert.deepEqual(ids(results), ['code', 'body']);
  assert.equal(results[0].命中字段, '药敏简写');
  assert.equal(results[0].命中片段, 'ZXQ');
});

test('已知英文缩写不误中其他英文单词内部，普通名称仍允许前缀检索', () => {
  const db = { glossary: [
    { id: 'noise', 名称: 'staining', 类别: 'alpha' },
    { id: 'embedded', 名称: 'xng2', 类别: 'alpha' },
    { id: 'literal', 名称: 'NG', 类别: 'alpha' },
    { id: 'expanded', 名称: Core.aliasesFor('ng')[0], 类别: 'alpha' },
    { id: 'later', 名称: 'Other', 小节: [{ 标题: 'Text', 正文: 'staining / NG / alpha' }] }
  ] };
  assert.deepEqual(ids(Core.searchEntries(db, 'ng')), ['literal', 'expanded', 'later']);
  assert.deepEqual(ids(Core.searchEntries(db, 'ng alpha')), ['literal', 'expanded', 'later']);
  assert.deepEqual(ids(Core.searchEntries({ glossary: [{ id: 'prefix', 名称: 'Alphabet' }] }, 'alph')), ['prefix']);
});

test('不同 db 或模块复用同一条目时，扩展数据不串到其他索引', () => {
  const entry = { id: 'shared', 名称: 'Entry' };
  const first = { microbes: [entry], morphology: { shared: { note: 'first-token' } } };
  const second = { microbes: [entry], morphology: { shared: { note: 'second-token' } } };
  const otherModule = { glossary: [entry], morphology: first.morphology };
  assert.deepEqual(ids(Core.searchEntries(first, 'first-token')), ['shared']);
  assert.deepEqual(ids(Core.searchEntries(second, 'second-token')), ['shared']);
  assert.deepEqual(Core.searchEntries(second, 'first-token'), []);
  assert.deepEqual(Core.searchEntries(otherModule, 'first-token'), []);
});

test('显式重建读取更新后的数据，同时刷新兼容入口；旧索引保留快照', () => {
  const entry = { id: 'entry', 名称: 'Alpha', 小节: [{ 标题: 'Text', 正文: 'old-token' }] };
  const db = { glossary: [entry] };
  const oldIndex = Core.createSearchIndex(db);
  entry.名称 = 'Beta';
  entry.小节[0].正文 = 'new-token';
  db.glossary.push({ id: 'added', 名称: 'Beta' });
  const updated = Core.createSearchIndex(db);
  assert.deepEqual(ids(Core.searchIndex(oldIndex, 'old-token')), ['entry']);
  assert.deepEqual(Core.searchIndex(oldIndex, 'beta'), []);
  assert.deepEqual(Core.searchIndex(updated, 'old-token'), []);
  assert.deepEqual(ids(Core.searchIndex(updated, 'beta')), ['entry', 'added']);
  assert.deepEqual(Core.searchEntries(db, 'beta'), Core.searchIndex(updated, 'beta'));
});

test('多分组 AND 可跨字段匹配，但单个分组的别名不能替代另一分组', () => {
  const first = Core.aliasesFor('eco')[0];
  const second = Core.aliasesFor('kpn')[0];
  const db = { glossary: [
    { id: 'first-only', 名称: first, 类别: 'alpha' },
    { id: 'second-only', 名称: second, 类别: 'alpha' },
    { id: 'both', 名称: first, 小节: [{ 标题: 'Text', 正文: second }], 类别: 'alpha' }
  ] };
  assert.deepEqual(ids(Core.searchEntries(db, 'eco kpn alpha')), ['both']);
  assert.deepEqual(ids(Core.searchEntries(db, 'alpha kpn eco')), ['both']);
  assert.deepEqual(Core.searchEntries(db, 'eco kpn missing'), []);
  assert.deepEqual(Core.searchEntries(db, 'ecoo'), [], '不做拼写猜测或自动纠错');
});

test('索引覆盖全部模块并保留稳定次序，不修改输入或泄漏可变结果', () => {
  const db = {};
  for (const module of Core.MODULE_KEYS) {
    db[module] = Object.freeze([Object.freeze({ id: module, 名称: 'Alpha', 类别: 'Category' })]);
  }
  Object.freeze(db);
  const index = Core.createSearchIndex(db);
  const results = Core.searchIndex(index, 'alpha');
  assert.deepEqual(ids(results), Core.MODULE_KEYS);
  assert.deepEqual(Core.searchEntries(db, 'alpha'), results);
  results[0].名称 = 'changed';
  results.pop();
  assert.equal(Core.searchIndex(index, 'alpha')[0].名称, 'Alpha');
  assert.equal(Core.searchIndex(index, 'alpha').length, Core.MODULE_KEYS.length);
});

test('空库、空查询安全返回空结果，归一不折叠上标或其他专业符号', () => {
  const empty = Core.createSearchIndex({});
  for (const query of [undefined, null, '', ' \t\n', 'unknown']) {
    assert.deepEqual(Core.searchIndex(empty, query), []);
    assert.deepEqual(Core.searchEntries({}, query), []);
  }
  const db = { glossary: [{ id: 'symbol', 名称: 'A²' }] };
  assert.deepEqual(ids(Core.searchEntries(db, 'a²')), ['symbol']);
  assert.deepEqual(Core.searchEntries(db, 'a2'), []);
});

test('中文常用简称金葡和金葡菌先返回对应名称，而非正文提及', () => {
  const db = { microbes: [
    { id: 'mention', 名称: '其他条目', 小节: [{ 标题: '名称引用', 正文: '金葡菌' }] },
    { id: 'staphylococcus-aureus', 名称: '金黄色葡萄球菌', 拉丁名: 'Staphylococcus aureus' }
  ] };
  for (const query of ['金葡', '金葡菌']) {
    assert.equal(Core.searchEntries(db, query)[0].id, 'staphylococcus-aureus');
    assert.ok(Core.searchTokens(query).includes('金黄色葡萄球菌'));
  }
});
