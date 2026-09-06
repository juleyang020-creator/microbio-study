#!/usr/bin/env node
// 批54（书95 试验补强·第1批）：往 biochem-tests.js 既有条目追加「操作细节（95书）」小节。
// 源：《临床微生物学检验技术实验指导》第2版 实验三（书页22–35 / 源PDF 38–51）。
// 文件是单引号 JS 对象字面量混合风格（既有单引号也有 JSON 双引号 push 块），两种锚点都要支持。
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'data', 'biochem-tests.js');
let src = fs.readFileSync(FILE, 'utf8');

const ADD = {
  'glucose-fermentation': '操作细节（95书实验指导）：液体培养基观察倒置小导管中有无气泡，半固体看穿刺线、管壁及管底有无微小气泡、培养基有无断裂；产气记「⊕」，产酸不产气记「+」，不变色记「−」。指示剂首选溴甲酚紫（或酸性复红）——酚红、溴麝香草酚蓝虽敏感但稳定性差，仅适用于迟缓发酵或培养时间短的场合；糖浓度 1% 可减少逆反应。',
  'of-test': '操作细节（95书实验指导）：两支 Hugh-Leifson 培养基穿刺接种，其中一支滴加无菌液体石蜡封管，35℃ 培养 24～48 小时。封管石蜡高度至少 1 cm（保证有效隔氧）。若细菌不能在 Hugh-Leifson 培养基中生长，可加入无菌血清至 2% 浓度后重做。',
  'mr-test': '操作细节（95书实验指导）：葡萄糖蛋白胨水 35℃ 培养 18～24 小时后加甲基红指示剂 2～3 滴，立即观察。蛋白胨成分与培养时间影响结果，培养时间太短会假阴性。',
  'vp-test': '操作细节（95书实验指导）：葡萄糖蛋白胨水 35℃ 培养 18～24 小时，加 V-P 甲、乙液各 1 滴，充分混匀后静置 10 分钟观察；阴性者置 35℃ 4 小时后复查，仍无红色方报阴性。已知 V-P 阳性菌出现阴性时，对培养物加热可复现红色。',
  'citrate': '操作细节（95书实验指导）：35℃ 培养 24～48 小时。接种菌量要合适——过少易假阴性，过多易假阳性；部分细菌需 48 小时以上才变色。',
  'indole': '操作细节（95书实验指导）：蛋白胨水 35℃ 培养 18～24 小时，加吲哚试剂 2～3 滴，沿管壁徐徐加入、稍待片刻后观察液面交界处。不可用含葡萄糖的蛋白胨水——细菌分解葡萄糖产酸会抑制生长或酶活性而假阴性。',
  'phenylalanine-deaminase': '操作细节（95书实验指导）：苯丙氨酸琼脂 35℃ 培养 18～24 小时，加 100 g/L 三氯化铁 3～5 滴后慢慢转动试管使试剂布满斜面，5 分钟内出现绿色为阳性。',
  'decarboxylase': '操作细节（95书实验指导）：赖氨酸/鸟氨酸脱羧酶培养基与不含氨基酸的对照管同时接种，每管加无菌液体石蜡覆盖，35℃ 培养 1～2 天。对照管黄色、试验管紫色为阳性；两管均黄色为阴性。对照管内含葡萄糖，细菌生长发酵葡萄糖产酸而变黄——若对照管为紫色（未正常发酵），所有脱羧酶结果无效。',
  'urease': '操作细节（95书实验指导）：尿素培养基 35℃ 培养 18～24 小时观察，阴性者继续观察到 72 小时。细菌利用蛋白胨产氨可使酚红变红造成假阳性，缺乏特异性时应以无尿素培养基作对照排除。',
  'nitrate-reduction': '操作细节（95书实验指导）：硝酸盐培养基 35℃ 培养 1～2 天，沿管壁缓慢加入硝酸盐还原试剂甲、乙液各 1 滴，10 分钟内变红为阳性。不变色时加少许锌粉复核：加锌后出现红色说明硝酸盐仍存在（未被细菌还原），判阴性；仍不出现红色说明硝酸盐已被还原成氨/氮等，判阳性。',
  'bio-oxidase': '操作细节（95书实验指导）：滤纸条蘸取菌落后滴加氧化酶试剂（盐酸二甲基/四甲基对苯二胺），10 秒内出现紫红色（二甲基）或蓝色（四甲基）为阳性。避免接触含铁物质（镊子部位会显色造成假阳性），且不宜用含葡萄糖培养基上的菌落（易假阴性）。',
  'bio-catalase': '操作细节（95书实验指导）：取固体培养基上 18～24 小时培养物置洁净载玻片，滴加 3% 过氧化氢数滴，10 秒内大量气泡为阳性。过氧化氢须新鲜配制；避免含铁物质或含铁培养基（假阳性）。',
  'bio-coagulase': '操作细节（95书实验指导）：玻片法——生理盐水与新鲜兔血浆各 1 滴分别置载玻片上，挑菌分别混匀，立即观察（血浆中聚集成团块为阳性，生理盐水侧应无自凝）。试管法——18～24 小时培养物接种含 0.5～1 ml 血浆的试管，37℃ 水浴 4 小时观察凝固。注意某些菌株的葡激酶在延长孵育后溶解凝块致假阴性；血浆须无菌，否则假阳/假阴均可出现。',
  'dnase': '操作细节（95书实验指导）：点种 DNA 酶琼脂平板，35℃ 培养 18～24 小时后用 1 mol/L 盐酸覆盖琼脂观察：菌落周围透明环为阳性。',
  'tsi-kia': '操作细节（95书实验指导）：接种针挑菌先穿刺接种 KIA（距管底 3～5 mm 止），再从原路返回、自下而上划曲线接种斜面，35℃ 培养 18～24 小时。记录格式 K/A（斜面/底层）：K/K-- 不发酵糖；K/A+− 葡萄糖产酸产气不发酵乳糖；K/A-+ 产硫化氢（底层黑色）；A/A+− 乳糖葡萄糖均发酵产气。原理上葡萄糖仅为乳糖量的 1/10，单独发酵葡萄糖时斜面因氧化与产碱回红，底层缺氧保黄。',
  'miu': '操作细节（95书实验指导）：接种针垂直穿刺 MIU 半固体（距管底约 4 mm 处），35℃ 培养 18～24 小时。先读动力（沿穿刺线向四周扩散为阳性）与脲酶（整个培养基变红为阳性），再滴加吲哚试剂读交界面红色。',
  'slide-agglutination': '操作细节（95书实验指导）：1～2 接种环多价诊断血清与同量生理盐水对照分置玻片两端，少量待检菌分别混匀，轻摇玻片数分钟观察——血清侧颗粒状凝集、盐水侧均匀浑浊为阳性。多价阳性后再以同法做群/型因子血清。凝集不易观察时可在显微镜下确认。',
  'capsule-swelling': '操作细节（95书实验指导）：玻片两侧各加待检菌液 1～2 接种环，分别加抗荚膜血清与正常对照兔血清混匀，各加 1 接种环 1% 亚甲蓝水溶液，加盖玻片置湿盒室温 5～10 分钟镜检：蓝色菌体周围界限清晰、宽阔的无色环状带为膨胀荚膜（试验侧有、对照侧无为阳性）。',
};

