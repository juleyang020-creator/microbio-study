// 流行病学界值（ECV / ECOFF）——区分野生型(WT)/非野生型(NWT)，非临床折点。
// 逐值转录自用户提供的 CLSI/MCM 原始资料，安全关键数值经独立复核。
window.DB = window.DB || {};
window.DB.ecv = [
  {
    组名: '曲霉·丝状真菌 (Aspergillus fumigatus)',
    来源: 'CLSI / EUCAST 共识 ECOFF（《临床微生物学手册》第 12 版 · 第 134 章）',
    注: 'CLSI 目前仅伏立康唑对烟曲霉设临床折点；其余三唑类用 ECV(流行病学界值/ECOFF) 区分野生型(WT)与非野生型(NWT)，非临床折点、不等同 S/I/R。仅适用于烟曲霉。',
    菌种: ['aspergillus-fumigatus'],
    药物: [
      { 药物: '伊曲康唑 (Itraconazole)', 简写: 'ITC', ECV: '1', WT: '≤1', NWT: '>1', 备注: '>1 提示 cyp51A 等获得性耐药' },
      { 药物: '伏立康唑 (Voriconazole)', 简写: 'VRC', ECV: '1', WT: '≤1', NWT: '>1', 备注: '另有 CLSI 临床折点 S≤0.5 / I 1 / R≥2' },
      { 药物: '泊沙康唑 (Posaconazole)', 简写: 'POS', ECV: '0.25', WT: '≤0.25', NWT: '>0.25', 备注: '' },
      { 药物: '艾沙康唑 (Isavuconazole)', 简写: 'ISA', ECV: '1', WT: '≤1', NWT: '>1', 备注: 'CLSI ECV 1（EUCAST ECOFF 2）' },
      { 药物: '雷夫康唑 (Ravuconazole)', 简写: 'RVC', ECV: '1', WT: '≤1', NWT: '>1', 备注: '' }
    ]
  },
  {
    组名: '厌氧菌 (痤疮皮肤杆菌 / 艰难拟梭菌)',
    来源: 'CLSI M100 Ed36 (2026) · Appendix F · Table F1',
    注: 'ECV 仅区分野生型(WT)/非野生型(NWT)，不作为临床折点、不报告 S/I/R；用于监测耐药出现。',
    菌种: ['cutibacterium-acnes', 'clostridioides-difficile'],
    药物: [
      { 药物: '万古霉素 (Vancomycin)', 简写: 'VAN', ECV: '2', WT: '≤2', NWT: '≥4', 备注: '适用于痤疮皮肤杆菌 C. acnes 与艰难拟梭菌 C. difficile' }
    ]
  }
];
