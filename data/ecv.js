// 流行病学界值（ECV / ECOFF）——区分野生型(WT)/非野生型(NWT)，非临床折点。
// 真菌 ECV 逐值程序化转录自 CLSI M57S 4th ed (2022) Tables 1–3（无 CLSI 折点的药物组合）。
window.DB = window.DB || {};
window.DB.ecv = [
  {
    组名: '白色念珠菌 · 抗真菌 ECV',
    来源: 'CLSI M57S 4th ed (2022) · Table 1（酵母·无折点）',
    注: '以下药物无 CLSI 临床折点，用 ECV(流行病学界值/ECOFF) 区分野生型(WT ≤ECV)与非野生型(NWT >ECV，提示获得性耐药)；ECV 不预测疗效、不等同 S/I/R。',
    菌种: ['candida-albicans'],
    药物: [
      { 药物: '两性霉素B (Amphotericin B)', 简写: 'AMB', ECV: '2', WT: '≤2', NWT: '>2', 备注: '' },
      { 药物: '泊沙康唑 (Posaconazole)', 简写: 'POS', ECV: '0.06', WT: '≤0.06', NWT: '>0.06', 备注: '' }
    ]
  },
  {
    组名: '光滑念珠菌 · 抗真菌 ECV',
    来源: 'CLSI M57S 4th ed (2022) · Table 1（酵母·无折点）',
    注: '以下药物无 CLSI 临床折点，用 ECV(流行病学界值/ECOFF) 区分野生型(WT ≤ECV)与非野生型(NWT >ECV，提示获得性耐药)；ECV 不预测疗效、不等同 S/I/R。',
    菌种: ['candida-glabrata'],
    药物: [
      { 药物: '两性霉素B (Amphotericin B)', 简写: 'AMB', ECV: '2', WT: '≤2', NWT: '>2', 备注: '' },
      { 药物: '伊曲康唑 (Itraconazole)', 简写: 'ITC', ECV: '4', WT: '≤4', NWT: '>4', 备注: '' },
      { 药物: '泊沙康唑 (Posaconazole)', 简写: 'POS', ECV: '1', WT: '≤1', NWT: '>1', 备注: '' },
      { 药物: '伏立康唑 (Voriconazole)', 简写: 'VRC', ECV: '0.25', WT: '≤0.25', NWT: '>0.25', 备注: '' }
    ]
  },
  {
    组名: '近平滑念珠菌 · 抗真菌 ECV',
    来源: 'CLSI M57S 4th ed (2022) · Table 1（酵母·无折点）',
    注: '以下药物无 CLSI 临床折点，用 ECV(流行病学界值/ECOFF) 区分野生型(WT ≤ECV)与非野生型(NWT >ECV，提示获得性耐药)；ECV 不预测疗效、不等同 S/I/R。',
    菌种: ['candida-parapsilosis'],
    药物: [
      { 药物: '两性霉素B (Amphotericin B)', 简写: 'AMB', ECV: '1', WT: '≤1', NWT: '>1', 备注: '' },
      { 药物: '伊曲康唑 (Itraconazole)', 简写: 'ITC', ECV: '0.5', WT: '≤0.5', NWT: '>0.5', 备注: '' },
      { 药物: '泊沙康唑 (Posaconazole)', 简写: 'POS', ECV: '0.25', WT: '≤0.25', NWT: '>0.25', 备注: '' }
    ]
  },
  {
    组名: '热带念珠菌 · 抗真菌 ECV',
    来源: 'CLSI M57S 4th ed (2022) · Table 1（酵母·无折点）',
    注: '以下药物无 CLSI 临床折点，用 ECV(流行病学界值/ECOFF) 区分野生型(WT ≤ECV)与非野生型(NWT >ECV，提示获得性耐药)；ECV 不预测疗效、不等同 S/I/R。',
    菌种: ['candida-tropicalis'],
    药物: [
      { 药物: '两性霉素B (Amphotericin B)', 简写: 'AMB', ECV: '2', WT: '≤2', NWT: '>2', 备注: '' },
      { 药物: '伊曲康唑 (Itraconazole)', 简写: 'ITC', ECV: '0.5', WT: '≤0.5', NWT: '>0.5', 备注: '' },
      { 药物: '泊沙康唑 (Posaconazole)', 简写: 'POS', ECV: '0.12', WT: '≤0.12', NWT: '>0.12', 备注: '' }
    ]
  },
  {
    组名: '克柔念珠菌 · 抗真菌 ECV',
    来源: 'CLSI M57S 4th ed (2022) · Table 1（酵母·无折点）',
    注: '以下药物无 CLSI 临床折点，用 ECV(流行病学界值/ECOFF) 区分野生型(WT ≤ECV)与非野生型(NWT >ECV，提示获得性耐药)；ECV 不预测疗效、不等同 S/I/R。',
    菌种: ['candida-krusei'],
    药物: [
      { 药物: '两性霉素B (Amphotericin B)', 简写: 'AMB', ECV: '2', WT: '≤2', NWT: '>2', 备注: '' },
      { 药物: '伊曲康唑 (Itraconazole)', 简写: 'ITC', ECV: '1', WT: '≤1', NWT: '>1', 备注: '' },
      { 药物: '泊沙康唑 (Posaconazole)', 简写: 'POS', ECV: '0.5', WT: '≤0.5', NWT: '>0.5', 备注: '' }
    ]
  },
  {
    组名: '耳念珠菌 · 抗真菌 ECV',
    来源: 'CLSI M57S 4th ed (2022) · Table 1（酵母·无折点）',
    注: '以下药物无 CLSI 临床折点，用 ECV(流行病学界值/ECOFF) 区分野生型(WT ≤ECV)与非野生型(NWT >ECV，提示获得性耐药)；ECV 不预测疗效、不等同 S/I/R。',
    菌种: ['candida-auris'],
    药物: [
      { 药物: '阿尼芬净 (Anidulafungin)', 简写: 'AND', ECV: '1', WT: '≤1', NWT: '>1', 备注: '' },
      { 药物: '卡泊芬净 (Caspofungin)', 简写: 'CAS', ECV: '0.5', WT: '≤0.5', NWT: '>0.5', 备注: '' },
      { 药物: '米卡芬净 (Micafungin)', 简写: 'MCF', ECV: '0.5', WT: '≤0.5', NWT: '>0.5', 备注: '' }
    ]
  },
  {
    组名: '葡萄牙念珠菌 · 抗真菌 ECV',
    来源: 'CLSI M57S 4th ed (2022) · Table 1（酵母·无折点）',
    注: '以下药物无 CLSI 临床折点，用 ECV(流行病学界值/ECOFF) 区分野生型(WT ≤ECV)与非野生型(NWT >ECV，提示获得性耐药)；ECV 不预测疗效、不等同 S/I/R。',
    菌种: ['candida-lusitaniae'],
    药物: [
      { 药物: '两性霉素B (Amphotericin B)', 简写: 'AMB', ECV: '2', WT: '≤2', NWT: '>2', 备注: '' },
      { 药物: '氟康唑 (Fluconazole)', 简写: 'FLU', ECV: '1', WT: '≤1', NWT: '>1', 备注: '' },
      { 药物: '伊曲康唑 (Itraconazole)', 简写: 'ITC', ECV: '1', WT: '≤1', NWT: '>1', 备注: '' },
      { 药物: '泊沙康唑 (Posaconazole)', 简写: 'POS', ECV: '0.06', WT: '≤0.06', NWT: '>0.06', 备注: '' },
      { 药物: '阿尼芬净 (Anidulafungin)', 简写: 'AND', ECV: '1', WT: '≤1', NWT: '>1', 备注: '' },
      { 药物: '卡泊芬净 (Caspofungin)', 简写: 'CAS', ECV: '1', WT: '≤1', NWT: '>1', 备注: '' },
      { 药物: '米卡芬净 (Micafungin)', 简写: 'MCF', ECV: '0.5', WT: '≤0.5', NWT: '>0.5', 备注: '' }
    ]
  },
  {
    组名: '希木龙念珠菌 · 抗真菌 ECV',
    来源: 'CLSI M57S 4th ed (2022) · Table 1（酵母·无折点）',
    注: '以下药物无 CLSI 临床折点，用 ECV(流行病学界值/ECOFF) 区分野生型(WT ≤ECV)与非野生型(NWT >ECV，提示获得性耐药)；ECV 不预测疗效、不等同 S/I/R。',
    菌种: ['candida-haemulonii'],
    药物: [
      { 药物: '氟康唑 (Fluconazole)', 简写: 'FLU', ECV: '128', WT: '≤128', NWT: '>128', 备注: 'ECV 极高，提示可能固有耐药或敏感性有限；MIC 低于 ECV 不代表敏感' },
      { 药物: '泊沙康唑 (Posaconazole)', 简写: 'POS', ECV: '1', WT: '≤1', NWT: '>1', 备注: '' },
      { 药物: '伏立康唑 (Voriconazole)', 简写: 'VRC', ECV: '2', WT: '≤2', NWT: '>2', 备注: '' },
      { 药物: '阿尼芬净 (Anidulafungin)', 简写: 'AND', ECV: '0.5', WT: '≤0.5', NWT: '>0.5', 备注: '' }
    ]
  },
  {
    组名: '皱褶念珠菌 · 抗真菌 ECV',
    来源: 'CLSI M57S 4th ed (2022) · Table 1（酵母·无折点）',
    注: '以下药物无 CLSI 临床折点，用 ECV(流行病学界值/ECOFF) 区分野生型(WT ≤ECV)与非野生型(NWT >ECV，提示获得性耐药)；ECV 不预测疗效、不等同 S/I/R。',
    菌种: ['candida-rugosa'],
    药物: [
      { 药物: '氟康唑 (Fluconazole)', 简写: 'FLU', ECV: '8', WT: '≤8', NWT: '>8', 备注: '' }
    ]
  },
  {
    组名: '新型隐球菌 · 抗真菌 ECV',
    来源: 'CLSI M57S 4th ed (2022) · Table 2（担子菌酵母·无折点）',
    注: '以下药物无 CLSI 临床折点，用 ECV(流行病学界值/ECOFF) 区分野生型(WT ≤ECV)与非野生型(NWT >ECV，提示获得性耐药)；ECV 不预测疗效、不等同 S/I/R。',
    菌种: ['cryptococcus-neoformans'],
    药物: [
      { 药物: '两性霉素B (Amphotericin B)', 简写: 'AMB', ECV: '0.5', WT: '≤0.5', NWT: '>0.5', 备注: '' },
      { 药物: '氟胞嘧啶 (Flucytosine)', 简写: '5FC', ECV: '8', WT: '≤8', NWT: '>8', 备注: '' },
      { 药物: '氟康唑 (Fluconazole)', 简写: 'FLU', ECV: '8', WT: '≤8', NWT: '>8', 备注: '' },
      { 药物: '伊曲康唑 (Itraconazole)', 简写: 'ITC', ECV: '0.25', WT: '≤0.25', NWT: '>0.25', 备注: '' },
      { 药物: '泊沙康唑 (Posaconazole)', 简写: 'POS', ECV: '0.25', WT: '≤0.25', NWT: '>0.25', 备注: '' },
      { 药物: '伏立康唑 (Voriconazole)', 简写: 'VRC', ECV: '0.25', WT: '≤0.25', NWT: '>0.25', 备注: '' }
    ]
  },
  {
    组名: '阿萨希毛孢子菌 · 抗真菌 ECV',
    来源: 'CLSI M57S 4th ed (2022) · Table 2（担子菌酵母·无折点）',
    注: '以下药物无 CLSI 临床折点，用 ECV(流行病学界值/ECOFF) 区分野生型(WT ≤ECV)与非野生型(NWT >ECV，提示获得性耐药)；ECV 不预测疗效、不等同 S/I/R。',
    菌种: ['trichosporon-asahii'],
    药物: [
      { 药物: '两性霉素B (Amphotericin B)', 简写: 'AMB', ECV: '1', WT: '≤1', NWT: '>1', 备注: '' },
      { 药物: '氟康唑 (Fluconazole)', 简写: 'FLU', ECV: '8', WT: '≤8', NWT: '>8', 备注: '' },
      { 药物: '伊曲康唑 (Itraconazole)', 简写: 'ITC', ECV: '1', WT: '≤1', NWT: '>1', 备注: '' },
      { 药物: '泊沙康唑 (Posaconazole)', 简写: 'POS', ECV: '1', WT: '≤1', NWT: '>1', 备注: '' }
    ]
  },
  {
    组名: '烟曲霉 · 抗真菌 ECV',
    来源: 'CLSI M57S 4th ed (2022) · Table 3（曲霉·无折点）',
    注: '以下药物无 CLSI 临床折点，用 ECV(流行病学界值/ECOFF) 区分野生型(WT ≤ECV)与非野生型(NWT >ECV，提示获得性耐药)；ECV 不预测疗效、不等同 S/I/R。',
    菌种: ['aspergillus-fumigatus'],
    药物: [
      { 药物: '两性霉素B (Amphotericin B)', 简写: 'AMB', ECV: '2', WT: '≤2', NWT: '>2', 备注: '' },
      { 药物: '伊曲康唑 (Itraconazole)', 简写: 'ITC', ECV: '1', WT: '≤1', NWT: '>1', 备注: '' },
      { 药物: '艾沙康唑 (Isavuconazole)', 简写: 'ISA', ECV: '1', WT: '≤1', NWT: '>1', 备注: '' },
      { 药物: '卡泊芬净 (Caspofungin)', 简写: 'CAS', ECV: '0.5', WT: '≤0.5', NWT: '>0.5', 备注: '' }
    ]
  },
  {
    组名: '黄曲霉 · 抗真菌 ECV',
    来源: 'CLSI M57S 4th ed (2022) · Table 3（曲霉·无折点）',
    注: '以下药物无 CLSI 临床折点，用 ECV(流行病学界值/ECOFF) 区分野生型(WT ≤ECV)与非野生型(NWT >ECV，提示获得性耐药)；ECV 不预测疗效、不等同 S/I/R。',
    菌种: ['aspergillus-flavus'],
    药物: [
      { 药物: '两性霉素B (Amphotericin B)', 简写: 'AMB', ECV: '4', WT: '≤4', NWT: '>4', 备注: '' },
      { 药物: '伊曲康唑 (Itraconazole)', 简写: 'ITC', ECV: '1', WT: '≤1', NWT: '>1', 备注: '' },
      { 药物: '泊沙康唑 (Posaconazole)', 简写: 'POS', ECV: '0.5', WT: '≤0.5', NWT: '>0.5', 备注: '' },
      { 药物: '伏立康唑 (Voriconazole)', 简写: 'VRC', ECV: '2', WT: '≤2', NWT: '>2', 备注: '' },
      { 药物: '艾沙康唑 (Isavuconazole)', 简写: 'ISA', ECV: '1', WT: '≤1', NWT: '>1', 备注: '' },
      { 药物: '卡泊芬净 (Caspofungin)', 简写: 'CAS', ECV: '0.5', WT: '≤0.5', NWT: '>0.5', 备注: '' }
    ]
  },
  {
    组名: '黑曲霉 · 抗真菌 ECV',
    来源: 'CLSI M57S 4th ed (2022) · Table 3（曲霉·无折点）',
    注: '以下药物无 CLSI 临床折点，用 ECV(流行病学界值/ECOFF) 区分野生型(WT ≤ECV)与非野生型(NWT >ECV，提示获得性耐药)；ECV 不预测疗效、不等同 S/I/R。',
    菌种: ['aspergillus-niger'],
    药物: [
      { 药物: '两性霉素B (Amphotericin B)', 简写: 'AMB', ECV: '2', WT: '≤2', NWT: '>2', 备注: '' },
      { 药物: '伊曲康唑 (Itraconazole)', 简写: 'ITC', ECV: '4', WT: '≤4', NWT: '>4', 备注: '' },
      { 药物: '泊沙康唑 (Posaconazole)', 简写: 'POS', ECV: '2', WT: '≤2', NWT: '>2', 备注: '' },
      { 药物: '伏立康唑 (Voriconazole)', 简写: 'VRC', ECV: '2', WT: '≤2', NWT: '>2', 备注: '' },
      { 药物: '艾沙康唑 (Isavuconazole)', 简写: 'ISA', ECV: '4', WT: '≤4', NWT: '>4', 备注: '' },
      { 药物: '卡泊芬净 (Caspofungin)', 简写: 'CAS', ECV: '0.25', WT: '≤0.25', NWT: '>0.25', 备注: '' }
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
