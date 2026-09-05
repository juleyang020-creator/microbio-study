#!/usr/bin/env python3
# 批39 补速查表别名：噬/嗜纤维字尾互写 + 茴香军团菌 → 使图谱匹配命中
import re
path = '/Users/juleyang/Projects/微生物学习软件/data/microbe-names.js'
src = open(path, encoding='utf-8').read()
subs = [
  ('{"名称":"生痰二氧化碳嗜纤维菌","拉丁名":"Capnocytophaga sputigena","类"',
   '{"名称":"生痰二氧化碳嗜纤维菌","拉丁名":"Capnocytophaga sputigena","别名":"生痰二氧化碳噬纤维菌","类"'),
  ('{"名称":"牙龈二氧化碳嗜纤维菌","拉丁名":"Capnocytophaga gingivalis","类"',
   '{"名称":"牙龈二氧化碳嗜纤维菌","拉丁名":"Capnocytophaga gingivalis","别名":"牙龈二氧化碳噬纤维菌","类"'),
  ('{"名称":"颗粒二氧化碳嗜纤维菌","拉丁名":"Capnocytophaga granulosa","类"',
   '{"名称":"颗粒二氧化碳嗜纤维菌","拉丁名":"Capnocytophaga granulosa","别名":"颗粒二氧化碳噬纤维菌","类"'),
  ('{"名称":"溶血二氧化碳嗜纤维菌","拉丁名":"Capnocytophaga haemolytica","类"',
   '{"名称":"溶血二氧化碳嗜纤维菌","拉丁名":"Capnocytophaga haemolytica","别名":"溶血二氧化碳噬纤维菌","类"'),
  ('{"名称":"不同(茴香)军团菌","拉丁名":"Legionella anisa","类"',
   '{"名称":"不同(茴香)军团菌","拉丁名":"Legionella anisa","别名":"茴香军团菌","类"'),
]
cnt = 0
for old, new in subs:
    if old in src:
        src = src.replace(old, new, 1)
        cnt += 1
    else:
        print('未命中：', old[:50])
open(path, 'w', encoding='utf-8').write(src)
print(f'补别名 {cnt}/5')
