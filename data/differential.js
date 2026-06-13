window.DB = window.DB || {};
// 鉴别（按微生物 id）：每项 { 名称, id?(相似菌的id,用于跳转), 相似点, 鉴别 }
window.DB.differential = {
  'staph-aureus': [
    { 名称: '凝固酶阴性葡萄球菌', id: 'staph-epidermidis', 相似点: '同为革兰阳性、触酶阳性的葡萄球菌', 鉴别: '金葡血浆凝固酶(+)、甘露醇发酵(+)；CoNS 凝固酶(−)。' }
  ],
  'staph-epidermidis': [
    { 名称: '金黄色葡萄球菌', id: 'staph-aureus', 相似点: '同属葡萄球菌、触酶阳性', 鉴别: '凝固酶：金葡(+)、表皮葡(−)。' },
    { 名称: '腐生葡萄球菌', id: 'staph-saprophyticus', 相似点: '均为凝固酶阴性葡萄球菌(CoNS)', 鉴别: '新生霉素：表皮葡(敏感)、腐生葡(耐药)。' }
  ],
  'strep-pneumoniae': [
    { 名称: '草绿色链球菌', id: 'strep-viridans', 相似点: '均为 α 溶血链球菌', 鉴别: 'Optochin / 胆汁溶解：肺炎链球菌(敏感 / 溶解)、草绿色链球菌(耐药 / 不溶)。' }
  ],
  'strep-pyogenes': [
    { 名称: '无乳链球菌(B群)', id: 'strep-agalactiae', 相似点: '均为 β 溶血链球菌', 鉴别: '杆菌肽(A群敏感)、CAMP 试验(B群+)；Lancefield 分群不同。' }
  ],
  'enterococcus-faecalis': [
    { 名称: '链球菌', id: 'strep-pyogenes', 相似点: '革兰阳性链状球菌、触酶阴性', 鉴别: '肠球菌胆汁七叶苷(+)、6.5%NaCl 生长(+)，且天然耐头孢。' }
  ],
  'e-coli': [
    { 名称: '伤寒沙门菌 / 志贺菌', id: 'salmonella-typhi', 相似点: '同为肠杆菌科革兰阴性杆菌', 鉴别: '大肠埃希菌乳糖发酵(+)、吲哚(+)；沙门 / 志贺乳糖(−)。' },
    { 名称: '肺炎克雷伯菌', id: 'klebsiella-pneumoniae', 相似点: '均为乳糖发酵(+)的肠杆菌', 鉴别: '大肠：吲哚(+)、动力(+)、VP(−)；克雷伯：吲哚(−)、无动力、VP(+)、菌落黏液状。' }
  ],
  'klebsiella-pneumoniae': [
    { 名称: '大肠埃希菌', id: 'e-coli', 相似点: '乳糖发酵阳性的肠杆菌', 鉴别: '克雷伯无动力、VP(+)、吲哚(−)、有厚荚膜；大肠相反。' }
  ],
  'salmonella-typhi': [
    { 名称: '志贺菌', id: 'shigella-dysenteriae', 相似点: '均为乳糖不发酵、致肠道感染的肠杆菌', 鉴别: '沙门菌动力(+)、H2S(+)；志贺菌无动力、H2S(−)。' }
  ],
  'shigella-dysenteriae': [
    { 名称: '伤寒沙门菌', id: 'salmonella-typhi', 相似点: '乳糖不发酵的革兰阴性肠道杆菌', 鉴别: '志贺无动力、H2S(−)、不产气；沙门动力(+)、H2S(+)。' }
  ],
  'pseudomonas-aeruginosa': [
    { 名称: '鲍曼不动杆菌', id: 'acinetobacter-baumannii', 相似点: '均为非发酵革兰阴性杆菌、院内多重耐药', 鉴别: '氧化酶：铜绿(+)、不动杆菌(−)；铜绿产绿脓菌素、有动力。' }
  ],
  'acinetobacter-baumannii': [
    { 名称: '铜绿假单胞菌', id: 'pseudomonas-aeruginosa', 相似点: '非发酵革兰阴性杆菌、ICU 多重耐药', 鉴别: '不动杆菌氧化酶(−)、无动力、球杆状；铜绿氧化酶(+)、有动力、产色素。' },
    { 名称: '嗜麦芽窄食单胞菌', id: 'stenotrophomonas-maltophilia', 相似点: '非发酵菌、碳青霉烯天然耐药', 鉴别: '窄食单胞菌氧化酶(−)、DNase(+)，首选 SXT；不动杆菌首选舒巴坦制剂/多黏菌素。' }
  ],
  'neisseria-meningitidis': [
    { 名称: '淋病奈瑟菌', id: 'neisseria-gonorrhoeae', 相似点: '革兰阴性双球菌、氧化酶阳性', 鉴别: '糖发酵：脑膜炎奈瑟菌(葡萄糖+、麦芽糖+)、淋病奈瑟菌(仅葡萄糖+)。' }
  ],
  'candida-albicans': [
    { 名称: '光滑念珠菌', id: 'candida-glabrata', 相似点: '同属念珠菌、可致念珠菌血症', 鉴别: '白色念珠菌芽管试验(germ tube)+、可形成厚膜孢子；光滑念珠菌不形成假菌丝、唑类敏感性低。' },
    { 名称: '克柔念珠菌', id: 'candida-krusei', 相似点: '同属念珠菌', 鉴别: '克柔念珠菌对氟康唑天然耐药；白色念珠菌一般对氟康唑敏感。' }
  ],
  'aspergillus-fumigatus': [
    { 名称: '毛霉 / 根霉', id: 'rhizopus', 相似点: '同为侵袭性丝状真菌、好发于免疫低下', 鉴别: '曲霉：有隔菌丝、45° 锐角分支，首选伏立康唑；毛霉/根霉：宽大无隔菌丝、直角分支、血管侵袭坏死，首选两性霉素B（棘白菌素、伏立康唑对毛霉无效）。' }
  ],
  'mucor': [
    { 名称: '曲霉', id: 'aspergillus-fumigatus', 相似点: '侵袭性丝状真菌', 鉴别: '毛霉宽大无隔、直角分支；曲霉有隔、45° 锐角分支。治疗：毛霉首选两性霉素B，曲霉首选伏立康唑。' }
  ],
  'rhizopus': [
    { 名称: '曲霉', id: 'aspergillus-fumigatus', 相似点: '侵袭性丝状真菌、免疫低下者感染', 鉴别: '根霉/毛霉宽大无隔、直角分支，好发于糖尿病酮症；曲霉有隔、45° 锐角分支。治疗药物不同（毛霉用两性霉素B）。' }
  ],
  'klebsiella-oxytoca': [
    { 名称: '肺炎克雷伯菌', id: 'klebsiella-pneumoniae', 相似点: '有荚膜、无动力、乳糖发酵的克雷伯菌', 鉴别: '产酸克雷伯吲哚(+)；肺炎克雷伯吲哚(−)。' }
  ],
  'klebsiella-aerogenes': [
    { 名称: '肺炎克雷伯菌', id: 'klebsiella-pneumoniae', 相似点: '乳糖发酵的克雷伯菌', 鉴别: '产气克雷伯有动力、产诱导型 AmpC；肺炎克雷伯无动力、有厚荚膜。' }
  ],
  'plasmodium-falciparum': [
    { 名称: '间日疟原虫', id: 'plasmodium-vivax', 相似点: '同属疟原虫、红细胞内期', 鉴别: '恶性疟：环状体纤细且常一红细胞内多个、香蕉形配子体、红细胞不胀大、病情凶险；间日疟：红细胞胀大、薛氏点、有休眠子可复发。' }
  ],
  'plasmodium-vivax': [
    { 名称: '三日疟 / 恶性疟原虫', id: 'plasmodium-malariae', 相似点: '同属疟原虫', 鉴别: '间日疟红细胞胀大+薛氏点、48h、可复发(休眠子)；三日疟带状滋养体、72h、红细胞不胀大；恶性疟香蕉形配子体、凶险。' }
  ],
  'haemophilus-parainfluenzae': [
    { 名称: '流感嗜血杆菌', id: 'haemophilus-influenzae', 相似点: '同属嗜血杆菌、革兰阴性小杆菌', 鉴别: '生长因子：流感嗜血杆菌需 X+V 因子；副流感嗜血杆菌仅需 V 因子。' }
  ],
  'nocardia': [
    { 名称: '结核分枝杆菌', id: 'mycobacterium-tuberculosis', 相似点: '抗酸染色均可着色、可致肺/播散感染', 鉴别: '诺卡菌弱抗酸(改良抗酸+)、有分枝丝状、需氧、SXT 治疗；结核完全抗酸、无分枝、抗结核联合治疗。' }
  ],
  'proteus-vulgaris': [
    { 名称: '奇异变形杆菌', id: 'proteus-mirabilis', 相似点: '迁徙生长、脲酶阳性的变形杆菌', 鉴别: '吲哚：普通变形杆菌(+)、奇异变形杆菌(−)；鸟氨酸脱羧酶奇异(+)。' }
  ],
  'morganella-morganii': [
    { 名称: '奇异变形杆菌', id: 'proteus-mirabilis', 相似点: '脲酶阳性、苯丙氨酸脱氨酶阳性的肠杆菌', 鉴别: '摩根菌不迁徙生长、H₂S(−)；变形杆菌迁徙生长、多 H₂S(+)。' }
  ],
  'vibrio-vulnificus': [
    { 名称: '霍乱弧菌', id: 'vibrio-cholerae', 相似点: '同属弧菌', 鉴别: 'TCBS：霍乱弧菌发酵蔗糖呈黄色；创伤弧菌不发酵蔗糖呈绿色，且乳糖(+)、嗜盐。' }
  ],
  'staph-lugdunensis': [
    { 名称: '金黄色葡萄球菌', id: 'staph-aureus', 相似点: '均可致心内膜炎、侵袭性强', 鉴别: '试管凝固酶：金葡(+)、路邓葡萄球菌(−，属 CoNS)；后者玻片凝固酶/PYR 可阳性而易误判。' }
  ],
  'enterococcus-gallinarum': [
    { 名称: '屎肠球菌', id: 'enterococcus-faecium', 相似点: '肠球菌、对万古霉素可不敏感', 鉴别: '鹑鸡肠球菌有动力、固有 vanC 低度耐药(替考拉宁敏感)；屎肠球菌无动力、VRE 多为获得性 VanA(高度耐药)。' }
  ],
  'citrobacter-koseri': [
    { 名称: '弗劳地柠檬酸杆菌', id: 'citrobacter-freundii', 相似点: '同属柠檬酸杆菌', 鉴别: '克氏：吲哚(+)、H₂S(−)、致新生儿脑脓肿；弗劳地：吲哚(−)、H₂S(+)、产诱导型 AmpC。' }
  ]
};
