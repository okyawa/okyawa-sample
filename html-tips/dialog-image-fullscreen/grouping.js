// @ts-check

/** @typedef { import('./types').GroupImageType } GroupImageType */

import { DIALOG_NEXT_BUTTON_CLASS_NAME, DIALOG_PREV_BUTTON_CLASS_NAME } from './const.js';

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
 * @private
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
