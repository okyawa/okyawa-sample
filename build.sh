#!/bin/sh

rm -rf ./public

# barcode-scanner
mkdir -p ./public/barcode-scanner
cp -r ./barcode-scanner/ ./public/barcode-scanner/
