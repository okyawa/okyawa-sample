// @ts-check

import {
  DIALOG_CONTROLS_HIDDEN_CLASS_NAME,
  DIALOG_GROUP_IMAGES_ENABLED,
  DIALOG_HAS_CAPTION_CLASS_NAME,
  DIALOG_IMAGE_CAPTION_CLASS_NAME,
  DIALOG_IMAGE_COUNTER_CLASS_NAME,
  DIALOG_IMAGE_PREVIEW_WRAPPER_CLASS_NAME,
  DIALOG_IMAGE_SIZE_CLASS_NAME,
  DIALOG_IMAGE_SIZE_ENABLED_CLASS_NAME,
  DIALOG_NEXT_BUTTON_AREA_CLASS_NAME,
  DIALOG_NEXT_BUTTON_CLASS_NAME,
  DIALOG_PREV_BUTTON_AREA_CLASS_NAME,
  DIALOG_PREV_BUTTON_CLASS_NAME,
  DIALOG_ZOOM_CLASS_NAME,
  DIALOG_ZOOM_DISABLED_CLASS_NAME,
  DIALOG_ZOOM_IN_BUTTON_CLASS_NAME,
  DIALOG_ZOOM_OUT_BUTTON_CLASS_NAME,
} from './const.js';
import { htmlEscape } from './utility.js';

/** @typedef { import('./types').DialogImageOptionType } DialogImageOptionType */

/**
 * 画像拡大に使うdialog要素を生成
 * @param {DialogImageOptionType} options
 * @returns {HTMLDialogElement}
 */
export function createDialogImageElement(options) {
  const modalDialog = document.querySelector(`#${options.dialogId}`);
  if (modalDialog !== null && modalDialog instanceof HTMLDialogElement) {
    // HTML上に規定のdialog要素ある場合は、それを使う
    return modalDialog;
  }

  // 必要なdialog要素を生成
  const dialogElem = document.createElement('dialog');
  dialogElem.id = options.dialogId;
  dialogElem.style.display = 'none';
  dialogElem.innerHTML = `
    <div class="${DIALOG_IMAGE_PREVIEW_WRAPPER_CLASS_NAME}">
      <div class="preview_controls">
        <div class="${DIALOG_IMAGE_COUNTER_CLASS_NAME}"></div>
        <div class="inner_preview_controls">
          <button
            type="button"
            class="${DIALOG_ZOOM_IN_BUTTON_CLASS_NAME}"
            title="${htmlEscape(options.zoomInButtonTitle)}"
          >
            ${options.zoomInButtonInnerHTML}
          </button>
          <button
            type="button"
            class="${DIALOG_ZOOM_OUT_BUTTON_CLASS_NAME}"
            title="${htmlEscape(options.zoomOutButtonTitle)}"
          >
            ${options.zoomOutButtonInnerHTML}
          </button>
          <button
            type="button"
            class="close_button"
            title="${htmlEscape(options.closeButtonTitle)}"
            onclick="this.closest('dialog').close();"
          >
            ${options.closeButtonInnerHTML}
          </button>
        </div>
      </div>
      <div class="image_main_area">
        <div class="${DIALOG_PREV_BUTTON_AREA_CLASS_NAME}"></div>
        <div class="image_preview"></div>
        <div class="${DIALOG_NEXT_BUTTON_AREA_CLASS_NAME}"></div>
      </div>
      <div class="image_lower_text">
        <div class="${DIALOG_IMAGE_CAPTION_CLASS_NAME}"></div>
        <div class="${DIALOG_IMAGE_SIZE_CLASS_NAME}"></div>
      </div>
    </div>
  `;

  // 生成したdialog要素をbody要素の末尾に追加
  const bodyElem = document.querySelector('body');
  if (bodyElem === null) {
    throw new Error('Error: body element not found');
  }
  bodyElem.appendChild(dialogElem);

  return dialogElem;
}

/**
 * dialog要素の状態をリセット
 * @param {HTMLDialogElement} dialogElem dialog要素
 */
export function resetDialog(dialogElem) {
  // dialog要素のstyle指定で非表示にする
  dialogElem.style.display = 'none';
  // image_preview内の画像を削除
  const imagePreviewElem = dialogElem.querySelector('.image_preview');
  if (imagePreviewElem) {
    imagePreviewElem.innerHTML = '';
  }
  // body要素に付与されたdata属性を削除
  delete document.body.dataset.dialogId;
  delete dialogElem.dataset.direction;
  // dialogをリセットする際に各DOM要素の中身を空っぽに戻す
  clearInnerHtml(dialogElem);
  // 判定用に付与したクラス名を初期化
  resetDialogClassName(dialogElem);
}

