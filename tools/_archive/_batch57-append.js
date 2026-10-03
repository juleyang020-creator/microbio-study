#!/usr/bin/env node
// 批57（书95 药敏方法补强）：往 tests.js 药敏试验方法条目追加「操作细节（95书）」小节，
// 新增「联合药敏试验（棋盘法 FIC）」词条。
// 源：《临床微生物学检验技术实验指导》第2版 实验四（书页36–46 / 源PDF 52–62）。
// 安全攸关数值（接种量/孵育参数/纸片间距/QC 判读）逐条回源转写，不抄折点表（库内另有 breakpoints 模块管折点）。
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'data', 'tests.js');
let src = fs.readFileSync(FILE, 'utf8');

const ADD = {
  'kb-test': '95书操作细节：挑取 16～24 小时培养物 4～5 个菌落制 0.5 麦氏菌悬液；无菌棉签蘸菌液、试管内壁挤去多余菌液后涂抹接种 3 次、每次旋转平板 60°，最后沿平板内缘涂抹一周。室温干燥 3～5 分钟后贴纸片——纸片中心间距 >24mm、边缘距平板内缘 >15mm，贴后不可再移动（药物已扩散）。35℃ 16～18 小时，从平板背面以游标卡尺测完全抑制区域直径（毫米整数）。质控菌株：金黄色葡萄球菌 ATCC 25923、大肠埃希菌 ATCC 25922、铜绿假单胞菌 ATCC 27853；超出 QC 范围视为失控、不发报告。影响因素：培养基质量与厚度、孵育条件、菌龄与接种量、纸片质量、测量工具精度与操作规范性。',
  'bmd': '95书操作细节：宏量肉汤稀释法——26 支试管两排每排 13 支（另设肉汤对照、测试菌与标准菌生长对照管），MH 肉汤对倍稀释药物（如 128→0.03125μg/ml）；菌液 0.5 麦氏再 1:10 稀释至 10⁷CFU/ml，取 0.1ml 由低浓度向高浓度加入各管（吸头插到液面下、避免触壁），最终接种量 5×10⁵CFU/ml；35℃ 16～20 小时。微量肉汤稀释法——96 孔 U 形板第 1～12 孔对倍稀释（50μl 体系），菌液 0.5 麦氏再 1:100 稀释至 10⁶CFU/ml、每孔接种 50μl（终浓度 5×10⁵CFU/ml）；振荡 1 分钟混匀、胶纸密封减少蒸发、湿盒中 35℃ 16～20 小时。琼脂稀释法——2ml 药液 + 18ml 50℃ 水浴平衡的 MH 琼脂注入 90mm 平板（1:9 混匀），多点接种器每点 1～2μl（约 10⁷CFU/ml），菌液干后 35℃ 16～20 小时。贮存液溶剂：青霉素类/头孢多为磷酸盐缓冲液或蒸馏水，阿奇霉素/氯霉素/红霉素先用 95% 乙醇溶、利福平先甲醇溶，亚胺培南用 pH7.2 0.01mol/L 磷酸盐缓冲液。MIC 判读：无肉眼可见生长的最低浓度；琼脂稀释法单一菌落可忽略。质控 MIC 范围表见书表 4-7。',
  'e-test': '95书操作细节：菌液准备与涂布接种同纸片扩散法；无菌镊子放置 E 试条（50mm×5mm 无孔载体，一面连续梯度药物、一面 μg/ml 刻度）——140mm 平板可放 6 条、90mm 平板 1～2 条；培养条件同纸片扩散法。判读四规则：抑菌圈与试条相交介于上下刻度之间读较高值；双层抑菌圈读完全抑制的刻度；相交处散在菌落读完全抑制刻度；相交处凹陷延伸读凹陷起始部位刻度。质控 MIC 须在允许范围内。',
};

let count = 0;
for (const [id, text] of Object.entries(ADD)) {
  const anchor = `id: '${id}'`;
  const i = src.indexOf(anchor);
  if (i < 0) { console.error('NOT FOUND:', id); process.exit(1); }
  const secStart = src.indexOf('小节: [', i);
  const bracket = src.indexOf('[', secStart);
  let depth = 0, k = bracket;
  for (; k < src.length; k++) {
    if (src[k] === '[') depth++;
    else if (src[k] === ']') { depth--; if (depth === 0) break; }
  }
  const insertAt = k;
  const prevNonWs = src.slice(0, insertAt).replace(/[\s,]+$/, '').slice(-1);
  if (prevNonWs !== '}') { console.error('UNEXPECTED at', id); process.exit(1); }
  src = src.slice(0, insertAt) + `,\n      { 标题: '操作细节（95书）', 正文: '${text}' }` + src.slice(insertAt);
  count++;
}

// 新增联合药敏词条
const newEntry = `
  // 批57 新增（源：95书实验四五、联合药敏试验）
  {
    id: 'checkerboard-fic',
    名称: '联合药敏试验（棋盘法 FIC）',
    类别: '药敏试验方法',
    小节: [
      { 标题: '原理', 正文: '肉汤微量稀释棋盘法：两种抗菌药物各以其 MIC 的 2 倍为最高浓度对倍稀释 6～8 个稀释度交叉组合，测定方法同微量肉汤稀释法。通过部分抑菌浓度（FIC）指数判断 A、B 两药联合应用的效果。' },
      { 标题: '方法', 正文: '先分别测定拟联合药物 A、B 对待测菌的 MIC，据此确定联合测定的稀释度（一般 8～12 个）。每种药物最高浓度为其 MIC 的 2 倍，按棋盘格局交叉稀释（如 A 药 MIC=32μg/ml、B 药 MIC=8μg/ml，则 A 药列 64→4μg/ml、B 药行 16→1μg/ml 交叉），操作同微量肉汤稀释法。' },
      { 标题: '结果判读', 正文: 'FIC 指数 = A 药联合时 MIC/A 药单测 MIC + B 药联合时 MIC/B 药单测 MIC。<0.5 为协同作用；0.5～1 为相加作用；1～2 为无关作用；>2 为拮抗作用。' }
    ],
    关联: ['bmd', 'hlar']
  }
`;
const closeIdx = src.lastIndexOf('];');
src = src.slice(0, closeIdx) + newEntry + src.slice(closeIdx);

fs.writeFileSync(FILE, src);
console.log('appended', count, '+1 new entry');
