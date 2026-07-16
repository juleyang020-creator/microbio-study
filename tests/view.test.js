'use strict';
const test = require('node:test');
const assert = require('node:assert');
const View = require('../js/view.js');

test('moduleLabel 返回中文标签', () => {
  assert.strictEqual(View.moduleLabel('microbes'), '微生物');
  assert.strictEqual(View.moduleLabel('antibiotics'), '抗微生物药');
  assert.strictEqual(View.moduleLabel('resistance'), '耐药');
  assert.strictEqual(View.moduleLabel('cards'), '药敏卡');
  assert.strictEqual(View.moduleLabel('tests'), '试验');
  assert.strictEqual(View.moduleLabel('media'), '培养基');
  assert.strictEqual(View.moduleLabel('staining'), '染色');
  assert.strictEqual(View.moduleLabel('biochem-tests'), '生化反应');
  assert.strictEqual(View.moduleLabel('unknown'), '未知');
});

test('detailVM 为空条目时返回 null', () => {
  assert.strictEqual(View.detailVM(null, []), null);
});

test('detailVM 组装标题/类别/拉丁名/小节/关联（含 href 与 label）', () => {
  const entry = { id: 'm1', 名称: '金葡', 拉丁名: 'Staph', 类别: '革兰氏阳性球菌',
    小节: [{ 标题: '致病性', 正文: '引起脓肿' }], 关联: ['a1'] };
  const rels = [{ id: 'a1', 名称: '苯唑西林', module: 'antibiotics', exists: true, direction: 'forward' }];
  const vm = View.detailVM(entry, rels);
  assert.strictEqual(vm.名称, '金葡');
  assert.strictEqual(vm.类别, '革兰氏阳性球菌');
  assert.strictEqual(vm.拉丁名, 'Staph');
  assert.strictEqual(vm.小节[0].标题, '致病性');
  assert.strictEqual(vm.关联[0].label, '抗微生物药 · 苯唑西林');
  assert.strictEqual(vm.关联[0].href, '#/antibiotics/a1');
  assert.strictEqual(vm.关联[0].exists, true);
});

test('detailVM 悬空关联：label 带问号、href 为 null', () => {
  const entry = { id: 'm1', 名称: 'x', 类别: 'c', 小节: [], 关联: ['ghost'] };
  const rels = [{ id: 'ghost', 名称: 'ghost', module: null, exists: false, direction: 'forward' }];
  const vm = View.detailVM(entry, rels);
  assert.strictEqual(vm.关联[0].label, 'ghost ?');
  assert.strictEqual(vm.关联[0].href, null);
  assert.strictEqual(vm.关联[0].exists, false);
});

const sidebarCats = { microbes: [{ 名称: '细菌', 子类: [{ 名称: '革兰氏阳性球菌' }, { 名称: '革兰氏阴性杆菌' }] }] };

test('sidebarVM 把条目挂到对应叶子，并标注选中与 href', () => {
  const entries = [{ id: 'm1', 名称: '金葡', 类别: '革兰氏阳性球菌' }];
  const vm = View.sidebarVM('microbes', sidebarCats, entries, 'm1');
  const group = vm.tree[0];
  assert.strictEqual(group.名称, '细菌');
  const leaf = group.children[0];
  assert.strictEqual(leaf.名称, '革兰氏阳性球菌');
  assert.strictEqual(leaf.entries[0].href, '#/microbes/m1');
  assert.strictEqual(leaf.entries[0].selected, true);
  assert.deepStrictEqual(vm.未分类, []);
});

test('sidebarVM 支持属级（多级）分类，菌种挂到属下', () => {
  const cats = { microbes: [
    { 名称: '细菌', 子类: [
      { 名称: '革兰氏阳性球菌', 子类: [{ 名称: '葡萄球菌属' }, { 名称: '链球菌属' }] }
    ] }
  ] };
  const entries = [{ id: 'sa', 名称: '金黄色葡萄球菌', 类别: '葡萄球菌属' }];
  const vm = View.sidebarVM('microbes', cats, entries, 'sa');
  const genus = vm.tree[0].children[0].children[0]; // 细菌 → 革兰氏阳性球菌 → 葡萄球菌属
  assert.strictEqual(genus.名称, '葡萄球菌属');
  assert.strictEqual(genus.entries[0].名称, '金黄色葡萄球菌');
  assert.strictEqual(genus.entries[0].selected, true);
});

