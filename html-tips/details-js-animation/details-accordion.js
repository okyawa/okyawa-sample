// @ts-check

/** アニメーションの時間とイージング */
const animTiming = {
  duration: 300,
  easing: 'ease-in-out',
};

/**
 * アコーディオンを閉じるときのキーフレームを返す
 * @param {HTMLElement} contentElement 
 * @returns 
 */
const closingAnimation = (contentElement) => [
  {
    height: contentElement.offsetHeight + 'px',
    opacity: 1,
  },
  {
    height: 0,
    opacity: 0,
  },
];

// アコーディオンを開くときのキーフレーム
/**
 * アコーディオンを開くときのキーフレームを返す
 * @param {HTMLElement} contentElement 
 * @returns 
 */
const openingAnimation = (contentElement) => [
  {
    height: 0,
    opacity: 0,
  },
  {
    height: contentElement.offsetHeight + 'px',
    opacity: 1,
  },
];

/**
 * summary要素をクリックした際に実行するイベントハンドラー
 * @param {MouseEvent} event 
 */
function handleClickSummary(event) {
  const summaryElement = event.currentTarget;
  if (summaryElement instanceof HTMLElement === false) {
    throw new Error('Error :: summary element not found');
  }
  const detailsElement = summaryElement.closest('details');
  if (detailsElement instanceof HTMLDetailsElement === false) {
    throw new Error('Error :: details element not found');
  }
  const contentElement = detailsElement.querySelector('.accordion_content');
  if (contentElement instanceof HTMLElement === false) {
    throw new Error('Error :: content element not found');
  }
  // summary要素click時のデフォルトの挙動を無効化
  event.preventDefault();

  if (detailsElement.getAttribute('open') === null) {
    // 閉じている場合で、open属性を付与して「開く」
    // open属性を付与
    detailsElement.setAttribute('open', 'true');
    // アコーディオンを開くときの処理
    contentElement.animate(openingAnimation(contentElement), animTiming);
    return;
  }
  // 開いている場合、open属性を取り除いて「閉じる」
  const closingAnim = contentElement.animate(closingAnimation(contentElement), animTiming);
  // アニメーション完了後の処理
  closingAnim.onfinish = () => {
    // アニメーションの完了後にopen属性を取り除く
    detailsElement.removeAttribute('open');
  };
}

/**
 * details要素をアコーディオンの初期化処理
 * @param {string} wrapSelector 対象details要素のセレクター
 */
function setupDetailsAccordion(wrapSelector) {
  document.querySelectorAll(wrapSelector).forEach(function (detailsElement) {
    detailsElement.querySelector('summary')
      ?.addEventListener('click', handleClickSummary);
  });
}

// 画面読み込み完了後に初期化処理を実行
document.addEventListener('DOMContentLoaded', () => {
  setupDetailsAccordion('details.accordion');
});
