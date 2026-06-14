#!/bin/sh
# 把网页资源汇总到 ios/web/，供 Xcode 以「文件夹引用」加入工程。
# 用法：在仓库根目录或任意位置执行  sh ios/make-web.sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/ios/web"
rm -rf "$DEST"
mkdir -p "$DEST"
cp "$ROOT/index.html" "$DEST/"
cp -R "$ROOT/css" "$ROOT/js" "$ROOT/data" "$ROOT/img" "$DEST/"
echo "✓ 已生成 $DEST"
echo "  内容：index.html + css/ + js/ + data/ + img/"
echo "  下一步：把 ios/web 文件夹拖进 Xcode 工程，选「Create folder references」(蓝色)。"
