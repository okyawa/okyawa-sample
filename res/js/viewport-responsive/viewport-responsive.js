/**
 * 画面幅375px以下をViewportの表示倍率縮小によるレスポンシブ対応
 */

/**
 * Viewportを画面幅に応じて調整する
 */
function adjustViewport() {
  const TRIGGER_WIDTH = 375;
  const viewport = document.querySelector('meta[name="viewport"]');
  const value = window.outerWidth < TRIGGER_WIDTH
    ? `width=${TRIGGER_WIDTH}, target-densitydpi=device-dpi`
    : 'width=device-width, initial-scale=1';
  viewport.setAttribute('content', value);
}

/**
 * ブラウザに負荷がかからないよう、実行頻度を減らす
 * @param {function} func 実行する関数
 * @param {number} timeout 実行までの遅延時間 (ミリ秒)
 */
function debounce(func, timeout) {
  /** funcが呼び出されるまでの遅延時間 */
  const DELAY_MILLISECONDS = 300;
  let timer;
  timeout = timeout !== undefined ? timeout : DELAY_MILLISECONDS;
  return () => {
    const context = this;
    const args = arguments;
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(context, args);
    }, timeout);
  };
}

// 画面リサイズ時にViewportを調整
const debouncedFunction = debounce(adjustViewport)
window.addEventListener('resize', debouncedFunction, false);

// 画面読み込み時にViewportを調整を実行
window.addEventListener('DOMContentLoaded', adjustViewport, false);