test('sidebarVM 把未匹配分类的条目放入 未分类', () => {
  const entries = [{ id: 'x1', 名称: '怪条目', 类别: '查无此类' }];
  const vm = View.sidebarVM('microbes', sidebarCats, entries, null);
  assert.strictEqual(vm.未分类[0].名称, '怪条目');
  assert.strictEqual(vm.未分类[0].selected, false);
});

test('searchVM 组装查询词与结果项（含 href）', () => {
  const vm = View.searchVM([{ id: 'a1', 名称: '苯唑西林', module: 'antibiotics' }], '苯');
  assert.strictEqual(vm.query, '苯');
  assert.strictEqual(vm.items[0].href, '#/antibiotics/a1');
  assert.strictEqual(vm.items[0].module, 'antibiotics');
  assert.strictEqual(vm.items[0].名称, '苯唑西林');
});

test('searchVM 无结果时 items 为空数组', () => {
  assert.deepStrictEqual(View.searchVM([], '查无').items, []);
});

test('buildComparison 并排比较并标出差异项', () => {
  const names = { a: '甲菌', b: '乙菌' };
  const biochem = {
    a: [{ 项目: '触酶', 结果: '+' }, { 项目: '氧化酶', 结果: '−' }],
    b: [{ 项目: '触酶', 结果: '+' }, { 项目: '氧化酶', 结果: '+' }]
  };
  const vm = View.buildComparison(names, biochem, ['a', 'b']);
  assert.deepStrictEqual(vm.items.map((i) => i.名称), ['甲菌', '乙菌']);
  assert.strictEqual(vm.rows.find((r) => r.项目 === '触酶').differs, false);
  const oxidase = vm.rows.find((r) => r.项目 === '氧化酶');
  assert.strictEqual(oxidase.differs, true);
  assert.deepStrictEqual(oxidase.cells, ['−', '+']);
});

test('buildCardComparison 并排比较药敏卡、标出不一致药物', () => {
  const names = { a: '卡A', b: '卡B' };
  const drugs = { a: ['氨苄西林', '头孢曲松'], b: ['头孢曲松', '美罗培南'] };
  const vm = View.buildCardComparison(names, drugs, ['a', 'b']);
  assert.deepStrictEqual(vm.items.map((i) => i.名称), ['卡A', '卡B']);
  const cro = vm.rows.find((r) => r.药物 === '头孢曲松');
  assert.deepStrictEqual(cro.cells, [true, true]);
  assert.strictEqual(cro.differs, false);
  const amp = vm.rows.find((r) => r.药物 === '氨苄西林');
  assert.deepStrictEqual(amp.cells, [true, false]);
  assert.strictEqual(amp.differs, true);
});

test('buildComparison 缺失项以 — 补齐并算作差异', () => {
  const vm = View.buildComparison({ a: '甲', b: '乙' }, { a: [{ 项目: '脲酶', 结果: '+' }], b: [{ 项目: '触酶', 结果: '+' }] }, ['a', 'b']);
  const urease = vm.rows.find((r) => r.项目 === '脲酶');
  assert.deepStrictEqual(urease.cells, ['+', '—']);
  assert.strictEqual(urease.differs, true);
});

const abxCats = { antibiotics: [
  { 名称: '抑制细胞壁合成', 子类: [{ 名称: '青霉素类' }, { 名称: '头孢菌素类' }] },
  { 名称: '抑制蛋白质合成', 子类: [{ 名称: '大环内酯类' }] }
] };

test('detailVM 暴露药敏简写/机制图/生化反应', () => {
  const entry = { id: 'cro', 名称: '头孢曲松', 类别: '头孢菌素类', 药敏简写: 'CRO', 小节: [], 关联: [] };
  const vm = View.detailVM(entry, [], { mechanismImage: 'img/mechanism-cellwall.svg', biochem: [{ 项目: '氧化酶', 结果: '−' }] });
  assert.strictEqual(vm.药敏简写, 'CRO');
  assert.strictEqual(vm.机制图, 'img/mechanism-cellwall.svg');
  assert.strictEqual(vm.生化反应[0].项目, '氧化酶');
});

test('detailVM 暴露形态', () => {
  const vm = View.detailVM({ 名称: 'x', 类别: 'c', 小节: [], 关联: [] }, [], { morphology: { 镜下: 'a', 培养: [{ 培养基: '血平板', 形态: 'b' }] } });
  assert.strictEqual(vm.形态.镜下, 'a');
  assert.strictEqual(vm.形态.培养[0].培养基, '血平板');
});

