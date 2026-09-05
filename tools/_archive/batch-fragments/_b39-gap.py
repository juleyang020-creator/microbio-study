#!/usr/bin/env python3
# 批39摸底：速查表(microbe-names)各属下有种条目、但详情库(microbes)尚未收录该种的缺口清单
import re, subprocess, json
from collections import defaultdict

def load_js(path):
    src = open(path, encoding='utf-8').read()
    return src

# ---- 用 node 提取两个库的数据 ----
node_script = r'''
global.window = {DB:{}};
for (const f of ['microbe-names','microbes','microbes-gram-positive','microbes-gram-negative','microbes-anaerobe','microbes-atypical','microbes-fungi','microbes-parasite','microbes-virus','microbes-misc']) {
  require('/Users/juleyang/Projects/微生物学习软件/data/' + f + '.js');
}
const names = window.DB['microbeNames'];
const microbes = window.DB.microbes;
const out = {names: [], microbes: []};
for (const n of names) out.names.push({cn: n['名称']||'', lat: n['拉丁名']||'', maldi: !!n['MALDI']});
for (const m of microbes) out.microbes.push({id: m.id, cn: m['名称']||'', lat: m['拉丁名']||'', cat: m['类别']||''});
console.log(JSON.stringify(out));
'''
open('/tmp/_b39_extract.js','w',encoding='utf-8').write(node_script)
r = subprocess.run(['node','/tmp/_b39_extract.js'], capture_output=True, text=True)
data = json.loads(r.stdout)

# ---- 详情库的拉丁名集合（取种加词首词=属名）----
by_lat = {}
for m in data['microbes']:
    # 拉丁名可能是 'Candida albicans' 或 'Candidozyma haemulonii（旧称 ...）'
    lat = m['lat'].split('（')[0].strip()
    by_lat[lat.lower()] = m

# 速查表里的拉丁名（也剥旧称括注）
name_lats = set()
for n in data['names']:
    lat = n['lat'].split('（')[0].strip()
    name_lats.add(lat.lower())

# ---- 统计：速查表里每个属（拉丁首词）下有种级条目、但详情库缺的 ----
genus_missing = defaultdict(list)   # genus -> [(cn, lat)]
genus_has = defaultdict(int)
for n in data['names']:
    lat = n['lat'].split('（')[0].strip()
    parts = lat.split()
    if len(parts) < 2:
        continue
    genus = parts[0]
    low = lat.lower()
    if low in by_lat:
        genus_has[genus] += 1
    elif low.endswith(' spp.') or low.endswith(' sp.'):
        continue
    else:
        # 种条目（双词）且详情库没有
        genus_missing[genus].append((n['cn'], lat))

print(f"详情库菌种数: {len(data['microbes'])}，速查表条目: {len(data['names'])}")
print()
rows = []
for g, miss in genus_missing.items():
    have = genus_has.get(g, 0)
    if not miss:
        continue
    rows.append((len(miss), have, g, miss))
rows.sort(key=lambda x: -x[0])
print("=== 速查表有种条目但详情库缺（按属统计，只列缺 ≥3 种的属）===")
for cnt, have, g, miss in rows:
    if cnt >= 3:
        print(f"\n[{g}] 已收 {have} 种，缺 {cnt}:")
        for cn, lat in miss[:12]:
            print(f"    {cn}  {lat}")
        if len(miss) > 12:
            print(f"    ... 共 {len(miss)}")
