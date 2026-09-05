#!/usr/bin/env node
// 批42 手工接线：米曲霉（速查名「黄/米曲霉」带斜杠子串不命中）+ 桔青霉（橘/桔异写）
const fs = require('fs');
const { execFileSync } = require('child_process');
const imgs = JSON.parse(fs.readFileSync('/tmp/b42-imgs.json', 'utf8'));
const src = process.env.HOME + '/Documents/资料库/微生物/94-临床微生物学诊断与图解-第5版/images';
const caps = {
  '27-2-18': '米曲霉菌落(SDA, 35℃, 2日)', '27-2-19': '米曲霉菌落(血琼脂平板,35℃,3日)',
  '27-2-20': '米曲霉菌落(PDA, 35℃, 3日)', '27-2-21': '米曲霉菌落(PDA, 35℃, 7日)',
  '27-2-22': '米曲霉镜检(乳酸酚棉蓝染色, ×1000)', '27-2-23': '米曲霉镜检(乳酸酚棉蓝染色, ×1000)',
  '27-1-2': '桔青霉菌落(PDA, 28℃, 7日)', '27-1-3': '桔青霉纯培养镜下形态(乳酸酚棉蓝染色, ×400)',
  '27-1-5': '桔青霉帚状枝(25℃, 7日)',
};
const add = { 'aspergillus-oryzae': [], 'penicillium-citrinum': [] };
for (const [fig, arr] of Object.entries(imgs)) {
  const id = fig.startsWith('27-2') ? 'aspergillus-oryzae' : 'penicillium-citrinum';
  const img = arr[0];
  const dst = 'img/atlas/' + img + '.jpg';
  if (!fs.existsSync(dst)) execFileSync('sips', ['-Z', '800', '-s', 'formatOptions', '58', src + '/' + img + '.jpg', '--out', dst], { stdio: 'pipe' });
  add[id].push({ 文件: dst, 说明: '图 ' + fig + '　' + caps[fig] });
}
// 插入 photos-atlas.js（锚在近邻条目前）
let s = fs.readFileSync('data/photos-atlas.js', 'utf8');
function block(id, arr) {
  return ' "' + id + '": ' + JSON.stringify(arr, null, 1).replace(/\n/g, '\n ') + ',\n';
}
s = s.replace(' "aspergillus-nidulans": [', block('aspergillus-oryzae', add['aspergillus-oryzae']) + ' "aspergillus-nidulans": [');
s = s.replace(' "aspergillus-nidulans": [', block('aspergillus-oryzae', add['aspergillus-oryzae']) + ' "aspergillus-nidulans": [');
s = s.replace(' "penicillium-chrysogenum": [', block('penicillium-citrinum', add['penicillium-citrinum']) + ' "penicillium-chrysogenum": [');
fs.writeFileSync('data/photos-atlas.js', s);
console.log('手工接线：米曲霉', add['aspergillus-oryzae'].length, '张（锚 parasiticus），桔青霉', add['penicillium-citrinum'].length, '张（锚 chrysogenum）');
