# BarcodeDetector API を使ったバーコードリーダー

- 現状、ブラウザの標準APIのBarcodeDetectorを使えるのはChromeだけで、iOSのSafariでは利用できない状態
- Chromeはブラウザの標準APIのBarcodeDetectorを使うことで、canvasに変換せずにvideoのまま渡すことができ、記述量が少なくなる


## デモ

- [BarcodeDetector Shape Detection API バーコードリーダーSample](https://okyawa-sample.web.app/barcode-detector)


## 参照

- [BarcodeDetector - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector)
- [BarcodeDetector API - Can I use](https://caniuse.com/mdn-api_barcodedetector)
- [The Shape Detection API: a picture is worth a thousand words, faces, and barcodes - web.dev](https://web.dev/shape-detection/)
- [Barcode Detection APIでブラウザ上からQRコードを読み取る](https://sbfl.net/blog/2020/04/12/barcode-detection-api-qr-code/)
- [Shape Detection API + PWAでブラウザからそのまま使えるバーコードリーダーアプリを作ってみる - Qiita](https://qiita.com/radiocat/items/ce07a4942fc912df85ab)
- [バーコード を読めるようになりたかったので　～ Shape Detection API を使ってみる～](https://toranoana-lab.hatenablog.com/entry/2020/08/12/183305)
- [Webの技術だけで作るQRコードリーダー - Qiita](https://qiita.com/kan_dai/items/4331aae12f5f2d3ad18d)
- [続・Webの技術だけで作るQRコードリーダー - Qiita](https://qiita.com/kan_dai/items/3486880236a2fcd9b527)


## BarcodeDetectorの使い方

- web.devより参照

```js
const barcodeDetector = new BarcodeDetector({
  // (Optional) A series of barcode formats to search for.
  // Not all formats may be supported on all platforms
  formats: [
    'aztec',
    'code_128',
    'code_39',
    'code_93',
    'codabar',
    'data_matrix',
    'ean_13',
    'ean_8',
    'itf',
    'pdf417',
    'qr_code',
    'upc_a',
    'upc_e'
  ]
});
try {
  const barcodes = await barcodeDetector.detect(image);
  barcodes.forEach(barcode => searchProductDatabase(barcode));
} catch (e) {
  console.error('Barcode detection failed:', e);
}
```

## 配列内の検出オブジェクトの情報

```js
const barcode = {
  boundingBox: {
   x: 0,
   y: 0,
   width: 100,
   height: 100,
   top: 10,
   right: 10,
   bottom: 10,
   left: 10
  },
  rawValue: "バーコードに書き込まれた文字列",
  format: "qr_code",
  cornerPoints: [
    {x: 40, y: 40},
    {x: 250, y: 40},
    {x: 250, y: 250},
    {x: 40, y: 250}
  ]
};
```
