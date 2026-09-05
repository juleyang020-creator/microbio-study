#!/usr/bin/env python3
# 批50 biochem 伪键清洗（复用批49 fix2 逻辑）
import re
p='/Users/juleyang/Projects/微生物学习软件/tools/_b51-biochem.js'
s=open(p,encoding='utf-8').read()
def clean_obj(m):
    obj=m.group(0)
    kv=dict(re.findall(r'"([^"]+)"\s*:\s*"([^"]*)"',obj))
    proj=kv.get('项目') or ''
    res=kv.get('结果','')
    if not proj:
        mm=re.match(r'([^：:]{2,12})[：:]',res)
        proj=mm.group(1) if mm else '备注'
        res=re.sub(r'^[^：:]{2,12}[：:]','',res)
    return '{"项目":"%s","结果":"%s"}'%(proj,res)
s=re.sub(r'\{[^{}]*\}',clean_obj,s)
open(p,'w',encoding='utf-8').write(s)
bad=len(re.findall(r'"(?:item|project|note|result[a-z_]*|results?_note)"\s*:',s))
print('伪键残留:',bad,'备注项:',s.count('"项目":"备注"'))
