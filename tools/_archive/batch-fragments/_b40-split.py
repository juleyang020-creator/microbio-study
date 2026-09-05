#!/usr/bin/env python3
# 拆 _b40u4：前半（乳杆菌 5 条）留 push 尾，后半（普雷沃 3 条）另存 push 块
src = open('/Users/juleyang/Projects/微生物学习软件/tools/_b40u4-lacto-prev.js', encoding='utf-8').read()
# 按 "id": "prevotella-buccae" 拆：该条目以 { "id": "prevotella-buccae" 开始
idx = src.index('{\n "id": "prevotella-buccae"')
lacto_part = src[:idx].rstrip()  # ...结尾是 },\n
prev_part = src[idx:]
# lacto_part 结尾应为 "...},", 补 "\n);" 收尾；prev_part 前补 push 头
assert lacto_part.endswith('},'), lacto_part[-40:]
open('/Users/juleyang/Projects/微生物学习软件/tools/_b40u4a-lacto.js', 'w', encoding='utf-8').write(lacto_part + '\n);')
open('/Users/juleyang/Projects/微生物学习软件/tools/_b40u4b-prev.js', 'w', encoding='utf-8').write('window.DB.microbes.push(\n' + prev_part)
print('拆分完成')