test('detailVM 暴露鉴别', () => {
  const vm = View.detailVM({ 名称: 'x', 类别: 'c', 小节: [], 关联: [] }, [], { differential: [{ 名称: 'y', id: 'yy', 相似点: 'a', 鉴别: 'b' }] });
  assert.strictEqual(vm.鉴别[0].名称, 'y');
  assert.strictEqual(vm.鉴别[0].id, 'yy');
});

test('detailVM 无 extras 时默认空值', () => {
  const vm = View.detailVM({ 名称: 'x', 类别: 'c', 小节: [], 关联: [] }, []);
  assert.strictEqual(vm.药敏简写, '');
  assert.strictEqual(vm.机制图, null);
  assert.deepStrictEqual(vm.生化反应, []);
});

test('mechanismImageFor 按抗生素类别映射到机制图', () => {
  assert.strictEqual(View.mechanismImageFor('antibiotics', { 类别: '头孢菌素类' }, abxCats), 'img/mechanism-cellwall.svg');
  assert.strictEqual(View.mechanismImageFor('antibiotics', { 类别: '大环内酯类' }, abxCats), 'img/mechanism-protein.svg');
});

test('mechanismImageFor 抗真菌药按类别映射到各自机制图', () => {
  const cats = { antibiotics: [
    { 名称: '抗真菌药', 子类: [{ 名称: '唑类' }, { 名称: '多烯类' }, { 名称: '棘白菌素类' }, { 名称: '嘧啶类似物' }] }
  ] };
  assert.strictEqual(View.mechanismImageFor('antibiotics', { 类别: '唑类' }, cats), 'img/mechanism-azole.svg');
  assert.strictEqual(View.mechanismImageFor('antibiotics', { 类别: '棘白菌素类' }, cats), 'img/mechanism-echinocandin.svg');
});

test('mechanismImageFor 对非抗生素/耐药或未知类别返回 null', () => {
  assert.strictEqual(View.mechanismImageFor('microbes', { 类别: '革兰氏阳性球菌' }, abxCats), null);
  assert.strictEqual(View.mechanismImageFor('antibiotics', { 类别: '查无此类' }, abxCats), null);
  assert.strictEqual(View.mechanismImageFor('antibiotics', null, abxCats), null);
});

const resCats = { resistance: [
  { 名称: '产生灭活酶', 子类: [{ 名称: 'β-内酰胺酶' }, { 名称: '氨基糖苷修饰酶' }] },
  { 名称: '靶位改变', 子类: [{ 名称: 'PBP改变' }] },
  { 名称: '主动外排', 子类: [{ 名称: '外排泵' }] },
  { 名称: '膜通透性下降', 子类: [{ 名称: '孔蛋白缺失' }] },
  { 名称: '旁路与其他', 子类: [{ 名称: '旁路代谢' }, { 名称: '生物膜' }] }
] };

test('mechanismImageFor 耐药机制按大类/叶子映射', () => {
  assert.strictEqual(View.mechanismImageFor('resistance', { 类别: 'β-内酰胺酶' }, resCats), 'img/resistance-enzyme.svg');
  assert.strictEqual(View.mechanismImageFor('resistance', { 类别: 'PBP改变' }, resCats), 'img/resistance-target.svg');
  assert.strictEqual(View.mechanismImageFor('resistance', { 类别: '外排泵' }, resCats), 'img/resistance-efflux.svg');
  assert.strictEqual(View.mechanismImageFor('resistance', { 类别: '孔蛋白缺失' }, resCats), 'img/resistance-permeability.svg');
  // 旁路代谢 / 生物膜 同属"旁路与其他"，按叶子直接区分
  assert.strictEqual(View.mechanismImageFor('resistance', { 类别: '旁路代谢' }, resCats), 'img/resistance-bypass.svg');
  assert.strictEqual(View.mechanismImageFor('resistance', { 类别: '生物膜' }, resCats), 'img/resistance-biofilm.svg');
});

