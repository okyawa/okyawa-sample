#!/bin/sh

rm -rf ./public

# barcode-scanner
mkdir -p ./public/barcode-scanner
cp -r ./barcode-scanner/ ./public/barcode-scanner/

# barcode-detector
mkdir -p ./public/barcode-detector
cp -r ./barcode-detector/ ./public/barcode-detector/

# teachable-machine
mkdir -p ./public/teachable-machine
cp -r ./teachable-machine/ ./public/teachable-machine/

# scroll-snap
mkdir -p ./public/scroll-snap
cp -r ./scroll-snap/ ./public/scroll-snap/

