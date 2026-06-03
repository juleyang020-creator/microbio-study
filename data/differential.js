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
  ]
};
