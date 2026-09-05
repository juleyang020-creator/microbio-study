#!/usr/bin/env python3
# 批40：合并片段——microbes push 块追加（放线菌→gram-positive、乳杆菌→gram-positive、普雷沃→anaerobe），
# 对象字面量合并（修复批39的裸 { 问题：剥包装时保留键名）。
import re

ROOT = '/Users/juleyang/Projects/微生物学习软件'

def append_push(frag, target):
    src = open(f'{ROOT}/{frag}', encoding='utf-8').read()
    lines = src.split('\n')
    body, skip = [], True
    for l in lines:
        if skip and (l.strip().startswith('//') or not l.strip()):
            continue
        skip = False
        body.append(l)
    src = '\n'.join(body).strip()
    with open(f'{ROOT}/{target}', 'a', encoding='utf-8') as f:
        f.write('\n' + src + '\n')
    print(f'append {frag} → {target}')

def merge_literal(frag, target):
    src = open(f'{ROOT}/{frag}', encoding='utf-8').read()
    lines = src.split('\n')
    body, skip = [], True
    for l in lines:
        if skip and (l.strip().startswith('//') or not l.strip()):
            continue
        skip = False
        body.append(l)
    src = '\n'.join(body).strip()
    # 剥包装：window.DB._b40xxx = {\n ... \n}; → 保留内部（含每条的 "id": {...} 键值）
    m = re.search(r'window\.DB\._\w+\s*=\s*\n?(\{.*)\n\};\s*$', src, re.S)
    assert m, f'{frag} 未匹配包装结构'
    inner = m.group(1).strip()  # inner 形如 "id1": {...},\n\n "id2": {...} —— 已含键名
    tgt = open(f'{ROOT}/{target}', encoding='utf-8').read().rstrip()
    assert tgt.endswith('};'), f'{target} 尾部异常'
    new = tgt[:-2].rstrip()
    if not new.endswith(','):
        new += ','
    new += '\n\n' + inner + '\n};\n'
    open(f'{ROOT}/{target}', 'w', encoding='utf-8').write(new)
    print(f'merge {frag} → {target}')

# microbes：放线菌/乳杆菌 → gram-positive（G+厌氧无芽胞杆菌域）；普雷沃 → anaerobe（G-厌氧域）
append_push('tools/_b40u1-actino.js', 'data/microbes-gram-positive.js')
append_push('tools/_b40u2-actino-lacto.js', 'data/microbes-gram-positive.js')
append_push('tools/_b40u3-lacto.js', 'data/microbes-gram-positive.js')
append_push('tools/_b40u4a-lacto.js', 'data/microbes-gram-positive.js')
append_push('tools/_b40u4b-prev.js', 'data/microbes-anaerobe.js')
append_push('tools/_b40u5-prev.js', 'data/microbes-anaerobe.js')
merge_literal('tools/_b40m-morph.js', 'data/morphology.js')
merge_literal('tools/_b40d-diff.js', 'data/differential.js')
merge_literal('tools/_b40b-bio.js', 'data/biochem.js')
print('批40 合并完成')
