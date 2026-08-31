#!/usr/bin/env python3
# 批40 图谱误挂修复：三处书/库异写补别名 + 两处「格氏乳杆菌联图重复计数」核查
# 1) 「麦耶沙尔菌」不涉（麦尔未挂图）。检查 20-8-7 的 D=黏放线菌 分联未挂 → 库名「粘放线菌」vs 书「黏放线菌」
# 2) 20-8-3=纽氏放线菌（=新放线菌 A.neuii 旧译）、20-8-4=瑞丁放线菌（=雷丁放线 A.radingae）整图挂在 genus —— 书用旧译名
# 3) 20-15-5 D=口颊普雷沃菌（=P.buccalis 旧译，库里「颊普雷沃菌」=P.buccae 不同菌！）——需精确核对
import re
path = '/Users/juleyang/Projects/微生物学习软件/data/microbe-names.js'
src = open(path, encoding='utf-8').read()
subs = [
  # 粘/黏放线菌互写
  ('{"名称":"粘放线菌","拉丁名":"Actinomyces viscosus","类"',
   '{"名称":"粘放线菌","拉丁名":"Actinomyces viscosus","别名":"黏放线菌","类"'),
  # 纽氏放线菌（新放线菌旧译）
  ('{"名称":"新放线菌","拉丁名":"Actinomyces neuii","类"',
   '{"名称":"新放线菌","拉丁名":"Actinomyces neuii","别名":"纽氏放线菌","类"'),
  # 瑞丁放线菌（雷丁放线异写）
  ('{"名称":"雷丁放线","拉丁名":"Actinomyces radingae","类"',
   '{"名称":"雷丁放线","拉丁名":"Actinomyces radingae","别名":"瑞丁放线菌","类"'),
]
cnt = 0
for old, new in subs:
    if old in src:
        src = src.replace(old, new, 1)
        cnt += 1
    else:
        print('未命中：', old[:60])
open(path, 'w', encoding='utf-8').write(src)
print(f'补别名 {cnt}/3')
