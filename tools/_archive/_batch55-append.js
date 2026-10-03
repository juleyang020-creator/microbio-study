#!/usr/bin/env node
// 批55（书95 染色法补强）：往 staining.js 既有条目追加「操作细节（95书）」小节，
// 并新增「细胞壁染色（鞣酸媒染法）」词条（库内无对应条目）。
// 源：《临床微生物学检验技术实验指导》第2版 实验一（书页4–10 / 源PDF 20–26）。
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'data', 'staining.js');
let src = fs.readFileSync(FILE, 'utf8');

const ADD = {
  'gram-stain': '95书操作细节：初染结晶紫 1～2 滴完全覆盖菌膜，室温 1 分钟，细流水冲洗；媒染碘液室温 1 分钟，冲洗；脱色用 95% 乙醇滴于菌膜轻摇玻片、边滴边观察至流下乙醇无色（约 30 秒），立即冲洗——脱色是关键步骤，过度则 G⁺ 变 G⁻、不足则 G⁻ 变 G⁺，且脱色时间与涂片厚薄有关应灵活掌握；复染稀释苯酚复红 30～60 秒。碘液不可久存（失媒染作用），95% 乙醇密封不良或涂片积水会使浓度下降影响脱色力；菌龄、染色时间、pH、染液浓度均影响结果，同批须加质控菌。涂片固定：菌膜面朝上中等速度过火焰 3 次。',
  'spore-stain': '95书操作细节（复红-亚甲蓝法，与 Schaeffer-Fulton 孔雀绿法并列的经典教学方案）：枯草芽胞杆菌涂片自然干燥固定后，苯酚复红微微加热染色 5 分钟（保持冒蒸汽、不能沸腾，否则菌体破裂），冷却后细流水冲洗；95% 乙醇脱色 2 分钟，冲洗；碱性亚甲蓝复染半分钟。结果菌体蓝色、芽胞红色。选用适当菌龄——幼龄菌未形成芽胞，老龄菌芽胞已破裂。',
  'capsule-stain': '95书操作细节（Hiss 硫酸铜法）：肺炎链球菌血琼脂培养物涂片自然干燥（不加热固定——荚膜含水量 90% 以上，加热会使荚膜皱缩变形）；滴加 1% 结晶紫，微微加热玻片至染液冒蒸汽；用 20% 硫酸铜溶液冲洗去染液（切勿用水冲洗），倾去硫酸铜自然干燥镜检。结果：菌体及背景紫色，荚膜淡蓝色——荚膜与结晶紫结合不牢，被硫酸铜洗脱后改与硫酸铜结合呈蓝。',
  'india-ink': '95书操作细节：1 滴墨汁置洁净载玻片，取少量细菌充分混匀；镊子夹盖玻片倾斜使其一边接触菌液边缘，菌液沿盖玻片边缘扩散后缓慢放下（角度要低、动作要缓慢，防气泡）；先低倍后高倍观察。墨汁量适中——过多溢出、过少产气泡。实际工作中墨汁负染常配合亚甲蓝单染检查荚膜：黑色背景中蓝色菌体周围一层无色透明荚膜。常用染液除墨汁外还有刚果红、水溶性苯胺黑等酸性染料（带负电荷，菌体不着色仅背景着色）。',
  'flagella-stain': '95书操作细节（改良 Ryu 法与碱性复红法）：玻片须先洗衣粉液煮沸 10 分钟→清洁液浸泡加温 10 分钟→95% 乙醇脱脂；加一滴无菌蒸馏水，接种环从平板菌膜延伸处挑菌轻轻点置水面（勿搅动研磨，以免鞭毛脱落），自然干燥（不能火焰加热）。改良 Ryu 法：媒染剂（5% 苯酚 10 ml + 单宁酸 2 g + 饱和硫酸钾铝 10 ml）与饱和结晶紫乙醇溶液按 10:1 混合，染 10～15 分钟，菌体鞭毛均紫色；碱性复红法：9 份甲液（明矾饱和液 2 ml + 50 g/L 苯酚 5 ml + 200 g/L 鞣酸 2 ml）与 1 份乙液（碱性复红乙醇饱和液）混合过滤、配制后第三天使用最佳，染 1～2 分钟，菌体鞭毛均红色。镜检从涂片边缘开始找单个细菌分布的视野，观察鞭毛位置及数量。须用新鲜培养物。',
  'methylene-blue': '95书操作细节：制备好的涂片上滴加吕氏碱性亚甲蓝染 1～2 分钟，细流水冲去染液，吸干表面水后镜检（单染法亦可用结晶紫或稀释苯酚复红各染 1 分钟）。',
};

