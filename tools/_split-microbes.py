#!/usr/bin/env python3
"""重构：data/microbes.js（5176 行/505KB）按类别域拆分为多个小文件。
保持架构约束：纯 script 标签 + window.DB 模式，无 fetch/module。
拆分方案：microbes.js（头部+基础结构，数组开头）→ microbes-b1..bN.js（push 块按类域分组）。
其实更简单的方案：保持单文件但按 push 块重排+分节注释。这里执行「按域拆文件」：
- data/microbes.js         —— window.DB.microbes = [ 原第一个 push 块前的初始数组 ]（保留最小骨架）
- data/microbes-gp.js      —— G+球菌（葡萄球菌/链球菌/肠球菌/气球菌群…）
- data/microbes-gn.js      —— G-杆菌（肠杆菌/非发酵/弧菌…）
- data/microbes-anaerobe.js—— 厌氧菌
- data/microbes-atypical.js—— 苛养/胞内/人畜共患/螺旋体
- data/microbes-fungi.js   —— 真菌（酵母+双相+丝状）
- data/microbes-virus.js   —— 病毒
- data/microbes-parasite.js—— 寄生虫
拆分按条目的「类别」字段映射到域文件；无法映射的进 microbes-misc.js。
每个域文件是 window.DB.microbes.push( ... ); 块——完全兼容现有加载模式。
"""
import re, json, subprocess, sys

SRC = 'data/microbes.js'
s = open(SRC).read()

# 1) 解析：初始数组段（window.DB.microbes = [ ... ];）与后续 push 块
m0 = re.search(r'window\.DB\.microbes\s*=\s*\[', s)
start = m0.start()
# 找初始数组的闭合 '];'——用括号平衡扫描（忽略字符串）
def find_close(text, open_idx):
    depth = 0; i = open_idx; in_str = False
    while i < len(text):
        c = text[i]
        if in_str:
            if c == "'" and text[i-1] != '\\': in_str = False
            i += 1; continue
        if c == "'": in_str = True
        elif c == '[': depth += 1
        elif c == ']':
            depth -= 1
            if depth == 0: return i
        i += 1
    return -1

arr_open = s.index('[', start)
arr_close = find_close(s, arr_open)
init_block = s[:arr_close+1] + ';\n'

# 2) 解析全部条目对象（初始数组 + 每个 push 块的参数）——用 require 让 Node 解析，别用正则
node_script = '''
global.window={};
require('./data/microbes.js');
const ms = window.DB.microbes;
const out = ms.map(m => JSON.stringify(m));
require('fs').writeFileSync('/tmp/all_microbes.jsonl', out.join('\\n'));
console.log('total', ms.length);
'''
r = subprocess.run(['node', '-e', node_script], capture_output=True, text=True)
print(r.stdout, r.stderr)
lines = open('/tmp/all_microbes.jsonl').read().strip().split('\n')
microbes = [json.loads(l) for l in lines]
print('解析条目', len(microbes))

