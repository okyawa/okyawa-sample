// @ts-check

import {
  DIALOG_HAS_CAPTION_CLASS_NAME,
  DIALOG_IMAGE_CAPTION_CLASS_NAME,
  DIALOG_IMAGE_COUNTER_CLASS_NAME,
  DIALOG_IMAGE_SIZE_CLASS_NAME,
  DIALOG_IMAGE_SIZE_ENABLED_CLASS_NAME,
  DIALOG_IMAGE_SIZE_TEXT_CLASS_NAME,
} from './const.js';
import { setupOuterClickClose } from './initial-click-event.js';

/** @typedef { import('./types').GroupImageType } GroupImageType */

/**
 * キャプションのテキストを初期化
 * @param {string} caption キャプションのテキスト
 * @param {HTMLDialogElement} dialogElem ダイアログ要素
 */
export function setupCaptionView(caption, dialogElem) {
  const captionElem = dialogElem.querySelector(`.${DIALOG_IMAGE_CAPTION_CLASS_NAME}`);
  if (captionElem === null) {
    throw new Error(`ERROR :: Not Found ".${DIALOG_IMAGE_CAPTION_CLASS_NAME}}" element`);
  }

  if (!caption) {
    // キャプション指定なし
    captionElem.innerHTML = '';
    dialogElem.classList.remove(DIALOG_HAS_CAPTION_CLASS_NAME);
    return;
  }

  // キャプション指定あり
  // ※生成するHTML構成↓
  // <div class="caption_text"><span class="inner_caption_text">キャプション</span></div>
  const divElem = document.createElement('div');
  divElem.classList.add('caption_text');
  const spanElem = document.createElement('span');
  spanElem.classList.add('inner_caption_text');
  // エスケープするために、textContentを使用
  spanElem.textContent = caption;
  divElem.append(spanElem);
  // キャプションのテキスト外をクリックした際は、ダイアログを閉じるイベントをセット
  setupOuterClickClose(divElem, dialogElem);
  // 生成したものを枠要素へセット
  captionElem.innerHTML = '';
  captionElem.append(divElem);
  dialogElem.classList.add(DIALOG_HAS_CAPTION_CLASS_NAME);
}

/**
 * 画像の幅と高さの表示を初期化
 * @param {number} width 画像の幅
 * @param {number} height 画像の高さ
 * @param {HTMLDialogElement} dialogElem ダイアログ要素
 */
export function setupImageSizeView(width, height, dialogElem) {
  const imageSizeElem = dialogElem.querySelector(`.${DIALOG_IMAGE_SIZE_CLASS_NAME}`);
  if (imageSizeElem === null) {
    throw new Error(`ERROR :: Not Found ".${DIALOG_IMAGE_SIZE_CLASS_NAME}" element`);
  }

  const divElem = document.createElement('div');
  divElem.classList.add(DIALOG_IMAGE_SIZE_TEXT_CLASS_NAME);
  divElem.textContent = `(${width}x${height})`;

  imageSizeElem.innerHTML = divElem.outerHTML;
  dialogElem.classList.add(DIALOG_IMAGE_SIZE_ENABLED_CLASS_NAME);
}

/**
 * 画像送りのカウンター表示を初期化
 * @param {string} currentUrl 現在表示中のURL
 * @param {HTMLDialogElement} dialogElem ダイアログ要素
 * @param {GroupImageType[]} groupImages グループ化した画像の情報
 */
export function setupImageCounterView(currentUrl, dialogElem, groupImages) {
  const counterElem = dialogElem.querySelector(`.${DIALOG_IMAGE_COUNTER_CLASS_NAME}`);
  if (counterElem === null) {
    return;
  }
  // 現在表示中の画像の並び順
  const currentIndex = groupImages.findIndex((image) => image.url === currentUrl);
  if (currentIndex === -1) {
    return;
  }
  // カウンター表示に反映
  counterElem.innerHTML = `<span class="counter_value">${
    currentIndex + 1
  }<span class="slash">/</span>${groupImages.length}</span>`;
}

