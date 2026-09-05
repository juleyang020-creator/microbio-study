#!/usr/bin/env python3
# 批48 合并（幂等版）：15 种五文件接线
ROOT = '/Users/juleyang/Projects/微生物学习软件/'

def append_push(src, dst, marker):
    with open(ROOT+src, encoding='utf-8') as f: block = f.read().strip()
    with open(ROOT+dst, encoding='utf-8') as f: content = f.read()
    if marker in content:
        print(dst, 'push 块已存在，跳过'); return
    assert content.rstrip().endswith(');'), '目标不是 ); 结尾: '+dst
    content = content.rstrip() + '\n\n' + block + '\n'
    with open(ROOT+dst, 'w', encoding='utf-8') as f: f.write(content)
    print('push 追加完成:', dst)

def merge_literal(src, dst, marker_id):
    with open(ROOT+src, encoding='utf-8') as f: frag = f.read().strip()
    with open(ROOT+dst, encoding='utf-8') as f: content = f.read()
    if ('"'+marker_id+'":') in content:
        print(dst, marker_id, '已存在，跳过'); return
    lines = [l for l in frag.split('\n') if not l.startswith('//')]
    frag2 = '\n'.join(lines).strip()
    content = content.rstrip()
    assert content.endswith('};'), '目标不是 }; 结尾: '+dst
    content = content[:-2].rstrip()
    if not content.endswith(','): content += ','
    content += '\n\n' + frag2 + '\n};\n'
    with open(ROOT+dst, 'w', encoding='utf-8') as f: f.write(content)
    print('字面量合并完成:', dst)

append_push('tools/_b48-microbes.js', 'data/microbes-fungi.js', '// 批48')
merge_literal('tools/_b48-morph.js', 'data/morphology.js', 'malassezia-pachydermatis')
merge_literal('tools/_b48-diff.js', 'data/differential.js', 'malassezia-pachydermatis')
merge_literal('tools/_b48-biochem.js', 'data/biochem.js', 'malassezia-pachydermatis')

# treatment 补 4 条（源书有明确药敏记载的）
tre_lines = """'malassezia-pachydermatis': '源书：马拉色菌无标准体外药敏法（可参考 CLSI M27-A3 调整条件）。厚皮对伊曲康唑、酮康唑、泊沙康唑最敏感；局部感染外用唑类/丙烯胺类，皮损广泛口服伊曲康唑/酮康唑；系统感染（静脉脂肪乳相关）须拔中心静脉导管+停脂肪乳，系统两性霉素 B 或伊曲康唑。',
'rhodotorula-mucilaginosa': '源书：多数红酵母对两性霉素 B、氟胞嘧啶 MIC 低，唑类 MIC 高，对棘白菌素天然耐药；文献多建议两性霉素 B 治疗。部分患者去除感染源（拔导管）后即使无抗真菌治疗也可痊愈。',
'trichosporon-mucoides': '源书：毛孢子菌属对棘白菌素天然耐药；伏立康唑、泊沙康唑、伊曲康唑 MIC 较低，氟康唑/氟胞嘧啶 MIC 高。《热病》53 版推荐伊曲康唑、伏立康唑、泊沙康唑、艾沙康唑和多烯类为备选，氟康唑三线。',
'geotrichum-candidum': '源书（地霉属）：常用抗真菌药物为两性霉素 B 和伏立康唑（同大孢酵母属节）。'"""
with open(ROOT+'data/treatment.js', encoding='utf-8') as f: t = f.read()
if "'malassezia-pachydermatis'" not in t:
    t = t.rstrip()
    assert t.endswith('};')
    t = t[:-2].rstrip().rstrip(',')
    t += ',\n' + tre_lines + '\n};\n'
    with open(ROOT+'data/treatment.js', 'w', encoding='utf-8') as f: f.write(t)
    print('treatment 补 4 条')
else:
    print('treatment 已有，跳过')
print('批48 合并完成')