test('referenceLinks 细菌：含 PubMed/StatPearls/默沙东/CDC/LPSN，无维基', () => {
  const links = View.referenceLinks('microbes', { 名称: '金黄色葡萄球菌', 拉丁名: 'Staphylococcus aureus', 类别: '葡萄球菌属' });
  const urls = links.map(l => l.url).join(' ');
  assert.ok(links[0].url.indexOf('pubmed.ncbi.nlm.nih.gov') !== -1);
  assert.ok(links[0].url.indexOf('filter=pubt.review') !== -1);
  assert.ok(urls.indexOf('ncbi.nlm.nih.gov/books') !== -1);
  assert.ok(urls.indexOf('msdmanuals.cn') !== -1);
  assert.ok(urls.indexOf('cdc.gov') !== -1);
  assert.ok(urls.indexOf('lpsn.dsmz.de') !== -1);
  assert.strictEqual(links.filter(l => /wikipedia/.test(l.url)).length, 0);
});

test('referenceLinks 非细菌(真菌)用 NCBI 分类而非 LPSN', () => {
  const links = View.referenceLinks('microbes', { 名称: '白色念珠菌', 拉丁名: 'Candida albicans', 类别: '念珠菌属' });
  const urls = links.map(l => l.url).join(' ');
  assert.ok(urls.indexOf('Taxonomy') !== -1);
  assert.strictEqual(links.filter(l => /lpsn/.test(l.url)).length, 0);
});

test('referenceLinks 拉丁名去除括注与 spp. 后缀', () => {
  const links = View.referenceLinks('microbes', { 名称: '立克次体', 拉丁名: 'Rickettsia spp.', 类别: '立克次体属' });
  const latinUrls = links.filter(l => l.url.indexOf('msdmanuals') === -1).map(l => l.url).join(' ');
  assert.ok(latinUrls.indexOf('Rickettsia') !== -1);
  assert.ok(latinUrls.indexOf('spp') === -1);
});

test('referenceLinks 耐药用英文术语，仅 PubMed', () => {
  const links = View.referenceLinks('resistance', { 名称: 'KPC 型碳青霉烯酶', 英文: 'KPC carbapenemase' });
  assert.strictEqual(links.length, 1);
  assert.ok(links[0].url.indexOf(encodeURIComponent('KPC carbapenemase')) !== -1);
});

test('referenceLinks 对其他模块返回空数组', () => {
  assert.deepStrictEqual(View.referenceLinks('antibiotics', { 名称: '美罗培南' }), []);
  assert.deepStrictEqual(View.referenceLinks('microbes', null), []);
});

test('detailVM 暴露综述链接', () => {
  const vm = View.detailVM({ 名称: 'x', 类别: 'c', 小节: [], 关联: [] }, [], { links: [{ 标题: 'PubMed 综述', url: 'http://x' }] });
  assert.strictEqual(vm.链接.length, 1);
  assert.strictEqual(vm.链接[0].标题, 'PubMed 综述');
});

test('detailVM 暴露折点数据', () => {
  const bps = { 菌组名: '肠杆菌目', CLSI表: 'Table 1A', 药物: [{ 药物: '阿米卡星', 简写: 'AK', MIC: '≤16 / 32 / ≥64', 抑菌圈: '≥17 / 15–16 / ≤14', 备注: '' }] };
  const vm = View.detailVM({ 名称: 'x', 类别: 'c', 小节: [], 关联: [] }, [], { breakpoints: bps });
  assert.strictEqual(vm.折点.菌组名, '肠杆菌目');
  assert.strictEqual(vm.折点.药物[0].简写, 'AK');
});

test('detailVM 无折点数据时折点为 null', () => {
  const vm = View.detailVM({ 名称: 'x', 类别: 'c', 小节: [], 关联: [] }, []);
  assert.strictEqual(vm.折点, null);
});

test('breakpointGroup 按菌 id 匹配所属菌组', () => {
  const bps = [
    { 菌组名: '肠杆菌目', CLSI表: 'Table 1A', 菌种: ['e-coli', 'klebsiella-pneumoniae'], 药物: [] },
    { 菌组名: '铜绿假单胞菌', CLSI表: 'Table 1B', 菌种: ['pseudomonas-aeruginosa'], 药物: [] }
  ];
  const g = View.breakpointGroup('e-coli', bps);
  assert.strictEqual(g.菌组名, '肠杆菌目');
  assert.strictEqual(View.breakpointGroup('pseudomonas-aeruginosa', bps).菌组名, '铜绿假单胞菌');
  assert.strictEqual(View.breakpointGroup('nope', bps), null);
  assert.strictEqual(View.breakpointGroup('e-coli', null), null);
});