# 3) 类别→域映射
DOMAIN = []
def dom(*cats): DOMAIN.append((cats, 'gp' if False else None))
GP = ['葡萄球菌属','链球菌属','肠球菌属','气球菌属','孪生球菌属','乳球菌属','明串珠菌属','魏斯菌属','片球菌属','创伤球菌属','微球菌属','库克菌属','皮生球菌属','皮肤球菌属','动性球菌属','费克蓝姆菌属','圆短链菌属','懒惰菌属','罗斯菌属','乏养菌属','颗粒链菌属']
GN = ['埃希菌属','志贺菌属','沙门菌属','柠檬酸杆菌属','克雷伯菌属','肠杆菌属','哈夫尼亚菌属','沙雷菌属','变形杆菌属','摩根菌属','普罗威登斯菌属','耶尔森菌属','爱德华菌属','克罗诺杆菌属','西地西菌属','泛菌属','克吕沃尔菌属','光杆状菌属','致病杆菌属','米勒菌属','拉恩菌属','塔特姆菌属','布戴维采菌属','勒米诺菌属','欧文菌属','勒克菌属','假单胞菌属',' Burkholderia','伯克霍尔德菌属','窄食单胞菌属','不动杆菌属','产碱杆菌属','无色杆菌属','金黄杆菌属','伊丽莎白金菌属','稳杆菌属','希瓦菌属','色杆菌属','鞘氨醇单胞菌属','鞘氨醇杆菌属','短波单胞菌属','黄杆菌属','根瘤菌属','食酸菌属','伯杰菌属','凯斯特菌属','假苍白杆菌属','潘多拉菌属','贪铜菌属','罗尔斯顿菌属','代尔夫特菌属','威克斯菌属','寡源菌属','巴尔通体属','布鲁氏菌属','巴斯德菌属','放线杆菌属','二氧化碳噬纤维菌属','奈瑟菌属','莫拉菌属','金氏菌属','艾肯菌属','嗜血杆菌属','聚集杆菌属','鲍特菌属','军团菌属','弧菌属','气单胞菌属','邻单胞菌属','螺杆菌属','弯曲菌属','弓形杆菌属','海鸥菌属','萨顿菌属','阿菲波菌属','念珠状链杆菌属','色杆菌属','血液杆菌属','乌鲁布路菌属','新鞘氨醇菌属','致癌菌属','玫瑰单胞菌属','金色单胞菌属','黄色单胞菌属','异地菌属','涅斯捷连科菌属','土壤杆菌属','嗜冷杆菌属',' 博德特菌']
ANA = ['拟杆菌属','普雷沃菌属','卟啉单胞菌属','梭菌属','消化链球菌属','消化球菌属','韦荣球菌属','氨基酸球菌属','巨球菌属','丙酸杆菌属','双歧杆菌属','真杆菌属','乳杆菌属','埃格特菌属','梭杆菌属','纤毛菌属','沃林菌属','萨顿菌属','嗜胆菌属','副杆菌属','罕见厌氧菌属','蛛网菌属','放线菌属',' Mobiluncus','动弯杆菌属',' Solobacterium',' Tissierella',' 泰泽菌属',' FILIFACTOR','产线菌属',' BULLEIDIA',' 假分枝杆菌属']
ATYP = ['分枝杆菌属','诺卡菌属','红球菌属','戈登菌属','冢村菌属','链霉菌属','马杜拉放线菌属','拟诺卡菌属','皮杆菌属','厄氏菌属','纤维单胞菌属','微杆菌属','库特菌属','苏黎世菌属','隐秘杆菌属','加德纳菌属','弯曲杆菌属','螺杆菌属','军团菌属','衣原体属','支原体属','脲原体属','立克次体属','东方体属','埃里希体','无形体','柯克斯体','密螺旋体属','疏螺旋体属','钩端螺旋体属','布鲁菌','弗朗西斯菌属','巴尔通体','土拉菌']
FUNGI = ['念珠菌属','隐球菌属','曲霉属','毛霉属','根霉属','根毛霉属','横梗霉属','犁头霉属','小克银汉霉属','壶霉菌属','鳞质霉属','科克霉属','蛙粪霉属','耳霉属','接霉属','瓶霉属','外瓶霉属','枝孢瓶霉属','枝孢霉属','弯孢霉属','毛壳菌属','赭霉属','链格孢属','茎点霉属','白僵菌属','枝顶孢属','帚霉属','拟青霉属','青霉属','镰刀菌属','赛多孢属','镰刀菌','酒香菌属','短梗霉属','离蠕孢属','单端孢属','节菱孢霉属','轮枝孢霉属','节纹菌属','棒孢霉属','葡萄穗孢霉属','新柱顶孢属','射盾子囊霉属','吊霉属','小囊菌属','黏帚霉属','昂枝霉属','孢子丝菌属','芽生菌属','球孢子菌属','组织胞浆菌属','副球孢子菌','马尔尼菲','青霉属','酵母属','红酵母属','地霉属','拉钱斯菌属','毕赤酵母属','新伊蒙菌属','着色霉属','喙枝孢属','新柱顶孢','腐霉菌属','肺孢子菌属','皮肤癣菌','毛癣菌属','小孢子菌属','表皮癣菌属','癣菌',' 曲霉属','假丝酵母']
VIRUS_PREFIX = ['病毒','流感','肝发','HBV','HCV']
PARA = ['疟原虫','溶组织内阿米巴','贾第','毛滴虫','利什曼','弓形虫','隐孢子虫','环孢子虫','等孢子球虫','巴贝虫','棘阿米巴','福氏耐格里','结肠小袋','芽囊','绦虫','吸虫','线虫','蛔虫','钩虫','蛲虫','鞭虫','旋毛虫','丝虫','血吸虫','肝吸虫','肺吸虫','姜片虫','猪带','牛带','包虫','曼氏','疥螨','蠕形螨','蝇蛆']

def domain_of(cat):
    cat = cat or ''
    if any(cat.startswith(p) for p in PARA) or cat in ('原虫','蠕虫'): return 'parasite'
    if cat in FUNGI or '真菌' in cat or '酵母' in cat: return 'fungi'
    if cat in GP: return 'gp'
    if cat in GN or '肠杆菌' in cat: return 'gn'
    if cat in ANA: return 'anaerobe'
    if cat in ATYP: return 'atypical'
    # 病毒/未匹配按名称兜底
    return 'misc'

groups = {}
for m_ in microbes:
    d = domain_of(m_.get('类别', ''))
    groups.setdefault(d, []).append(m_)

print({k: len(v) for k, v in groups.items()})
# 4) 写域文件
ORDER = ['gp','gn','anaerobe','atypical','fungi','misc']
NAMES = {'gp':'gram-positive','gn':'gram-negative','anaerobe':'anaerobe','atypical':'atypical','fungi':'fungi','misc':'misc'}
for d in ORDER:
    arr = groups.get(d, [])
    if not arr: continue
    path = f'data/microbes-{NAMES[d]}.js'
    with open(path, 'w') as f:
        f.write('// 自动拆分自 data/microbes.js（tools/_split-microbes.py）——按类域分文件，push 模式加载\n')
        f.write('window.DB.microbes.push(\n')
        for i, m_ in enumerate(arr):
            js = json.dumps(m_, ensure_ascii=False, indent=1)
            f.write(js + (',\n' if i < len(arr)-1 else '\n'))
        f.write(');\n')
    print('写', path, len(arr), '条')

# 5) 骨架文件：只留初始赋值（空数组）——原 microbes.js 内容全部迁走
with open('data/microbes.js', 'w') as f:
    f.write('// 微生物主数据骨架：条目按类域拆分在 microbes-*.js（tools/_split-microbes.py 生成）\n')
    f.write('window.DB = window.DB || {};\n')
    f.write('window.DB.microbes = [];\n')
print('骨架重写完成')
