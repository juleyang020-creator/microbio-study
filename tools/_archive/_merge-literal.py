#!/usr/bin/env python3
"""把批2的 morphology/differential/biochem 追加块安全合并进对象字面量文件。
用法：python3 _merge.py <appendix_file> <target_file>
追加块格式：对象字面量内的键值对（'id': {...}），文件首有 // 注释头。"""
import sys

appendix_path, target_path = sys.argv[1], sys.argv[2]
appendix = open(appendix_path, encoding='utf-8').read()
# 去掉注释头（连续 // 开头的行）
lines = appendix.split('\n')
body = []
skip = True
for l in lines:
    if skip and (l.strip().startswith('//') or not l.strip()):
        continue
    skip = False
    body.append(l)
appendix = '\n'.join(body).strip()

src = open(target_path, encoding='utf-8').read().rstrip()
assert src.endswith('};'), f'{target_path} 尾部不是 }};: {src[-20:]!r}'
new = src[:-2].rstrip()
if not new.endswith(','):
    new += ','
new += '\n\n' + appendix + '\n};\n'
open(target_path, 'w', encoding='utf-8').write(new)
print(f'合并 {appendix_path} → {target_path} 完成')