/**
 * dialogをリセットする際に各DOM要素の中身を空っぽに戻す
 * @param {HTMLDialogElement} dialogElem dialog要素
 */
function clearInnerHtml(dialogElem) {
  // 表示テキスト
  const captionElem = dialogElem.querySelector(`.${DIALOG_IMAGE_CAPTION_CLASS_NAME}`);
  if (captionElem === null) {
    throw new Error(`Error: .${DIALOG_IMAGE_CAPTION_CLASS_NAME} element not found`);
  }
  const imageSizeElem = dialogElem.querySelector(`.${DIALOG_IMAGE_SIZE_CLASS_NAME}`);
  if (imageSizeElem === null) {
    throw new Error(`Error: .${DIALOG_IMAGE_SIZE_CLASS_NAME} element not found`);
  }
  // 画像送りボタン
  const prevButtonAreaElem = dialogElem.querySelector(`.${DIALOG_PREV_BUTTON_AREA_CLASS_NAME}`);
  if (prevButtonAreaElem === null) {
    throw new Error(`Error: .${DIALOG_PREV_BUTTON_AREA_CLASS_NAME} element not found`);
  }
  const nextButtonAreaElem = dialogElem.querySelector(`.${DIALOG_NEXT_BUTTON_AREA_CLASS_NAME}`);
  if (nextButtonAreaElem === null) {
    throw new Error(`Error: .${DIALOG_NEXT_BUTTON_AREA_CLASS_NAME} element not found`);
  }
  // 画像送りのカウンター表示
  const counterElem = dialogElem.querySelector(`.${DIALOG_IMAGE_COUNTER_CLASS_NAME}`);
  if (counterElem === null) {
    throw new Error(`Error: .${DIALOG_IMAGE_COUNTER_CLASS_NAME} element not found`);
  }

  // 対象勝訴の中身をクリア
  captionElem.innerHTML = '';
  imageSizeElem.innerHTML = '';
  prevButtonAreaElem.innerHTML = '';
  nextButtonAreaElem.innerHTML = '';
  counterElem.innerHTML = '';
}

/**
 * dialog要素のクラス名指定を初期状態に戻す
 * @param {HTMLDialogElement} dialogElem dialog要素
 */
function resetDialogClassName(dialogElem) {
  // 判定用に付与したクラス名を初期化
  dialogElem.classList.remove(DIALOG_ZOOM_CLASS_NAME);
  dialogElem.classList.remove(DIALOG_ZOOM_DISABLED_CLASS_NAME);
  dialogElem.classList.remove(DIALOG_HAS_CAPTION_CLASS_NAME);
  dialogElem.classList.remove(DIALOG_CONTROLS_HIDDEN_CLASS_NAME);
  dialogElem.classList.remove(DIALOG_IMAGE_SIZE_ENABLED_CLASS_NAME);
  dialogElem.classList.remove(DIALOG_GROUP_IMAGES_ENABLED);
}

/**
 * 前へボタンの要素を生成
 * @param {DialogImageOptionType} options オプション値
 * @returns {HTMLButtonElement}
 * @private
 */
export function createPrevButton(options) {
  const prevButtonElem = document.createElement('button');
  prevButtonElem.type = 'button';
  prevButtonElem.classList.add(DIALOG_PREV_BUTTON_CLASS_NAME);
  prevButtonElem.title = options.prevButtonTitle;
  prevButtonElem.innerHTML = options.prevButtonInnerHTML;
  return prevButtonElem;
}

/**
 * 前へボタンの要素を生成
 * @param {DialogImageOptionType} options オプション値
 * @returns {HTMLButtonElement}
 * @private
 */
export function createNextButton(options) {
  const nextButtonElem = document.createElement('button');
  nextButtonElem.type = 'button';
  nextButtonElem.classList.add(DIALOG_NEXT_BUTTON_CLASS_NAME);
  nextButtonElem.title = options.nextButtonTitle;
  nextButtonElem.innerHTML = options.nextButtonInnerHTML;
  return nextButtonElem;
}

/**
 * 表示する画像に拡大ボタンが必要かを判定
 * @param {number} width 画像の幅
 * @param {number} height 画像の高さ
 * @param {HTMLDialogElement} dialogElem ダイアログ要素
 * @param {HTMLElement} imagePreviewElem 画像表示エリアの要素
 * @private
 */
export async function setupDialogZoomVisible(width, height, dialogElem, imagePreviewElem) {
  const zoomEnabled =
    width > imagePreviewElem.clientWidth || height > imagePreviewElem.clientHeight;
  if (zoomEnabled) {
    dialogElem.classList.remove(DIALOG_ZOOM_DISABLED_CLASS_NAME);
  } else {
    dialogElem.classList.add(DIALOG_ZOOM_DISABLED_CLASS_NAME);
  }
}
