#!/usr/bin/env node
// 批58（书95 真菌试验补强）：
// 1) staining.js：lpcb / india-ink / koh-wet 追加「操作细节（95书）」，新增「钙荧光白染色」词条
// 2) tests.js：gm-test 追加 GM 试验手工 ELISA 操作细节；新增「酵母样真菌药敏试验（纸片扩散/微量肉汤稀释）」词条
// 3) biochem-tests.js：assimilation-panel 追加真菌糖同化纸片法细节；germ-tube 无需（芽管试验书内未单列节）
// 源：实验十五（书页130–137）、实验十八（书页148–151）。
const fs = require('fs');
const path = require('path');

function appendSection(file, ADD) {
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
    src = src.slice(0, k) + `,\n      { 标题: '操作细节（95书）', 正文: '${text}' }` + src.slice(k);
    count++;
  }
  fs.writeFileSync(file, src);
  console.log(path.basename(file), 'appended', count);
}

// 1) staining.js
appendSection(path.join(__dirname, '..', 'data', 'staining.js'), {
  'lpcb': '95书操作细节：洁净载玻片滴 1 滴乳酸酚棉蓝染液，小镊子取少量标本置染液中，或用透明胶带法粘取孢子和菌丝覆盖染液，加盖玻片镜检（丝状真菌须在生物安全柜内操作，避免孢子播散）。红色毛癣菌镜下可见大分生孢子与小分生孢子。',
  'india-ink': '95书操作细节：脑脊液离心取沉淀物 10μl 置载玻片中央，加 5μl 墨汁混匀，盖盖玻片暗视野镜检。墨汁比例按批次染色性能验证调整——以镜下背景墨褐色、菌体透亮为宜，太多影响观察。新型隐球菌菌体与荚膜均不着色，黑色背景下透明圆形芽生孢子绕宽厚荚膜，偶见泰坦细胞。',
});

// 新增钙荧光白词条（staining.js 数组末尾）
let st = fs.readFileSync(path.join(__dirname, '..', 'data', 'staining.js'), 'utf8');
const stainEntry = `
  // 批58 新增（源：95书实验十五）
  {
    id: 'calcofluor-white',
    名称: '钙荧光白染色',
    类别: '真菌染色',
    关联: ['trichophyton-rubrum'],
    小节: [
      { 标题: '原理', 正文: '钙荧光白（Calcofluor White）与真菌细胞壁几丁质、纤维素结合，在荧光显微镜下发出亮荧光，用于甲屑、皮屑、毛发等角质标本中真菌的直接快速检查。推荐激发光波长 340～380nm、发射光波长 400nm。' },
      { 标题: '步骤', 正文: '小镊子取少许甲屑、皮屑或毛发置载玻片中央，滴钙荧光白染色液 1 滴，1～2 分钟待组织/角质溶解后盖盖玻片（避免气泡），轻压驱气泡并将标本压薄，酒精棉球吸去周围多余液体。先用低倍镜查分枝状排列的孢子菌丝，再换高倍镜看结构特征；荧光强度宜适当，避免过度曝光。' },
      { 标题: '结果判读', 正文: '一定荧光强度的孢子和菌丝呈分枝状排列，高倍镜下菌丝和孢子结构清晰。' },
      { 标题: '临床应用', 正文: '甲真菌病、皮肤癣菌感染标本的直接镜检；亦用于培养后丝状真菌的胶带粘取制片（先滴染液 1 滴再以透明胶带粘取孢子菌丝覆盖）。须在生物安全柜内操作，避免孢子播散与染液刺激皮肤。' }
    ]
  },
`;
const stClose = st.lastIndexOf('];');
st = st.slice(0, stClose) + stainEntry + st.slice(stClose);
fs.writeFileSync(path.join(__dirname, '..', 'data', 'staining.js'), st);
console.log('staining.js +1 new entry');

// 2) tests.js
appendSection(path.join(__dirname, '..', 'data', 'tests.js'), {
  'gm-test': '95书操作细节（ELISA 竞争法手工流程）：试剂室温平衡 30 分钟；EP 管加 300μl 质控品/待检血清或肺泡灌洗液 + 100μl 样本处理液，涡旋 10 秒，金属浴 100℃ 加热 3 分钟；10 000×g 离心 10 分钟（小心高温爆管），冷却后取上清 100μl 加酶标板（3 个质控孔 + 样本孔）；洗涤每孔不少于 300μl、静置 40 秒、拍干，共 1 次；加酶标抗体 100μl，37℃ 30 分钟后同法洗涤；加 TMB 底物 100μl，37℃ 避光 25～30 分钟（不需封板）；加终止液 50μl（与底物同顺序），5 分钟内 450nm 读数（参考波长 620/630nm）。吸光度与 GM 含量呈负相关；手工法注意洗涤有效性，失控须分析原因复测。',
});

