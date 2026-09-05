#!/usr/bin/env python3
# 批53 合并（幂等）：5 种五文件接线 + 速查补 5 条 + 折点挂组
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

append_push('tools/_b53-microbes.js', 'data/microbes-gram-negative.js', '// 批53')
merge_literal('tools/_b53-morph.js', 'data/morphology.js', 'salmonella-typhimurium')
merge_literal('tools/_b53-diff.js', 'data/differential.js', 'salmonella-typhimurium')
merge_literal('tools/_b53-biochem.js', 'data/biochem.js', 'salmonella-typhimurium')

# 折点挂组：5 个沙门血清型 → 2A-2 沙门/志贺组
with open(ROOT+'data/breakpoints.js', encoding='utf-8') as f: bp = f.read()
if "'salmonella-typhimurium'" not in bp and '"salmonella-typhimurium"' not in bp:
    m = re.search(r'(菌组名: "沙门菌 / 志贺菌 \(Salmonella & Shigella spp.\)",\s*CLSI表: "Table 2A-2",\s*菌种: \[)([^\]]*)(\])', bp)
    assert m, '2A-2 组未找到'
    ids = m.group(2).rstrip()
    if not ids.endswith(','): ids += ','
    ids += "\n      'salmonella-typhimurium', 'salmonella-choleraesuis', 'salmonella-paratyphi-b', 'salmonella-paratyphi-c', 'salmonella-bovismorbificans'"
    bp = bp[:m.start(2)] + ids + bp[m.end(2):]
    with open(ROOT+'data/breakpoints.js', 'w', encoding='utf-8') as f: f.write(bp)
    print('折点挂组: 5 血清型 → 2A-2')
else:
    print('折点已挂，跳过')

# 速查补 5 条（拉丁序锚插；首字母大写血清型格式与库内 Typhi/Enteritidis 一致）
with open(ROOT+'data/microbe-names.js', encoding='utf-8') as f: names = f.read()
entries = re.findall(r'\{"名称":"[^"]*","拉丁名":"[^"]*"(?:,[^{}]*)?\}', names)
def lat(e):
    m=re.search(r'"拉丁名":"([^"]*)"',e); return m.group(1)
def tkey(l): return re.sub(r'[^a-z]','',l.lower())
new_items = [
  {'名称':'鼠伤寒沙门菌','拉丁名':'Salmonella Typhimurium'},
  {'名称':'猪霍乱沙门菌','拉丁名':'Salmonella Choleraesuis'},
  {'名称':'乙型副伤寒沙门菌','拉丁名':'Salmonella Paratyphi B'},
  {'名称':'丙型副伤寒沙门菌','拉丁名':'Salmonella Paratyphi C'},
  {'名称':'病牛沙门菌','拉丁名':'Salmonella Bovismorbificans'},
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
print('速查共补', added, '条；批53 合并完成')
