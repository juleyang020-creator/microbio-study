window.DB = window.DB || {};
// 常见药敏/鉴定质控菌株（CLSI M100/M02/M07 · 真菌 M60/M27）。ATCC 编号↔菌种↔用途经多智能体对抗校验。
// 关联指向对应真实菌种与相关试验（反向链接自动出现在其页面）。
window.DB['qc-strains'] = [
  {
    id: 'qc-ecoli-25922',
    名称: '大肠埃希菌 ATCC 25922',
    拉丁名: 'Escherichia coli ATCC 25922',
    英文: 'ATCC 25922',
    类别: '常规药敏质控',
    小节: [ { 标题: '质控用途 / 要点', 正文: '非苛养菌（肠杆菌目等）MIC 与纸片扩散法的主质控株；β-内酰胺酶阴性。用于肠杆菌目大多数抗菌药的日常质控；测试非发酵菌及抗铜绿假单胞菌药物（如碳青霉烯、氨基糖苷、多黏菌素等）应改用铜绿假单胞菌 ATCC 27853 质控。β-内酰胺/酶抑制剂复合制剂需另加 ATCC 35218（产 TEM-1）。' } ],
    关联: ['e-coli', 'kb-test', 'e-test']
  },
  {
    id: 'qc-saureus-29213',
    名称: '金黄色葡萄球菌 ATCC 29213',
    拉丁名: 'Staphylococcus aureus ATCC 29213',
    英文: 'ATCC 29213',
    类别: '常规药敏质控',
    小节: [ { 标题: '质控用途 / 要点', 正文: '革兰阳性菌 MIC 法主质控株（葡萄球菌 MIC 质控，含苯唑西林、万古霉素、达托霉素等 MIC 范围，CLSI M100 表 5A）；β-内酰胺酶（青霉素酶）试验的弱阳性质控株。注意：本株为 mecA 阴性 MSSA、对红霉素/克林霉素敏感，不能作为 mecA/MRSA 阳性对照（用 ATCC 43300），也不是 D 试验诱导型克林霉素耐药的阳性对照——D 试验阳性对照为 S. aureus ATCC BAA-977，阴性对照为 ATCC BAA-976。' } ],
    关联: ['staph-aureus', 'e-test']
  },
  {
    id: 'qc-saureus-25923',
    名称: '金黄色葡萄球菌 ATCC 25923',
    拉丁名: 'Staphylococcus aureus ATCC 25923',
    英文: 'ATCC 25923',
    类别: '常规药敏质控',
    小节: [ { 标题: '质控用途 / 要点', 正文: '纸片扩散法(KB, CLSI M02/M100)常规质控株；青霉素敏感、β-内酰胺酶阴性（为菌株固有属性，非指定阴性对照——β-内酰胺酶试验阳性对照为 S. aureus ATCC 29213）；可用于头孢西丁纸片法(FOX 30µg)质控，抑菌圈参考范围约23–29 mm。注意：MIC/肉汤稀释法质控应使用 S. aureus ATCC 29213。' } ],
    关联: ['staph-aureus', 'kb-test', 'cefoxitin-screen']
  },
  {
    id: 'qc-paeruginosa-27853',
    名称: '铜绿假单胞菌 ATCC 27853',
    拉丁名: 'Pseudomonas aeruginosa ATCC 27853',
    英文: 'ATCC 27853',
    类别: '常规药敏质控',
    小节: [ { 标题: '质控用途 / 要点', 正文: '非发酵菌/抗假单胞药 MIC 与纸片法质控(碳青霉烯、头孢他啶、氨基糖苷等)；黏菌素肉汤纸片洗脱法(CBDE)质控' } ],
    关联: ['pseudomonas-aeruginosa', 'kb-test', 'e-test', 'colistin-bmd']
  },
  {
    id: 'qc-efaecalis-29212',
    名称: '粪肠球菌 ATCC 29212',
    拉丁名: 'Enterococcus faecalis ATCC 29212',
    英文: 'ATCC 29212',
    类别: '常规药敏质控',
    小节: [ { 标题: '质控用途 / 要点', 正文: '肠球菌/革兰阳性 MIC 质控；高水平氨基糖苷、达托霉素、万古霉素质控；亦用于 M-H 琼脂胸苷含量质控(磺胺/甲氧苄啶)' } ],
    关联: ['enterococcus-faecalis', 'hlar']
  },
  {
    id: 'qc-ecoli-35218',
    名称: '大肠埃希菌 ATCC 35218',
    拉丁名: 'Escherichia coli ATCC 35218',
    英文: 'ATCC 35218',
    类别: '耐药机制/酶质控',
    小节: [ { 标题: '质控用途 / 要点', 正文: '产 TEM-1 β-内酰胺酶；专用于 β-内酰胺/β-内酰胺酶抑制剂复合物（阿莫西林-克拉维酸、氨苄西林-舒巴坦、哌拉西林-他唑巴坦、替卡西林-克拉维酸）的质控，主要监测抑制剂组分活性，通常与 ATCC 25922 联合使用' } ],
    关联: ['e-coli', 'beta-lactamase-test']
  },
  {
    id: 'qc-kpneumoniae-700603',
    名称: '肺炎克雷伯菌 ATCC 700603',
    拉丁名: 'Klebsiella pneumoniae ATCC 700603',
    英文: 'ATCC 700603',
    类别: '耐药机制/酶质控',
    小节: [ { 标题: '质控用途 / 要点', 正文: 'ESBL 阳性(SHV-18)质控株；ESBL 表型确证试验的阳性对照' } ],
    关联: ['klebsiella-pneumoniae', 'esbl-test']
  },
  {
    id: 'qc-kpneumoniae-baa1705',
    名称: '肺炎克雷伯菌 ATCC BAA-1705',
    拉丁名: 'Klebsiella pneumoniae ATCC BAA-1705',
    英文: 'ATCC BAA-1705',
    类别: '耐药机制/酶质控',
    小节: [ { 标题: '质控用途 / 要点', 正文: '产 KPC 碳青霉烯酶阳性质控；改良碳青霉烯灭活试验(mCIM)阳性对照' } ],
    关联: ['klebsiella-pneumoniae', 'mcim', 'ecim']
  },
  {
    id: 'qc-kpneumoniae-baa1706',
    名称: '肺炎克雷伯菌 ATCC BAA-1706',
    拉丁名: 'Klebsiella pneumoniae ATCC BAA-1706',
    英文: 'ATCC BAA-1706',
    类别: '耐药机制/酶质控',
    小节: [ { 标题: '质控用途 / 要点', 正文: '碳青霉烯酶阴性质控；mCIM 阴性对照' } ],
    关联: ['klebsiella-pneumoniae', 'mcim']
  },
  {
    id: 'qc-efaecalis-51299',
    名称: '粪肠球菌 ATCC 51299',
    拉丁名: 'Enterococcus faecalis ATCC 51299',
    英文: 'ATCC 51299',
    类别: '耐药机制/酶质控',
    小节: [ { 标题: '质控用途 / 要点', 正文: 'vanB 型耐万古霉素 + 高水平庆大/链霉素耐药(HLAR)阳性质控；万古霉素琼脂筛选与 HLAR 检测的阳性对照' } ],
    关联: ['enterococcus-faecalis', 'hlar']
  },
  {
    id: 'qc-hinfluenzae-49247',
    名称: '流感嗜血杆菌 ATCC 49247',
    拉丁名: 'Haemophilus influenzae ATCC 49247',
    英文: 'ATCC 49247',
    类别: '苛养菌质控',
    小节: [ { 标题: '质控用途 / 要点', 正文: '流感嗜血杆菌 AST 质控（HTM 培养基），CLSI 主要嗜血杆菌质控株；为 β-内酰胺酶阴性/氨苄西林耐药（BLNAR，PBP3 改变）参考株，氨苄西林、阿莫西林-克拉维酸 MIC 偏高。注意部分头孢菌素及口服药另用 ATCC 49766，HTM 生长/培养基质控用 ATCC 10211。' } ],
    关联: ['haemophilus-influenzae', 'kb-test']
  },
  {
    id: 'qc-hinfluenzae-49766',
    名称: '流感嗜血杆菌 ATCC 49766',
    拉丁名: 'Haemophilus influenzae ATCC 49766',
    英文: 'ATCC 49766',
    类别: '苛养菌质控',
    小节: [ { 标题: '质控用途 / 要点', 正文: '嗜血杆菌 AST 质控株（HTM 培养基），主要用于头孢菌素类的 MIC/纸片质控（如头孢呋辛、头孢泊肟、头孢克洛、头孢地尼、头孢克肟、头孢他洛林等）；氟喹诺酮类（环丙沙星、左氧氟沙星）及氨苄西林、阿莫西林-克拉维酸、碳青霉烯、四环素、复方新诺明等应使用 H. influenzae ATCC 49247 质控。' } ],
    关联: ['haemophilus-influenzae']
  },
  {
    id: 'qc-hinfluenzae-10211',
    名称: '流感嗜血杆菌 ATCC 10211',
    拉丁名: 'Haemophilus influenzae ATCC 10211',
    英文: 'ATCC 10211',
    类别: '苛养菌质控',
    小节: [ { 标题: '质控用途 / 要点', 正文: 'HTM 培养基生长质控株(检验培养基是否支持充分生长)' } ],
    关联: ['haemophilus-influenzae']
  },
  {
    id: 'qc-spneumoniae-49619',
    名称: '肺炎链球菌 ATCC 49619',
    拉丁名: 'Streptococcus pneumoniae ATCC 49619',
    英文: 'ATCC 49619',
    类别: '苛养菌质控',
    小节: [ { 标题: '质控用途 / 要点', 正文: '链球菌属(肺炎链球菌、β-溶血/草绿色链球菌)AST 质控；青霉素、头孢噻肟、大环内酯等' } ],
    关联: ['strep-pneumoniae', 'kb-test']
  },
  {
    id: 'qc-ngonorrhoeae-49226',
    名称: '淋病奈瑟菌 ATCC 49226',
    拉丁名: 'Neisseria gonorrhoeae ATCC 49226',
    英文: 'ATCC 49226',
    类别: '苛养菌质控',
    小节: [ { 标题: '质控用途 / 要点', 正文: '淋球菌 AST(GC 琼脂基础 + 1% 添加剂)质控' } ],
    关联: ['neisseria-gonorrhoeae']
  },
  {
    id: 'qc-cjejuni-33560',
    名称: '空肠弯曲菌 ATCC 33560',
    拉丁名: 'Campylobacter jejuni ATCC 33560',
    英文: 'ATCC 33560',
    类别: '苛养菌质控',
    小节: [ { 标题: '质控用途 / 要点', 正文: '弯曲菌 AST 质控' } ],
    关联: ['campylobacter-jejuni']
  },
  {
    id: 'qc-cparapsilosis-22019',
    名称: '近平滑念珠菌 ATCC 22019',
    拉丁名: 'Candida parapsilosis ATCC 22019',
    英文: 'ATCC 22019',
    类别: '抗真菌质控',
    小节: [ { 标题: '质控用途 / 要点', 正文: '抗真菌药敏质控株：CLSI M60/M27 肉汤微量稀释及 M44 纸片法质控，覆盖唑类、棘白菌素、两性霉素B及氟胞嘧啶，与克柔念珠菌 ATCC 6258 同为两株推荐酵母菌质控株之一' } ],
    关联: ['candida-parapsilosis']
  },
  {
    id: 'qc-ckrusei-6258',
    名称: '克柔念珠菌 ATCC 6258',
    拉丁名: 'Candida krusei ATCC 6258',
    英文: 'ATCC 6258',
    类别: '抗真菌质控',
    小节: [ { 标题: '质控用途 / 要点', 正文: 'CLSI M60 抗真菌药敏质控株，肉汤微量稀释 MIC 与纸片扩散法均适用；QC 范围涵盖唑类(氟康唑/伏立康唑/泊沙康唑/伊曲康唑)、棘白菌素(卡泊芬净/米卡芬净/阿尼芬净)、两性霉素B 及 5-氟胞嘧啶。本株对氟康唑为固有(天然)耐药。' } ],
    关联: ['candida-krusei']
  },
  {
    id: 'qc-calbicans-90028',
    名称: '白念珠菌 ATCC 90028',
    拉丁名: 'Candida albicans ATCC 90028',
    英文: 'ATCC 90028',
    类别: '抗真菌质控',
    小节: [ { 标题: '质控用途 / 要点', 正文: '抗真菌药 MIC 质控株(部分方法/药物)' } ],
    关联: ['candida-albicans']
  }
];
