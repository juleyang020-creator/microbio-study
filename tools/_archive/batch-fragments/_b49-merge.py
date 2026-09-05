#!/usr/bin/env python3
# 批49 合并（幂等）：14 种五文件接线 + 速查表补 5 条（按全局拉丁序锚插）
ROOT = '/Users/juleyang/Projects/微生物学习软件/'

def append_push(src, dst, marker):
    with open(ROOT+src, encoding='utf-8') as f: block = f.read().strip()
    with open(ROOT+dst, encoding='utf-8') as f: content = f.read()
    if marker in content:
        print(dst, 'push 块已存在，跳过'); return
    assert content.rstrip().endswith(');')
    content = content.rstrip() + '\n\n' + block + '\n'
    with open(ROOT+dst, 'w', encoding='utf-8') as f: f.write(content)
    print('push 追加:', dst)

def merge_literal(src, dst, marker_id):
    with open(ROOT+src, encoding='utf-8') as f: frag = f.read().strip()
    with open(ROOT+dst, encoding='utf-8') as f: content = f.read()
    if ('"'+marker_id+'":') in content:
        print(dst, marker_id, '已存在，跳过'); return
    lines = [l for l in frag.split('\n') if not l.startswith('//')]
    frag2 = '\n'.join(lines).strip()
    content = content.rstrip()
    assert content.endswith('};')
    content = content[:-2].rstrip()
    if not content.endswith(','): content += ','
    content += '\n\n' + frag2 + '\n};\n'
    with open(ROOT+dst, 'w', encoding='utf-8') as f: f.write(content)
    print('字面量合并:', dst)

append_push('tools/_b49a-microbes.js', 'data/microbes-fungi.js', '// 批49 上段')
append_push('tools/_b49b-microbes.js', 'data/microbes-fungi.js', '// 批49 下段')
merge_literal('tools/_b49-morph.js', 'data/morphology.js', 'exophiala-dermatitidis')
merge_literal('tools/_b49-diff.js', 'data/differential.js', 'exophiala-dermatitidis')
merge_literal('tools/_b49-biochem.js', 'data/biochem.js', 'exophiala-dermatitidis')

# 速查表补 5 条（不带 MALDI）：棒状弯孢霉/球孢枝孢霉/草本枝孢霉/烂木歪嘴座壳霉/黑葡萄穗霉
with open(ROOT+'data/microbe-names.js', encoding='utf-8') as f: names = f.read()
adds = [
  # (新拉丁名, 新中文名, 紧前锚拉丁名=锚条目的拉丁名唯一串)
  ('Curvularia clavata', '棒状弯孢霉', 'C.americana'),
  ('Cladosporium sphaerospermum', '球孢枝孢霉', '枝孢样枝孢霉'),
  ('Cladosporium herbarum', '草本枝孢霉', 'Phoma herbarum'),  # 锚需再核，见下
  ('Pleurostoma richardsiae', '烂木歪嘴座壳霉', '匍匐斜嘴座壳'),
  ('Stachybotrys chartarum', '黑葡萄穗霉', None),  # 无锚则全局字母序插入
]
import re, json
entries = re.findall(r'\{"名称":"[^"]*","拉丁名":"[^"]*"(?:,[^{}]*)?\}', names)
def lat(e):
    m=re.search(r'"拉丁名":"([^"]*)"',e); return m.group(1)
# 需要补的条目列表
new_items = [
  {'名称':'棒状弯孢霉','拉丁名':'Curvularia clavata'},
  {'名称':'球孢枝孢霉','拉丁名':'Cladosporium sphaerospermum'},
  {'名称':'草本枝孢霉','拉丁名':'Cladosporium herbarum'},
  {'名称':'烂木歪嘴座壳霉','拉丁名':'Pleurostoma richardsiae'},
  {'名称':'黑葡萄穗霉','拉丁名':'Stachybotrys chartarum'},
]
added=0
for it in new_items:
    if ('"拉丁名":"%s"'%it['拉丁名']) in names:
        print('速查已有', it['拉丁名']); continue
    # 全局紧前锚：现有条目拉丁名中 < 新拉丁名 的最大者（字符串序）
    # 拉丁名写法不一（缩写式），用「排序键 = 小写全串」近似；对缩写条目按字面排序
    key = it['拉丁名'].lower()
    prev = None
    for e in entries:
        l = lat(e)
        if l.lower() < key and (prev is None or l.lower() > lat(prev).lower()):
            prev = e
    newjson = json.dumps(it, ensure_ascii=False, separators=(',',':'))
    # json.dumps 键序=插入序：名称/拉丁名 ✓
    if prev:
        names = names.replace(prev, prev + ',' + newjson, 1)
    else:
        names = names.replace('[', '[' + newjson + ',', 1)
    added+=1
    print('速查补:', it['拉丁名'], '锚:', lat(prev) if prev else '(队首)')
with open(ROOT+'data/microbe-names.js', 'w', encoding='utf-8') as f: f.write(names)
print('速查共补', added, '条')
print('批49 合并完成')
