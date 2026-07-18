window.DB = window.DB || {};
// 真实形态学图片：来自美国 CDC 公共卫生图像库 PHIL（phil.cdc.gov / wwwn.cdc.gov/phil）。
// 所选图片在 PHIL 详情页均明确标注 "Copyright Restrictions: None - This image is in the
// public domain and thus free of any copyright restrictions."（已逐张核对）。
// 图片为 PHIL 提供的低分辨率版（约 700px 宽），适合教学辨认并可随应用离线缓存。
// 结构：微生物 id → [{ 文件, 说明(中), 英文说明(PHIL 原文摘录), 供图, 摄影, PHIL(图像ID) }]
window.DB.photos = {
 "staph-aureus": [
  {
   "文件": "img/photo-staph-aureus-26014.jpg",
   "说明": "革兰阳性球菌，成葡萄串状簇集（Brown & Brenn 组织革兰染色，1280×）",
   "英文说明": "This photomicrograph, captured at a magnification of 1280X, shows a Brown & Brenn-stained specimen containing numerous coccoid bacteria of Staphylococcus aureus .",
   "供图": "CDC/ Dr. Martin Hicklin",
   "摄影": "",
   "PHIL": "26014"
  }
 ],
 "e-coli": [
  {
   "文件": "img/photo-e-coli-24573.jpg",
   "说明": "革兰阴性杆菌（革兰染色，1125×）",
   "英文说明": "Under 1125X magnification, this photomicrograph of a Gram-stained specimen highlights the morphology of numerous Gram-negative, rod-shaped Escherichia coli bacteria.",
   "供图": "CDC/ K. Skogstad",
   "摄影": "",
   "PHIL": "24573"
  }
 ],
 "klebsiella-pneumoniae": [
  {
   "文件": "img/photo-klebsiella-pneumoniae-6690.jpg",
   "说明": "血平板菌落：黏液样、易拉丝",
   "英文说明": "This blood agar plate (BAP) grew colonies of Gram-negative, small rod-shaped and facultatively anaerobic Klebsiella pneumoniae bacteria.",
   "供图": "CDC/ Dr. Theo. Hawkins",
   "摄影": "",
   "PHIL": "6690"
  },
  {
   "文件": "img/photo-klebsiella-pneumoniae-6689.jpg",
   "说明": "麦康凯平板：乳糖发酵呈粉红色黏液样菌落",
   "英文说明": "This inoculated MacConkey agar culture plate cultivated colonial growth of Gram-negative, small rod-shaped, and facultatively anaerobic, Klebsiella pneumoniae bacteria.",
   "供图": "CDC/ Dr. Theo. Hawkins",
   "摄影": "",
   "PHIL": "6689"
  }
 ],
 "pseudomonas-aeruginosa": [
  {
   "文件": "img/photo-pseudomonas-aeruginosa-17370.jpg",
   "说明": "革兰阴性杆菌（革兰染色）",
   "英文说明": "This photomicrograph of a Gram-stained specimen, revealed the presence of numerous, Gram-negative, Pseudomonas aeruginosa bacteria.",
   "供图": "CDC/ Dr. W.A. Clark",
   "摄影": "",
   "PHIL": "17370"
  },
  {
   "文件": "img/photo-pseudomonas-aeruginosa-6688.jpg",
   "说明": "血平板菌落：可见色素与特征性生长",
   "英文说明": "This photograph depicts the colonial growth pattern displayed by Pseudomonas aeruginosa bacteria, also known as Bacillus pyocyaneus , growing on a blood agar plate (BAP).",
   "供图": "CDC/ Dr. Theo. Hawkins",
   "摄影": "",
   "PHIL": "6688"
  }
 ],
 "acinetobacter-baumannii": [
  {
   "文件": "img/photo-acinetobacter-baumannii-17069.jpg",
   "说明": "培养菌落形态（10× 体视镜）",
   "英文说明": "Under the low-power magnification of 10X, using a digital Keyence scope, this photograph depicts the colonial growth displayed by the Gram-negative bacterium, Acinetobacter baumannii , which were cultured on xylose-lysine-deoxycholate (XLD)",
   "供图": "CDC/ Todd Parker, Ph.D., Assoc Director for Laboratory Science, Div of Preparedness and Emerging Infections at CDC",
   "摄影": "Todd Parker, Ph.D., Assoc Director for Laboratory Science, Div of Preparedness and Emerging Infections at CDC",
   "PHIL": "17069"
  }
 ],
 "strep-pneumoniae": [
  {
   "文件": "img/photo-strep-pneumoniae-21342.jpg",
   "说明": "革兰阳性矛尖状双球菌（革兰染色印片，1700×）",
   "英文说明": "Under a magnification of 1700X, this Gram-stained impression smear specimen, revealed a number of Gram-positive, Streptococcus pneumoniae diplococcal bacteria, which were amongst some other cellular debris. This specimen was harvested from ",
   "供图": "CDC/ Arnold Kaufman",
   "摄影": "",
   "PHIL": "21342"
  }
 ],
 "enterococcus-faecalis": [
  {
   "文件": "img/photo-enterococcus-faecalis-2646.jpg",
   "说明": "琼脂平板培养菌落（药敏试验中）",
   "英文说明": "Here, Enterococcus faecalis , formerly known as Streptococcus faecalis , bacteria were being cultured on an agar plate during a drug-sensitivity test in an anaerobic environment. E. faecalis , a facultative anaerobe, is a normal inhabitant ",
   "供图": "CDC/ Don Stalons",
   "摄影": "",
   "PHIL": "2646"
  }
 ],
 "candida-albicans": [
  {
   "文件": "img/photo-candida-albicans-30264.jpg",
   "说明": "芽管形成（germ tube），血清 37℃ 培养",
   "英文说明": "This photomicrograph shows the morphology of the fungal organism Candida albicans , including the presence of germ tubes.",
   "供图": "CDC/ Dr. C.D. Webb",
   "摄影": "",
   "PHIL": "30264"
  },
  {
   "文件": "img/photo-candida-albicans-26603.jpg",
   "说明": "玉米粉琼脂：厚壁孢子与假菌丝（475×）",
   "英文说明": "Under 475X magnification, this photomicrograph highlights morphologic features of the fungal organism Candida albicans , cultivated on cornmeal agar. Note round, thick-walled chlamydospores (chlamydoconidia) forming along the length of the ",
   "供图": "CDC/ Dr. Lucille K. Georg",
   "摄影": "",
   "PHIL": "26603"
  }
 ],
 "haemophilus-influenzae": [
  {
   "文件": "img/photo-haemophilus-influenzae-23029.jpg",
   "说明": "革兰阴性球杆菌（数字着色镜检图）",
   "英文说明": "This digitally-colorized photomicrograph depicted numerous, Gram-negative, Haemophilus influenzae coccobacilli.",
   "供图": "CDC/ William B. Cherry, Ph.D.",
   "摄影": "",
   "PHIL": "23029"
  }
 ],
 "strep-pyogenes": [
  {
   "文件": "img/photo-strep-pyogenes-8173.jpg",
   "说明": "含 5% 羊血胰酶大豆琼脂：β 溶血环（100×）",
   "英文说明": "Magnified 100x, this 1977 photograph depicted a Petri dish filled with trypticase soy agar medium, containing 5% defibrinated sheep's blood. After having been inoculated by streaking the surface with Group A Streptococcus pyogenes (GAS) bac",
   "供图": "CDC/ Richard R. Facklam, Ph.D.",
   "摄影": "",
   "PHIL": "8173"
  }
 ]
};
