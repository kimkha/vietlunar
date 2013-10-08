#!/bin/sh

#SCRIPT=`readlink -f $0`
#SCRIPTPATH=`dirname $SCRIPT`
#echo $SCRIPTPATH

rm -rf compiled
mkdir compiled
mkdir -p compiled/_locales/en/
mkdir -p compiled/_locales/vi/

cp manifest.json compiled/
cp icon16.png compiled/
cp icon19.png compiled/
cp icon48.png compiled/
cp icon128.png compiled/
cp popup.html compiled/
cp _locales/en/messages.json compiled/_locales/en/
cp _locales/vi/messages.json compiled/_locales/vi/

java -jar ./compiler.jar --js background.js --js_output_file compiled/background.js
java -jar ./compiler.jar --js popup.js --js_output_file compiled/popup.js
java -jar ./compiler.jar --js amlich.js --js_output_file compiled/amlich.js

cd compiled
zip -9 -q -r vietlunar.zip *
cd ..
mv compiled/vietlunar.zip .

