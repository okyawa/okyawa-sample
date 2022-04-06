# 画像圧縮ツールSquooshをNode.jsで扱う

- https://github.com/ics-creative/220204_libSquoosh/tree/main/basic の写経
- https://ics.media/entry/220204/ を参照


## 使い方

- `images` ディレクトリに画像圧縮したい画像ファイルを入れる
- 生成結果は `dist` ディレクトリに保存される

### ファイル形式はそのままで画像圧縮

```sh
npm run optimize
```

### リサイズして画像圧縮

```sh
npm run resize
```

### リサイズと減色して画像圧縮

```sh
npm run reduce
```

### WebPに画像変換

```sh
npm run convert
```


## 各種フォーマットのオプションは細かい設定

- [code.ts](https://github.com/GoogleChromeLabs/squoosh/blob/dev/libsquoosh/src/codecs.ts#L284) の `defaultEncoderOptions` に書かれている
- Web版の[Squoosh](https://squoosh.app/)アプリと同じオプションが使える
    - 名称は完全に一致していない場合があるので注意