test('breakpointVM 转换折点数据为紧凑视图', () => {
  const bps = [
    { 菌组名: '肠杆菌目', CLSI表: 'Table 1A', 菌种: ['e-coli'], 药物: [
      { 药物: '阿米卡星 (Amikacin)', 简写: 'AK', MIC_S: '≤16', MIC_I: '32', MIC_R: '≥64', 抑菌圈_S: '≥17', 抑菌圈_I: '15–16', 抑菌圈_R: '≤14', 备注: '' },
      { 药物: '氨苄西林 (Ampicillin)', 简写: 'AM', MIC_S: '≤8', MIC_I: '16', MIC_R: '≥32', 抑菌圈_S: '≥17', 抑菌圈_I: '14–16', 抑菌圈_R: '≤13', 备注: '部分菌种适用' }
    ]}
  ];
  const vm = View.breakpointVM('e-coli', bps);
  assert.strictEqual(vm.菌组名, '肠杆菌目');
  assert.strictEqual(vm.CLSI表, 'Table 1A');
  assert.strictEqual(vm.药物[0].简写, 'AK');
  assert.strictEqual(vm.药物[0].MIC, '≤16 / 32 / ≥64');
  assert.strictEqual(vm.药物[0].抑菌圈, '≥17 / 15–16 / ≤14');
  assert.strictEqual(vm.药物[1].MIC, '≤8 / 16 / ≥32');
  assert.strictEqual(vm.药物[1].备注, '部分菌种适用');
  assert.strictEqual(View.breakpointVM('nope', bps), null);
});

test('judgeMIC：SDD 与中介(I)分开判读', () => {
  // 氟康唑白念珠菌：S≤2 / SDD 4 / R≥8
  assert.strictEqual(View.judgeMIC(1, '≤2', '4 (SDD)', '≥8').result, 'S');
  assert.strictEqual(View.judgeMIC(4, '≤2', '4 (SDD)', '≥8').result, 'SDD');
  assert.strictEqual(View.judgeMIC(8, '≤2', '4 (SDD)', '≥8').result, 'R');
  // 光滑念珠菌氟康唑：SDD ≤32 / R≥64（le 型 SDD）
  assert.strictEqual(View.judgeMIC(16, '—', '≤32 (SDD)', '≥64').result, 'SDD');
  // 普通中介仍为 I（无 SDD 标记）：卡泊芬净白念珠菌 S≤0.25 / I 0.5 / R≥1
  assert.strictEqual(View.judgeMIC(0.5, '≤0.25', '0.5', '≥1').result, 'I');
});

test('judgeMIC：非标准梯度值向上归入下一稀释点', () => {
  var r = View.judgeMIC(3, '≤2', '4 (SDD)', '≥8');
  assert.strictEqual(r.result, 'SDD');
  assert.strictEqual(r.adjusted, true);
  assert.strictEqual(r.interpretedValue, 4);
  // 12 → 16 → I（S≤8 / I 16 / R≥32）
  var r2 = View.judgeMIC(12, '≤8', '16', '≥32');
  assert.strictEqual(r2.result, 'I');
  assert.strictEqual(r2.adjusted, true);
  // 0.3 → 0.5 → I（S≤0.25 / I 0.5 / R≥1）
  assert.strictEqual(View.judgeMIC(0.3, '≤0.25', '0.5', '≥1').result, 'I');
});

test('judgeMIC：黏菌素仅 I≤2 / R≥4 时正常判读，且不误判为 SDD', () => {
  assert.strictEqual(View.judgeMIC(1, '—', '≤2', '≥4').result, 'I');
  assert.strictEqual(View.judgeMIC(4, '—', '≤2', '≥4').result, 'R');
});

test('judgeMIC：瑞扎芬净仅有敏感折点时只判 S、不生成 I/R', () => {
  // 瑞扎芬净暂定「仅敏感」折点：S≤0.25，无 I/R
  assert.strictEqual(View.judgeMIC(0.12, '≤0.25', '—', '—').result, 'S');
  assert.strictEqual(View.judgeMIC(0.25, '≤0.25', '—', '—').result, 'S');
  // 高于 S 折点但无 R 折点 → 不能判为 R，应回落为“无完整判读”而非臆断
  assert.notStrictEqual(View.judgeMIC(1, '≤0.25', '—', '—').result, 'R');
});
