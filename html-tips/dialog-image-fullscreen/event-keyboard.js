// @ts-check

import { DIALOG_NEXT_BUTTON_CLASS_NAME, DIALOG_PREV_BUTTON_CLASS_NAME } from './const.js';

/**
 * キーボードイベントのイベントハンドラー
 * @param {KeyboardEvent} event キーボードイベント
 * @private
 */
export function handleKeyboardEvent(event) {
  /** dialog要素のid値 */
  const dialogId = document.querySelector('body')?.dataset.dialogId;
  if (!dialogId) {
    return;
  }

  if (['ArrowLeft', 'ArrowRight'].includes(event.key) === false) {
    return;
  }

  /** @type {HTMLDialogElement | null} dialog要素 */
  const dialogElem = document.querySelector(`#${dialogId}`);
  if (dialogElem === null) {
    throw new Error('Error: dialog element not found.');
  }

  if (event.key === 'ArrowLeft') {
    // 右矢印きー: 前へ
    const prevButtonElem = dialogElem?.querySelector(`.${DIALOG_PREV_BUTTON_CLASS_NAME}`);
    prevButtonElem?.dispatchEvent(new Event('click'));
    // 画像送り完了後にフォーカスを当てれるよう、判定用のdata属性をセット
    dialogElem.dataset.direction = 'prev';
    return;
  }

  if (event.key === 'ArrowRight') {
    // 右矢印キー: 次へ
    const nextButtonElem = dialogElem?.querySelector(`.${DIALOG_NEXT_BUTTON_CLASS_NAME}`);
    nextButtonElem?.dispatchEvent(new Event('click'));
    // 画像送り完了後にフォーカスを当てれるよう、判定用のdata属性をセット
    dialogElem.dataset.direction = 'next';
    return;
  }
}
