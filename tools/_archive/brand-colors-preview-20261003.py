#!/usr/bin/env python3
"""Package genuine browser screenshots; does not redraw or recolor the app."""
import base64
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/审核/品牌配色-20261003'
NAMES = {'microbes': '微生物分类首页', 'detail': '铜绿假单胞菌详情', 'breakpoints': '折点查询', 'detail-cards': '详情页卡片'}
font_path = Path('/System/Library/Fonts/PingFang.ttc')
if not font_path.exists():
    font_path = Path('/System/Library/Fonts/STHeiti Medium.ttc')
font = ImageFont.truetype(str(font_path), 25)
shots = {}
manifest = []
for name, title in NAMES.items():
    for width in (1280, 390):
        height = 900 if width == 1280 else 844
        gap, label = 16, 48
        canvas = Image.new('RGB', (width * 2 + gap * 3, (height + label) * 2 + gap * 3), '#e7e4dd')
        draw = ImageDraw.Draw(canvas)
        for row, theme in enumerate(('light', 'dark')):
            for col, phase in enumerate(('before', 'after')):
                file = OUT / phase / f'{name}-{width}-{theme}.png'
                im = Image.open(file).convert('RGB')
                assert im.size == (width, height), (file, im.size)
                x = gap + col * (width + gap)
                y = gap + row * (height + label + gap)
                draw.text((x + 8, y + 7), ('修改前' if phase == 'before' else '修改后') + ' · ' + ('浅色' if theme == 'light' else '深色'), font=font, fill='#23272e')
                canvas.paste(im, (x, y + label))
                shots[f'{name}-{width}-{theme}-{phase}'] = 'data:image/png;base64,' + base64.b64encode(file.read_bytes()).decode('ascii')
        target = OUT / f'{name}-{width}-compare.png'
        canvas.save(target, optimize=True)
        manifest.append({'title': title, 'width': width, 'file': target.name})

html = '''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>知微 · 品牌配色确认</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f6f5f1;color:#23272e;font:15px/1.6 -apple-system,"PingFang SC",sans-serif}header{padding:24px;border-bottom:1px solid #ddd;background:white}h1{font-size:24px;margin:0 0 8px}p{margin:4px 0;color:#454b54}.controls{display:flex;flex-wrap:wrap;gap:12px;margin-top:16px}label{display:flex;align-items:center;gap:8px}select,button{font:inherit;padding:7px 12px;background:white;border:1px solid #b9c3bd;border-radius:5px;color:#23272e}button{cursor:pointer}button[aria-pressed=true]{background:#155e56;color:white;border-color:#155e56}main{padding:20px}.pair{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px;align-items:start}figure{margin:0;min-width:0}figcaption{font-weight:600;margin-bottom:8px}img{display:block;width:100%;height:auto;border:1px solid #ccc}a{color:#1f5f8b}.note{padding:16px 0}.single-before #right,.single-after #left{display:none}.single-before,.single-after{grid-template-columns:minmax(0,1fr)}.mobile figure{max-width:390px}@media(max-width:700px){header,main{padding:14px}.pair{grid-template-columns:minmax(0,1fr)}}
</style></head><body>
<header><h1>知微 · 品牌配色确认</h1><p>真实 Headless Chrome 截图；同一页面、同一视口、同一滚动位置。没有改布局、字号、正文或图片。</p><p>新版浅色主色 #155E56，深色主色 #62BDB3；待你确认，尚未提交或发布。</p>
<div class="controls"><label>页面<select id="route"><option value="microbes">微生物分类首页</option><option value="detail">铜绿假单胞菌详情</option><option value="breakpoints">折点查询</option><option value="detail-cards">详情页卡片（正文中段）</option></select></label><label>主题<select id="theme"><option value="light">浅色</option><option value="dark">深色</option></select></label><label>视口<select id="width"><option value="1280">桌面 1280px</option><option value="390">手机 390px</option></select></label></div>
<div class="controls" aria-label="比较方式"><button data-mode="both" aria-pressed="true">并排比较</button><button data-mode="before" aria-pressed="false">只看修改前</button><button data-mode="after" aria-pressed="false">只看修改后</button></div></header>
<main><div class="pair" id="pair"><figure id="left"><figcaption>修改前 · <a id="open-before" target="_blank" rel="noopener">下载原尺寸截图</a></figcaption><img id="before" alt="修改前的真实页面截图"></figure><figure id="right"><figcaption>修改后 · <a id="open-after" target="_blank" rel="noopener">下载原尺寸截图</a></figcaption><img id="after" alt="修改后的真实页面截图"></figure></div><p class="note">提示：切换“只看修改前 / 只看修改后”可在同一位置比较。手机截图保持原始比例；图片中的照片和 SVG 沿用原版，未重新着色。</p></main>
<script id="shots" type="application/json">__SHOTS__</script>
<script>
const shots=JSON.parse(document.getElementById('shots').textContent);let mode='both';
function update(){const route=document.getElementById('route').value,theme=document.getElementById('theme').value,width=document.getElementById('width').value;for(const phase of ['before','after']){const key=[route,width,theme,phase].join('-');document.getElementById(phase).src=shots[key];const a=document.getElementById('open-'+phase);a.href=shots[key];a.download=key+'.png'}document.getElementById('pair').className='pair'+(mode==='both'?'':' single-'+mode)+(width==='390'?' mobile':'')}
for(const s of document.querySelectorAll('select'))s.addEventListener('change',update);
for(const b of document.querySelectorAll('[data-mode]'))b.addEventListener('click',()=>{mode=b.dataset.mode;for(const n of document.querySelectorAll('[data-mode]'))n.setAttribute('aria-pressed',String(n===b));update()});update();
</script></body></html>'''
(OUT / 'preview.html').write_text(html.replace('__SHOTS__', json.dumps(shots)), encoding='utf8')
(OUT / 'preview-manifest.json').write_text(json.dumps({'screenshots': len(shots), 'comparisons': manifest}, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
print(json.dumps({'preview': str(OUT / 'preview.html'), 'screenshots': len(shots), 'comparisonImages': len(manifest)}, ensure_ascii=False))
