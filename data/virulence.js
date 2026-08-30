window.DB = window.DB || {};
// 致病因素：按机制分类的病原毒力因子。关联指向携带菌与相关药物/试验（反向链接自动出现在对应页面）。
window.DB.virulence = [
  {
    id: 'adhesion-pili-fimbriae',
    名称: '黏附因子（菌毛/菌毛样结构）',
    英文: 'Adhesion factors (pili, fimbriae)',
    类别: '定植与黏附',
    小节: [
      { 标题: '机制', 正文: '病原菌以菌毛（fimbriae/pili）、非菌毛黏附素（如金黄色葡萄球菌的 MSCRAMM 家族、A 蛋白）等特异性结合宿主细胞表面受体，完成定植第一步。黏附决定组织亲嗜性：泌尿道致病性大肠埃希菌（UPEC）的 P 菌毛结合肾小管 Galα1-4Gal 受体（肾盂肾炎）、1 型菌毛结合膀胱甘露糖（膀胱炎）；霍乱弧菌 TCP 菌毛是肠道定植与 CTXφ 噬菌体受体；淋病奈瑟菌菌毛介导生殖道上皮黏附并抗拒冲洗。' },
      { 标题: '临床意义', 正文: '黏附是导尿管/中心导管相关感染的起始事件——生物膜形成的第一步；抗菌药物难以清除黏附态细菌。疫苗研发靶点（UPEC 菌毛疫苗在研）；甘露糖样分子（Mannoside）抑制 1 型菌毛为抗黏附治疗新思路。' }
    ],
    关联: ['e-coli', 'neisseria-gonorrhoeae', 'vibrio-cholerae', 'staph-epidermidis']
  },
  {
    id: 'capsule-antiphagocytosis',
    名称: '荚膜（抗吞噬）',
    英文: 'Capsule (antiphagocytic polysaccharide)',
    类别: '免疫逃逸',
    小节: [
      { 标题: '机制', 正文: '多糖荚膜遮蔽补体沉积与吞噬细胞识别，是经典抗吞噬毒力因子：肺炎链球菌荚膜（90+ 血清型）抑制 C3b 调理；金黄色葡萄球菌蛋白 A 结合 IgG Fc 段倒置调理；炭疽芽孢杆菌多谷氨酸荚膜；肺炎克雷伯菌 K1/K2 荚膜同时抵御补体与吞噬（高毒力株 hvKP 的 rmpA 调控过度产荚膜——拉丝试验阳性的分子基础）；新型隐球菌荚膜（GXM）兼具抗吞噬与免疫偏移。' },
      { 标题: '临床意义', 正文: '荚膜血清型决定疫苗设计：肺炎链球菌多糖结合疫苗（PCV13 覆盖 13 型）、脑膜炎奈瑟菌 ABCYW 疫苗、b 型流感嗜血杆菌（Hib）PRP 疫苗——疫苗时代 NTHi（无荚膜型）相对上升。Quellung 荚膜肿胀试验与乳胶凝集为经典分型手段。' }
    ],
    关联: ['strep-pneumoniae', 'staph-aureus', 'klebsiella-pneumoniae', 'cryptococcus-neoformans', 'haemophilus-influenzae']
  },
  {
    id: 'exotoxin-table',
    名称: '外毒素（细胞/组织损伤）',
    英文: 'Exotoxins',
    类别: '毒素',
    小节: [
      { 标题: '机制', 正文: '革兰阳性菌为主分泌的蛋白毒素，按作用分三类：①超抗原——金黄色葡萄球菌 TSST-1、肠毒素 A-E（非 MHC 限制性激活大量 T 细胞→细胞因子风暴）；②膜损伤毒素——溶血素（链球菌溶血素 O/S、产气荚膜梭菌 α 毒素/卵磷脂酶、李斯特溶血素 O）；③A-B 结构毒素——白喉毒素（ADP 核糖基化 EF-2）、破伤风痉挛毒素/肉毒神经毒素（锌蛋白酶裂解 SNARE 蛋白）、霍乱肠毒素（ADP 核糖基化 Gsα→cAMP→水电解质倾泻）、志贺毒素 Stx（核酸酶失活 60S）。' },
      { 标题: '临床意义', 正文: '毒素介导病是「抗菌+抗毒素」双线治疗的依据：白喉（抗毒素早用——毒素结合后不可逆）、TSS（克林霉素抑制毒素合成）、难辨梭菌（bezlotoxumab 抗毒素单抗）。EHEC O157:H7 的 Stx 致 HUS——抗生素诱导噬菌体溶源释放毒素，禁用。' }
    ],
    关联: ['staph-aureus', 'strep-pyogenes', 'corynebacterium-diphtheriae', 'clostridium-perfringens', 'vibrio-cholerae']
  },
  {
    id: 'endotoxin-lps',
    名称: '内毒素（LPS/Lipid A）',
    英文: 'Endotoxin (LPS, lipid A)',
    类别: '毒素',
    小节: [
      { 标题: '机制', 正文: '革兰阴性菌外膜脂多糖的脂质 A 部分，细菌裂解后释放：LPS→LBP→CD14/TLR4/MD2→NF-κB 级联→TNF-α/IL-1/IL-6/NO 大量释放→脓毒症休克（血管通透性↑、DIC、多器官衰竭）。与外毒素区别：耐热（100℃ 不灭活）、非特异性症状、无类毒素疫苗。鲎试验（LAL）定量检测。' },
      { 标题: '临床意义', 正文: '革兰阴性菌血症休克的病理核心；抗菌治疗杀灭细菌后内毒素释放可短暂加重反应（Jarisch-Herxheimer 样）。血液净化内毒素吸附柱（多黏菌素 B 灌流）用于难治性脓毒症休克。' }
    ],
    关联: ['e-coli', 'pseudomonas-aeruginosa', 'neisseria-meningitidis', 'polymyxin-b']
  },
  {
    id: 'invasion-enzymes',
    名称: '侵袭性酶',
    英文: 'Invasive enzymes (spreading factors)',
    类别: '侵袭与扩散',
    小节: [
      { 标题: '机制', 正文: '细菌分泌的胞外酶直接破坏组织屏障促进扩散：化脓性链球菌——透明质酸酶（水解基质）+链激酶（纤溶）+链道酶（DNA 液化脓液）+DNase，「侵袭性 GAS」快速坏死性筋膜炎的酶基础；产气荚膜梭菌胶原酶+透明质酸酶（气性坏疽沿肌束扩散）；金黄色葡萄球菌凝固酶（纤维蛋白屏障护菌）与葡萄球菌激酶（需要时溶解屏障转移）。' },
      { 标题: '临床意义', 正文: '侵袭性酶解释临床「捻发音」「沿筋膜快速蔓延」的体征；坏死性筋膜炎外科清创不可替代（药物无法到达无血供坏死区）。链道酶/链激酶曾用于临床溶栓治疗。' }
    ],
    关联: ['strep-pyogenes', 'clostridium-perfringens', 'staph-aureus']
  },
  {
    id: 'biofilm-formation',
    名称: '生物膜形成',
    英文: 'Biofilm formation',
    类别: '免疫逃逸',
    小节: [
      { 标题: '机制', 正文: '细菌黏附表面后分泌胞外多糖基质（PIA/PNAG、藻酸盐等）形成被膜群落：代谢缓慢的「持留菌」（persister）+物理屏障使抗生素渗透下降 100~1000 倍，并屏蔽补体与吞噬。表皮葡萄球菌（导管/人工关节）、金黄色葡萄球菌（慢性骨髓炎）、铜绿假单胞菌 CF 型（藻酸盐黏液型——慢性肺部定植的核心）、念珠菌（导管相关念珠菌血症）。群体感应（QS）系统协调膜内菌群行为。' },
      { 标题: '临床意义', 正文: '生物膜相关感染抗菌治愈率低——处理三原则：移除装置（导管拔除）、外科清创（骨髓炎死骨）、长疗程抑菌方案（利福平+氟喹诺酮联合穿透生物膜用于人工关节感染的保留尝试）。抗 QS/抗膜剂（EDTA、分散素 B）研究中。' }
    ],
    关联: ['staph-epidermidis', 'pseudomonas-aeruginosa', 'candida-albicans', 'rifampicin']
  },
  {
    id: 'antigenic-variation',
    名称: '抗原变异与免疫逃逸',
    英文: 'Antigenic variation',
    类别: '免疫逃逸',
    小节: [
      { 标题: '机制', 正文: '病原通过高频改变表面抗原逃避已建立免疫：淋病奈瑟菌菌毛/Opa 基因转换（重复感染不产生保护免疫——疫苗研发最大障碍）；流感病毒抗原漂移（点突变）/抗原转换（节段重排，大流行根源）；HIV 包膜糖蛋白高突变率；回归热疏螺旋体 Vmp 抗原切换（周期性热型机制）；锥虫 VSG。链球菌 M 蛋白分型（>200 型）与抗体型特异性是再感染基础。' },
      { 标题: '临床意义', 正文: '解释「感染后不免疫」的病原（淋病、链球菌咽炎可反复）；流感疫苗年度更新依据（WHO 南北半球毒株预测）；HIV 单靶点药物迅速耐药的进化基础（三联疗法原理）。' }
    ],
    关联: ['neisseria-gonorrhoeae', 'influenza-a', 'hiv', 'borrelia-burgdorferi', 'strep-pyogenes']
  },
  {
    id: 'siderophore-iron',
    名称: '铁载体与铁获取',
    英文: 'Siderophores and iron acquisition',
    类别: '营养竞争',
    小节: [
      { 标题: '机制', 正文: '宿主体内游离铁极低（转铁蛋白/乳铁蛋白螯合），病原分泌铁载体（siderophore）竞争性摄取铁：肠杆菌素（大肠/沙门，儿茶酚型，亲和力极高）、气杆菌素、铜绿假单胞菌 pyoverdin/pyochelin（荧光色素即铁载体复合物——King B 培养基荧光的分子本质）、耶尔森菌 yersiniabactin（鼠疫毒力质粒编码）。转铁蛋白受体直接掠夺宿主铁（淋病奈瑟菌/脑膜炎奈瑟菌 TbpA/B）。' },
      { 标题: '临床意义', 正文: '铁过载状态（血色病、反复输血）显著增加创伤弧菌/耶尔森菌等重症感染风险——补铁治疗期间的感染防范；铁载体通路为新型抗菌靶点（siderophore-抗生素「特洛伊木马」——头孢地尔的摄取机制）。' }
    ],
    关联: ['pseudomonas-aeruginosa', 'yersinia-pestis', 'vibrio-vulnificus', 'neisseria-meningitidis']
  },
  {
    id: 'type-iii-secretion',
    名称: 'III 型分泌系统（注射器装置）',
    英文: 'Type III secretion system (T3SS injectisome)',
    类别: '侵袭与扩散',
    小节: [
      { 标题: '机制', 正文: '革兰阴性菌的「分子注射器」：跨膜针状装置将效应蛋白直接注入宿主细胞胞浆。沙门菌/志贺菌 T3SS 诱导非吞噬细胞膜皱褶内吞（细菌进入上皮细胞）、志贺菌效应蛋白触发上皮细胞凋亡并跨细胞扩散；铜绿假单胞菌 ExoS/ExoU（急性肺炎毒力）；肠致病性大肠埃希菌（EPEC）T3SS 形成附着抹平效应（A/E 损伤）；耶尔森菌 Yop 抑制吞噬。' },
      { 标题: '临床意义', 正文: 'T3SS 缺失株毒力剧降——疫苗/药物靶点（T3SS 抑制剂在研）；解释志贺菌/沙门菌的细胞内致病与抗生素胞内浓度要求（氟喹诺酮/三代头孢细胞穿透佳）。' }
    ],
    关联: ['salmonella-typhi', 'shigella-sonnei', 'pseudomonas-aeruginosa', 'e-coli']
  },
  {
    id: 'intracellular-survival',
    名称: '胞内生存策略',
    英文: 'Intracellular survival',
    类别: '免疫逃逸',
    小节: [
      { 标题: '机制', 正文: '兼性胞内菌在吞噬细胞内生存复制：结核分枝杆菌阻断吞噬体-溶酶体融合（PtpA/SecA2）并抑制吞噬体酸化——肉芽肿隔离（免疫病理与免疫保护双刃剑）；李斯特菌溶血素 O 逃逸入胞浆（细胞间「弹弓」直接扩散，避开体液免疫）；军团菌 Dot/Icm（T4SS）改造吞噬体为复制巢（内质网样）；布鲁氏菌/柯克斯体在吞噬溶酶体酸性区内抵抗杀伤（Coxiella 需酸性 pH 才复制——培养模拟依据）。' },
      { 标题: '临床意义', 正文: '胞内菌共同治疗特点：细胞内活性的药物（利福平/氟喹诺酮/大环内酯/四环素类）优于单纯β-内酰胺（胞内浓度低）；复发倾向与长疗程依据（布鲁氏病 6 周联合、结核 6 个月）；细胞免疫（Th1/IFN-γ）而非抗体是保护免疫——HIV 患者胞内菌感染加重的免疫学解释。' }
    ],
    关联: ['mycobacterium-tuberculosis', 'listeria-monocytogenes', 'legionella-pneumophila', 'brucella-melitensis', 'coxiella']
  },
  {
    id: 'quorum-sensing',
    名称: '群体感应（QS）',
    英文: 'Quorum sensing',
    类别: '调节系统',
    小节: [
      { 标题: '机制', 正文: '细菌以信号分子密度感知种群规模、协调群体行为（毒力按需表达而非持续暴露）：革兰阴性菌 AHL 酰基高丝氨酸内酯类（铜绿假单胞菌 Las/Rhl 级联调控弹力蛋白酶/绿脓菌素/生物膜）；革兰阳性菌寡肽信息素（金黄色葡萄球菌 agr 系统调控毒素分泌——高密度时切换为毒素表型）；AI-2 种间通用信号。霍乱弧菌 QS 低密度表达毒力、高密度表达扩散。' },
      { 标题: '临床意义', 正文: 'QS 抑制（抗毒力治疗）不杀细菌、无选择压力——耐药时代新思路（研究阶段）；agr 功能缺失的金葡菌株持续生物膜表型（慢性感染分离株常见）。' }
    ],
    关联: ['pseudomonas-aeruginosa', 'staph-aureus', 'vibrio-cholerae']
  },
  {
    id: 'iga-protease',
    名称: 'IgA 蛋白酶（黏膜免疫逃逸）',
    英文: 'IgA protease (mucosal immune evasion)',
    类别: '免疫逃逸',
    小节: [
      { 标题: '机制', 正文: '黏膜表面 slgA 是黏膜免疫第一道防线，病原菌分泌 IgA 蛋白酶（以 IgA1 为底物，铰链区特异性裂解）使抗体失去交联聚集细菌的能力：淋病奈瑟菌、脑膜炎奈瑟菌（致病物质含 IgA1 蛋白酶）、流感嗜血杆菌、肺炎链球菌、脲原体等均产 IgA 蛋白酶（脲原体的编码基因尚未在基因组中识别出来，但可检测到该酶活性并经尿素水解释放氨）。变形杆菌属各种蛋白水解酶对 IgA 也有高度水解活性，是促进感染扩散、逃避免疫攻击的毒力因子。' },
      { 标题: '临床意义', 正文: 'IgA 蛋白酶解释了这些病原为何能长期定植黏膜（鼻咽、尿道）而局部抗体不足以清除；slgA 缺乏患者反复黏膜感染（慢性腹泻、呼吸道感染）的对照说明黏膜抗体的重要性。检测层面：IgA 蛋白酶活性曾用于奈瑟菌属内鉴别的研究工具，常规实验室不检测，意义在于理解「带菌/定植」状态。' }
    ],
    关联: ['neisseria-gonorrhoeae', 'neisseria-meningitidis', 'haemophilus-influenzae', 'strep-pneumoniae', 'proteus-vulgaris', 'ureaplasma-urealyticum']
  },
  {
    id: 'pvl-leukocidin',
    名称: '杀白细胞素（PVL）',
    英文: 'Panton-Valentine leukocidin (PVL)',
    类别: '毒素',
    小节: [
      { 标题: '机制', 正文: 'PVL 是金黄色葡萄球菌的打孔毒素（pore-forming cytotoxin），由 lukS-PV/lukF-PV 基因编码（携带于前噬菌体），具有强效细胞溶解及炎症活性——攻击中性粒细胞与巨噬细胞细胞膜，形成孔道致细胞溶解。CA-MRSA（社区相关 MRSA）更可能携带 PVL，但 PVL 拥有权不限于 CA-MRSA：许多流行的 MSSA 谱系也携带 PVL 基因（非洲人群中 PVL 阳性 MSSA 患病率很高）；LA-MRSA（家畜相关）中 PVL 及免疫逃逸簇基因典型阴性。' },
      { 标题: '临床意义', 正文: 'PVL 阳性菌株与皮肤软组织感染（脓肿、坏死性筋膜炎）、坏死性肺炎相关——呼吸道病毒感染（最常见流感）后，PVL 阳性的 MRSA/MSSA 坏死性肺炎在年轻健康儿童中可为致命性疾病。检测：培养物中 PVL 编码基因可经 RIDA GENE PVL 试剂盒单项检测，或作为 GenoType Staphylococcus/MRSA 测试板的一部分；表型方法有 ELISA、免疫层析侧流试验。常规实验室不强制检测，重症坏死性肺炎/反复脓肿流行病学调查时送检。' }
    ],
    关联: ['staph-aureus', 'influenza-a']
  },
  {
    id: 'complement-resistance',
    名称: '补体抵抗（血清杀菌作用抵抗）',
    英文: 'Complement resistance (serum bactericidal activity)',
    类别: '免疫逃逸',
    小节: [
      { 标题: '机制', 正文: '革兰阴性菌血症须先逃过血清补体级联（膜攻击复合物 MAC 插入外膜）：①脑膜炎奈瑟菌——H 因子结合蛋白（fHbp）结合补体 H 因子下调替代途径、可用作新一代流脑疫苗覆盖率分析的靶标；包膜/荚膜与脂寡糖唾液酸化协同；晚期补体缺陷（含依库珠单抗 eculizumab 用药后）、脾切除患者 IMD 风险显著升高（对照说明补体的保护作用）；②b 型流感嗜血杆菌——荚膜天然抗吞噬，无抗荚膜抗体时细菌大量繁殖、浓度超阈值即播散（脑膜、关节、心包）；③狗咬/犬咬二氧化碳噬纤维菌——抵抗巨噬细胞吞噬及补体与白细胞杀伤，并使巨噬细胞不能产生炎性细胞因子（脾切除/酗酒者暴发性败血症、DIC 的机制基础）。' },
      { 标题: '临床意义', 正文: '补体抵抗是把「定植菌」变成「侵入性病原」的关键一步——携带率（脑膜炎奈瑟菌约 10% 鼻咽定植）与发病率（IMD 仅小部分）的差距由此解释。血清杀菌试验（SBA，体外用幼兔或人补体）是流脑疫苗保护评估的最佳替代试验。反复侵袭性奈瑟菌感染应查补体（晚期补体成分 C5-C9）缺陷。' }
    ],
    关联: ['neisseria-meningitidis', 'haemophilus-influenzae', 'capnocytophaga-canimorsus']
  },
  {
    id: 'internalin-invasion',
    名称: '内化素与侵袭性蛋白',
    英文: 'Internalin and invasive proteins',
    类别: '侵袭与扩散',
    小节: [
      { 标题: '机制', 正文: '「主动钻入」非吞噬细胞的分子工具：单核细胞性李斯特菌毒力基因集聚在一个 8.2 kb 毒力岛上，内化蛋白 A/B（InlA/InlB）介导侵入宿主肠道上皮细胞——InlA 与上皮钙黏蛋白（滋养层受体）相互作用促进母体向胎儿传播（妊娠李斯特菌病）；李斯特溶胞素（溶血素）介导胞内逃逸与肌动蛋白弹弓扩散。志贺菌 IpaB、IpaC 等侵袭性蛋白帮助细菌向邻近细胞扩散（T3SS 效应蛋白）；EPEC 经 LEE 毒力岛编码的紧密黏附素（intimin，eae 基因）与 T3SS 造成 A/E 附着抹平损伤。' },
      { 标题: '临床意义', 正文: '分子检测层面：EPEC 确认采用 eae 基因（编码 intimin 黏附因子）PCR 或 LEE 毒力岛基因检测；EIEC 侵袭力验证用细胞培养侵袭试验或 ipaC/ipaH 基因 PCR。李斯特菌病「越过血胎/血脑屏障」的能力与 InlA/InlB 直接相关——孕妇、新生儿、免疫抑制、老年高危人群的食品安全宣教（即食食品、未灭菌乳制品）是预防核心。' }
    ],
    关联: ['listeria-monocytogenes', 'shigella-flexneri', 'e-coli', 'type-iii-secretion']
  }
];
