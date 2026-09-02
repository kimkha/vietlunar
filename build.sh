#!/bin/sh
set -e

TERSER=./node_modules/.bin/terser

if [ ! -x "$TERSER" ]; then
	echo "terser not found. Run: yarn install" >&2
	exit 1
fi

rm -rf compiled vietlunar.zip
mkdir compiled

cp -R src/. compiled/

for js in background.js popup.js amlich.js; do
	"$TERSER" "src/$js" --compress --mangle -o "compiled/$js"
done

cd compiled
zip -9 -q -r ../vietlunar.zip *
