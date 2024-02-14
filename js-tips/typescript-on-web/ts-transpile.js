// TypeScript本家のパッケージ
import { transpile, ScriptTarget } from 'https://esm.sh/typescript@5.3.3?bundle&target=esnext';
// ソースコード圧縮し、minifyするパッケージ
import { minify_sync } from 'https://esm.sh/terser@5.27.0?bundle&target=esnext';

/**
 * TypeScriptファイルを読み込み、JavaScriptにトランスパイルして圧縮したDataURLを返す
 * @param {string} url TypeScriptファイルのURL
 * @returns {Promise<string>}
 */
export async function transpileTS(url) {
  const response = await fetch(url);
  const tsText = await response.text();

  // TypeScriptからJavaScriptへのトラインスパイルを実行
  const js = transpile(tsText, {
    target: ScriptTarget.ESNext,
  });

  // ソースコードの圧縮
  const { code } = minify_sync(js, {
    module: true,
  });

  // UTF-8でエンコードしBASE64へ変換したDataURLへ変換
  return `data:text/javascript;charset=utf-8,${encodeURIComponent(code)}`;
}
