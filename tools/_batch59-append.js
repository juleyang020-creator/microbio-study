#!/usr/bin/env node
// 批59（书95 培养基制备与接种技术补强）：
// 1) media.js：nutrient-agar / blood-agar / chocolate-agar 追加「制备细节（95书）」；新增「培养基制备通用技术」词条（基础与营养培养基类别）
// 2) biochem-tests.js：motility 追加半固体动力判读细节（属实验二半固体生长现象，动力试验已条目化，并入）
// 源：实验二（书页11–21 / 源PDF 27–37）。
const fs = require('fs');
const path = require('path');

function appendSection(file, ADD, label) {
  let src = fs.readFileSync(file, 'utf8');
  let count = 0;
  for (const [id, text] of Object.entries(ADD)) {
    const i = src.indexOf(`id: '${id}'`);
    if (i < 0) { console.error('NOT FOUND in', path.basename(file), ':', id); process.exit(1); }
    const secStart = src.indexOf('小节', i);
    const bracket = src.indexOf('[', secStart);
    let depth = 0, k = bracket;
    for (; k < src.length; k++) {
      if (src[k] === '[') depth++;
      else if (src[k] === ']') { depth--; if (depth === 0) break; }
    }
    const prevNonWs = src.slice(0, k).replace(/[\s,]+$/, '').slice(-1);
    if (prevNonWs !== '}') { console.error('UNEXPECTED at', id); process.exit(1); }
    src = src.slice(0, k) + `,\n      { 标题: '${label}', 正文: '${text}' }` + src.slice(k);
    count++;
  }
  fs.writeFileSync(file, src);
  console.log(path.basename(file), 'appended', count);
}

// 1) media.js 补强
appendSection(path.join(__dirname, '..', 'data', 'media.js'), {
  'nutrient-agar': '95书制备细节：营养肉汤配方（牛肉膏 3g + 蛋白胨 10g + 氯化钠 5g /L）基础上每升加琼脂 15～20g；各成分置锥形瓶加热煮沸完全溶解，冷却至 50℃ 左右校正 pH 7.2～7.6 后分装；斜面管高压灭菌后趁热搁置（斜面长度约试管 2/3、下端留 1cm 柱高），平板则灭菌后无菌倾注。称量时先以少量蒸馏水混悬非蛋白胨成分、最后加蛋白胨并冲洗瓶壁，防干粉粘底。',
  'blood-agar': '95书制备细节：灭菌后的营养琼脂冷却至 50℃ 左右，无菌操作按每 100ml 加 5～10ml 经 50℃ 预热的无菌脱纤维羊血（或兔血），立即混匀避免气泡，分装平皿或试管。倾注时适时转动锥形瓶使气泡附着于瓶壁，减少平板表面气泡。注：巧克力琼脂为 80℃ 左右加血并在 80℃ 水浴摇匀 20 分钟后分装（缓慢加热破坏红细胞释出 V 因子）。',
  'chocolate-agar': '95书制备细节：灭菌营养琼脂冷却至 80℃ 左右加入无菌脱纤维羊血，80℃ 水浴中摇匀 20 分钟后分装——缓慢加热使红细胞破坏、释出 V 因子（NAD），适用于流感嗜血杆菌、奈瑟菌等苛养菌。',
}, '制备细节（95书）');

// 2) media.js 新增「培养基制备通用技术」
let md = fs.readFileSync(path.join(__dirname, '..', 'data', 'media.js'), 'utf8');
const mediaEntry = `
  // 批59 新增（源：95书实验二一(一)，培养基制备九步通用流程）
  {
    id: 'media-prep-general',
    名称: '培养基制备通用技术',
    类别: '基础与营养培养基',
    小节: [
      { 标题: '九步流程', 正文: '称量→溶解→校正 pH→分装→灭菌→倾注平皿→搁置斜面→质量控制→保存。称量：少量蒸馏水先混悬非蛋白胨成分，最后加蛋白胨并冲洗瓶壁防粘底。溶解：电磁炉/磁力搅拌加热至完全溶解呈半透明。校正 pH：一般 7.2～7.6，高压灭菌后 pH 约降 0.1～0.2，故调校时应比目标高 0.1～0.2；校正后如有沉淀须过滤澄清（液体/半固体用滤纸，固体趁热用纱布）。分装：不超过容器 2/3 防灭菌外溢，试管分装约管长 1/3。' },
      { 标题: '灭菌参数', 正文: '耐热培养基常规 121.3℃（103.43kPa）15～30 分钟（少量分装 15 分钟、大量分装 30 分钟）；含糖或明胶培养基为防破坏用 115℃（68.95kPa）15 分钟；血清、细胞培养液等不耐热液态用滤菌器过滤除菌；糖类/血清/明胶/牛乳/鸡蛋等不耐热成分可用间歇蒸汽灭菌法（80～100℃ 15～30 分钟→35℃ 孵育 24h→再蒸，连续三次）。' },
      { 标题: '倾注与搁置', 正文: '灭菌后固体培养基先冷却至 50℃ 左右再无菌倾注（温度过高冷凝水多易污染，过低琼脂凝固致平板高低不平）；立即水平旋转平皿铺匀，厚度约 2mm——9cm 平皿倾注 13～15ml，7cm 平皿 7～8ml。凝固后倒置保存。斜面培养基趁热搁置，斜面约试管长 2/3、下端留 1cm 柱高；高层斜面使斜面与高层等高。' },
      { 标题: '质量控制与保存', 正文: '每批制成后：①无菌试验——倒置 35℃ 孵育 24 小时无细菌生长为合格；②性能测试——已知标准参考菌株接种，生长状况或生化反应符合要求方可使用。注明名称与制备日期，保鲜袋 2～8℃ 保存，不宜超过两周。' }
    ],
    关联: ['nutrient-agar', 'blood-agar', 'mh-agar']
  },
`;
const mdClose = md.lastIndexOf('];');
md = md.slice(0, mdClose) + mediaEntry + md.slice(mdClose);
fs.writeFileSync(path.join(__dirname, '..', 'data', 'media.js'), md);
console.log('media.js +1 new entry');

// 3) biochem-tests.js：动力试验并入半固体判读
appendSection(path.join(__dirname, '..', 'data', 'biochem-tests.js'), {
  'motility': '95书半固体判读细节：半固体含琼脂 0.3%～0.5%，有鞭毛细菌可自由游动——沿穿刺线生长外、穿刺线两侧呈羽毛状或云雾状浑浊生长为动力阳性；无鞭毛细菌仅沿穿刺线呈明显线状生长、两边培养基仍澄清为阴性。穿刺接种须垂直直线穿刺至距管底 2～3mm、沿原路退出不能抖动。',
}, '操作细节（95书）');

console.log('done');
