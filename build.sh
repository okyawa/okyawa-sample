#!/bin/sh

rm -rf ./public

# home
cp -r ./home/ ./public/

# img
mkdir -p ./public/img
cp -r ./img/ ./public/img/

# barcode
mkdir -p ./public/barcode
cp -r ./barcode/ ./public/barcode/

# teachable-machine
mkdir -p ./public/teachable-machine
cp -r ./teachable-machine/ ./public/teachable-machine/

# scroll-snaptext-scroll
mkdir -p ./public/scroll-snap
cp -r ./scroll-snap/ ./public/scroll-snap/

# text-scroll
mkdir -p ./public/text-scroll
cp -r ./text-scroll/ ./public/text-scroll/

# css-tips
mkdir -p ./public/css-tips
cp -r ./css-tips/ ./public/css-tips/

# html-tips
mkdir -p ./public/html-tips
cp -r ./html-tips/ ./public/html-tips/
