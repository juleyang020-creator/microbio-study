#!/usr/bin/env python3
# 批47 合并：10 种五文件接线 + 速查表补 1 条（颈玫瑰单胞菌）
import re

ROOT = '/Users/juleyang/Projects/微生物学习软件/'

def append_push(src, dst):
    with open(ROOT+src, encoding='utf-8') as f: block = f.read().strip()
    with open(ROOT+dst, encoding='utf-8') as f: content = f.read()
    assert content.rstrip().endswith(');'), '目标不是以 ); 结尾: '+dst
    content = content.rstrip() + '\n\n' + block + '\n'
    with open(ROOT+dst, 'w', encoding='utf-8') as f: f.write(content)
    print('push 追加完成:', dst)

def merge_literal(src, dst):
    with open(ROOT+src, encoding='utf-8') as f: frag = f.read().strip()
    lines = [l for l in frag.split('\n') if not l.startswith('//')]
    frag = '\n'.join(lines).strip()
    with open(ROOT+dst, encoding='utf-8') as f: content = f.read()
    content = content.rstrip()
    assert content.endswith('};'), '目标不是以 }; 结尾: '+dst
    content = content[:-2].rstrip()
    if not content.endswith(','): content += ','
    content += '\n\n' + frag + '\n};\n'
    with open(ROOT+dst, 'w', encoding='utf-8') as f: f.write(content)
    print('字面量合并完成:', dst)

append_push('tools/_b47-microbes.js', 'data/microbes-gram-negative.js')
merge_literal('tools/_b47-morph.js', 'data/morphology.js')
merge_literal('tools/_b47-diff.js', 'data/differential.js')
merge_literal('tools/_b47-biochem.js', 'data/biochem.js')

# 速查表补条目：颈玫瑰单胞菌（严格全局拉丁字母序，紧前锚）
# Roseomonas cervicalis 应插在 Roseomonas 属级条目（Roseomonas）之后、Roseomonas aestuarii 之后？
# 字母序：Roseomonas < Roseomonas aestuarii < Roseomonas cervicalis < Roseomonas fauriae
# 锚 = {"名称":"潮汐(海岸)玫瑰单胞菌","拉丁名":"Roseomonas aestuarii"} 的紧后
with open(ROOT+'data/microbe-names.js', encoding='utf-8') as f: names = f.read()
anchor = '{"名称":"潮汐(海岸)玫瑰单胞菌","拉丁名":"Roseomonas aestuarii","类":"革兰阴性","MALDI":1}'
new = anchor + ',{"名称":"颈玫瑰单胞菌","拉丁名":"Roseomonas cervicalis"}'
if 'Roseomonas cervicalis' not in names:
    assert anchor in names, '锚不存在'
    names = names.replace(anchor, new, 1)
    print('速查表补: 颈玫瑰单胞菌')
with open(ROOT+'data/microbe-names.js', 'w', encoding='utf-8') as f: f.write(names)

# treatment 补 4 条（源书有敏感性记载的）
tre = '''
'serratia-rubidaea': '源书：药敏选药参见黏质沙雷菌，头孢吡肟为本菌 2 级选药。',
'escherichia-hermannii': '源书：药敏选药参见大肠埃希菌。',
'enterobacter-asburiae': '源书：按阴沟肠杆菌复合群选药（Table 8-7-4）；按药敏结果用药。',
'roseomonas-cervicalis': '源书：玫瑰单胞菌属对氨基糖苷类、四环素敏感；普遍对碳青霉烯类耐药（黏液玫瑰单胞菌尤甚）。'
'''
with open(ROOT+'data/treatment.js', encoding='utf-8') as f: t = f.read()
t = t.rstrip()
assert t.endswith('};')
t = t[:-2].rstrip().rstrip(',')
t += ',\n' + tre.strip() + '\n};\n'
with open(ROOT+'data/treatment.js', 'w', encoding='utf-8') as f: f.write(t)
print('treatment 补 4 条')
print('批47 合并完成')
