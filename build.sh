#!/bin/sh

rm -rf ./public

# barcode-scanner
mkdir -p ./public/barcode-scanner
cp -r ./barcode-scanner/ ./public/barcode-scanner/

# teachable-machine/pose-model
mkdir -p ./public/teachable-machine
cp -r ./teachable-machine/ ./public/teachable-machine/

