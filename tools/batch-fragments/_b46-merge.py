#!/usr/bin/env python3
# 批46 合并：microbes push 块追加 + morph/diff/biochem 字面量合并 + 速查表别名补齐
import re, sys, json

ROOT = '/Users/juleyang/Projects/微生物学习软件/'

def append_push(src, dst):
    with open(ROOT+src, encoding='utf-8') as f: block = f.read().strip()
    with open(ROOT+dst, encoding='utf-8') as f: content = f.read()
    assert content.rstrip().endswith(');'), '目标不是以 ); 结尾的 push 块: '+dst
    content = content.rstrip() + '\n\n' + block + '\n'
    with open(ROOT+dst, 'w', encoding='utf-8') as f: f.write(content)
    print('push 追加完成:', dst)

def merge_literal(src, dst):
    with open(ROOT+src, encoding='utf-8') as f: frag = f.read().strip()
    # 剥可能的注释头行
    lines = [l for l in frag.split('\n') if not l.startswith('//')]
    frag = '\n'.join(lines).strip()
    with open(ROOT+dst, encoding='utf-8') as f: content = f.read()
    content = content.rstrip()
    assert content.endswith('};'), '目标不是以 }; 结尾的对象字面量: '+dst
    content = content[:-2].rstrip()  # 去 };
    # 目标此时以 } 或 " 结尾，补逗号
    if not content.endswith(','): content += ','
    content += '\n\n' + frag + '\n};\n'
    with open(ROOT+dst, 'w', encoding='utf-8') as f: f.write(content)
    print('字面量合并完成:', dst)

append_push('tools/_b46-microbes.js', 'data/microbes-gram-negative.js')
merge_literal('tools/_b46-morph.js', 'data/morphology.js')
merge_literal('tools/_b46-diff.js', 'data/differential.js')
merge_literal('tools/_b46-biochem.js', 'data/biochem.js')

# 速查表别名补齐（4 组缩写条目补「别名」指向全称条目首选名，属信息补全不改基线）
alias_pairs = [
    ('"名称":"蒙氏假单胞菌","拉丁名":"P. monteilii"', '"名称":"蒙氏假单胞菌","拉丁名":"P. monteilii","别名":"蒙太利假单胞菌"'),
    ('"名称":"摩氏假单胞菌","拉丁名":"P. mosseli"', '"名称":"摩氏假单胞菌","拉丁名":"P. mosseli","别名":"摩西假单胞菌"'),
    ('"名称":"威隆假单胞菌","拉丁名":"P. veronii"', '"名称":"威隆假单胞菌","拉丁名":"P. veronii","别名":"维罗纳假单胞菌"'),
]
with open(ROOT+'data/microbe-names.js', encoding='utf-8') as f: names = f.read()
for old, new in alias_pairs:
    if old in names and new not in names:
        names = names.replace(old, new, 1)
        print('别名补齐:', old[:30])
with open(ROOT+'data/microbe-names.js', 'w', encoding='utf-8') as f: f.write(names)
print('批46 合并全部完成')
