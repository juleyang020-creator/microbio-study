#!/usr/bin/env python3
# 加 EXCLUDE：prevotella-buccae|20-15-5（D 分联是口颊普雷沃菌 P.buccalis≠颊普雷沃菌 P.buccae——近缘一字之差误挂）
path = '/Users/juleyang/Projects/微生物学习软件/tools/sync-atlas-images.mjs'
src = open(path, encoding='utf-8').read()
anchor = "  'strep-intermedius|12-4-22',      // 假肺炎链球菌胆汁溶菌试验误挂（正文段串扰）"
add = anchor + "\n  // ==== 批40 审计补充（近缘种一字之差：口颊 P.buccalis ≠ 颊 P.buccae）====\n  'prevotella-buccae|20-15-5',       // D 分联实为口颊普雷沃菌（P. buccalis），误挂颊普雷沃菌（P. buccae）"
if 'prevotella-buccae|20-15-5' not in src:
    src = src.replace(anchor, add, 1)
    open(path, 'w', encoding='utf-8').write(src)
    print('EXCLUDE 已加')
else:
    print('已存在')
