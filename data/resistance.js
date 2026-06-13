window.DB = window.DB || {};
// 耐药因素：按机制分类。关联指向其影响的抗微生物药与常见携带菌（反向链接会自动出现在对应药/菌页）。
// 英文：用于生成 PubMed 综述检索链接。
window.DB.resistance = [

  // ===== 产生灭活酶 · β-内酰胺酶 =====
  {
    id: 'penicillinase',
    名称: '青霉素酶',
    英文: 'staphylococcal penicillinase',
    类别: 'β-内酰胺酶',
    小节: [
      { 标题: '原理', 正文: '葡萄球菌等产生的青霉素酶（一种丝氨酸β-内酰胺酶），水解青霉素的β-内酰胺环使其失活。' },
      { 标题: '应对', 正文: '改用耐酶青霉素（如苯唑西林，其侧链位阻使之不被水解）或加用β-内酰胺酶抑制剂。' }
    ],
    关联: ['penicillin-g', 'oxacillin', 'staph-aureus']
  },
  {
    id: 'esbl',
    名称: '超广谱β-内酰胺酶（ESBL）',
    英文: 'extended-spectrum beta-lactamase',
    类别: 'β-内酰胺酶',
    小节: [
      { 标题: '原理', 正文: '多由质粒介导（TEM、SHV、CTX-M 型），水解青霉素类、头孢菌素类（含三代如头孢曲松）及单环类；可被克拉维酸、他唑巴坦、阿维巴坦抑制。' },
      { 标题: '临床意义 / 应对', 正文: '常见于大肠埃希菌、肺炎克雷伯菌。重症首选碳青霉烯；头孢他啶/阿维巴坦、哌拉西林/他唑巴坦可选。' }
    ],
    关联: ['ceftriaxone', 'ceftazidime', 'ceftazidime-avibactam', 'meropenem', 'e-coli', 'klebsiella-pneumoniae']
  },
  {
    id: 'ampc',
    名称: 'AmpC 头孢菌素酶',
    英文: 'AmpC beta-lactamase',
    类别: 'β-内酰胺酶',
    小节: [
      { 标题: '原理', 正文: 'C 类丝氨酸头孢菌素酶，染色体或质粒介导，不被克拉维酸抑制；肠杆菌（阴沟肠杆菌、产气克雷伯）可诱导高产。' },
      { 标题: '临床意义 / 应对', 正文: '可致三代头孢"治疗中耐药"；选头孢吡肟（对 AmpC 较稳定）或碳青霉烯。' }
    ],
    关联: ['ceftriaxone', 'cefepime', 'meropenem', 'enterobacter-cloacae', 'klebsiella-aerogenes']
  },
  {
    id: 'kpc',
    名称: 'KPC 型碳青霉烯酶',
    英文: 'KPC carbapenemase',
    类别: 'β-内酰胺酶',
    小节: [
      { 标题: '原理', 正文: 'A 类丝氨酸碳青霉烯酶，水解几乎所有β-内酰胺（含碳青霉烯）；可被阿维巴坦抑制。' },
      { 标题: '临床意义 / 应对', 正文: '碳青霉烯耐药肠杆菌(CRE)主要机制之一（多见于肺炎克雷伯菌）；头孢他啶/阿维巴坦有效。' }
    ],
    关联: ['meropenem', 'imipenem', 'ceftazidime-avibactam', 'klebsiella-pneumoniae']
  },
  {
    id: 'ndm',
    名称: '金属β-内酰胺酶（NDM/MBL）',
    英文: 'NDM metallo-beta-lactamase',
    类别: 'β-内酰胺酶',
    小节: [
      { 标题: '原理', 正文: 'B 类锌离子依赖的金属酶，水解碳青霉烯，不被阿维巴坦/克拉维酸抑制；但氨曲南不被其水解。' },
      { 标题: '临床意义 / 应对', 正文: '产 NDM 菌治疗困难；氨曲南/阿维巴坦联合可覆盖。' }
    ],
    关联: ['meropenem', 'imipenem', 'aztreonam-avibactam', 'klebsiella-pneumoniae', 'e-coli']
  },
  {
    id: 'oxa48',
    名称: 'OXA-48 型碳青霉烯酶',
    英文: 'OXA-48 carbapenemase',
    类别: 'β-内酰胺酶',
    小节: [
      { 标题: '原理', 正文: 'D 类β-内酰胺酶，弱水解碳青霉烯、强水解青霉素；不被克拉维酸抑制，可被阿维巴坦抑制。' },
      { 标题: '临床意义 / 应对', 正文: '头孢他啶/阿维巴坦可选；常与 ESBL 并存使表型复杂。' }
    ],
    关联: ['meropenem', 'ceftazidime-avibactam', 'klebsiella-pneumoniae']
  },

  // ===== 产生灭活酶 · 氨基糖苷修饰酶 =====
  {
    id: 'ame',
    名称: '氨基糖苷修饰酶',
    英文: 'aminoglycoside-modifying enzyme',
    类别: '氨基糖苷修饰酶',
    小节: [
      { 标题: '原理', 正文: '乙酰转移酶(AAC)、磷酸转移酶(APH)、核苷转移酶(ANT)对氨基糖苷分子进行修饰，削弱其与 30S 核糖体的结合。' },
      { 标题: '临床意义 / 应对', 正文: '最常见的氨基糖苷耐药机制；阿米卡星对多数修饰酶相对稳定。' }
    ],
    关联: ['gentamicin', 'tobramycin', 'amikacin']
  },

  // ===== 靶位改变 · PBP改变 =====
  {
    id: 'mrsa-meca',
    名称: 'MRSA（mecA / PBP2a）',
    英文: 'MRSA mecA PBP2a',
    类别: 'PBP改变',
    小节: [
      { 标题: '原理', 正文: 'mecA 基因编码低亲和力青霉素结合蛋白 PBP2a，β-内酰胺类几乎无法与之结合，从而对甲氧西林及几乎所有β-内酰胺耐药（MRSA）。' },
      { 标题: '临床意义 / 应对', 正文: '万古霉素、利奈唑胺、达托霉素为主；头孢洛林是少数可结合 PBP2a 的β-内酰胺；药敏常用头孢西丁纸片筛查。' }
    ],
    关联: ['oxacillin', 'ceftaroline', 'vancomycin', 'linezolid', 'daptomycin', 'staph-aureus']
  },
  {
    id: 'prsp',
    名称: '青霉素耐药肺炎链球菌（PRSP）',
    英文: 'penicillin-resistant Streptococcus pneumoniae',
    类别: 'PBP改变',
    小节: [
      { 标题: '原理', 正文: 'PBP 基因发生镶嵌式突变，降低对青霉素的亲和力（非产酶机制）。' },
      { 标题: '临床意义 / 应对', 正文: '据药敏与感染部位选药；脑膜炎需高剂量头孢曲松±万古霉素。' }
    ],
    关联: ['penicillin-g', 'ceftriaxone', 'strep-pneumoniae']
  },

  // ===== 靶位改变 · 核糖体甲基化 =====
  {
    id: 'erm-mlsb',
    名称: 'erm 核糖体甲基化（MLSB）',
    英文: 'erm MLSB macrolide resistance',
    类别: '核糖体甲基化',
    小节: [
      { 标题: '原理', 正文: 'erm 基因编码甲基化酶修饰 23S rRNA 上的腺嘌呤，降低大环内酯-林可酰胺-链阳菌素B(MLSB)的结合，致交叉耐药。' },
      { 标题: '临床意义 / 应对', 正文: '可为诱导型——D 试验阳性时即使体外克林霉素"敏感"也不宜使用。' }
    ],
    关联: ['erythromycin', 'clindamycin', 'staph-aureus']
  },
  {
    id: '16s-methylase',
    名称: '16S rRNA 甲基化酶',
    英文: '16S rRNA methyltransferase aminoglycoside resistance',
    类别: '核糖体甲基化',
    小节: [
      { 标题: '原理', 正文: 'armA、rmt 等甲基化酶修饰 16S rRNA，使所有氨基糖苷类均不能有效结合 30S。' },
      { 标题: '临床意义 / 应对', 正文: '致氨基糖苷高水平耐药（含阿米卡星），常与产碳青霉烯酶菌共存。' }
    ],
    关联: ['gentamicin', 'amikacin', 'tobramycin']
  },

  // ===== 靶位改变 · 糖肽靶位改变 =====
  {
    id: 'vana-vre',
    名称: 'VanA / 耐万古霉素肠球菌（VRE）',
    英文: 'vanA vancomycin-resistant enterococci',
    类别: '糖肽靶位改变',
    小节: [
      { 标题: '原理', 正文: 'vanA 操纵子将肽聚糖前体末端的 D-丙氨酰-D-丙氨酸(D-Ala-D-Ala) 改为 D-丙氨酰-D-乳酸(D-Ala-D-Lac)，万古霉素结合力骤降约千倍。' },
      { 标题: '临床意义 / 应对', 正文: '致耐万古霉素肠球菌(VRE，多为屎肠球菌)；选利奈唑胺、达托霉素。' }
    ],
    关联: ['vancomycin', 'teicoplanin', 'linezolid', 'daptomycin', 'enterococcus-faecium']
  },

  // ===== 主动外排 · 外排泵 =====
  {
    id: 'efflux-pump',
    名称: '主动外排泵',
    英文: 'antibiotic efflux pump resistance',
    类别: '外排泵',
    小节: [
      { 标题: '原理', 正文: '膜转运蛋白（如 RND 家族 AcrAB-TolC、铜绿假单胞菌 MexAB-OprM）耗能将药物主动泵出胞外，降低胞内有效浓度。' },
      { 标题: '临床意义 / 应对', 正文: '底物谱广（四环素、喹诺酮、β-内酰胺等），常是多重耐药的重要因素。' }
    ],
    关联: ['ciprofloxacin', 'doxycycline', 'pseudomonas-aeruginosa']
  },

  // ===== 膜通透性下降 · 孔蛋白缺失 =====
  {
    id: 'porin-loss',
    名称: '孔蛋白缺失（外膜通透性下降）',
    英文: 'porin loss antibiotic resistance',
    类别: '孔蛋白缺失',
    小节: [
      { 标题: '原理', 正文: '外膜孔蛋白（铜绿假单胞菌 OprD、肠杆菌 OmpK35/36）表达下降或丢失，减少药物进入周质间隙。' },
      { 标题: '临床意义 / 应对', 正文: '铜绿 OprD 缺失致碳青霉烯耐药；与产酶（AmpC/ESBL）协同可致碳青霉烯耐药肠杆菌。' }
    ],
    关联: ['imipenem', 'meropenem', 'pseudomonas-aeruginosa', 'klebsiella-pneumoniae']
  },

  // ===== 旁路与其他 · 旁路代谢 =====
  {
    id: 'bypass-folate',
    名称: '旁路 / 靶点改变（叶酸途径）',
    英文: 'sulfonamide trimethoprim resistance dfr sul gene',
    类别: '旁路代谢',
    小节: [
      { 标题: '原理', 正文: '获得不敏感的替代酶或过量表达靶酶以绕过抑制：如磺胺耐药的 sul 基因（耐药型二氢蝶酸合酶）、甲氧苄啶耐药的 dfr 基因（耐药型二氢叶酸还原酶）。' },
      { 标题: '临床意义 / 应对', 正文: '可致复方磺胺甲噁唑耐药；据药敏换药。' }
    ],
    关联: ['sulfamethoxazole', 'trimethoprim']
  },

  // ===== 旁路与其他 · 生物膜 =====
  {
    id: 'biofilm',
    名称: '生物膜',
    英文: 'bacterial biofilm antibiotic resistance',
    类别: '生物膜',
    小节: [
      { 标题: '原理', 正文: '细菌在导管、人工瓣膜/关节等表面形成由胞外多糖基质包裹的群落，限制药物渗透、内部菌代谢低下并受保护。' },
      { 标题: '临床意义 / 应对', 正文: '致慢性、顽固、易复发的器械相关感染；常需移除感染器械。' }
    ],
    关联: ['staph-epidermidis', 'pseudomonas-aeruginosa', 'vancomycin']
  }

];
