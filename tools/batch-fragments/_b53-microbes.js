// 批53：94 书第 8 章沙门菌血清型扩充 5 种（鼠伤寒/猪霍乱/乙副/丙副/病牛）
// 速查表均无条目——merge 脚本按拉丁序补（拉丁名用 Salmonella enterica ser. X 与库内甲副一致的风格）
window.DB.microbes.push(
{
  "id": "salmonella-typhimurium",
  "名称": "鼠伤寒沙门菌",
  "拉丁名": "Salmonella Typhimurium",
  "类别": "沙门菌属",
  "小节": [
    { "标题": "形态与染色", "正文": "革兰阴性细长杆菌，无芽孢无荚膜，周身鞭毛；氧化酶阴性。血清型抗原：O4（1,4,5,12）、H 第 1 相 i、第 2 相 1,2。" },
    { "标题": "致病性 / 所致疾病", "正文": "全球最常见非伤寒沙门菌血清型：胃肠炎（食物中毒主力——畜禽蛋奶制品）、菌血症（儿童/免疫低下）、院内感染新生儿腹泻暴发。TSI K/A、H2S 强阳性、动力+、脲酶−。" }
  ],
  "关联": ["salmonella-enteritidis", "salmonella-typhi", "salmonella-genus"]
},
{
  "id": "salmonella-choleraesuis",
  "名称": "猪霍乱沙门菌",
  "拉丁名": "Salmonella Choleraesuis",
  "类别": "沙门菌属",
  "小节": [
    { "标题": "形态与染色", "正文": "革兰阴性杆菌（1～3) μm×(0.4～0.9) μm，无芽孢有鞭毛能运动，多数有菌毛。血清型抗原：O6,7、H 第 1 相 c、第 2 相 1,5。" },
    { "标题": "致病性 / 所致疾病", "正文": "猪源血清型，侵袭力强，人感染以菌血症/肠外感染（骨髓炎、肺炎、脑膜炎）为特征而非典型胃肠炎——非伤寒沙门菌中侵袭性最强之一。卫矛醇 5%（阴性，区别于多数沙门菌）、山梨醇 90%。" }
  ],
  "关联": ["salmonella-paratyphi-c", "salmonella-typhimurium", "salmonella-genus"]
},
{
  "id": "salmonella-paratyphi-b",
  "名称": "乙型副伤寒沙门菌",
  "拉丁名": "Salmonella Paratyphi B",
  "类别": "沙门菌属",
  "小节": [
    { "标题": "形态与染色", "正文": "革兰阴性细长杆菌，无芽孢无荚膜有鞭毛。血清型抗原：O1,4,5,12、H 第 1 相 b、第 2 相 1,2。" },
    { "标题": "致病性 / 所致疾病", "正文": "副伤寒（肠热症）——菌血症为主，也可致胃肠炎。H2S 100%、枸橼酸盐 100%、赖氨酸脱羧酶 95%、木糖 90%、黏液酸 90%——与甲型副伤寒（依次 10%/0%/0%/0%/0%）五轴全面鉴别。" }
  ],
  "关联": ["salmonella-paratyphi-a", "salmonella-typhi", "salmonella-genus"]
},
{
  "id": "salmonella-paratyphi-c",
  "名称": "丙型副伤寒沙门菌",
  "拉丁名": "Salmonella Paratyphi C",
  "类别": "沙门菌属",
  "小节": [
    { "标题": "形态与染色", "正文": "革兰阴性细长杆菌有鞭毛。血清型抗原：O6,7（含 Vi）、H 第 1 相 c、第 2 相 1,5——O/H 抗原与猪霍乱沙门菌同（6,7/c/1,5），靠 Vi 抗原区分。" },
    { "标题": "致病性 / 所致疾病", "正文": "副伤寒 C（肠热症），国内罕见。H2S 100%、枸橼酸盐 100%、赖氨酸 100%、木糖 100%；与猪霍乱沙门菌生化相近，鉴别靠 Vi 抗原凝集（丙副 Vi+，猪霍乱 Vi−）与海藻糖（丙副 41% 迟缓）。" }
  ],
  "关联": ["salmonella-choleraesuis", "salmonella-paratyphi-b", "salmonella-genus"]
},
{
  "id": "salmonella-bovismorbificans",
  "名称": "病牛沙门菌",
  "拉丁名": "Salmonella Bovismorbificans",
  "类别": "沙门菌属",
  "小节": [
    { "标题": "形态与染色", "正文": "革兰阴性细长杆菌有鞭毛。血清型抗原：O8（6,8）、H 第 1 相 r、第 2 相 1,5（C2 组，与纽波特沙门菌同组）。" },
    { "标题": "致病性 / 所致疾病", "正文": "牛源血清型，人感染致胃肠炎/菌血症。生化谱典型：葡萄糖产气+、H2S+、枸橼酸盐+、赖氨酸/鸟氨酸脱羧酶+、脲酶−、海藻糖 V、黏液酸−。" }
  ],
  "关联": ["salmonella-typhimurium", "salmonella-enteritidis", "salmonella-genus"]
}
);
