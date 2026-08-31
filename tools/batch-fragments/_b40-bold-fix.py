#!/usr/bin/env python3
# 批40 修正：小节正文里的 **markdown 加粗** 字面残留——richBody 不解析 markdown，改用中文强调（「」）或去星号
import re, glob
files = glob.glob('/Users/juleyang/Projects/微生物学习软件/data/microbes-*.js')
total = 0
for path in files:
    s = open(path, encoding='utf-8').read()
    # 只处理批40 新增段的 **xxx** → 「xxx」
    def repl(m):
        return '「' + m.group(1) + '」'
    s2 = re.sub(r'\*\*([^*\n]{2,40})\*\*', repl, s)
    if s2 != s:
        cnt = len(re.findall(r'\*\*([^*\n]{2,40})\*\*', s))
        open(path, 'w', encoding='utf-8').write(s2)
        print(path.split('/')[-1], f'替换 {cnt} 处')
        total += cnt
print('共', total, '处')
