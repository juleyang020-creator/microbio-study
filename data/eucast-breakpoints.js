window.DB = window.DB || {};
// EUCAST 临床折点（v16.1, 2026-06-24），程序化提取自官方 Excel 折点表、逐条对源核对。
// 仅收录能对应到本 App CLSI 折点组/药物的项，用于与 CLSI 并排对照。EUCAST 采用 S≤ / R> 模型：
//   MIC_S="≤X"、MIC_R=">Y"；X<Y 时 X<MIC≤Y 为 I(“增加暴露”)；X==Y 时无 I。部分菌(如铜绿)S 设为
//   “≤0.001”表示无标准剂量 S、仅 I/R。括注:true 表示官方为“括号折点”，需按指南谨慎使用。
// 正式报告以实验室现行 EUCAST 原表与本地 SOP 为准。
window.DB.eucastBreakpoints = [
 {
  "菌组名": "肠杆菌目 (Enterobacterales，不含沙门/志贺)",
  "来源": "EUCAST v16.1（2026-06-24）",
  "菌种": [
   "e-coli",
   "klebsiella-pneumoniae",
   "klebsiella-oxytoca",
   "klebsiella-aerogenes",
   "proteus-mirabilis",
   "proteus-vulgaris",
   "enterobacter-cloacae",
   "citrobacter-freundii",
   "citrobacter-koseri",
   "morganella-morganii",
   "serratia-marcescens",
   "providencia-stuartii",
   "providencia-rettgeri",
   "yersinia-pestis",
   "hafnia-alvei",
   "raoultella-ornithinolytica",
   "proteus-hauseri"
  ],
  "药物": [
   {
    "药物": "氨苄西林 (Ampicillin)",
    "简写": "AM",
    "MIC_S": "≤8",
    "MIC_R": ">8"
   },
   {
    "药物": "氨苄西林/舒巴坦 (Ampicillin-Sulbactam)",
    "简写": "SAM",
    "MIC_S": "≤8",
    "MIC_R": ">8"
   },
   {
    "药物": "哌拉西林/他唑巴坦 (Piperacillin-Tazobactam)",
    "简写": "TZP",
    "MIC_S": "≤8",
    "MIC_R": ">8"
   },
   {
    "药物": "氨曲南 (Aztreonam)",
    "简写": "ATM",
    "MIC_S": "≤1",
    "MIC_R": ">4"
   },
   {
    "药物": "氨曲南/阿维巴坦 (Aztreonam-Avibactam)",
    "简写": "ATM-AVI",
    "MIC_S": "≤4",
    "MIC_R": ">4"
   },
   {
    "药物": "头孢唑林 (Cefazolin)",
    "简写": "CZ",
    "MIC_S": "≤0.001",
    "MIC_R": ">4"
   },
   {
    "药物": "头孢吡肟 (Cefepime)",
    "简写": "FEP",
    "MIC_S": "≤1",
    "MIC_R": ">4"
   },
   {
    "药物": "头孢噻肟 (Cefotaxime)",
    "简写": "CTX",
    "MIC_S": "≤1",
    "MIC_R": ">2"
   },
   {
    "药物": "头孢他啶 (Ceftazidime)",
    "简写": "CAZ",
    "MIC_S": "≤1",
    "MIC_R": ">4"
   },
   {
    "药物": "头孢他啶/阿维巴坦 (Ceftazidime-Avibactam)",
    "简写": "CZA",
    "MIC_S": "≤8",
    "MIC_R": ">8"
   },
   {
    "药物": "头孢曲松 (Ceftriaxone)",
    "简写": "CRO",
    "MIC_S": "≤1",
    "MIC_R": ">2"
   },
   {
    "药物": "环丙沙星 (Ciprofloxacin)",
    "简写": "CIP",
    "MIC_S": "≤0.25",
    "MIC_R": ">0.5"
   },
   {
    "药物": "黏菌素 (Colistin)",
    "简写": "CT",
    "MIC_S": "≤2",
    "MIC_R": ">2",
    "括注": true
   },
   {
    "药物": "厄他培南 (Ertapenem)",
    "简写": "ETP",
    "MIC_S": "≤0.5",
    "MIC_R": ">0.5"
   },
   {
    "药物": "庆大霉素 (Gentamicin)",
    "简写": "GM",
    "MIC_S": "≤2",
    "MIC_R": ">2",
    "括注": true
   },
   {
    "药物": "亚胺培南 (Imipenem)",
    "简写": "IPM",
    "MIC_S": "≤2",
    "MIC_R": ">4"
   },
   {
    "药物": "左氧氟沙星 (Levofloxacin)",
    "简写": "LVX",
    "MIC_S": "≤0.5",
    "MIC_R": ">1"
   },
   {
    "药物": "美罗培南 (Meropenem)",
    "简写": "MEM",
    "MIC_S": "≤2",
    "MIC_R": ">8"
   },
   {
    "药物": "妥布霉素 (Tobramycin)",
    "简写": "TOB",
    "MIC_S": "≤2",
    "MIC_R": ">2",
    "括注": true
   },
   {
    "药物": "阿米卡星 (Amikacin)",
    "简写": "AK",
    "MIC_S": "≤8",
    "MIC_R": ">8",
    "括注": true
   },
   {
    "药物": "呋喃妥因 (Nitrofurantoin)",
    "简写": "F",
    "MIC_S": "≤64",
    "MIC_R": ">64"
   }
  ]
 },
 {
  "菌组名": "沙门菌 / 志贺菌 (Salmonella & Shigella spp.)",
  "来源": "EUCAST v16.1（2026-06-24）",
  "菌种": [
   "salmonella-typhi",
   "salmonella-enteritidis",
   "salmonella-paratyphi-a",
   "shigella-dysenteriae",
   "shigella-flexneri"
  ],
  "药物": [
   {
    "药物": "氨苄西林 (Ampicillin)",
    "简写": "AM",
    "MIC_S": "≤8",
    "MIC_R": ">8"
   },
   {
    "药物": "头孢噻肟 (Cefotaxime)",
    "简写": "CTX",
    "MIC_S": "≤1",
    "MIC_R": ">2"
   },
   {
    "药物": "头孢曲松 (Ceftriaxone)",
    "简写": "CRO",
    "MIC_S": "≤1",
    "MIC_R": ">2"
   },
   {
    "药物": "厄他培南 (Ertapenem)",
    "简写": "ETP",
    "MIC_S": "≤0.5",
    "MIC_R": ">0.5"
   },
   {
    "药物": "亚胺培南 (Imipenem)",
    "简写": "IPM",
    "MIC_S": "≤2",
    "MIC_R": ">4"
   },
   {
    "药物": "美罗培南 (Meropenem)",
    "简写": "MEM",
    "MIC_S": "≤2",
    "MIC_R": ">8"
   },
   {
    "药物": "四环素 (Tetracycline)",
    "简写": "TE",
    "MIC_S": "—",
    "MIC_R": "—"
   },
   {
    "药物": "多西环素 (Doxycycline)",
    "简写": "DOX",
    "MIC_S": "—",
    "MIC_R": "—"
   },
   {
    "药物": "米诺环素 (Minocycline)",
    "简写": "MI",
    "MIC_S": "—",
    "MIC_R": "—"
   }
  ]
 },
 {
  "菌组名": "铜绿假单胞菌 (Pseudomonas aeruginosa)",
  "来源": "EUCAST v16.1（2026-06-24）",
  "菌种": [
   "pseudomonas-aeruginosa"
  ],
  "药物": [
   {
    "药物": "哌拉西林/他唑巴坦 (Piperacillin-Tazobactam)",
    "简写": "TZP",
    "MIC_S": "≤0.001",
    "MIC_R": ">16"
   },
   {
    "药物": "头孢他啶 (Ceftazidime)",
    "简写": "CAZ",
    "MIC_S": "≤0.001",
    "MIC_R": ">8"
   },
   {
    "药物": "头孢他啶/阿维巴坦 (Ceftazidime-Avibactam)",
    "简写": "CZA",
    "MIC_S": "≤8",
    "MIC_R": ">8"
   },
   {
    "药物": "头孢吡肟 (Cefepime)",
    "简写": "FEP",
    "MIC_S": "≤0.001",
    "MIC_R": ">8"
   },
   {
    "药物": "氨曲南 (Aztreonam)",
    "简写": "ATM",
    "MIC_S": "≤0.001",
    "MIC_R": ">16"
   },
   {
    "药物": "亚胺培南 (Imipenem)",
    "简写": "IPM",
    "MIC_S": "≤0.001",
    "MIC_R": ">4"
   },
   {
    "药物": "美罗培南 (Meropenem)",
    "简写": "MEM",
    "MIC_S": "≤2",
    "MIC_R": ">8"
   },
   {
    "药物": "环丙沙星 (Ciprofloxacin)",
    "简写": "CIP",
    "MIC_S": "≤0.001",
    "MIC_R": ">0.5"
   },
   {
    "药物": "左氧氟沙星 (Levofloxacin)",
    "简写": "LVX",
    "MIC_S": "≤0.001",
    "MIC_R": ">2"
   },
   {
    "药物": "妥布霉素 (Tobramycin)",
    "简写": "TOB",
    "MIC_S": "≤2",
    "MIC_R": ">2",
    "括注": true
   },
   {
    "药物": "阿米卡星 (Amikacin)",
    "简写": "AK",
    "MIC_S": "≤16",
    "MIC_R": ">16",
    "括注": true
   },
   {
    "药物": "黏菌素 (Colistin)",
    "简写": "CT",
    "MIC_S": "≤4",
    "MIC_R": ">4",
    "括注": true
   }
  ]
 },
 {
  "菌组名": "不动杆菌属 (Acinetobacter spp.)",
  "来源": "EUCAST v16.1（2026-06-24）",
  "菌种": [
   "acinetobacter-baumannii",
   "acinetobacter-pittii",
   "acinetobacter-nosocomialis",
   "acinetobacter-junii"
  ],
  "药物": [
   {
    "药物": "氨苄西林/舒巴坦 (Ampicillin-Sulbactam)",
    "简写": "SAM",
    "MIC_S": "IE",
    "MIC_R": "IE"
   },
   {
    "药物": "哌拉西林/他唑巴坦 (Piperacillin-Tazobactam)",
    "简写": "TZP",
    "MIC_S": "IE",
    "MIC_R": "IE"
   },
   {
    "药物": "头孢他啶 (Ceftazidime)",
    "简写": "CAZ",
    "MIC_S": "—",
    "MIC_R": "—"
   },
   {
    "药物": "头孢吡肟 (Cefepime)",
    "简写": "FEP",
    "MIC_S": "—",
    "MIC_R": "—"
   },
   {
    "药物": "亚胺培南 (Imipenem)",
    "简写": "IPM",
    "MIC_S": "≤2",
    "MIC_R": ">4"
   },
   {
    "药物": "美罗培南 (Meropenem)",
    "简写": "MEM",
    "MIC_S": "≤2",
    "MIC_R": ">8"
   },
   {
    "药物": "环丙沙星 (Ciprofloxacin)",
    "简写": "CIP",
    "MIC_S": "≤0.001",
    "MIC_R": ">1"
   },
   {
    "药物": "左氧氟沙星 (Levofloxacin)",
    "简写": "LVX",
    "MIC_S": "≤0.5",
    "MIC_R": ">1"
   },
   {
    "药物": "庆大霉素 (Gentamicin)",
    "简写": "GM",
    "MIC_S": "≤4",
    "MIC_R": ">4",
    "括注": true
   },
   {
    "药物": "妥布霉素 (Tobramycin)",
    "简写": "TOB",
    "MIC_S": "≤4",
    "MIC_R": ">4",
    "括注": true
   },
   {
    "药物": "阿米卡星 (Amikacin)",
    "简写": "AK",
    "MIC_S": "≤8",
    "MIC_R": ">8",
    "括注": true
   },
   {
    "药物": "米诺环素 (Minocycline)",
    "简写": "MI",
    "MIC_S": "IE",
    "MIC_R": "IE"
   },
   {
    "药物": "复方新诺明 (Trimethoprim-Sulfamethoxazole)",
    "简写": "SXT",
    "MIC_S": "≤0.5",
    "MIC_R": ">0.5"
   },
   {
    "药物": "黏菌素 (Colistin)",
    "简写": "CT",
    "MIC_S": "≤2",
    "MIC_R": ">2",
    "括注": true
   }
  ]
 },
 {
  "菌组名": "嗜麦芽窄食单胞菌 (Stenotrophomonas maltophilia)",
  "来源": "EUCAST v16.1（2026-06-24）",
  "菌种": [
   "stenotrophomonas-maltophilia"
  ],
  "药物": [
   {
    "药物": "复方新诺明 (Trimethoprim-Sulfamethoxazole)",
    "简写": "SXT",
    "MIC_S": "≤0.001",
    "MIC_R": ">2"
   }
  ]
 },
 {
  "菌组名": "流感嗜血杆菌 / 副流感嗜血杆菌 (Haemophilus spp.)",
  "来源": "EUCAST v16.1（2026-06-24）",
  "菌种": [
   "haemophilus-influenzae",
   "haemophilus-parainfluenzae"
  ],
  "药物": [
   {
    "药物": "氨苄西林 (Ampicillin)",
    "简写": "AM",
    "MIC_S": "≤1",
    "MIC_R": ">1"
   },
   {
    "药物": "阿莫西林/克拉维酸 (Amoxicillin-Clavulanate)",
    "简写": "AMC",
    "MIC_S": "≤2",
    "MIC_R": ">2"
   },
   {
    "药物": "头孢噻肟 (Cefotaxime)",
    "简写": "CTX",
    "MIC_S": "≤0.125",
    "MIC_R": ">0.125"
   },
   {
    "药物": "头孢曲松 (Ceftriaxone)",
    "简写": "CRO",
    "MIC_S": "≤0.125",
    "MIC_R": ">0.125"
   },
   {
    "药物": "美罗培南 (Meropenem)",
    "简写": "MEM",
    "MIC_S": "≤2",
    "MIC_R": ">2"
   },
   {
    "药物": "头孢呋辛 (Cefuroxime)",
    "简写": "CXM",
    "MIC_S": "≤1",
    "MIC_R": ">2"
   },
   {
    "药物": "环丙沙星 (Ciprofloxacin)",
    "简写": "CIP",
    "MIC_S": "≤0.03",
    "MIC_R": ">0.03"
   },
   {
    "药物": "左氧氟沙星 (Levofloxacin)",
    "简写": "LVX",
    "MIC_S": "≤0.06",
    "MIC_R": ">0.06"
   },
   {
    "药物": "复方新诺明 (Trimethoprim-Sulfamethoxazole)",
    "简写": "SXT",
    "MIC_S": "≤0.5",
    "MIC_R": ">0.5"
   },
   {
    "药物": "氯霉素 (Chloramphenicol)",
    "简写": "C",
    "MIC_S": "≤2",
    "MIC_R": ">2"
   }
  ]
 },
 {
  "菌组名": "淋病奈瑟菌 (Neisseria gonorrhoeae)",
  "来源": "EUCAST v16.1（2026-06-24）",
  "菌种": [
   "neisseria-gonorrhoeae"
  ],
  "药物": [
   {
    "药物": "头孢曲松 (Ceftriaxone)",
    "简写": "CRO",
    "MIC_S": "≤0.125",
    "MIC_R": ">0.125"
   },
   {
    "药物": "头孢克肟 (Cefixime)",
    "简写": "CFM",
    "MIC_S": "≤0.125",
    "MIC_R": ">0.125"
   },
   {
    "药物": "青霉素 (Penicillin)",
    "简写": "P",
    "MIC_S": "≤0.06",
    "MIC_R": ">1"
   },
   {
    "药物": "环丙沙星 (Ciprofloxacin)",
    "简写": "CIP",
    "MIC_S": "≤0.03",
    "MIC_R": ">0.06"
   },
   {
    "药物": "壮观霉素 (Spectinomycin)",
    "简写": "SPT",
    "MIC_S": "≤64",
    "MIC_R": ">64"
   },
   {
    "药物": "四环素 (Tetracycline)",
    "简写": "TE",
    "MIC_S": "≤0.5",
    "MIC_R": ">0.5"
   }
  ]
 },
 {
  "菌组名": "脑膜炎奈瑟菌 (Neisseria meningitidis)",
  "来源": "EUCAST v16.1（2026-06-24）",
  "菌种": [
   "neisseria-meningitidis"
  ],
  "药物": [
   {
    "药物": "青霉素 (Penicillin)",
    "简写": "P",
    "MIC_S": "≤0.25",
    "MIC_R": ">0.25"
   },
   {
    "药物": "氨苄西林 (Ampicillin)",
    "简写": "AM",
    "MIC_S": "≤0.125",
    "MIC_R": ">1"
   },
   {
    "药物": "头孢曲松 (Ceftriaxone)",
    "简写": "CRO",
    "MIC_S": "≤0.125",
    "MIC_R": ">0.125"
   },
   {
    "药物": "头孢噻肟 (Cefotaxime)",
    "简写": "CTX",
    "MIC_S": "≤0.125",
    "MIC_R": ">0.125"
   },
   {
    "药物": "美罗培南 (Meropenem)",
    "简写": "MEM",
    "MIC_S": "≤0.25",
    "MIC_R": ">0.25"
   },
   {
    "药物": "左氧氟沙星 (Levofloxacin)",
    "简写": "LVX",
    "MIC_S": "IE",
    "MIC_R": "IE"
   },
   {
    "药物": "利福平 (Rifampin)",
    "简写": "RIF",
    "MIC_S": "≤0.25",
    "MIC_R": ">0.25"
   },
   {
    "药物": "复方新诺明 (Trimethoprim-Sulfamethoxazole)",
    "简写": "SXT",
    "MIC_S": "—",
    "MIC_R": "—"
   },
   {
    "药物": "米诺环素 (Minocycline)",
    "简写": "MI",
    "MIC_S": "≤1",
    "MIC_R": ">1"
   },
   {
    "药物": "氯霉素 (Chloramphenicol)",
    "简写": "C",
    "MIC_S": "≤2",
    "MIC_R": ">2"
   }
  ]
 },
 {
  "菌组名": "葡萄球菌属 (Staphylococcus spp.)",
  "来源": "EUCAST v16.1（2026-06-24）",
  "菌种": [
   "staph-aureus",
   "staph-epidermidis",
   "staph-saprophyticus",
   "staph-haemolyticus",
   "staph-lugdunensis",
   "staph-capitis",
   "staph-hominis",
   "staph-cohnii",
   "staph-kloosii"
  ],
  "药物": [
   {
    "药物": "青霉素 (Penicillin)",
    "简写": "P",
    "MIC_S": "≤0.125",
    "MIC_R": ">0.125"
   },
   {
    "药物": "头孢洛林 (Ceftaroline)",
    "简写": "CPT",
    "MIC_S": "≤1",
    "MIC_R": ">2"
   },
   {
    "药物": "万古霉素 (Vancomycin)",
    "简写": "VA",
    "MIC_S": "≤2",
    "MIC_R": ">2"
   },
   {
    "药物": "达托霉素 (Daptomycin)",
    "简写": "DAP",
    "MIC_S": "≤1",
    "MIC_R": ">1"
   },
   {
    "药物": "利奈唑胺 (Linezolid)",
    "简写": "LZD",
    "MIC_S": "≤4",
    "MIC_R": ">4"
   },
   {
    "药物": "克林霉素 (Clindamycin)",
    "简写": "CC",
    "MIC_S": "≤0.25",
    "MIC_R": ">0.25"
   },
   {
    "药物": "红霉素 (Erythromycin)",
    "简写": "E",
    "MIC_S": "≤1",
    "MIC_R": ">1"
   },
   {
    "药物": "庆大霉素 (Gentamicin)",
    "简写": "GM",
    "MIC_S": "≤2",
    "MIC_R": ">2",
    "括注": true
   },
   {
    "药物": "左氧氟沙星 (Levofloxacin)",
    "简写": "LVX",
    "MIC_S": "≤0.001",
    "MIC_R": ">1"
   },
   {
    "药物": "利福平 (Rifampin)",
    "简写": "RIF",
    "MIC_S": "≤0.06",
    "MIC_R": ">0.06"
   },
   {
    "药物": "四环素 (Tetracycline)",
    "简写": "TE",
    "MIC_S": "≤1",
    "MIC_R": ">1"
   },
   {
    "药物": "复方新诺明 (Trimethoprim-Sulfamethoxazole)",
    "简写": "SXT",
    "MIC_S": "≤0.5",
    "MIC_R": ">0.5"
   }
  ]
 },
 {
  "菌组名": "肠球菌属 (Enterococcus spp.)",
  "来源": "EUCAST v16.1（2026-06-24）",
  "菌种": [
   "enterococcus-faecalis",
   "enterococcus-faecium",
   "enterococcus-gallinarum",
   "enterococcus-avium",
   "enterococcus-casseliflavus"
  ],
  "药物": [
   {
    "药物": "氨苄西林 (Ampicillin)",
    "简写": "AM",
    "MIC_S": "≤4",
    "MIC_R": ">4"
   },
   {
    "药物": "青霉素 (Penicillin)",
    "简写": "P",
    "MIC_S": "—",
    "MIC_R": "—"
   },
   {
    "药物": "万古霉素 (Vancomycin)",
    "简写": "VA",
    "MIC_S": "≤4",
    "MIC_R": ">4"
   },
   {
    "药物": "替考拉宁 (Teicoplanin)",
    "简写": "TEC",
    "MIC_S": "≤2",
    "MIC_R": ">2"
   },
   {
    "药物": "达托霉素 (Daptomycin)",
    "简写": "DAP",
    "MIC_S": "IE",
    "MIC_R": "IE"
   },
   {
    "药物": "奎奴普丁-达福普汀 (Quinupristin-Dalfopristin)",
    "简写": "QD",
    "MIC_S": "≤1",
    "MIC_R": ">1"
   },
   {
    "药物": "利奈唑胺 (Linezolid)",
    "简写": "LZD",
    "MIC_S": "≤4",
    "MIC_R": ">4"
   }
  ]
 },
 {
  "菌组名": "β-溶血链球菌 (β-Hemolytic Streptococcus)",
  "来源": "EUCAST v16.1（2026-06-24）",
  "菌种": [
   "strep-pyogenes",
   "strep-agalactiae",
   "strep-dysgalactiae"
  ],
  "药物": [
   {
    "药物": "青霉素 (Penicillin)",
    "简写": "P",
    "MIC_S": "≤0.03",
    "MIC_R": ">0.03"
   },
   {
    "药物": "万古霉素 (Vancomycin)",
    "简写": "VA",
    "MIC_S": "≤2",
    "MIC_R": ">2"
   },
   {
    "药物": "红霉素 (Erythromycin)",
    "简写": "E",
    "MIC_S": "≤0.25",
    "MIC_R": ">0.25"
   },
   {
    "药物": "克林霉素 (Clindamycin)",
    "简写": "CC",
    "MIC_S": "≤0.5",
    "MIC_R": ">0.5"
   },
   {
    "药物": "左氧氟沙星 (Levofloxacin)",
    "简写": "LVX",
    "MIC_S": "≤0.001",
    "MIC_R": ">2"
   },
   {
    "药物": "复方新诺明 (Trimethoprim-Sulfamethoxazole)",
    "简写": "SXT",
    "MIC_S": "≤0.5",
    "MIC_R": ">0.5"
   }
  ]
 },
 {
  "菌组名": "肺炎链球菌 (Streptococcus pneumoniae)",
  "来源": "EUCAST v16.1（2026-06-24）",
  "菌种": [
   "strep-pneumoniae"
  ],
  "药物": [
   {
    "药物": "阿莫西林 (Amoxicillin)",
    "简写": "AMX",
    "MIC_S": "≤0.5",
    "MIC_R": ">1"
   },
   {
    "药物": "红霉素 (Erythromycin)",
    "简写": "E",
    "MIC_S": "≤0.25",
    "MIC_R": ">0.25"
   },
   {
    "药物": "左氧氟沙星 (Levofloxacin)",
    "简写": "LVX",
    "MIC_S": "≤0.001",
    "MIC_R": ">2"
   },
   {
    "药物": "莫西沙星 (Moxifloxacin)",
    "简写": "MXF",
    "MIC_S": "≤0.5",
    "MIC_R": ">0.5"
   },
   {
    "药物": "万古霉素 (Vancomycin)",
    "简写": "VA",
    "MIC_S": "≤2",
    "MIC_R": ">2"
   },
   {
    "药物": "克林霉素 (Clindamycin)",
    "简写": "CC",
    "MIC_S": "≤0.5",
    "MIC_R": ">0.5"
   },
   {
    "药物": "四环素 (Tetracycline)",
    "简写": "TE",
    "MIC_S": "≤1",
    "MIC_R": ">1"
   },
   {
    "药物": "复方新诺明 (Trimethoprim-Sulfamethoxazole)",
    "简写": "SXT",
    "MIC_S": "≤1",
    "MIC_R": ">1"
   }
  ]
 },
 {
  "菌组名": "草绿色链球菌群 (Viridans Group Streptococci)",
  "来源": "EUCAST v16.1（2026-06-24）",
  "菌种": [
   "strep-viridans",
   "strep-gallolyticus",
   "strep-anginosus"
  ],
  "药物": [
   {
    "药物": "青霉素 (Penicillin)",
    "简写": "P",
    "MIC_S": "≤0.25",
    "MIC_R": ">1"
   },
   {
    "药物": "氨苄西林 (Ampicillin)",
    "简写": "AM",
    "MIC_S": "≤0.5",
    "MIC_R": ">2"
   },
   {
    "药物": "头孢曲松 (Ceftriaxone)",
    "简写": "CRO",
    "MIC_S": "≤0.5",
    "MIC_R": ">0.5"
   },
   {
    "药物": "头孢噻肟 (Cefotaxime)",
    "简写": "CTX",
    "MIC_S": "≤0.5",
    "MIC_R": ">0.5"
   },
   {
    "药物": "万古霉素 (Vancomycin)",
    "简写": "VA",
    "MIC_S": "≤2",
    "MIC_R": ">2"
   },
   {
    "药物": "克林霉素 (Clindamycin)",
    "简写": "CC",
    "MIC_S": "≤0.5",
    "MIC_R": ">0.5"
   },
   {
    "药物": "红霉素 (Erythromycin)",
    "简写": "E",
    "MIC_S": "IE",
    "MIC_R": "IE"
   },
   {
    "药物": "左氧氟沙星 (Levofloxacin)",
    "简写": "LVX",
    "MIC_S": "IE",
    "MIC_R": "IE"
   }
  ]
 },
 {
  "菌组名": "单核细胞增生李斯特菌 (Listeria monocytogenes)",
  "来源": "EUCAST v16.1（2026-06-24）",
  "菌种": [
   "listeria-monocytogenes"
  ],
  "药物": [
   {
    "药物": "青霉素 (Penicillin)",
    "简写": "P",
    "MIC_S": "≤1",
    "MIC_R": ">1"
   },
   {
    "药物": "复方新诺明 (Trimethoprim-Sulfamethoxazole)",
    "简写": "SXT",
    "MIC_S": "≤0.06",
    "MIC_R": ">0.06"
   },
   {
    "药物": "美罗培南 (Meropenem)",
    "简写": "MEM",
    "MIC_S": "≤0.25",
    "MIC_R": ">0.25"
   }
  ]
 },
 {
  "菌组名": "卡他莫拉菌 (Moraxella catarrhalis)",
  "来源": "EUCAST v16.1（2026-06-24）",
  "菌种": [
   "moraxella-catarrhalis"
  ],
  "药物": [
   {
    "药物": "阿莫西林/克拉维酸 (Amoxicillin-Clavulanate)",
    "简写": "AMC",
    "MIC_S": "≤1",
    "MIC_R": ">1"
   },
   {
    "药物": "头孢曲松 (Ceftriaxone)",
    "简写": "CRO",
    "MIC_S": "≤1",
    "MIC_R": ">2"
   },
   {
    "药物": "复方新诺明 (Trimethoprim-Sulfamethoxazole)",
    "简写": "SXT",
    "MIC_S": "≤1",
    "MIC_R": ">1"
   },
   {
    "药物": "头孢呋辛 (Cefuroxime)",
    "简写": "CXM",
    "MIC_S": "≤4",
    "MIC_R": ">8"
   }
  ]
 },
 {
  "菌组名": "幽门螺杆菌 (Helicobacter pylori)",
  "来源": "EUCAST v16.1（2026-06-24）",
  "菌种": [
   "helicobacter-pylori"
  ],
  "药物": [
   {
    "药物": "克拉霉素 (Clarithromycin)",
    "简写": "CLR",
    "MIC_S": "≤0.25",
    "MIC_R": ">0.25"
   },
   {
    "药物": "阿莫西林 (Amoxicillin)",
    "简写": "AMX",
    "MIC_S": "≤0.125",
    "MIC_R": ">0.125"
   },
   {
    "药物": "甲硝唑 (Metronidazole)",
    "简写": "MZ",
    "MIC_S": "≤8",
    "MIC_R": ">8"
   },
   {
    "药物": "四环素 (Tetracycline)",
    "简写": "TE",
    "MIC_S": "≤1",
    "MIC_R": ">1"
   },
   {
    "药物": "左氧氟沙星 (Levofloxacin)",
    "简写": "LVX",
    "MIC_S": "≤1",
    "MIC_R": ">1"
   }
  ]
 },
 {
  "菌组名": "厌氧菌 (Anaerobic Bacteria)",
  "来源": "EUCAST v16.1（2026-06-24）",
  "菌种": [
   "clostridium-perfringens",
   "clostridium-tetani",
   "clostridium-botulinum",
   "clostridioides-difficile",
   "bacteroides-fragilis",
   "cutibacterium-acnes",
   "clostridium-septicum"
  ],
  "药物": [
   {
    "药物": "青霉素 (Penicillin)",
    "简写": "P",
    "MIC_S": "≤0.5",
    "MIC_R": ">0.5"
   },
   {
    "药物": "氨苄西林 (Ampicillin)",
    "简写": "AM",
    "MIC_S": "≤0.5",
    "MIC_R": ">0.5"
   },
   {
    "药物": "阿莫西林/克拉维酸 (Amoxicillin-Clavulanate)",
    "简写": "AMC",
    "MIC_S": "≤2",
    "MIC_R": ">2"
   },
   {
    "药物": "氨苄西林/舒巴坦 (Ampicillin-Sulbactam)",
    "简写": "SAM",
    "MIC_S": "≤2",
    "MIC_R": ">2"
   },
   {
    "药物": "哌拉西林/他唑巴坦 (Piperacillin-Tazobactam)",
    "简写": "TZP",
    "MIC_S": "≤2",
    "MIC_R": ">2"
   },
   {
    "药物": "厄他培南 (Ertapenem)",
    "简写": "ETP",
    "MIC_S": "≤2",
    "MIC_R": ">2",
    "括注": true
   },
   {
    "药物": "亚胺培南 (Imipenem)",
    "简写": "IPM",
    "MIC_S": "≤1",
    "MIC_R": ">1"
   },
   {
    "药物": "美罗培南 (Meropenem)",
    "简写": "MEM",
    "MIC_S": "≤1",
    "MIC_R": ">1"
   },
   {
    "药物": "克林霉素 (Clindamycin)",
    "简写": "CC",
    "MIC_S": "≤4",
    "MIC_R": ">4",
    "括注": true
   },
   {
    "药物": "甲硝唑 (Metronidazole)",
    "简写": "MZ",
    "MIC_S": "≤4",
    "MIC_R": ">4"
   }
  ]
 },
 {
  "菌组名": "芽孢杆菌属(非炭疽) (Bacillus spp., not B. anthracis)",
  "来源": "EUCAST v16.1（2026-06-24）",
  "菌种": [
   "bacillus-cereus"
  ],
  "药物": [
   {
    "药物": "亚胺培南 (Imipenem)",
    "简写": "IPM",
    "MIC_S": "≤0.5",
    "MIC_R": ">0.5"
   },
   {
    "药物": "美罗培南 (Meropenem)",
    "简写": "MEM",
    "MIC_S": "≤0.25",
    "MIC_R": ">0.25"
   },
   {
    "药物": "万古霉素 (Vancomycin)",
    "简写": "VA",
    "MIC_S": "≤2",
    "MIC_R": ">2"
   },
   {
    "药物": "红霉素 (Erythromycin)",
    "简写": "E",
    "MIC_S": "≤0.5",
    "MIC_R": ">0.5"
   },
   {
    "药物": "环丙沙星 (Ciprofloxacin)",
    "简写": "CIP",
    "MIC_S": "≤0.001",
    "MIC_R": ">0.5"
   },
   {
    "药物": "左氧氟沙星 (Levofloxacin)",
    "简写": "LVX",
    "MIC_S": "≤0.001",
    "MIC_R": ">1"
   },
   {
    "药物": "克林霉素 (Clindamycin)",
    "简写": "CC",
    "MIC_S": "≤1",
    "MIC_R": ">1"
   }
  ]
 },
 {
  "菌组名": "棒状杆菌属 (Corynebacterium spp.，含白喉棒状杆菌)",
  "来源": "EUCAST v16.1（2026-06-24）",
  "菌种": [
   "corynebacterium-diphtheriae",
   "corynebacterium-striatum"
  ],
  "药物": [
   {
    "药物": "青霉素 (Penicillin)",
    "简写": "P",
    "MIC_S": "≤0.001",
    "MIC_R": ">1"
   },
   {
    "药物": "头孢噻肟 (Cefotaxime)",
    "简写": "CTX",
    "MIC_S": "≤0.001",
    "MIC_R": ">2"
   },
   {
    "药物": "美罗培南 (Meropenem)",
    "简写": "MEM",
    "MIC_S": "≤0.25",
    "MIC_R": ">0.25"
   },
   {
    "药物": "万古霉素 (Vancomycin)",
    "简写": "VA",
    "MIC_S": "≤2",
    "MIC_R": ">2"
   },
   {
    "药物": "庆大霉素 (Gentamicin)",
    "简写": "GM",
    "MIC_S": "IE",
    "MIC_R": "IE"
   },
   {
    "药物": "红霉素 (Erythromycin)",
    "简写": "E",
    "MIC_S": "≤0.06",
    "MIC_R": ">0.06"
   },
   {
    "药物": "环丙沙星 (Ciprofloxacin)",
    "简写": "CIP",
    "MIC_S": "≤0.001",
    "MIC_R": ">1"
   },
   {
    "药物": "多西环素 (Doxycycline)",
    "简写": "DOX",
    "MIC_S": "≤0.5",
    "MIC_R": ">0.5"
   },
   {
    "药物": "四环素 (Tetracycline)",
    "简写": "TE",
    "MIC_S": "≤2",
    "MIC_R": ">2"
   },
   {
    "药物": "克林霉素 (Clindamycin)",
    "简写": "CC",
    "MIC_S": "≤0.5",
    "MIC_R": ">0.5"
   },
   {
    "药物": "复方新诺明 (Trimethoprim-Sulfamethoxazole)",
    "简写": "SXT",
    "MIC_S": "≤0.5",
    "MIC_R": ">0.5"
   },
   {
    "药物": "利福平 (Rifampin)",
    "简写": "RIF",
    "MIC_S": "≤0.06",
    "MIC_R": ">0.06"
   },
   {
    "药物": "利奈唑胺 (Linezolid)",
    "简写": "LZD",
    "MIC_S": "≤2",
    "MIC_R": ">2"
   }
  ]
 },
 {
  "菌组名": "炭疽芽孢杆菌 (Bacillus anthracis)",
  "来源": "EUCAST v16.1（2026-06-24）",
  "菌种": [
   "bacillus-anthracis"
  ],
  "药物": [
   {
    "药物": "青霉素 (Penicillin)",
    "简写": "P",
    "MIC_S": "≤0.001",
    "MIC_R": ">0.5"
   },
   {
    "药物": "环丙沙星 (Ciprofloxacin)",
    "简写": "CIP",
    "MIC_S": "≤0.001",
    "MIC_R": ">0.25"
   },
   {
    "药物": "左氧氟沙星 (Levofloxacin)",
    "简写": "LVX",
    "MIC_S": "≤0.001",
    "MIC_R": ">0.5"
   },
   {
    "药物": "多西环素 (Doxycycline)",
    "简写": "DOX",
    "MIC_S": "≤0.06",
    "MIC_R": ">0.06"
   },
   {
    "药物": "四环素 (Tetracycline)",
    "简写": "TE",
    "MIC_S": "≤0.125",
    "MIC_R": ">0.125"
   }
  ]
 },
 {
  "菌组名": "布鲁菌属 (Brucella spp.)",
  "来源": "EUCAST v16.1（2026-06-24）",
  "菌种": [
   "brucella-melitensis"
  ],
  "药物": [
   {
    "药物": "庆大霉素 (Gentamicin)",
    "简写": "GM",
    "MIC_S": "≤0.5",
    "MIC_R": ">0.5",
    "括注": true
   },
   {
    "药物": "链霉素 (Streptomycin)",
    "简写": "STR",
    "MIC_S": "≤1",
    "MIC_R": ">1",
    "括注": true
   },
   {
    "药物": "多西环素 (Doxycycline)",
    "简写": "DOX",
    "MIC_S": "≤0.25",
    "MIC_R": ">0.25"
   },
   {
    "药物": "四环素 (Tetracycline)",
    "简写": "TE",
    "MIC_S": "≤0.5",
    "MIC_R": ">0.5"
   },
   {
    "药物": "复方新诺明 (Trimethoprim-Sulfamethoxazole)",
    "简写": "SXT",
    "MIC_S": "≤0.125",
    "MIC_R": ">0.125"
   }
  ]
 }
];
