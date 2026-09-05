#!/usr/bin/env python3
# 批39：把四个 push 片段并入对应 microbes 域文件（gram-negative / atypical），
# 把三个对象字面量片段先剥掉 window.DB._b39xxx 包装再并 morphology/differential/biochem。
import re, subprocess, sys

ROOT = '/Users/juleyang/Projects/微生物学习软件'

def append_push(frag, target):
    """microbes push 块直接 cat 追加（target 末尾是 );）"""
    src = open(f'{ROOT}/{frag}', encoding='utf-8').read().strip()
    # 去掉注释头
    lines = src.split('\n')
    body = []
    skip = True
    for l in lines:
        if skip and (l.strip().startswith('//') or not l.strip()):
            continue
        skip = False
        body.append(l)
    src = '\n'.join(body).strip()
    with open(f'{ROOT}/{target}', 'a', encoding='utf-8') as f:
        f.write('\n' + src + '\n')
    print(f'append {frag} → {target}')

def merge_literal(frag, target, wrap):
    """剥掉 `window.DB._b39xxx = {` 头与 `};` 尾，把内部键值对并进对象字面量目标。"""
    src = open(f'{ROOT}/{frag}', encoding='utf-8').read()
    # 去注释头
    lines = src.split('\n')
    body, skip = [], True
    for l in lines:
        if skip and (l.strip().startswith('//') or not l.strip()):
            continue
        skip = False
        body.append(l)
    src = '\n'.join(body).strip()
    # 剥包装
    m = re.search(r'window\.DB\._\w+\s*=\s*\n?(\{.*)\n\};\s*$', src, re.S)
    assert m, f'{frag} 未匹配包装结构'
    inner = m.group(1).strip()
    tgt = open(f'{ROOT}/{target}', encoding='utf-8').read().rstrip()
    assert tgt.endswith('};'), f'{target} 尾部异常'
    new = tgt[:-2].rstrip()
    if not new.endswith(','):
        new += ','
    new += '\n\n' + inner + '\n};\n'
    open(f'{ROOT}/{target}', 'w', encoding='utf-8').write(new)
    print(f'merge {frag} → {target}')

# 1. microbes：军团菌 14 → gram-negative（既有军团菌条目在此）；巴尔通体/鲍特/莫拉/噬纤维 → gram-negative
append_push('tools/_b39u1-legionella.js', 'data/microbes-gram-negative.js')
append_push('tools/_b39u2-legionella.js', 'data/microbes-gram-negative.js')
append_push('tools/_b39u3-bact-morax.js', 'data/microbes-gram-negative.js')
append_push('tools/_b39u4-capno.js', 'data/microbes-gram-negative.js')
# 2. 三对象文件
merge_literal('tools/_b39m-morph.js', 'data/morphology.js', '_b39morph')
merge_literal('tools/_b39d-diff.js', 'data/differential.js', '_b39diff')
merge_literal('tools/_b39b-bio.js', 'data/biochem.js', '_b39bio')
print('全部合并完成')
