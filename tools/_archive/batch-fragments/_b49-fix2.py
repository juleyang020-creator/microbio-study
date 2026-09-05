#!/usr/bin/env python3
# 批49 修复 v2：清理 bantiana/pleurostoma/stachybotrys/lunata 残留伪键 + 优化「备注」项目名
import re
ROOT='/Users/juleyang/Projects/微生物学习软件/'
p=ROOT+'tools/_b49-biochem.js'
s=open(p,encoding='utf-8').read()

# 1) 删除对象内的伪键（保留 项目/结果 两个真键之外的键值对，把真键留下）
def clean_obj(m):
    obj=m.group(0)
    kv=dict(re.findall(r'"([^"]+)"\s*:\s*"([^"]*)"',obj))
    proj=kv.get('项目') or kv.get('结果','')[:6]
    res=kv.get('结果','')
    if not proj:
        # 从结果文字提取项目名
        mm=re.match(r'([^：:]{2,12})[：:]',res)
        proj=mm.group(1) if mm else '备注'
        res=re.sub(r'^[^：:]{2,12}[：:]','',res)
    return '{"项目":"%s","结果":"%s"}'%(proj,res)

s=re.sub(r'\{[^{}]*\}',clean_obj,s)
open(p,'w',encoding='utf-8').write(s)
bad=len(re.findall(r'"(?:item|project|note|result[a-z_]*|results?_note)"\s*:',s))
print('伪键残留:',bad)
print('备注项目数:',s.count('"项目":"备注"'))