function findSectionArrayClose(src, idLiteral) {
  // 支持 id: 'x' 与 "id":"x" 两种锚点
  const patterns = [`id: '${idLiteral}'`, `"id":"${idLiteral}"`];
  let i = -1, used = null;
  for (const p of patterns) {
    const k = src.indexOf(p);
    if (k >= 0) { i = k; used = p; break; }
  }
  if (i < 0) return { err: 'id not found' };
  const secStart = src.indexOf('小节', i);
  if (secStart < 0 || src.indexOf('小节', i) > src.indexOf('\n  {', i + 10)) {
    // 小节 must come before next entry
  }
  const bracket = src.indexOf('[', secStart);
  let depth = 0, k = bracket;
  for (; k < src.length; k++) {
    if (src[k] === '[') depth++;
    else if (src[k] === ']') { depth--; if (depth === 0) break; }
  }
  return { insertAt: k, used };
}

let count = 0;
for (const [id, text] of Object.entries(ADD)) {
  const r = findSectionArrayClose(src, id);
  if (r.err) { console.error('NOT FOUND:', id); process.exit(1); }
  const insertAt = r.insertAt;
  const prevNonWs = src.slice(0, insertAt).replace(/[\s,]+$/, '').slice(-1);
  if (prevNonWs !== '}') { console.error('UNEXPECTED STRUCTURE at', id, JSON.stringify(prevNonWs)); process.exit(1); }
  // 引号风格跟随锚点：JSON 风格用双引号键，单引号风格用单引号键
  const jsonStyle = r.used.includes('"id"');
  const addition = jsonStyle
    ? `,{\"标题\":\"操作细节（95书）\",\"正文\":\"${text}\"}`
    : `,\n      { 标题: '操作细节（95书）', 正文: '${text}' }`;
  src = src.slice(0, insertAt) + addition + src.slice(insertAt);
  count++;
}
fs.writeFileSync(FILE, src);
console.log('appended', count, 'entries');
