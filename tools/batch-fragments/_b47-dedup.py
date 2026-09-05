#!/usr/bin/env python3
# 批47 去重：merge 脚本因首跑中断后重跑，push/字面量块被追加了两次——删第二份
import re

ROOT = '/Users/juleyang/Projects/微生物学习软件/'

def dedup_push(path, marker):
    with open(ROOT+path, encoding='utf-8') as f: c = f.read()
    parts = c.split(marker)
    # parts[0] = 前面全部内容 + 各次块。保留第一次，删除后续重复
    if len(parts) > 2:
        print(path, '发现', len(parts)-1, '份 push 块，去重为 1')
        c = parts[0] + marker + ''.join(parts[1:2]).rstrip() + '\n'
        # 后续 parts[2:] 本应只含空内容；打印出来检查
        for extra in parts[2:]:
            if extra.strip():
                print('  ⚠ 第二份块后有非空内容，需人工检查:', extra[:100])
        c = parts[0] + marker + parts[1].rstrip() + '\n'
        with open(ROOT+path, 'w', encoding='utf-8') as f: f.write(c)

def dedup_literal(path):
    with open(ROOT+path, encoding='utf-8') as f: c = f.read().rstrip()
    assert c.endswith('};')
    body = c[:-2]
    ids = ['serratia-rubidaea','proteus-penneri','escherichia-hermannii','enterobacter-asburiae','cedecea-davisae','kluyvera-ascorbata','kluyvera-cryocrescens','tatumella-ptyseos','rahnella-aquatilis','roseomonas-cervicalis']
    for i in ids:
        # 找每个 key 的全部出现（行首 "id": 形式）
        pat = re.compile(r'(?m)^"'+i+r'":')
        ms = list(pat.finditer(body))
        if len(ms) > 1:
            # 删除第二次出现起、到下一个行首 "xxx": 或结尾的全部内容
            start = ms[1].start()
            # 找 ms[1] 之后下一个行首 key
            nxt = re.compile(r'(?m)^\S').search(body, ms[1].end())
            end = nxt.start() if nxt else len(body)
            print(path, i, '删重复段', end-start, '字符')
            body = body[:start] + body[end:]
    with open(ROOT+path, 'w', encoding='utf-8') as f: f.write(body + '\n};\n')

dedup_push('data/microbes-gram-negative.js', '// 批47：肠杆菌目少见种 + 玫瑰单胞菌种级扩充 10 种')
for f in ['morphology','differential','biochem']:
    dedup_literal('data/'+f+'.js')
print('去重完成')
