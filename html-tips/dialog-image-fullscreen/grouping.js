// @ts-check

/** @typedef { import('./types').DialogImageOptionType } DialogImageOptionType */
/** @typedef { import('./types').GroupImageType } GroupImageType */

import { DIALOG_NEXT_BUTTON_CLASS_NAME, DIALOG_PREV_BUTTON_CLASS_NAME } from './const.js';

/**
 * HTML上から、グループに必要なデータを読み取って返す
 * (※グループ化した画像のキャプションが別の要素で指定されている場合用)
 *
 * @param {GroupImageType} item グループ化した画像の情報
 * @param {DialogImageOptionType} options オプション値
 * @returns {GroupImageType}
 */
export function readGroupingData(item, options) {
  const activeElem = document.querySelector(
    `${options.groupSelector}[${options.groupUrlAttr}="${item.url}"]`,
  );
  if (activeElem === null) {
    throw new Error('ERROR :: Not Found Active Element');
  }
  // グループ化した画像のキャプションが指定されている要素からキャプション情報を取り出す
  /** @type {HTMLInputElement | null | undefined } */
  const captionElem = activeElem
    .closest(options.groupCaptionWrapSelector ?? '')
    ?.querySelector(options.groupCaptionElemSelector ?? '');
  let caption = '';
  if (captionElem) {
    if (options.groupCaptionAttr === 'value') {
      // input要素など
      caption = captionElem.value;
    } else {
      // リンクなど
      caption = captionElem.getAttribute(options.groupCaptionAttr) ?? '';
    }
  }
  return {
    url: item.url,
    caption: caption ?? '',
  };
}

/**
 * 画像送りできないボタンをdisabledにする
 * @param {string} currentUrl 現在表示中の画像のURL
 * @param {HTMLDialogElement} dialogElem ダイアログ要素
 * @param {GroupImageType[]} groupImages グループ化した画像の情報
 */
export function managePrevNextButtonDisabled(currentUrl, dialogElem, groupImages) {
  const prevImageData = readNextImageData('prev', currentUrl, groupImages);
  const nextImageData = readNextImageData('next', currentUrl, groupImages);
  /** @type {HTMLButtonElement | null} */
  const prevButtonElem = dialogElem.querySelector(`.${DIALOG_PREV_BUTTON_CLASS_NAME}`);
  /** @type {HTMLButtonElement | null} */
  const nextButtonElem = dialogElem.querySelector(`.${DIALOG_NEXT_BUTTON_CLASS_NAME}`);
  if (prevButtonElem === null || nextButtonElem === null) {
    throw new Error('ERROR :: Not Found Prev or Next Button Element');
  }
  prevButtonElem.disabled = prevImageData === null;
  nextButtonElem.disabled = nextImageData === null;
}

/**
 * 画像送りで画像とキャプションを切り替え
 * @param {'prev' | 'next'} direction 画像を送る方向
 * @param {string} currentUrl 現在表示中の画像のURL
 * @param {GroupImageType[]} groupImages グループ化した画像の情報
 * @returns {GroupImageType | null}
 */
export function readNextImageData(direction, currentUrl, groupImages) {
  // 現在表示中の画像URL
  const currentIndex = groupImages.findIndex((image) => image.url === currentUrl);

  if (
    (direction === 'prev' && groupImages[currentIndex - 1] === undefined) ||
    (direction === 'next' && groupImages[currentIndex + 1] === undefined)
  ) {
    // 表示する画像なし
    return null;
  }

  // 次に表示する画像URL
  const url =
    direction === 'prev' ? groupImages[currentIndex - 1].url : groupImages[currentIndex + 1].url;
  // 次に表示するキャプション
  const caption =
    direction === 'prev'
      ? groupImages[currentIndex - 1].caption
      : groupImages[currentIndex + 1].caption;

  return { url, caption };
}

/**
 * グループ化しているときの前後の画像を先読み
 * @param {string} currentUrl 現在表示中の画像のURL
 * @param {GroupImageType[]} groupImages グループ化した画像の情報
 */
export function preloadPrevNextImages(currentUrl, groupImages) {
  if (groupImages.length === 0) {
    // プリロードする画像なし
    return;
  }
  const urlList = groupImages.map((image) => image.url);
  const currentIndex = urlList.indexOf(currentUrl);
  if (groupImages[currentIndex - 1]) {
    // 前の画像をプリロード
    new Image().src = groupImages[currentIndex - 1].url;
  }
  if (groupImages[currentIndex + 1]) {
    // 次の画像をプリロード
    new Image().src = groupImages[currentIndex + 1].url;
  }
}
