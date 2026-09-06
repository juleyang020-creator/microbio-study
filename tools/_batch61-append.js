#!/usr/bin/env node
// 批61（书95 病毒分子检测）：tests.js 新增「分子检测」类别词条 1 条——
// SARS-CoV-2 实时荧光 PCR（三通道 FAM/VIC/Cy5 双靶判读）。
// 源：实验二十一（书页168–177 / 源PDF 184–193）之「二、新型冠状病毒」。
// 甲/乙肝 PCR 与流感 RT-PCR 各为独立体系，本批只录新冠（教学代表性强、判读规则完整），
// 其余分子检测留待后续按需补。
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'data', 'tests.js');
let src = fs.readFileSync(FILE, 'utf8');

const newEntry = `
  // 批61 新增（源：95书实验二十一 二、新型冠状病毒）
  {
    id: 'sars2-rtqpcr',
    名称: '新冠病毒核酸检测（实时荧光 RT-PCR）',
    类别: '分子检测',
    小节: [
      { 标题: '原理', 正文: '实时荧光 PCR 结合荧光探针技术对 SARS-CoV-2 核酸定性检测：三荧光通道 FAM/VIC/Cy5 分别对应 N 基因、ORF1ab 基因与内标基因，双靶标平行检测降低假阴性。' },
      { 标题: '方法', 正文: '生物安全柜内取 200μl 鼻咽拭子洗脱液上核酸自动提取板提取 RNA。30μl 反应体系：2×Master Mix 15μl + SARS-CoV-2 特异性引物 2μl + 内标引物 1μl + 探针 1μl + 酶 1μl + RNA 10μl，离心混匀。扩增程序：50℃ 30 分钟（逆转录）；95℃ 15 分钟（预变性）；94℃ 15 秒 / 55℃ 45 秒 × 45 个循环；72℃ 10 分钟，4℃ 保存。' },
      { 标题: '结果判读', 正文: '质控有效：阴性质控品 FAM、VIC 无明显扩增曲线而 Cy5 有明显曲线；阳性质控品 FAM、VIC 明显扩增且 Ct ≤32。判阳性：Cy5 有扩增曲线，FAM、VIC 均有明显扩增曲线且 Ct ≤32；判阴性：Cy5 有扩增曲线，FAM、VIC 均无扩增曲线。' },
      { 标题: '注意事项', 正文: '严格按 PCR 要求规范操作防假阳/假阴（含滤芯吸头、无滑石粉手套、分区操作、移动紫外车消毒）；全流程符合生物安全要求。' }
    ],
    关联: ['sars-cov-2']
  }
`;
const closeIdx = src.lastIndexOf('];');
src = src.slice(0, closeIdx) + newEntry + src.slice(closeIdx);
fs.writeFileSync(FILE, src);
console.log('tests.js +1 new entry');
