window.DB = window.DB || {};
// 培养基：营养成分 + 用途/原理 + 关联适用微生物（反向链接自动出现在对应菌页）。
window.DB.media = [

  // ===== 基础与营养培养基 =====
  {
    id: 'nutrient-agar',
    名称: '营养琼脂',
    类别: '基础与营养培养基',
    小节: [
      { 标题: '营养成分', 正文: '蛋白胨（氨基酸/氮源）、牛肉膏（维生素/碳源）、氯化钠（渗透压）、琼脂（凝固剂，本身无营养）。' },
      { 标题: '用途 / 原理', 正文: '最基础的通用培养基，无选择性、无鉴别性；用于一般细菌的增菌、传代与保存，也是多数选择/鉴别培养基的基础。' }
    ],
    关联: ['e-coli', 'staph-aureus', 'proteus-mirabilis', 'bacillus-cereus']
  },
  {
    id: 'blood-agar',
    名称: '血琼脂平板（BAP）',
    类别: '基础与营养培养基',
    小节: [
      { 标题: '营养成分', 正文: '营养琼脂基础 + 5% 脱纤维羊（或兔）血，提供丰富营养与生长因子。' },
      { 标题: '用途 / 原理', 正文: '支持绝大多数细菌生长；并据溶血观察分型——α 溶血（草绿、不完全）、β 溶血（透明、完全）、γ（不溶血）。是链球菌/葡萄球菌分型与常规分离的核心平板。' }
    ],
    关联: ['strep-pyogenes', 'strep-agalactiae', 'strep-pneumoniae', 'strep-viridans', 'strep-gallolyticus', 'staph-aureus', 'staph-epidermidis', 'enterococcus-faecalis', 'enterococcus-faecium', 'listeria-monocytogenes']
  },
  {
    id: 'chocolate-agar',
    名称: '巧克力琼脂',
    类别: '基础与营养培养基',
    小节: [
      { 标题: '营养成分', 正文: '血琼脂基础经高压灭菌后冷却至 80℃ 左右时加入 5% 血液，红细胞裂解、血中 NAD 酶被灭活，故 X 因子（高铁血红素）与 V 因子（NAD）得以释放并保留（普通羊血平板本身即含 X 因子，但 V 因子被 NAD 酶破坏），培养基呈巧克力色。' },
      { 标题: '用途 / 原理', 正文: '为营养要求高、需 X/V 因子的细菌提供生长条件，常用于嗜血杆菌与奈瑟菌的培养。须置 35～37℃、3%～7% CO₂ 湿润环境（CO₂ 孵箱或烛缸）孵育并观察至 72 h，普通空气孵育易致淋病奈瑟菌等漏检。' }
    ],
    关联: ['haemophilus-influenzae', 'haemophilus-parainfluenzae', 'neisseria-meningitidis', 'neisseria-gonorrhoeae', 'moraxella-catarrhalis', 'brucella-melitensis']
  },

  // ===== 选择与鉴别培养基 =====
  {
    id: 'macconkey',
    名称: '麦康凯琼脂',
    类别: '选择与鉴别培养基',
    小节: [
      { 标题: '营养成分', 正文: '蛋白胨基础 + 乳糖 + 胆盐与结晶紫（抑制革兰阳性菌）+ 中性红（pH 指示剂）。' },
      { 标题: '用途 / 原理', 正文: '选择培养革兰阴性肠道杆菌；发酵乳糖者产酸使菌落呈粉红色（如大肠埃希菌、克雷伯），不发酵者无色（如沙门、志贺、变形杆菌）。' }
    ],
    关联: ['e-coli', 'klebsiella-pneumoniae', 'klebsiella-oxytoca', 'klebsiella-aerogenes', 'enterobacter-cloacae', 'citrobacter-freundii', 'serratia-marcescens', 'proteus-mirabilis', 'proteus-vulgaris', 'morganella-morganii', 'salmonella-typhi', 'salmonella-enteritidis', 'shigella-flexneri', 'shigella-dysenteriae', 'pseudomonas-aeruginosa', 'acinetobacter-baumannii', 'stenotrophomonas-maltophilia']
  },
  {
    id: 'emb',
    名称: '伊红美蓝琼脂（EMB）',
    类别: '选择与鉴别培养基',
    小节: [
      { 标题: '营养成分', 正文: '蛋白胨 + 乳糖（±蔗糖）+ 伊红 Y 与美蓝染料（兼抑制革兰阳性菌与 pH 指示）。' },
      { 标题: '用途 / 原理', 正文: '选择并鉴别革兰阴性菌；强发酵乳糖者产酸，使大肠埃希菌菌落呈特征性的绿色金属光泽；弱发酵或黏液型的克雷伯、肠杆菌属呈粉紫色黏液大菌落而无金属光泽；不发酵乳糖者（沙门菌、志贺菌）呈无色或半透明淡紫色菌落。' }
    ],
    关联: ['e-coli', 'klebsiella-pneumoniae', 'klebsiella-oxytoca', 'enterobacter-cloacae', 'proteus-mirabilis', 'salmonella-typhi', 'shigella-flexneri']
  },
  {
    id: 'ss-agar',
    名称: 'SS 琼脂',
    类别: '选择与鉴别培养基',
    小节: [
      { 标题: '营养成分', 正文: '乳糖 + 胆盐/枸橼酸盐/煌绿（强抑制革兰阳性菌及大肠菌群）+ 中性红 + 硫代硫酸钠与枸橼酸铁（指示 H₂S）。' },
      { 标题: '用途 / 原理', 正文: '强选择性分离沙门菌（尤适用于粪便标本）；不发酵乳糖呈无色菌落，产 H₂S 者中心变黑。其选择性过强会抑制部分志贺菌，志贺菌初次分离不能单用 SS，须同时接种麦康凯或 XLD/HE。判读注意：伤寒沙门菌产 H₂S 弱、甲型副伤寒沙门菌常不产 H₂S，黑心可不明显甚至缺如，不能以「无黑心」排除沙门菌；变形杆菌亦呈无色带黑心菌落，均须经生化与血清学进一步鉴定。' }
    ],
    关联: ['salmonella-typhi', 'salmonella-paratyphi-a', 'salmonella-enteritidis', 'shigella-dysenteriae', 'shigella-flexneri']
  },
  {
    id: 'xld',
    名称: 'XLD 琼脂',
    类别: '选择与鉴别培养基',
    小节: [
      { 标题: '营养成分', 正文: '木糖、赖氨酸、乳糖、蔗糖 + 酚红（pH 指示）+ 硫代硫酸钠/枸橼酸铁铵（H₂S 指示）+ 去氧胆酸钠（选择）。' },
      { 标题: '用途 / 原理', 正文: '分离鉴别沙门菌与志贺菌：多数沙门菌发酵木糖后再经赖氨酸脱羧产碱而呈红色菌落，产 H₂S 者中心变黑；志贺菌不发酵木糖，呈红色无黑心。注意伤寒沙门菌 H₂S 仅弱阳、甲型副伤寒沙门菌赖氨酸脱羧阴性且极少产 H₂S，可呈无黑心红色菌落而被误当志贺菌漏检；变形杆菌产 H₂S 亦呈红色黑心菌落，属假阳性，均须进一步鉴定与血清分型。' }
    ],
    关联: ['salmonella-typhi', 'salmonella-paratyphi-a', 'salmonella-enteritidis', 'shigella-flexneri', 'shigella-dysenteriae']
  },
  {
    id: 'tcbs',
    名称: 'TCBS 琼脂',
    类别: '选择与鉴别培养基',
    小节: [
      { 标题: '营养成分', 正文: '硫代硫酸盐-枸橼酸盐-胆盐 + 蔗糖 + 溴麝香草酚蓝/麝香草酚蓝指示剂，碱性 pH（约 8.6）。' },
      { 标题: '用途 / 原理', 正文: '选择培养弧菌（耐碱、耐胆盐）；发酵蔗糖者呈黄色——霍乱弧菌、溶藻弧菌、河弧菌、外来弧菌，部分肠球菌与嗜水气单胞菌亦可呈黄色；不发酵蔗糖者呈绿/蓝绿色——副溶血性弧菌、拟态弧菌及大部分创伤弧菌（少数创伤弧菌蔗糖阳性呈黄色，不能据颜色排除）。颜色仅供初筛，定种须靠生化/MALDI-TOF 与血清凝集。注意不可直接取 TCBS 菌落做氧化酶试验（含糖产酸易致假阴性），须转种血琼脂或营养琼脂后再测。' }
    ],
    关联: ['vibrio-cholerae', 'vibrio-parahaemolyticus', 'vibrio-vulnificus']
  },
  {
    id: 'mannitol-salt',
    名称: '甘露醇盐琼脂（MSA）',
    类别: '选择与鉴别培养基',
    小节: [
      { 标题: '营养成分', 正文: '7.5% 高浓度氯化钠（选择耐盐菌）+ 甘露醇 + 酚红（pH 指示）。' },
      { 标题: '用途 / 原理', 正文: '选择培养葡萄球菌（耐 7.5% 高盐）；发酵甘露醇产酸使周围培养基由红变黄，金黄色葡萄球菌典型呈黄色。但黄色≠金黄色葡萄球菌——腐生葡萄球菌等多种凝固酶阴性葡萄球菌同样可产黄色菌落；MSA 仅用于污染严重标本的筛选，可疑菌落均须经凝固酶或 MALDI-TOF 确认。' }
    ],
    关联: ['staph-aureus', 'staph-epidermidis', 'staph-saprophyticus', 'staph-haemolyticus', 'staph-lugdunensis']
  },
  {
    id: 'chromagar-candida',
    名称: '念珠菌显色培养基',
    类别: '选择与鉴别培养基',
    小节: [
      { 标题: '营养成分', 正文: '沙保罗样营养基础 + 含特异酶显色底物 + 抑菌剂（抑制细菌）。' },
      { 标题: '用途 / 原理', 正文: '据不同念珠菌的特异酶切割显色底物呈不同颜色，快速区分常见种：白念珠菌翠绿、热带念珠菌蓝灰、克柔念珠菌粉红毛糙，48 h 判读。仅为推测性鉴定且仅覆盖上述三种，耳念珠菌在普通显色基上无法区分，须用 CHROMagar Candida Plus 或 MALDI-TOF/测序确认。' }
    ],
    关联: ['candida-albicans', 'candida-tropicalis', 'candida-krusei', 'candida-glabrata', 'candida-parapsilosis', 'candida-auris']
  },

  // ===== 特殊培养基 =====
  {
    id: 'lj-medium',
    名称: '罗氏培养基（L-J）',
    类别: '特殊培养基',
    小节: [
      { 标题: '营养成分', 正文: '全蛋（卵磷脂/蛋白）、甘油、天门冬酰胺、马铃薯淀粉 + 孔雀绿（抑制杂菌）。' },
      { 标题: '用途 / 原理', 正文: '分枝杆菌固体培养；结核分枝杆菌生长缓慢（4–8 周），菌落干燥、颗粒状、乳酪/菜花样。' }
    ],
    关联: ['mycobacterium-tuberculosis']
  },
  {
    id: 'sda',
    名称: '沙保罗琼脂（SDA）',
    类别: '特殊培养基',
    小节: [
      { 标题: '营养成分', 正文: '葡萄糖（原始配方 4%）+ 蛋白胨，低 pH（≈5.6）；Emmons 改良配方降为 2% 葡萄糖、pH 6.9～7.0，为多数商品化 SDA 所用。常加氯霉素/庆大霉素抑制细菌，加放线菌酮抑制腐生霉菌。' },
      { 标题: '用途 / 原理', 正文: '低 pH 与高糖利于真菌、不利于多数细菌，是酵母菌与丝状真菌的通用分离培养基。注意放线菌酮会抑制隐球菌、毛霉/根霉、曲霉、镰刀菌与诺卡菌，疑似上述感染时必须同时接种不含放线菌酮的平板。' }
    ],
    关联: ['candida-albicans', 'candida-glabrata', 'candida-tropicalis', 'candida-krusei', 'candida-parapsilosis', 'candida-auris', 'cryptococcus-neoformans', 'aspergillus-fumigatus', 'aspergillus-flavus', 'aspergillus-niger', 'mucor', 'rhizopus', 'fusarium', 'nocardia']
  },
  {
    id: 'bcye',
    名称: 'BCYE 琼脂',
    类别: '特殊培养基',
    小节: [
      { 标题: '营养成分', 正文: '活性炭-酵母浸膏基础 + L-半胱氨酸 + 焦磷酸铁，ACES 缓冲（活性炭吸附毒性代谢物）。' },
      { 标题: '用途 / 原理', 正文: '军团菌专用——其生长必需 L-半胱氨酸与铁，普通血平板不生长；生长缓慢（3–5 天）。' }
    ],
    关联: ['legionella-pneumophila']
  },
  {
    id: 'bordet-gengou',
    名称: '鲍-金培养基',
    类别: '特殊培养基',
    小节: [
      { 标题: '营养成分', 正文: '马铃薯浸出液 + 甘油 + 兔血，加甲氧西林（或头孢氨苄）抑制杂菌。' },
      { 标题: '用途 / 原理', 正文: '百日咳鲍特菌的分离培养；生长缓慢（3～7 天），菌落细小（<1 mm）、隆起、光滑有光泽，呈"汞滴/珍珠"样，周围有狭窄的 β 溶血环。' }
    ],
    关联: ['bordetella-pertussis']
  },
  {
    id: 'thayer-martin',
    名称: 'Thayer-Martin 培养基',
    类别: '特殊培养基',
    小节: [
      { 标题: '营养成分', 正文: '巧克力琼脂基础 + VCNT 抗菌剂（万古霉素/多黏菌素/制霉菌素/甲氧苄啶），抑制杂菌与真菌。' },
      { 标题: '用途 / 原理', 正文: '选择性培养致病性奈瑟菌（淋病、脑膜炎），从含正常菌群的标本中分离。' }
    ],
    关联: ['neisseria-gonorrhoeae', 'neisseria-meningitidis']
  },
  {
    id: 'cin-agar',
    名称: 'CIN 琼脂',
    类别: '特殊培养基',
    小节: [
      { 标题: '营养成分', 正文: '甘露醇 + 中性红 + 头孢磺啶-Irgasan-新生霉素（CIN 选择剂）。' },
      { 标题: '用途 / 原理', 正文: '选择性分离小肠结肠炎耶尔森菌；须在 25～30℃（室温）孵育 24～48 h，35℃ 常规孵育易漏检。发酵甘露醇者呈红心透明边的"牛眼"样菌落，但气单胞菌菌落形态与之难以区分（氧化酶阳性可鉴别），沙雷菌、摩根菌、枸橼酸杆菌亦可生长（菌落更大），须进一步鉴定后报告。' }
    ],
    关联: ['yersinia-pestis']
  },
  {
    id: 'ashdown',
    名称: 'Ashdown 培养基',
    类别: '特殊培养基',
    小节: [
      { 标题: '营养成分', 正文: '甘油 + 结晶紫 + 中性红 + 庆大霉素（选择）。' },
      { 标题: '用途 / 原理', 正文: '类鼻疽伯克霍尔德菌的选择性培养；结晶紫与庆大霉素为抑制剂，菌落吸附中性红而呈紫色，18 h 仅针尖状，48 h 后扁平、干燥、皱缩，呈"向日葵头"样。37℃ 空气环境培养 4 天、每日观察后方可判阴性。疑似菌株按 BSL-3 防护在生物安全柜内操作，并送参考实验室确认与上报。' }
    ],
    关联: []
  },
  {
    id: 'anaerobic-blood-agar',
    名称: '厌氧血平板',
    类别: '特殊培养基',
    小节: [
      { 标题: '营养成分', 正文: '强化血琼脂 + 维生素 K₁ 与氯化血红素（厌氧菌生长所需），于厌氧环境培养。' },
      { 标题: '用途 / 原理', 正文: '分离专性厌氧菌（如梭菌、拟杆菌），常规与 LKV、BBE 等选择性厌氧平板配套接种；生长的菌落须同时转种需氧（或加 5% CO₂）环境做耐氧试验，需氧不生长方可判为专性厌氧菌。' }
    ],
    关联: ['clostridium-perfringens', 'clostridioides-difficile', 'clostridium-tetani', 'clostridium-botulinum', 'clostridium-septicum', 'bacteroides-fragilis', 'cutibacterium-acnes']
  },
  {
    id: 'mh-agar',
    名称: 'M-H 琼脂（Mueller-Hinton）',
    类别: '基础与营养培养基',
    小节: [
      { 标题: '营养成分', 正文: '牛肉浸出粉、酸水解酪蛋白、可溶性淀粉（吸附细菌代谢产生的抑制物）、琼脂；低胸腺嘧啶/胸苷以免拮抗磺胺类，并校准 Ca²⁺/Mg²⁺ 浓度。' },
      { 标题: '用途 / 原理', 正文: '抗菌药物敏感性试验（KB 纸片扩散法、E-test）的国际标准培养基：非选择性、批次间一致、pH 7.2–7.4、厚度约 4 mm 以保证药物扩散准确。苛养菌需换用增菌培养基：链球菌纸片法用 MHA 加 5% 脱纤维羊血（肺炎链球菌亦可用 MH-F）；嗜血杆菌用 HTM 或 MH-F 琼脂（MHA 加 5% 机械脱纤维马血与 20 μg/mL NAD）。注意加羊血的 MHA 胸苷含量偏高，β 溶血链球菌的甲氧苄啶-磺胺甲噁唑不能用琼脂法测定，否则假耐药。' }
    ],
    关联: ['kb-test', 'e-test', 'e-coli', 'staph-aureus', 'pseudomonas-aeruginosa']
  }

];
