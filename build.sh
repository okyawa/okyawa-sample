#!/bin/sh

rm -rf ./public

# home
cp -r ./home/ ./public/

# img
mkdir -p ./public/img
cp -r ./img/ ./public/img/

# res (css)
mkdir -p ./public/res
cp -r ./res/ ./public/res/

# barcode
mkdir -p ./public/barcode
cp -r ./barcode/ ./public/barcode/

# teachable-machine
mkdir -p ./public/teachable-machine
cp -r ./teachable-machine/ ./public/teachable-machine/

# js-tips
mkdir -p ./public/js-tips
cp -r ./js-tips/ ./public/js-tips/

# css-tips
mkdir -p ./public/css-tips
cp -r ./css-tips/ ./public/css-tips/

# html-tips
mkdir -p ./public/html-tips
cp -r ./html-tips/ ./public/html-tips/

# library-tips
mkdir -p ./public/library-tips
cp -r ./library-tips/ ./public/library-tips/
