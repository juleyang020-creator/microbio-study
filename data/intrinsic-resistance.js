window.DB = window.DB || {};
// 真菌固有(内在)耐药结构化速查。仅收录 CLSI 明确标注 “IR” 的药物×菌种组合。
// 数据来源：
//   · 酵母    —— CLSI M27M44S Ed3 (2022) Appendix B「Intrinsic Resistance for Yeasts」
//   · 丝状真菌 —— CLSI M38M51S (2022) Appendix「Intrinsic Resistance for Molds」
// IR 定义：几乎所有野生型菌株即耐药，通常无需药敏；若测试且列为 IR，应报告为「耐药/固有耐药」。
// 注意：源表中带脚注(而非 “IR”)的格子表示“敏感性下降/资料有限”，不作为固有耐药收录，另在备注说明。
window.DB.intrinsicResistance = {
  来源: 'CLSI M27M44S Ed3 (2022) Appendix B（酵母）· CLSI M38M51S (2022) Appendix（丝状真菌）',
  说明: 'IR = 固有(内在)耐药：野生型即耐药、通常无需药敏；若检测并列为 IR，应报「耐药 / 固有耐药」。仅收录 CLSI 明确标注 IR 的组合。',
  分组: [
    {
      界: '酵母菌 (M27M44S Appendix B)',
      药物列: ['两性霉素B', '阿尼芬净', '卡泊芬净', '氟康唑', '米卡芬净'],
      行: [
        { 名称: '克柔念珠菌', 拉丁: 'Pichia kudriavzevii / C. krusei', id: 'candida-krusei', 耐药: ['氟康唑'], 备注: '' },
        { 名称: '隐球菌属', 拉丁: 'Cryptococcus spp.', id: 'cryptococcus-neoformans', 耐药: ['阿尼芬净', '卡泊芬净', '米卡芬净'], 备注: '棘白菌素类整类无效（细胞壁缺乏 1,3-β-D-葡聚糖靶点）' },
        { 名称: '红酵母属', 拉丁: 'Rhodotorula spp.', id: null, 耐药: ['阿尼芬净', '卡泊芬净', '氟康唑', '米卡芬净'], 备注: '棘白菌素类与氟康唑均无效；首选两性霉素B' },
        { 名称: '毛孢子菌属', 拉丁: 'Trichosporon spp.', id: 'trichosporon-asahii', 耐药: ['阿尼芬净', '卡泊芬净', '米卡芬净'], 备注: '棘白菌素类整类无效；首选唑类' }
      ]
    },
    {
      界: '丝状真菌 (M38M51S Appendix)',
      药物列: ['两性霉素B', '氟康唑', '5-氟胞嘧啶', '伏立康唑'],
      行: [
        { 名称: '曲霉属', 拉丁: 'Aspergillus spp.', id: 'aspergillus-fumigatus', 耐药: ['氟康唑'], 备注: '氟康唑对曲霉一律无效；5-氟胞嘧啶资料有限、不单用' },
        { 名称: '土曲霉', 拉丁: 'Aspergillus terreus', id: null, 耐药: ['氟康唑'], 备注: '另对两性霉素B 敏感性显著下降，临床上常规不宜用两性霉素B' },
        { 名称: '多育节荚孢霉', 拉丁: 'Lomentospora prolificans', id: null, 耐药: ['两性霉素B', '氟康唑'], 备注: '广泛耐药、治疗困难（旧称 Scedosporium prolificans）' },
        { 名称: '毛霉目', 拉丁: 'Mucorales', id: 'mucor', 耐药: ['氟康唑', '伏立康唑'], 备注: '短侧链唑类(氟康唑/伏立康唑)无效；首选两性霉素B、泊沙康唑或艾沙康唑' },
        { 名称: '淡紫紫孢霉', 拉丁: 'Purpureocillium lilacinum', id: null, 耐药: ['两性霉素B'], 备注: '旧称淡紫拟青霉；两性霉素B 无效，唑类多有活性' }
      ]
    }
  ]
};
