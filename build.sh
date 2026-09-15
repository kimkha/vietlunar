#!/bin/sh
set -e

TERSER=./node_modules/.bin/terser

if [ ! -x "$TERSER" ]; then
	echo "terser not found. Run: yarn install" >&2
	exit 1
fi

VERSION=$(node -p "require('./src/manifest.json').version")
PKG_VERSION=$(node -p "require('./package.json').version")

if [ "$VERSION" != "$PKG_VERSION" ]; then
	echo "version drift: src/manifest.json is $VERSION, package.json is $PKG_VERSION" >&2
	exit 1
fi

rm -rf compiled dist
mkdir compiled dist

cp -R src/. compiled/

for js in background.js popup.js amlich.js; do
	"$TERSER" "src/$js" --compress --mangle -o "compiled/$js"
done

# .github/workflows/release.yml attaches this exact path; edit both together.
ZIP="dist/vietlunar-$VERSION.zip"

cd compiled
zip -9 -q -r "../$ZIP" *
cd ..

echo "built $ZIP"
