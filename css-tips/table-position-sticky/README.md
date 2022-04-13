# table要素に `position: sticky;` を使って、theadとtbody内のth要素を固定

- 下記サイトの写経
  - [CSSだけで実装できるとは！テーブルのヘッダと左端のセルの両方を固定させるCSSの極上テクニック - coliss](https://coliss.com/articles/build-websites/operation/css/table-with-both-a-sticky-header-and-a-sticky-first-column.html)

## position: stickyでの固定方法

- `table` を囲う枠に、幅と高さの指定を加え、 `overflow: auto;` を指定
- `thead` 内の `th` に対し、 `position: sticky; z-index: 1; top: 0;` を指定することで、縦スクロール時に `thead` 部分が固定される
- `tbody` 内の `th` と `thead` 内の `th:first-child` に対し、 `position: sticky; z-index: 1; left: 0;` を指定することで、左右のスクロール時に `tbody` 内の `th` を固定できる
  - `table thead th:first-child` にだけ、 `left: 0;` と `z-index: 2` を加える必要あり