// 新增酵母药敏词条
let tt = fs.readFileSync(path.join(__dirname, '..', 'data', 'tests.js'), 'utf8');
const testEntry = `
  // 批58 新增（源：95书实验十八 酵母样真菌药敏试验）
  {
    id: 'yeast-ast',
    名称: '酵母样真菌药敏试验（纸片扩散/微量肉汤稀释）',
    类别: '药敏试验方法',
    小节: [
      { 标题: '纸片扩散法', 正文: '改良_disk_法：挑取沙保弱培养基 16～24 小时念珠菌 3～5 个菌落制 0.5 麦氏菌悬液，棉签涂抹接种 3 次（每次旋转 60°、最后沿内缘一周）；室温干燥 3～5 分钟后贴抗真菌药纸片（9cm 平板不超过 5 个），35℃ 20～24 小时；游标卡尺从平板背面量完全抑制区域直径（毫米整数）。24 小时生长不佳可延至 48 小时判读。质控：近平滑念珠菌 ATCC 22019 与克柔念珠菌 ATCC 6258（氟康唑对克柔天然耐药不测量）。报告 S/I/R/SDD，参照 WS/T 421—2024。' },
      { 标题: '微量肉汤稀释法', 正文: '培养基为含谷氨酰胺与酚红的 RPMI 1640 + 2g/L 葡萄糖 + 34.53g/L MOPS（pH 7.0±0.1）。药物贮存液 ≥1280μg/ml（或最高测定浓度 10 倍），非水溶剂（DMSO/乙醇/聚乙二醇/羧甲基纤维素）溶解，-60℃（至少 -20℃）分装可存 6 个月。挑 16～24 小时菌落 1～2 个制 0.5 麦氏菌液，RPMI 1640 先 1:50 再 1:20 稀释至 1×10³～5×10³CFU/ml 接种；设生长对照孔（100μl 菌液 + 100μl RPMI1640）与阴性对照孔（仅培养基）。35℃ 18～24 小时判读（新型隐球菌 72 小时）。质控菌株同上。' },
      { 标题: '判读要点', 正文: '棘白菌素（阿尼芬净/卡泊芬净/米卡芬净）与伏立康唑、氟康唑有种内折点（白念珠菌 SDD 仅氟康唑 4μg/ml）；两性霉素 B、泊沙康唑等以 ECV（流行病学界值）报告野生型/非野生型；新型隐球菌对三类棘白菌素天然耐药，药敏参照 CLSI M57 以 ECV 判读（72 小时孵育）。' },
      { 标题: '应用', 正文: '念珠菌属与新型隐球菌分离株对棘白菌素、唑类、两性霉素 B、5-氟胞嘧啶的敏感性测定；纸片法适合日常筛查，微量肉汤稀释为参考方法。' }
    ],
    关联: ['candida-albicans', 'cryptococcus-neoformans', 'kb-test', 'bmd']
  }
`;
const ttClose = tt.lastIndexOf('];');
tt = tt.slice(0, ttClose) + testEntry + tt.slice(ttClose);
fs.writeFileSync(path.join(__dirname, '..', 'data', 'tests.js'), tt);
console.log('tests.js +1 new entry');

// 3) biochem-tests.js：糖同化（真菌纸片法）
appendSection(path.join(__dirname, '..', 'data', 'biochem-tests.js'), {
  'assimilation-panel': '95书真菌糖同化纸片法：20ml 灭菌糖同化培养基冷却至 48℃，待检菌（24～48 小时培养物）混悬于 4ml 无菌生理盐水调 4.0 麦氏，全部菌液加入培养基混匀倾注平板；凝固后贴含葡萄糖、麦芽糖、蔗糖、乳糖的纸片，25℃ 或 35℃ 培养 24～48 小时——被检菌围绕含糖纸片生长即为能同化该糖。白念珠菌与新型隐球菌同为葡萄糖+、麦芽糖+、蔗糖+、乳糖−；糖发酵试验（含小导管液体培养管 35℃ 24～48 小时）白念珠菌仅发酵葡萄糖与麦芽糖、新型隐球菌四种糖均不发酵。发酵某种糖者必能同化之，同化未必发酵。',
});
console.log('done');
