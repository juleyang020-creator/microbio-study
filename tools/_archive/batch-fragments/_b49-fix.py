#!/usr/bin/env python3
# 批49 修复 biochem 伪键：把 item/project/note/result* 等伪键对象转为正常 {项目,结果}
import re
ROOT='/Users/juleyang/Projects/微生物学习软件/'
p=ROOT+'tools/_b49-biochem.js'
s=open(p,encoding='utf-8').read()
# 删掉所有 {"item":...},{"project":...},{"note":...},{"result...":...} 形式的伪键对象（值非空有用信息先打印）
# 策略：把这些伪对象整体删除，但保留其中含中文值的——统一转成 {"项目":"", "结果":"<中文值>"}
def fix(m):
    obj=m.group(0)
    vals=re.findall(r':\s*"([^"]*[\u4e00-\u9fff][^"]*)"',obj)
    if vals:
        return '{"项目":"备注","结果":"'+'；'.join(vals)+'"}'
    return ''
s=re.sub(r'\{"(?:item|project|note|result[a-z_]*|results?_note)"\s*:\s*"[^"]*"(?:\s*,\s*"(?:item|project|note|result[a-z_]*|results?_note)"\s*:\s*"[^"]*")*\}',fix,s)
open(p,'w',encoding='utf-8').write(s)
# 验证
import subprocess
print('伪键残留:',len(re.findall(r'"(?:item|project|note|result[a-z_]*|results?_note)"\s*:',s)))
print(s[:400])