let count = 0;
for (const [id, text] of Object.entries(ADD)) {
  const anchor = `id: '${id}'`;
  const i = src.indexOf(anchor);
  if (i < 0) { console.error('NOT FOUND:', id); process.exit(1); }
  const secStart = src.indexOf('小节: [', i);
  if (secStart < 0) { console.error('no 小节 array:', id); process.exit(1); }
  const bracket = src.indexOf('[', secStart);
  let depth = 0, k = bracket;
  for (; k < src.length; k++) {
    if (src[k] === '[') depth++;
    else if (src[k] === ']') { depth--; if (depth === 0) break; }
  }
  const insertAt = k;
  const prevNonWs = src.slice(0, insertAt).replace(/[\s,]+$/, '').slice(-1);
  if (prevNonWs !== '}') { console.error('UNEXPECTED STRUCTURE at', id); process.exit(1); }
  const addition = `,\n      { 标题: '操作细节（95书）', 正文: '${text}' }`;
  src = src.slice(0, insertAt) + addition + src.slice(insertAt);
  count++;
}

// 新词条：细胞壁染色（库内无）
const newEntry = `
  // 批55 新增：细胞壁染色（源：95书实验一(一)，细菌 L 型鉴别用）
  {
    id: 'cell-wall-stain',
    名称: '细胞壁染色（鞣酸媒染法）',
    类别: '特殊结构染色',
    关联: ['staphylococcus-aureus'],
    小节: [
      { 标题: '原理', 正文: '细胞壁主要成分肽聚糖与染料结合力差、不易着色，一般染料经渗透扩散进入细胞而细胞壁本身不显色。鞣酸（或磷钼酸）起媒染作用，使细胞壁形成可着色的复合物而细胞质不易着色，媒染后再以结晶紫等染料染色，即可在普通光学显微镜下观察到细胞壁。细菌 L 型为细胞壁缺陷型，可借此鉴别。' },
      { 标题: '步骤', 正文: '制细菌涂片（金黄色葡萄球菌普通培养物与诱导的细菌 L 型培养物各一份）；滴加 100 g/L 鞣酸染 15 分钟，水洗；滴加 5 g/L 结晶紫溶液染 3～5 分钟，水洗后吸干镜检。' },
      { 标题: '结果判读', 正文: '有细胞壁的细菌仅菌体周边染成紫色、菌体内部无色；无细胞壁的细菌（细菌 L 型）染料渗入菌体，整个菌体染成紫色。' },
      { 标题: '临床应用', 正文: '鉴别细菌 L 型（细胞壁缺陷型）与普通细菌；教学演示细胞壁结构。' }
    ]
  },
`;
// 插到最后一个条目 } 之后、数组收尾 ]; 之前
const closeIdx = src.lastIndexOf('];');
const lastBrace = src.lastIndexOf('}', closeIdx);
if (closeIdx < 0 || lastBrace < 0) { console.error('cannot find array close'); process.exit(1); }
src = src.slice(0, closeIdx) + newEntry + src.slice(closeIdx);

fs.writeFileSync(FILE, src);
console.log('appended', count, '+1 new entry');
