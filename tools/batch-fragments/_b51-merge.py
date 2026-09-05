#!/usr/bin/env python3
# 批51 合并（幂等）：3 种五文件接线 + 速查补 2 条 + 旧条目新名别名
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

append_push('tools/_b51-microbes.js', 'data/microbes-fungi.js', '// 批51')
merge_literal('tools/_b51-morph.js', 'data/morphology.js', 'trichophyton-interdigitale')
merge_literal('tools/_b51-diff.js', 'data/differential.js', 'trichophyton-interdigitale')
merge_literal('tools/_b51-biochem.js', 'data/biochem.js', 'trichophyton-interdigitale')

# 速查表补 2 条（拉丁序锚插）
with open(ROOT+'data/microbe-names.js', encoding='utf-8') as f: names = f.read()
entries = re.findall(r'\{"名称":"[^"]*","拉丁名":"[^"]*"(?:,[^{}]*)?\}', names)
def lat(e):
    m=re.search(r'"拉丁名":"([^"]*)"',e); return m.group(1)
def tkey(l): return l.lower().replace(' ','').replace('.','').replace('-','')
new_items = [
  {'名称':'趾间毛癣菌','拉丁名':'Trichophyton interdigitale'},  # 已有则跳过
  {'名称':'苯海姆毛癣菌','拉丁名':'Trichophyton benhamiae'},
  {'名称':'库克帕拉癣菌','拉丁名':'Paraphyton cookei'},
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

# 旧条目补新名别名（94 书 Nannizzia 新分类名 → 库内 Microsporum 旧条目，图谱匹配增强）
alias_fix = [
  ('{"名称":"石膏小孢子菌","拉丁名":"Microsporum gypseum"', '石膏样奈尼兹皮菌、Nannizzia gypsea'),
  ('{"名称":"猪小孢子菌","拉丁名":"Microsporum nanum"', '猪奈尼兹皮菌、Nannizzia nana'),
  ('{"名称":"桃色小孢子菌","拉丁名":"Microsporum persicolor"', '杂色奈尼兹皮菌、Nannizzia persicolor'),
  ('{"名称":"库克小孢子菌","拉丁名":"Microsporum cookei"', '库克帕拉癣菌、Paraphyton cookei'),
]
for anchor, alias in alias_fix:
    if anchor in names and alias not in names:
        i = names.find(anchor)
        j = names.find('}', i)
        names = names[:j] + ',"别名":"' + alias + '"' + names[j:]
        print('别名补:', anchor[8:30])
with open(ROOT+'data/microbe-names.js', 'w', encoding='utf-8') as f: f.write(names)
print('速查共补', added, '条；批51 合并完成')
