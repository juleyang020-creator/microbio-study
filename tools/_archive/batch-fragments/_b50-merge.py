#!/usr/bin/env python3
# 批50 合并（幂等）：8 种五文件接线 + 速查表补 5 条（拉丁序锚插，复用批49 全局紧前锚算法）
import re, json
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

append_push('tools/_b50-microbes.js', 'data/microbes-fungi.js', '// 批50')
merge_literal('tools/_b50-morph.js', 'data/morphology.js', 'mucor-racemosus')
merge_literal('tools/_b50-diff.js', 'data/differential.js', 'mucor-racemosus')
merge_literal('tools/_b50-biochem.js', 'data/biochem.js', 'mucor-racemosus')

# treatment 补 1 条（总状毛霉节有毛霉目药敏总则）
tre = "'mucor-racemosus': '源书（毛霉目总则）：毛霉目体外药敏多采用 CLSI M38-A3/EUCAST 微量肉汤稀释法，无临床折点；毛霉属对两性霉素 B、泊沙康唑、艾沙康唑相对敏感；伏立康唑、氟康唑及棘白菌素类对毛霉亚门全部耐药。'"
with open(ROOT+'data/treatment.js', encoding='utf-8') as f: t = f.read()
if "'mucor-racemosus'" not in t:
    t = t.rstrip()
    assert t.endswith('};')
    t = t[:-2].rstrip().rstrip(',')
    t += ',\n' + tre + '\n};\n'
    with open(ROOT+'data/treatment.js', 'w', encoding='utf-8') as f: f.write(t)
    print('treatment 补 1 条')
else:
    print('treatment 已有，跳过')

# 速查表补 5 条
with open(ROOT+'data/microbe-names.js', encoding='utf-8') as f: names = f.read()
entries = re.findall(r'\{"名称":"[^"]*","拉丁名":"[^"]*"(?:,[^{}]*)?\}', names)
def lat(e):
    m=re.search(r'"拉丁名":"([^"]*)"',e); return m.group(1)
new_items = [
  {'名称':'总状毛霉','拉丁名':'Mucor racemosus'},
  {'名称':'不规则毛霉','拉丁名':'Mucor irregularis'},
  {'名称':'椭圆毛霉','拉丁名':'Mucor ellipsoideus'},
  {'名称':'蓝色横梗霉','拉丁名':'Lichtheimia coerulea'},
  {'名称':'微小根毛霉','拉丁名':'Rhizomucor pusillus'},
]
added=0
for it in new_items:
    if ('"拉丁名":"%s"'%it['拉丁名']) in names:
        print('速查已有', it['拉丁名']); continue
    key = it['拉丁名'].lower().replace(' ','')
    # 用测试同款键（去非字母）找紧前
    def tkey(l): return l.lower().replace(' ','').replace('.','').replace('-','')
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
print('速查共补', added, '条；批50 合并完成')
