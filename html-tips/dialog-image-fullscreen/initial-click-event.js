// @ts-check

import {
  DIALOG_IMAGE_PREVIEW_WRAPPER_CLASS_NAME,
  DIALOG_ZOOM_CLASS_NAME,
  DIALOG_ZOOM_IN_BUTTON_CLASS_NAME,
  DIALOG_ZOOM_OUT_BUTTON_CLASS_NAME,
} from './const.js';

/**
 * ダイアログの枠外や黒塗りの部分をクリックした際にダイアログを閉じるイベントをセット
 * @param {HTMLDialogElement} dialogElem dialog要素
 */
export function setupDialogOuterClose(dialogElem) {
  dialogElem.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
      dialogElem.close();
    }
  });
  const imagePreviewWrapperElem = dialogElem.querySelector(
    `.${DIALOG_IMAGE_PREVIEW_WRAPPER_CLASS_NAME}`,
  );
  if (imagePreviewWrapperElem === null) {
    throw new Error(`ERROR :: Not Found ".${DIALOG_IMAGE_PREVIEW_WRAPPER_CLASS_NAME}" element`);
  }
  imagePreviewWrapperElem.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
      dialogElem.close();
    }
  });
}

/**
 * 拡大ボタンのイベント登録
 * @param {HTMLDialogElement} dialogElem dialog要素
 */
export function setupZoomInButton(dialogElem) {
  dialogElem
    .querySelector(`.${DIALOG_ZOOM_IN_BUTTON_CLASS_NAME}`)
    ?.addEventListener('click', () => {
      dialogElem.classList.add(DIALOG_ZOOM_CLASS_NAME);
      scrollToZoomCenter(dialogElem);
    });
}

/**
 * 縮小ボタンのイベント登録
 * @param {HTMLDialogElement} dialogElem dialog要素
 */
export function setupZoomOutButton(dialogElem) {
  dialogElem
    .querySelector(`.${DIALOG_ZOOM_OUT_BUTTON_CLASS_NAME}`)
    ?.addEventListener('click', () => {
      dialogElem.classList.remove(DIALOG_ZOOM_CLASS_NAME);
    });
}

/**
 * 画像を拡大表示した際に、中央を表示するようにスクロール
 * @param {HTMLDialogElement} dialogElem dialog要素
 */
function scrollToZoomCenter(dialogElem) {
  /** overflow: auto; でスクロールする枠要素 */
  const imagePreviewElem = dialogElem.querySelector('.image_preview');
  if (!imagePreviewElem) {
    throw new Error('ERROR :: Not Found ".image_preview" element');
  }
  // 中央部分を拡大
  const scrollWidth = imagePreviewElem.scrollWidth;
  const scrollHeight = imagePreviewElem.scrollHeight;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  if (scrollWidth < windowWidth && scrollHeight < windowHeight) {
    // スクロールが無しで、位置調整不要 (※この場合は拡大ボタンを表示しないが、念の為)
    return;
  }
  // 画面幅と高さの中央にスクロール
  if (scrollWidth > windowWidth) {
    imagePreviewElem.scrollLeft = (scrollWidth - windowWidth) / 2;
  }
  if (scrollHeight > windowHeight) {
    imagePreviewElem.scrollTop = (scrollHeight - windowHeight) / 2;
  }
}
