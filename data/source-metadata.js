window.DB = window.DB || {};
window.DB.sourceMetadata = {
  app: {
    名称: '知微 · 微生物学习手册',
    资源版本: '20260907-73',
    最近校对日期: '2026-06-30',
    说明: '本版本补充缓存校验、来源元数据、发布前检查和常用检索别名。'
  },
  breakpoints: {
    口径: 'CLSI M100 Ed36 · M45 Ed3 · M27M44S Ed3 · M38M51S Ed3（精选常用折点）',
    版本: '2026 教学整理口径',
    最近校对日期: '2026-06-30',
    // 结构化标准来源：按细菌/酵母/丝状真菌分列，含文件、版次、年份与状态。
    标准: {
      细菌: [
        { 文件: 'CLSI M100', 版次: 36, 年份: 2026, 用途: '细菌临床折点（本模块采用）' },
        { 文件: 'CLSI M45', 版次: 3, 年份: 2018, 用途: '罕见 / 苛养菌折点' },
        { 文件: 'EUCAST 临床折点', 版次: 'v16.1', 年份: 2026, 状态: '已结构化收录主要菌组、与 CLSI 并排对照，并支持 EUCAST 判读', 用途: '欧洲临床折点（替代标准），见 eucast.org' }
      ],
      酵母: [
        { 文件: 'CLSI M27M44S', 版次: 3, 年份: 2022, 用途: '酵母菌抗真菌折点（本模块采用）' },
        { 文件: 'CLSI M60', 版次: 2, 年份: 2020, 状态: '已被 M27M44S 取代', 用途: '仅作历史对照' },
        { 文件: 'EUCAST 抗真菌折点', 版次: 'v10.0', 年份: 2020, 状态: '未收录数值', 用途: '欧洲抗真菌折点（替代标准）' }
      ],
      丝状真菌: [
        { 文件: 'CLSI M38M51S', 版次: 3, 年份: 2022, 用途: '丝状真菌抗真菌折点' }
      ]
    },
    优先顺序: [
      '细菌临床折点：M100 Ed36（2026）',
      '罕见及苛养菌：M45 Ed3（2018）',
      '酵母菌：M27M44S Ed3（2022）',
      '丝状真菌：M38M51S Ed3（2022）',
      '鉴定 / 标本 / 流程背景：《临床微生物学手册》第 12 版',
      'M60 Ed2（2020）仅作历史对照，不应标为 2022 年第 3 版'
    ],
    说明: '折点用于学习与速查（精选常用折点）；正式报告应以实验室现行 CLSI/EUCAST 文件和本地 SOP 为准。每条折点在其表格内标注具体标准、表号与脚注。'
  },
  treatment: {
    口径: 'CDC / IDSA / Sanford / StatPearls / Merck Manual 综合教学口径',
    版本: '2026-06-29 内容校对',
    最近校对日期: '2026-06-30',
    说明: '治疗要点只保留学习级关键词；临床用药必须结合患者情况、感染部位、本地药敏和最新指南。'
  },
  taxonomy: {
    口径: 'LPSN / NCBI Taxonomy / 常用临床命名',
    版本: '2026-06-29 内容校对',
    最近校对日期: '2026-06-30',
    说明: '条目优先采用临床常用中文名，拉丁名中保留部分旧称以便检索。'
  },
  // 仅记录已回源的核心命题，不代表整图方法参数已全部复核。
  diagrams: {
    'img/glossary-ast-terms.svg': {
      标题: '药敏术语：MIC、解释类别与 WT',
      核心命题: 'MIC 是规定条件下达到相应抑制终点的最低浓度；CLSI 与 EUCAST 的 I 不能混读，SDD 为独立类别。',
      适用范围: '图中 MIC 为教学例值，不是临床折点。WT 限于特定菌种—药物组合，未见可表型检出的获得性耐药不等于临床敏感；具体终点和折点依现行标准解释。',
      核对日期: '2026-09-07',
      来源: [
        { 名称: 'CLSI M100 Ed36（2026）· 解释类别定义，印刷第8页', url: null },
        { 名称: 'EUCAST · S、I、R 定义', url: 'https://www.eucast.org/bacteria/clinical-breakpoints-and-interpretation/definition-of-s-i-and-r/' },
        { 名称: 'Clinical Microbiology Reviews · WT / ECOFF 的临床与实验室意义', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10732016/' }
      ]
    },
    'img/media-corn-rice-tween.svg': {
      标题: '厚壁孢子与假菌丝：形态学线索',
      核心命题: '厚壁孢子并非白念珠菌独有，都柏林念珠菌也可形成；不能仅凭这一特征确认到种。',
      适用范围: '形态学表现用于提供鉴别线索；芽管等组合表型也不自动等于种级确认。具体方法条件仍以产品说明和本地验证流程为准。',
      核对日期: '2026-09-07',
      来源: [
        { 名称: 'Adelaide University Mycology · Candida', url: 'https://mycology.adelaide.edu.au/candida' },
        { 名称: '《临床微生物学检验技术》第2版（人卫2025）· 第21章', url: null }
      ]
    },
    'img/glossary-structure-fungi-virus.svg': {
      标题: '真菌与病毒结构：特征与解释边界',
      核心命题: '曲霉分生孢子头由顶囊、瓶梗、可有的梗基和分生孢子组成；形态观察不能一概确认到种。',
      适用范围: '有隔/少隔是形态描述，不代替现代分类。包膜影响理化敏感性，但消毒要求依处理对象和规范确定，不能只凭包膜推断传播方式。',
      核对日期: '2026-09-07',
      来源: [
        { 名称: 'Adelaide University Mycology · Aspergillus', url: 'https://mycology.adelaide.edu.au/fungal-descriptions-and-antifungal-susceptibility/hyphomycetes-conidial-moulds/aspergillus' },
        { 名称: '《临床微生物学检验技术》第2版（人卫2025）· 第23、24章', url: null },
        { 名称: 'CDC · 医疗机构消毒与灭菌建议', url: 'https://www.cdc.gov/infection-control/hcp/disinfection-sterilization/summary-recommendations.html' }
      ]
    },
    'img/glossary-virus-serology.svg': {
      标题: '病毒血清学：典型应答与解释边界',
      核心命题: 'IgM/IgG 曲线仅为典型初次免疫应答示意，单一抗体阳性不能确定感染时间或阶段。',
      适用范围: '抗体结果依病原、宿主和检测方法解释。CDC 的 CMV 说明是这一限制的具体例子，不应直接套用为其他病原的诊断算法。',
      核对日期: '2026-09-07',
      来源: [ { 名称: 'CDC · CMV 实验室检测与抗体解释', url: 'https://www.cdc.gov/cytomegalovirus/php/laboratories/index.html' } ]
    },
    'img/resistance-biofilm.svg': {
      标题: '生物膜、耐受与持留',
      核心命题: '生物膜相关难清除不等于常规药敏必然显示耐药；耐受与持留可不伴 MIC 升高。',
      适用范围: '本图用于区分概念，分层是示意而非固定状态；不能仅凭生物膜示意推断某菌株的药敏类别或临床疗效。',
      核对日期: '2026-09-07',
      来源: [ { 名称: 'Nature Reviews Microbiology（2019）· 耐药、耐受与持留概念共识', url: 'https://www.nature.com/articles/s41579-019-0196-3' } ]
    },
    'img/media-chromagar-candida.svg': {
      标题: '念珠菌显色：常见表现与初筛边界',
      核心命题: '图中的常见颜色仅为初筛线索，任何颜色都不能独立确认到种。',
      适用范围: '颜色示意参考人卫2025教材第21章，不覆盖全部商品配方；不同产品、菌种与观察条件可有差异，应按所用产品说明和本地验证规则解释。',
      核对日期: '2026-09-07',
      来源: [
        { 名称: '《临床微生物学检验技术》第2版（人卫2025）· 第21章', url: null },
        { 名称: 'Adelaide University Mycology · Candida', url: 'https://mycology.adelaide.edu.au/candida' }
      ]
    },
    'img/test-maldi.svg': {
      标题: 'MALDI-TOF MS：谱库比对与报告边界',
      核心命题: '种级报告依赖谱库覆盖、谱图质量与经验证的判读规则，不能仅凭候选之间的相对分差决定。',
      适用范围: '图示说明常规质谱鉴定，不替代药敏。近缘菌与复合群的分辨能力依系统和谱库而异；低匹配结果应按本地验证流程复核。',
      核对日期: '2026-09-07',
      来源: [
        { 名称: 'Adelaide University Mycology · Aspergillus 鉴定与参考谱库', url: 'https://mycology.adelaide.edu.au/fungal-descriptions-and-antifungal-susceptibility/hyphomycetes-conidial-moulds/aspergillus' },
        { 名称: '《临床微生物学检验技术》第2版（人卫2025）· 第21章', url: null }
      ]
    }
  }
};
