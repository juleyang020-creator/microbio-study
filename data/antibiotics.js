window.DB = window.DB || {};
window.DB.antibiotics = [
  {
    id: 'oxacillin',
    名称: '苯唑西林',
    拉丁名: 'Oxacillin',
    类别: 'β-内酰胺类',
    小节: [
      { 标题: '抗菌谱', 正文: '（待填）' },
      { 标题: '作用机制', 正文: '（待填）' }
    ],
    关联: ['mrsa-meca']
  },
  {
    id: 'vancomycin',
    名称: '万古霉素',
    拉丁名: 'Vancomycin',
    类别: '糖肽类',
    小节: [ { 标题: '作用机制', 正文: '（待填）' } ],
    关联: []
  },
  {
    id: 'gentamicin',
    名称: '庆大霉素',
    拉丁名: 'Gentamicin',
    类别: '氨基糖苷类',
    小节: [ { 标题: '作用机制', 正文: '（待填）' } ],
    关联: []
  }
];
