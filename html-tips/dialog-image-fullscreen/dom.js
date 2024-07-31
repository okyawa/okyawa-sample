// @ts-check

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
