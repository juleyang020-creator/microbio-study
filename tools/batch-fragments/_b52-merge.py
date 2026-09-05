#!/usr/bin/env python3
# 批52 合并（幂等）：12 种五文件接线 + 速查补条 + categories 补 2 叶
import re, json
ROOT = '/Users/juleyang/Projects/微生物学习软件/'

def append_push(src, dst, marker):
    with open(ROOT+src, encoding='utf-8') as f: block = f.read().strip()
    with open(ROOT+dst, encoding='utf-8') as f: content = f.read()
    if marker in content:
        print(dst, 'push 已存在，跳过'); return
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

append_push('tools/_b52-microbes.js', 'data/microbes-parasite.js', '// 批52')
merge_literal('tools/_b52-morph.js', 'data/morphology.js', 'naegleria-fowleri')
merge_literal('tools/_b52-diff.js', 'data/differential.js', 'naegleria-fowleri')
merge_literal('tools/_b52-biochem.js', 'data/biochem.js', 'naegleria-fowleri')

# categories 补 2 叶：耐格里阿米巴属、缨滴虫属（插在内阿米巴属叶子后）
with open(ROOT+'data/categories.js', encoding='utf-8') as f: cat = f.read()
anchor = '"名称": "内阿米巴属"\n            }'
if '"名称": "耐格里阿米巴属"' not in cat:
    add = anchor + ',\n            {\n              "名称": "耐格里阿米巴属"\n            },\n            {\n              "名称": "缨滴虫属"'
    assert anchor in cat, '锚不在'
    cat = cat.replace(anchor, add, 1)
    print('categories 补: 耐格里阿米巴属 + 缨滴虫属')
with open(ROOT+'data/categories.js', 'w', encoding='utf-8') as f: f.write(cat)

# 速查补条（拉丁序锚插）
with open(ROOT+'data/microbe-names.js', encoding='utf-8') as f: names = f.read()
entries = re.findall(r'\{"名称":"[^"]*","拉丁名":"[^"]*"(?:,[^{}]*)?\}', names)
def lat(e):
    m=re.search(r'"拉丁名":"([^"]*)"',e); return m.group(1)
def tkey(l): return re.sub(r'[^a-z]','',l.lower())
new_items = [
  {'名称':'蠊缨滴虫','拉丁名':'Lophomonas blattarum'},
  {'名称':'布氏姜片吸虫','拉丁名':'Fasciolopsis buski'},
  {'名称':'曼氏迭宫绦虫','拉丁名':'Spirometra mansoni'},
  {'名称':'微小膜壳绦虫','拉丁名':'Hymenolepis nana'},
  {'名称':'缩小膜壳绦虫','拉丁名':'Hymenolepis diminuta'},
]
added=0
for it in new_items:
    if ('"拉丁名":"%s"'%it['拉丁名']) in names:
        print('速查已有', it['拉丁名']); continue
    key = tkey(it['拉丁名'])
    prev = None
    for e in entries:
        l = lat(e)
        if tkey(l) < key and (prev is None or tkey(l) > tkey(lat(prev))):
            prev = e
    newjson = json.dumps(it, ensure_ascii=False, separators=(',',':'))
    if prev:
        names = names.replace(prev, prev + ',' + newjson, 1)
    else:
        names = names.replace('[', '[' + newjson + ',', 1)
    added+=1
    print('速查补:', it['拉丁名'], '锚:', lat(prev) if prev else '(队首)')
with open(ROOT+'data/microbe-names.js', 'w', encoding='utf-8') as f: f.write(names)
print('速查共补', added, '条；批52 合并完成')
