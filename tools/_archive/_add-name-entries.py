#!/usr/bin/env python3
"""往 data/microbe-names.js 插入属级速查条目（严格全局拉丁字母序）。
用法：python3 tools/_add-name-entries.py <json文件>
json 文件格式：[{"名称":"...","拉丁名":"..."}, ...]"""
import json, re, sys

path = 'data/microbe-names.js'
with open(path) as f:
    src = f.read()

m = re.search(r'window\.DB\.microbeNames = \[', src)
assert m, '找不到数组起始'
arr_start = m.end()  # 位于 '[' 之后
# 找数组结束（文件末尾的 '];'）
arr_end = src.rindex('];')
body = src[arr_start:arr_end]

# 解析现有条目（逐个 {...} 对象）
entries = []
for em in re.finditer(r'\{[^{}]*\}', body):
    e = json.loads(em.group(0))
    e['_raw'] = em.group(0)
    entries.append(e)

def key(e):
    return re.sub(r'[^a-z]', '', (e.get('拉丁名') or '').lower())

new_items = json.load(open(sys.argv[1]))
inserted = 0
for item in new_items:
    k = re.sub(r'[^a-z]', '', item['拉丁名'].lower())
    # 查重
    if any(e.get('拉丁名') == item['拉丁名'] for e in entries):
        print('已存在，跳过:', item['拉丁名'])
        continue
    # 找插入位置：第一个 key 大于 k 的条目
    pos = len(entries)
    for i, e in enumerate(entries):
        if key(e) > k:
            pos = i
            break
    raw = json.dumps(item, ensure_ascii=False, separators=(',', ':'))
    entries.insert(pos, {**item, '_raw': raw})
    inserted += 1
    print('插入:', item['拉丁名'], '于位置', pos, '前邻', entries[pos-1].get('拉丁名') if pos>0 else '(头)')

# 重组 body
parts = []
for e in entries:
    raw = e.pop('_raw')
    parts.append(raw)
new_body = ', '.join(parts)
new_src = src[:arr_start] + new_body + src[arr_end:]
with open(path, 'w') as f:
    f.write(new_src)
print('共插入', inserted, '条；总条目', len(entries))
