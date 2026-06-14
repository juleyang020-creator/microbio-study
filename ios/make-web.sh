#!/bin/sh
# 把网页资源同步到 ios/Microbio/web（工程以「文件夹引用」打包它）。
# 用法：在仓库任意位置执行  sh ios/make-web.sh
# 每次改了网页内容(data/css/img/js/index.html)后重跑一次，再在 Xcode 点 ▶ 即可更新 App。
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/ios/Microbio/web"
rm -rf "$DEST"
mkdir -p "$DEST"
cp "$ROOT/index.html" "$DEST/"
cp -R "$ROOT/css" "$ROOT/js" "$ROOT/data" "$ROOT/img" "$DEST/"
echo "✓ 已同步网页到 $DEST"
echo "  内容：index.html + css/ + js/ + data/ + img/"
