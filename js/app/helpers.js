(function () {
  'use strict';
  var Core = window.Core, View = window.View;
  var NS = window.AppNS = window.AppNS || {};
  var MODULES = Core.MODULE_KEYS;
  // 正常由 index.html 内联脚本注入；此兜底值随发布一起更新（见发布清单）
  var APP_VERSION = window.APP_VERSION || '20260906-66';
  // 给图片 URL 追加版本号，保证内容更新后手机端不会命中旧缓存（图片本身无 ?v= 时浏览器/SW 会一直返回旧图）
  function imgV(p) { return p ? (p + (p.indexOf('?') < 0 ? '?v=' : '&v=') + APP_VERSION) : p; }

  // 合并图谱照片（photosAtlas，人卫教材原图）与 CDC PHIL 照片（photos）：图谱在前、CDC 在后。
  // 图谱条目 {文件, 说明}；CDC 条目 {文件, 说明, 英文说明, 供图, 摄影, PHIL}——以 PHIL 字段区分来源。
  function mergeAtlasPhotos(id) {
    var atlas = (window.DB.photosAtlas && window.DB.photosAtlas[id]) || [];
    var cdc = (window.DB.photos && window.DB.photos[id]) || [];
    if (!atlas.length) { return cdc.length ? cdc : null; }
    if (!cdc.length) { return atlas; }
    return atlas.concat(cdc);
  }

  // CLSI M100 Ed36 报告分层（Table 1A–1J：Tier 1–4 + 仅尿路）
  var BP_TIER_LABELS = {
    '1': 'Tier 1 · 常规首选检测并报告',
    '2': 'Tier 2 · 常规检测，按本机构级联规则报告',
    '3': 'Tier 3 · 高 MDRO 风险机构常规/按需检测，按级联规则报告',
    '4': 'Tier 4 · 临床申请或其他层不适用时检测报告'
  };
  var BP_TIER_ORDER = ['1', '2', '3', '4'];
  function bpTierBadge(tier) {
    if (!tier || !BP_TIER_LABELS[tier]) { return null; }
    return el('span', { cls: 'bp-tier bp-tier-' + tier, title: 'CLSI M100 Ed36 报告分层 ' + BP_TIER_LABELS[tier], text: tier });
  }
  function bpUrineChip(d) {
    if (!d || !d.仅尿路) { return null; }
    return el('span', { cls: 'bp-urine', title: '仅适用于尿路分离株的报告限制', text: '尿' });
  }
  // 图例：仅列出该菌组中实际出现的分层
  function bpTierLegend(drugs) {
    var present = {}, hasUrine = false;
    (drugs || []).forEach(function (d) { if (d.组别 && BP_TIER_LABELS[d.组别]) { present[d.组别] = 1; } if (d.仅尿路) { hasUrine = true; } });
    var tiers = BP_TIER_ORDER.filter(function (t) { return present[t]; });
    if (!tiers.length && !hasUrine) { return null; }
    var kids = [ el('span', { cls: 'bp-legend-lead', text: '报告分层（CLSI M100 Ed36）：' }) ];
    tiers.forEach(function (t) {
      kids.push(el('span', { cls: 'bp-legend-item' }, [
        el('span', { cls: 'bp-tier bp-tier-' + t, text: t }),
        el('span', { cls: 'bp-legend-txt', text: BP_TIER_LABELS[t] })
      ]));
    });
    if (hasUrine) {
      kids.push(el('span', { cls: 'bp-legend-item' }, [ el('span', { cls: 'bp-urine', text: '尿' }), el('span', { cls: 'bp-legend-txt', text: '仅尿路分离株报告' }) ]));
    }
    return el('div', {}, [
      el('div', { cls: 'bp-legend' }, kids),
      el('div', { cls: 'bp-legend-note', text: '分层为选择性报告参考：Tier 1 应常规报告，Tier 2–4 通常在上层耐药、深部/重症感染或临床需要时按机构级联规则报告。本地实验室应结合本机构药物目录与级联报告规则，并以现行版 CLSI 原表为准。' })
    ]);
  }

  // 折点表药物名与抗菌药条目名的别名（模块级常量，避免每次调用重建）：
  // 折点表写「青霉素 (Penicillin)」、抗菌药条目写「青霉素G」——两条别名覆盖从折点表回查与直接按条目名查两种路径。
  var ABX_ALIAS = { '青霉素': 'penicillin-g', '青霉素G': 'penicillin-g', '氨苄西林/阿莫西林': 'ampicillin', '复方磺胺甲噁唑': 'cotrimoxazole', '复方新诺明': 'cotrimoxazole' };

  function db() {
    var DB = window.DB || {};
    return { microbes: DB.microbes || [], antibiotics: DB.antibiotics || [], resistance: DB.resistance || [], virulence: DB.virulence || [], genetics: DB.genetics || [], glossary: DB.glossary || [], cards: DB.cards || [], tests: DB.tests || [], media: DB.media || [], staining: DB.staining || [], 'biochem-tests': DB.biochemTests || [], 'qc-strains': DB['qc-strains'] || [] };
  }

  // 缓存：window.DB 加载后不变，名称→id 映射只需建一次
  var _abxNameMap = null;
  function abxIdByName() {
    if (_abxNameMap) { return _abxNameMap; }
    var m = {};
    ((window.DB && window.DB.antibiotics) || []).forEach(function (a) { m[a.名称] = a.id; });
    _abxNameMap = m;
    return m;
  }
  // 药物名 → 抗生素 id（支持从折点表中的药物名查找）
  function abxIdByDrugText(text) {
    if (!text) { return null; }
    var map = abxIdByName();
    // 直接匹配 药敏简写(名称) 模式中的名称部分
    if (map[text]) { return map[text]; }
    // 从 "药物 (English)" 格式中提取中文名匹配
    var m = text.match(/^([^(]+)/);
    if (m && map[m[1].trim()]) { return map[m[1].trim()]; }
    if (m && ABX_ALIAS[m[1].trim()]) { return ABX_ALIAS[m[1].trim()]; }
    // 遍历所有抗生素，按名称包含关系匹配
    var abxList = (window.DB && window.DB.antibiotics) || [];
    for (var i = 0; i < abxList.length; i++) {
      if (text.indexOf(abxList[i].名称) !== -1) { return abxList[i].id; }
    }
    return null;
  }
  // 生化试验名 → 生化试验 id（支持多种模糊匹配）。模块级缓存。
  var _biochemTestMap = null;
  function biochemTestIdByName() {
    if (_biochemTestMap) { return _biochemTestMap; }
    var m = {};
    var tests = (window.DB && window.DB.biochemTests) || [];

    // 显式别名词典：biochem.js 中的简名 → 模块条目 id
    var aliases = {
      '血浆凝固酶': 'bio-coagulase',
      '试管凝固酶': 'bio-coagulase',
      '玻片凝固酶': 'bio-coagulase',
      '新生霉素': 'novobiocin',
      '溶血型': 'hemolysis',
      '杆菌肽': 'bacitracin',
      'PYR': 'pyr-test',
      'Lancefield 群': 'lancefield',
      'Optochin': 'bio-optochin',
      '6.5%NaCl 生长': 'nacl-65',
      'VP': 'vp-test',
      '枸橼酸盐': 'citrate',
      'H2S': 'h2s',
      'H₂S': 'h2s',
      '绿脓菌素': 'pigment',
      '黄色素': 'pigment',
      '蔗糖': 'glucose-fermentation',
      '麦芽糖': 'glucose-fermentation',
      '葡萄糖': 'glucose-fermentation',
      '糖发酵': 'glucose-fermentation',
      '葡萄糖发酵': 'glucose-fermentation',
      'TCBS(蔗糖)': 'glucose-fermentation',
      '蔗糖发酵(TCBS)': 'glucose-fermentation',
            '明胶酶': 'gelatinase',
      'DNase': 'dnase',
      '迁徙生长': 'motility',
      '动力(25℃/37℃)': 'motility',
      // ==== 批量归一映射（tools/_tmp-biomap.py 生成，2026-08-30）====
      '25℃ 绵羊血环形溶血': 'hemolysis',
      '42~43℃ 生长+尿素酶': 'urease',
      '42℃ 葡萄糖发酵': 'glucose-fermentation',
      '6.5% NaCl': 'nacl-65',
      '6.5% NaCl 生长': 'nacl-65',
      '6.5% NaCl生长': 'nacl-65',
      '6.5%NaCl 生长': 'nacl-65',
      '7% 高盐耐受': 'nacl-65',
      'CAMP': 'bio-camp',
      'CAMP 抑制试验': 'bio-camp',
      'CAMP 试验': 'bio-camp',
      'CAMP(金黄色葡萄球菌)': 'bio-camp',
      'CAMP(马红球菌)': 'bio-camp',
      'CAMP试验': 'bio-camp',
      'DNase': 'dnase',
      'H2S': 'h2s',
      'H₂S': 'h2s',
      'H₂S(醋酸铅试纸法)': 'h2s',
      'H₂S（TSI）': 'h2s',
      'Lancefield': 'lancefield',
      'Lancefield 群': 'lancefield',
      'Lancefield群': 'lancefield',
      'O/129': 'o129',
      'O/129 (150μg)': 'o129',
      'O/129 敏感': 'o129',
      'O/129 敏感性': 'o129',
      'ONPG': 'onpg',
      'ONPG/吲哚/尿素酶': 'urease',
      'ONPG试验': 'onpg',
      'Optochin': 'bio-optochin',
      'PYR': 'pyr-test',
      'PYR/LAP': 'pyr-test',
      'TSI 产 H₂S': 'tsi-kia',
      'V 因子需求': 'xv-factor',
      'V-P': 'vp-test',
      'V-P 试验': 'vp-test',
      'V-P（25℃）': 'vp-test',
      'VP': 'vp-test',
      'VP 试验': 'vp-test',
      'VP(22℃)': 'vp-test',
      'VP(35℃)': 'vp-test',
      'VP(乙酰甲基甲醇)': 'vp-test',
      'V因子(NAD)需求': 'xv-factor',
      'V因子需求': 'xv-factor',
      'X 因子需求': 'xv-factor',
      'X/V 因子': 'xv-factor',
      'X/V因子需求': 'xv-factor',
      'X因子(血红素)需求': 'xv-factor',
      'β-半乳糖苷酶': 'onpg',
      'β-溶血': 'hemolysis',
      '七叶苷': 'bile-esculin',
      '七叶苷水解': 'bile-esculin',
      '三糖铁 H2S': 'tsi-kia',
      '丙二酸盐利用': 'malonate',
      '乙酰胺培养基生长': 'acetamide',
      '乙酰胺生长': 'acetamide',
      '乳糖': 'lactose-fermentation',
      '乳糖发酵': 'lactose-fermentation',
      '亚硝酸盐还原': 'nitrate-reduction',
      '亚硝酸盐还原为氮气(脱氮)': 'nitrate-reduction',
      '产色素': 'pigment',
      '产过氧化氢': 'bio-catalase',
      '兰氏(Lancefield)血清分群': 'lancefield',
      '兰氏分群': 'lancefield',
      '凝固酶': 'bio-coagulase',
      '凝固酶(玻片法)': 'bio-coagulase',
      '凝固酶(试管法)': 'bio-coagulase',
      '凝固酶（试管法）': 'bio-coagulase',
      '动力': 'motility',
      '动力 25℃': 'motility',
      '动力 37℃': 'motility',
      '动力(25℃/36℃)': 'motility',
      '动力(36℃)': 'motility',
      '动力(36℃/25℃)': 'motility',
      '动力（22–25℃）': 'motility',
      '卵磷脂酶': 'lecithinase',
      '卵磷脂酶(Nagler)': 'lecithinase',
      '卵磷脂酶(Nagler反应)': 'lecithinase',
      '卵磷脂酶/脂肪酶': 'lecithinase',
      '卵磷脂酶（Nagler 反应）': 'lecithinase',
      '卵磷脂酶（Nagler）': 'lecithinase',
      '卵磷脂酶（蛋黄反应）': 'lecithinase',
      '双圈(双区)溶血(血平板)': 'hemolysis',
      '发酵葡萄糖': 'glucose-fermentation',
      '发酵葡萄糖/蔗糖': 'glucose-fermentation',
      '可溶性色素': 'pigment',
      '吲哚': 'indole',
      '吲哚/VP': 'indole',
      '吲哚/尿素酶/七叶苷': 'indole',
      '吲哚/硫化氢/硝酸盐': 'indole',
      '吲哚酚乙酸盐水解': 'indole',
      '奥普托欣': 'bio-optochin',
      '尿素酶': 'urease',
      '尿素酶(7日)': 'urease',
      '尿素酶（7 天）': 'urease',
      '改良氧化酶': 'bio-oxidase',
      '新生霉素': 'novobiocin',
      '明胶水解': 'gelatinase',
      '明胶液化': 'gelatinase',
      '明胶液化(28℃)': 'gelatinase',
      '明胶酶': 'gelatinase',
      '木糖发酵': 'glucose-fermentation',
      '杆菌肽': 'bacitracin',
      '杆菌肽(0.04U)': 'bacitracin',
      '果糖/甘露醇发酵': 'mannitol-fermentation',
      '果糖发酵': 'glucose-fermentation',
      '枸橼酸盐': 'citrate',
      '枸橼酸盐利用': 'citrate',
      '氧化酶': 'bio-oxidase',
      '氧化酶(改良法)': 'bio-oxidase',
      '氧化酶/尿素酶/明胶/七叶苷': 'bio-oxidase',
      '氧化酶/触酶': 'bio-catalase',
      '氧化酶/触酶/硝酸盐': 'bio-catalase',
      '海藻糖发酵': 'glucose-fermentation',
      '海藻糖发酵/同化': 'glucose-fermentation',
      '溶血': 'hemolysis',
      '溶血型': 'hemolysis',
      '热触酶(68℃)': 'bio-catalase',
      '玉米培养基产红色素': 'pigment',
      '玻片凝固酶': 'bio-coagulase',
      '甘露醇': 'mannitol-fermentation',
      '甘露醇产酸': 'mannitol-fermentation',
      '甘露醇发酵': 'mannitol-fermentation',
      '甲基红': 'mr-test',
      '甲基红(MR)': 'mr-test',
      '硝酸盐还原': 'nitrate-reduction',
      '硝酸盐还原/同化': 'nitrate-reduction',
      '硝酸盐还原为亚硝酸盐': 'nitrate-reduction',
      '硝酸盐还原产气': 'nitrate-reduction',
      '硝酸盐还原（硝基还原亚种）': 'nitrate-reduction',
      '硫化氢': 'h2s',
      '硫化氢(H₂S)': 'h2s',
      '硫化氢(SIM)': 'h2s',
      '硫化氢(TSI)': 'h2s',
      '硫化氢(TSI/KIA)': 'h2s',
      '硫化氢(TSI/PIA)': 'h2s',
      '类解脲生物变种尿素酶': 'urease',
      '精氨酸双水解酶': 'adh-test',
      '糖原/淀粉/海藻糖发酵': 'glucose-fermentation',
      '糖发酵': 'glucose-fermentation',
      '糖发酵(葡萄糖等)': 'glucose-fermentation',
      '糖发酵：葡萄糖/麦芽糖': 'glucose-fermentation',
      '紫色色素': 'pigment',
      '红色可扩散色素(25℃)': 'pigment',
      '耐热核酸酶(DNase)': 'dnase',
      '胆汁七叶苷': 'bile-esculin',
      '胆汁七叶苷(BBE，20%胆盐)': 'bile-esculin',
      '胆汁七叶苷(BEA)': 'bile-esculin',
      '胆汁溶菌': 'bio-bile-solubility',
      '胆汁溶解': 'bio-bile-solubility',
      '背面色素': 'pigment',
      '脲酶': 'urease',
      '脲酶（尿素水解）': 'urease',
      '色素': 'pigment',
      '色素产生': 'pigment',
      '色素（血平板避光 5~7 日）': 'pigment',
      '芽管试验': 'germ-tube',
      '芽管试验(血清37℃ 2-3h)': 'germ-tube',
      '苯丙氨酸脱氨酶': 'phenylalanine-deaminase',
      '菌落色素': 'pigment',
      '葡萄糖': 'glucose-fermentation',
      '葡萄糖/乳糖发酵': 'lactose-fermentation',
      '葡萄糖/蔗糖/山梨醇/甘露糖发酵': 'glucose-fermentation',
      '葡萄糖/麦芽糖/蔗糖发酵': 'glucose-fermentation',
      '葡萄糖/麦芽糖发酵': 'glucose-fermentation',
      '葡萄糖产气': 'glucose-fermentation',
      '葡萄糖产酸': 'glucose-fermentation',
      '葡萄糖发酵': 'glucose-fermentation',
      '葡萄糖发酵(O-F)': 'glucose-fermentation',
      '葡萄糖发酵/同化': 'glucose-fermentation',
      '葡萄糖发酵产气': 'glucose-fermentation',
      '葡萄糖（氧化型产酸）': 'glucose-fermentation',
      '葡萄糖（氧化型）': 'glucose-fermentation',
      '蔗糖发酵': 'glucose-fermentation',
      '蔗糖发酵(TCBS)': 'glucose-fermentation',
      '蔗糖发酵产酸': 'glucose-fermentation',
      '血平板溶血': 'hemolysis',
      '血浆凝固酶': 'bio-coagulase',
      '血清芽管': 'germ-tube',
      '触酶': 'bio-catalase',
      '触酶 (68℃)': 'bio-catalase',
      '触酶(过氧化氢酶)': 'bio-catalase',
      '试管凝固酶': 'bio-coagulase',
      '赖氨酸脱羧酶': 'lysine-decarboxylase',
      '赖氨酸脱羧酶（LDC）': 'lysine-decarboxylase',
      '酚氧化酶': 'bio-oxidase',
      '酚氧化酶(咖啡酸)': 'bio-oxidase',
      '酚氧化酶/咖啡酸(鸟食)培养基(产黑色素)': 'bio-oxidase',
      '酚氧化酶（黑素）': 'bio-oxidase',
      '阿拉伯糖发酵': 'glucose-fermentation',
      '马尿酸水解': 'hippurate',
      '马尿酸盐': 'hippurate',
      '马尿酸盐水解': 'hippurate',
      '高盐(10% NaCl)耐受': 'nacl-65',
      '鸟氨酸脱羧酶': 'ornithine-decarboxylase',
      '鸟氨酸脱羧酶（ODC）': 'ornithine-decarboxylase',
      '麦芽糖/蔗糖发酵': 'glucose-fermentation',
      '麦芽糖发酵': 'glucose-fermentation',
      '黄色素': 'pigment',
      '黄色素（25℃）': 'pigment',
      '黄色色素': 'pigment',
      '黑色素': 'pigment',
      '鼠李糖发酵': 'glucose-fermentation',
      // ==== 2026-08-31 补：糖发酵底物新词条的裸名/变体映射 ====
      '山梨醇': 'sorbitol-fermentation',
      '山梨醇发酵': 'sorbitol-fermentation',
      '山梨醇产酸': 'sorbitol-fermentation',
      'D-山梨醇发酵': 'sorbitol-fermentation',
      'D-山梨醇产酸': 'sorbitol-fermentation',
      '阿拉伯糖': 'arabinose-fermentation',
      '阿拉伯糖发酵': 'arabinose-fermentation',
      'L-阿拉伯糖': 'arabinose-fermentation',
      '鼠李糖': 'rhamnose-fermentation',
      'L-鼠李糖': 'rhamnose-fermentation',
      'L-鼠李糖产酸': 'rhamnose-fermentation',
      '海藻糖': 'trehalose-fermentation',
      '木糖': 'xylose-fermentation',
      'D-木糖': 'xylose-fermentation',
      '木糖发酵': 'xylose-fermentation',
      '木糖氧化': 'xylose-fermentation',
      '木糖同化': 'xylose-fermentation',
      'D-木糖同化': 'xylose-fermentation',
      '肌醇': 'inositol-fermentation',
      '肌醇发酵': 'inositol-fermentation',
      '肌醇同化': 'inositol-fermentation',
      '侧金盏花醇': 'adonitol-fermentation',
      '侧金盏花醇发酵': 'adonitol-fermentation',
      '卫矛醇': 'dulcitol-fermentation',
      '蜜二糖': 'melibiose-fermentation',
      '棉子糖': 'raffinose-fermentation',
      '棉子糖产酸': 'raffinose-fermentation',
      '水杨素': 'salicin-fermentation',
      '纤维二糖': 'cellobiose-fermentation',
      '松三糖': 'melezitose-fermentation',
      '果糖发酵': 'glucose-fermentation',
      '麦芽糖发酵': 'glucose-fermentation',
      '蔗糖发酵': 'glucose-fermentation',
      '核糖/麦芽糖/蔗糖/海藻糖': 'assimilation-panel',
      '核糖/麦芽糖/甘露糖': 'assimilation-panel',
      '葡萄糖/麦芽糖/蔗糖/果糖': 'assimilation-panel',
      '葡萄糖/麦芽糖': 'assimilation-panel',
      '葡萄糖/麦芽糖发酵': 'glucose-fermentation',
      '葡萄糖/麦芽糖/蔗糖发酵': 'glucose-fermentation',
      '葡萄糖/麦芽糖/蔗糖同化': 'assimilation-panel',
      '麦芽糖/蔗糖同化': 'assimilation-panel',
      '麦芽糖/蔗糖发酵': 'glucose-fermentation',
      '葡萄糖/蔗糖同化': 'assimilation-panel',
      '蔗糖同化': 'assimilation-panel',
      '半乳糖同化': 'assimilation-panel',
      '乳糖同化': 'assimilation-panel',
      '乳糖同化/发酵': 'lactose-fermentation',
      '乳糖产酸/ONPG': 'lactose-fermentation',
      '密二糖同化': 'assimilation-panel',
      '蔗糖/半乳糖/密二糖同化': 'assimilation-panel',
      '蔗糖/果糖': 'glucose-fermentation',
      '全部糖产酸': 'glucose-fermentation',
      '多数糖同化': 'assimilation-panel',
      '碳水化合物发酵': 'glucose-fermentation',
      '碳水化合物产酸': 'glucose-fermentation',
      '糖产酸': 'glucose-fermentation',
      '果糖产酸': 'glucose-fermentation',
      '蔗糖氧化产酸': 'glucose-fermentation',
      '麦芽糖（氧化型产酸）': 'glucose-fermentation',
      '葡萄糖（氧化型产酸）': 'glucose-fermentation',
      '葡萄糖氧化': 'glucose-fermentation',
      '葡萄糖氧化产酸': 'glucose-fermentation',
      '葡萄糖利用': 'glucose-fermentation',
      '发酵葡萄糖/蔗糖': 'glucose-fermentation',
      '发酵谱': 'assimilation-panel',
      '同化谱': 'assimilation-panel',
      'O-F试验(葡萄糖)': 'glucose-fermentation',
      'O-F 试验': 'glucose-fermentation',
      '糖酵解': 'glucose-fermentation',
      // ==== 2026-08-31 补：新词条简名/全角括号变体（归一只处理半角括号）====
      '烟酸试验': 'niacin-test',
      '烟酰胺(niacin)': 'niacin-test',
      '吡嗪酰胺酶': 'pyrazinamidase-test',
      '吐温-80 水解': 'tween80-hydrolysis',
      '吐温-80 水解 (5 天)': 'tween80-hydrolysis',
      '芳香硫酸酯酶': 'arylsulfatase-test',
      '芳香硫酸酯酶 (3 天)': 'arylsulfatase-test',
      '芳香硫酸酯酶试验': 'arylsulfatase-test',
      '3天芳基硫酸酯酶试验': 'arylsulfatase-test',
      '3日芳基硫酸酯酶': 'arylsulfatase-test',
      '亮氨酸氨肽酶(LAP)': 'lap-test',
      'LAP': 'lap-test',
      '亮氨酸芳胺酶(LeuA)': 'lap-test',
      '亮氨酸芳胺酶': 'lap-test',
      '精氨酸水解': 'arginine-dihydrolase-note',
      '水解精氨酸': 'arginine-dihydrolase-note',
      '精氨酸促生长': 'arginine-dihydrolase-note',
      '酪蛋白分解': 'casein-hydrolysis',
      '淀粉/蛋白质水解': 'casein-hydrolysis',
      '次黄嘌呤分解': 'hypoxanthine-decomposition',
      'DNA酶': 'dnase',
      'DNA 酶': 'dnase',
      '硝酸还原': 'nitrate-reduction',
      '脱硝作用': 'nitrate-reduction',
      '硝酸盐利用': 'nitrate-reduction',
      '亚硝酸盐还原为氮气(脱氮)': 'nitrate-reduction',
      'KCN 生长': 'kcn-growth-test',
      '20% 胆汁生长': 'bile-growth-test',
      '20%胆汁生长': 'bile-growth-test',
      '胆汁七叶苷(BBE，20%胆盐)': 'bile-esculin',
      '脂酶': 'lipase-test-ccnu',
      '脂肪酶': 'lipase-test-ccnu',
      '脂酶(玉米油/吐温)': 'lipase-test-ccnu',
      '碱性磷酸酶': 'alkaline-phosphatase-test',
      '磷酸酶': 'alkaline-phosphatase-test',
      '荧光素': 'fluorescein-production',
      '荧光素（King B 紫外）': 'fluorescein-production',
      '绿脓菌素(荧光)': 'pigment',
      '生物发光': 'fluorescein-production',
                        '生长速度': 'growth-temperature-panel',
      '生长速率': 'growth-temperature-panel',
      '生长温度': 'growth-temperature-panel',
      '最适生长温度': 'growth-temperature-panel',
      '最高生长温度': 'growth-temperature-panel',
      '最适温度': 'growth-temperature-panel',
      '37℃ 生长': 'growth-temperature-panel',
      '42℃ 生长': 'growth-temperature-panel',
      '42℃生长': 'growth-temperature-panel',
      '44℃生长': 'growth-temperature-panel',
      '45℃ 生长': 'growth-temperature-panel',
      '40℃ 生长': 'growth-temperature-panel',
      '25℃ 生长': 'growth-temperature-panel',
      '20℃ 生长': 'growth-temperature-panel',
      '22℃ 生长': 'growth-temperature-panel',
      '10℃ 生长': 'growth-temperature-panel',
      '4℃ 生长': 'growth-temperature-panel',
      '4℃ 存活': 'growth-temperature-panel',
      '50~55℃ 生长': 'growth-temperature-panel',
      '35℃ 以上生长': 'growth-temperature-panel',
      '37℃~40℃ 生长': 'growth-temperature-panel',
      '25℃/35℃ 生长': 'growth-temperature-panel',
      '温度双相': 'growth-temperature-panel',
      '冷增菌（4℃生长）': 'growth-temperature-panel',
      '厌氧生长': 'growth-temperature-panel',
      '需氧': 'growth-temperature-panel',
      '代谢类型': 'growth-temperature-panel',
      '嗜盐性': 'growth-temperature-panel',
      '嗜盐': 'growth-temperature-panel',
                                                            '营养琼脂 35℃': 'growth-temperature-panel',
                        '伍德灯': 'wood-lamp',
      '365nm紫外荧光': 'wood-lamp',
      '紫外荧光': 'wood-lamp',
      '毛发穿孔试验': 'hair-perforation-test',
      '毛发穿孔': 'hair-perforation-test',
      '侵毛发能力': 'hair-perforation-test',
      '毛发侵犯型': 'hair-perforation-test',
      '胞外多糖(蔗糖)': 'extracellular-polysaccharide-test',
      '多糖合成': 'extracellular-polysaccharide-test',
      '蔗糖多糖合成': 'extracellular-polysaccharide-test',
      '蔗糖产酸': 'glucose-fermentation',
      // ==== 2026-08-31 补：血清试验/同化谱变体；染色/药物/培养基生长走 linkDict（跨模块）====
      '柠檬酸盐': 'citrate',
      '靛基质': 'indole',
      '血清学': 'slide-agglutination',
      '血清学(IFA)': 'slide-agglutination',
      '山梨糖': 'assimilation-panel',
      '山梨糖产酸': 'assimilation-panel',
      'L-山梨糖利用': 'assimilation-panel',
      '葡萄糖同化': 'assimilation-panel',
      'D-葡萄糖同化': 'assimilation-panel',
      '葡萄糖发酵/同化': 'glucose-fermentation',
      '海藻糖同化': 'trehalose-fermentation',
      '海藻糖发酵/同化': 'trehalose-fermentation',
      '鼠李糖同化': 'rhamnose-fermentation',
      '蔗糖/麦芽糖同化': 'assimilation-panel',
      '乳糖/麦芽糖/蔗糖': 'glucose-fermentation',
      '乳糖/密二糖同化': 'assimilation-panel',
      '密二糖/纤维二糖同化': 'assimilation-panel',
      '己二酸同化': 'assimilation-panel',
      '同化癸酸盐/苹果酸盐/苯乙酸盐': 'assimilation-panel',
      '同化葡萄糖酸盐/L-苹果酸盐': 'assimilation-panel',
      '中康酸盐同化': 'assimilation-panel',
      '二氨基丁烷同化': 'assimilation-panel',
      '麦芽糖醇': 'assimilation-panel',
      '蕈糖': 'trehalose-fermentation',
      '可溶性淀粉': 'starch-hydrolysis'
    };
    Object.keys(aliases).forEach(function (k) { m[k] = aliases[k]; });

    tests.forEach(function (t) {
      m[t.名称] = t.id;
      // 去掉"试验"后缀
      var s1 = t.名称.replace(/\s*试验$/, '').trim();
      if (s1 !== t.名称) { m[s1] = t.id; if (!m[s1 + '试验']) { m[s1 + '试验'] = t.id; } }
      // 去掉括号内容
      var s2 = t.名称.replace(/\([^)]*\)/g, '').trim();
      if (s2 !== t.名称) { m[s2] = t.id; }
      // 同时去括号+去后缀
      var s3 = s2.replace(/\s*试验$/, '').trim();
      if (s3 !== s2 && s3 !== s1) { m[s3] = t.id; }
    });
    _biochemTestMap = m;
    return m;
  }
  // 药敏卡上的耐药表型检测项 → 对应的试验条目
  var CARD_TEST = {
    'ESBL': 'esbl-test',
    '头孢西丁筛选': 'cefoxitin-screen',
    '诱导型克林霉素耐药': 'd-test',
    '庆大霉素高水平': 'hlar',
    '链霉素高水平': 'hlar',
    '庆大霉素高水平(协同)': 'hlar',
    '链霉素高水平(协同)': 'hlar'
  };
  function categories() { return (window.DB && window.DB.categories) || {}; }

  function appendChildNode(parent, child) {
    if (child == null || child === false) { return; }
    if (typeof child === 'string' || typeof child === 'number') {
      parent.appendChild(document.createTextNode(String(child)));
      return;
    }
    parent.appendChild(child);
  }

  // 安全建节点：文本一律走 textContent / TextNode，内容不会被当作标记解析
  function el(tag, opts, children) {
    var node = document.createElement(tag);
    opts = opts || {};
    if (opts.cls != null) { node.className = opts.cls; }
    if (opts.text != null) { node.textContent = opts.text; }
    if (opts.href != null) { node.setAttribute('href', opts.href); }
    if (opts.target != null) { node.setAttribute('target', opts.target); }
    if (opts.rel != null) { node.setAttribute('rel', opts.rel); }
    if (opts.src != null) { node.setAttribute('src', opts.src); }
    if (opts.alt != null) { node.setAttribute('alt', opts.alt); }
    if (opts.loading != null) { node.setAttribute('loading', opts.loading); }
    if (opts.title != null) { node.setAttribute('title', opts.title); }
    if (opts.style != null) { node.setAttribute('style', opts.style); }
    if (opts.id != null) { node.id = opts.id; }
    if (opts.onclick != null) { node.onclick = opts.onclick; }
    if (opts.type != null) { node.setAttribute('type', opts.type); }
    if (opts.name != null) { node.setAttribute('name', opts.name); }
    if (opts.min != null) { node.setAttribute('min', opts.min); }
    if (opts.max != null) { node.setAttribute('max', opts.max); }
    if (opts.step != null) { node.setAttribute('step', opts.step); }
    if (opts.colspan != null) { node.setAttribute('colspan', opts.colspan); }
    if (opts.rowspan != null) { node.setAttribute('rowspan', opts.rowspan); }
    if (opts.role != null) { node.setAttribute('role', opts.role); }
    if (opts.tabindex != null) { node.setAttribute('tabindex', opts.tabindex); }
    if (opts['for'] != null) { node.setAttribute('for', opts['for']); }
    if (opts.selected) { node.selected = true; }
    if (opts.disabled) { node.disabled = true; }
    if (opts.checked) { node.checked = true; }
    if (opts.placeholder != null) { node.setAttribute('placeholder', opts.placeholder); }
    if (opts.value != null) { node.value = opts.value; }
    Object.keys(opts).forEach(function (key) {
      if ((key.indexOf('aria-') === 0 || key.indexOf('data-') === 0) && opts[key] != null) { node.setAttribute(key, opts[key]); }
    });
    if (opts.onClick) { node.addEventListener('click', opts.onClick); }
    // 键盘可达的“类按钮”元素：role="button" 只是语义标注，非 <button> 元素按 Enter/Space
    // 浏览器不会替你派发 click。用 onActivate 的地方一律补上 tabindex/role 与键盘绑定，
    // 避免每处自己拼（此前 zoomableImg 注释写着「点击/Enter 均可打开」，实际只有点击）。
    if (opts.onActivate) {
      if (opts.tabindex == null) { node.setAttribute('tabindex', '0'); }
      if (opts.role == null) { node.setAttribute('role', 'button'); }
      node.addEventListener('click', opts.onActivate);
      node.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
          ev.preventDefault();          // Space 默认滚动页面
          opts.onActivate(ev);
        }
      });
    }
    (children || []).forEach(function (c) { appendChildNode(node, c); });
    return node;
  }
  function fill(container, nodes) {
    container.replaceChildren.apply(container, nodes);
  }

  function parseHash() {
    var raw = (location.hash || '').replace(/^#\/?/, '');
    var parts = raw.split('/').filter(Boolean);
    var module = MODULES.indexOf(parts[0]) !== -1 ? parts[0] : MODULES[0];
    return { module: module, id: parts[1] || null };
  }
  // 当前路由的顶层 key（compare / cardcompare / intrinsic / breakpoints / ast-alerts / lab-workflow / microbe-names / about / 模块名）
  function routeKey() {
    return (location.hash || '').replace(/^#\/?/, '').split('/')[0];
  }

  var SVGNS = 'http://www.w3.org/2000/svg';
  // SVG 元素构造（与 el() 同风格，但用 createElementNS）
  function sg(tag, opts, children) {
    var node = document.createElementNS(SVGNS, tag);
    opts = opts || {};
    Object.keys(opts).forEach(function (k) {
      var v = opts[k];
      if (v == null) { return; }
      if (k === 'text') { node.textContent = v; return; }
      if (k === 'cls') { node.setAttribute('class', v); return; }
      node.setAttribute(k, v);
    });
    (children || []).forEach(function (c) { appendChildNode(node, c); });
    return node;
  }

  // 横滚容器的两端渐隐：只在真的还有内容可滚时才显示，滚到端点自动收起。
  // 不这么做的话，1440px 下「染色」「培养基」被裁在视野外而没有任何可滚提示。
  var FADE = 18;
  function syncScrollFade(box) {
    if (!box) { return; }
    var max = box.scrollWidth - box.clientWidth;
    if (max <= 1) { box.classList.remove('scroll-fade'); return; }
    box.classList.add('scroll-fade');
    box.style.setProperty('--fade-l', (box.scrollLeft > 1 ? FADE : 0) + 'px');
    box.style.setProperty('--fade-r', (box.scrollLeft < max - 1 ? FADE : 0) + 'px');
  }
  function initScrollFades() {
    Array.prototype.forEach.call(document.querySelectorAll('.tabs, .tools'), function (box) {
      syncScrollFade(box);
      box.addEventListener('scroll', function () { syncScrollFade(box); });
    });
  }

  function setActiveTab(moduleKey) {
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) {
      var on = t.getAttribute('data-module') === moduleKey;
      t.classList.toggle('active', on);
      if (on) { t.setAttribute('aria-current', 'page'); } else { t.removeAttribute('aria-current'); }
    });
    Array.prototype.forEach.call(document.querySelectorAll('.tool-btn'), function (t) {
      t.classList.remove('active');
      t.removeAttribute('aria-current');
    });
  }

  function setActiveTool(toolKey) {
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) {
      t.classList.remove('active');
      t.removeAttribute('aria-current');
    });
    Array.prototype.forEach.call(document.querySelectorAll('.tool-btn'), function (t) {
      var on = t.getAttribute('data-tool') === toolKey;
      t.classList.toggle('active', on);
      if (on) { t.setAttribute('aria-current', 'page'); } else { t.removeAttribute('aria-current'); }
    });
  }

  Object.assign(NS, { ABX_ALIAS, APP_VERSION, BP_TIER_LABELS, BP_TIER_ORDER, CARD_TEST, FADE, MODULES, SVGNS, _abxNameMap, _biochemTestMap, abxIdByDrugText, abxIdByName, appendChildNode, biochemTestIdByName, bpTierBadge, bpTierLegend, bpUrineChip, categories, db, el, fill, imgV, initScrollFades, mergeAtlasPhotos, parseHash, routeKey, setActiveTab, setActiveTool, sg, syncScrollFade });
})();
