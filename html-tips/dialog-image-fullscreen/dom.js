// @ts-check

import {
  DIALOG_CONTROLS_HIDDEN_CLASS_NAME,
  DIALOG_GROUP_IMAGES_ENABLED,
  DIALOG_HAS_CAPTION_CLASS_NAME,
  DIALOG_IMAGE_SIZE_ENABLED_CLASS_NAME,
  DIALOG_ZOOM_CLASS_NAME,
  DIALOG_ZOOM_DISABLED_CLASS_NAME,
} from './const.js';
import {htmlEscape} from './utility.js';

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
    <div class="image_preview_wrapper">
      <div class="preview_controls">
        <div class="image_counter"></div>
        <div class="inner_preview_controls">
          <button
            type="button"
            class="zoom_in_button"
            title="${htmlEscape(options.zoomInButtonTitle)}"
          >
            ${options.zoomInButtonInnerHTML}
          </button>
          <button
            type="button"
            class="zoom_out_button"
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
        <div class="prev_button_area"></div>
        <div class="image_preview"></div>
        <div class="next_button_area"></div>
      </div>
      <div class="image_lower_text">
        <div class="image_caption"></div>
        <div class="image_size"></div>
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
  // 背景スクロールを防ぐために追加したスタイルを削除
  document.documentElement.style.overflow = '';
}

/**
 * dialogをリセットする際に各DOM要素の中身を空っぽに戻す
 * @param {HTMLDialogElement} dialogElem dialog要素
 */
function clearInnerHtml(dialogElem) {
  // 表示テキスト
  const captionElem = dialogElem.querySelector('.image_caption');
  if (captionElem === null) {
    throw new Error('Error: image_caption element not found');
  }
  const imageSizeElem = dialogElem.querySelector('.image_size');
  if (imageSizeElem === null) {
    throw new Error('Error: image_size element not found');
  }
  // 画像送りボタン
  const prevButtonAreaElem = dialogElem.querySelector('.prev_button_area');
  if (prevButtonAreaElem === null) {
    throw new Error('Error: prev_button_area element not found');
  }
  const nextButtonAreaElem = dialogElem.querySelector('.next_button_area');
  if (nextButtonAreaElem === null) {
    throw new Error('Error: next_button_area element not found');
  }
  // 画像送りのカウンター表示
  const counterElem = dialogElem.querySelector('.image_counter');
  if (counterElem === null) {
    throw new Error('Error: image_counter element not found');
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
