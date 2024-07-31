import { DIALOG_NEXT_BUTTON_CLASS_NAME, DIALOG_PREV_BUTTON_CLASS_NAME, DIALOG_ZOOM_CLASS_NAME } from './const.js';

/**
 * メインで表示している画像のスワイプ操作を初期化
 * @param {HTMLImageElement} imgElem メインのimg要素
 * @param {HTMLDialogElement} dialogElem dialog要素
 */
export function setupImageSwipe(imgElem, dialogElem) {
  /**
   * 左スワイプ時の処理
   */
  const handleSwipeLeft = () => {
    if (dialogElem.classList.contains(DIALOG_ZOOM_CLASS_NAME)) {
      // ズーム中はスワイプ動作を実行しない
      return;
    }
    // 前へボタンをクリック
    const prevButtonElem = dialogElem.querySelector(`.${DIALOG_PREV_BUTTON_CLASS_NAME}`);
    prevButtonElem?.dispatchEvent(new Event('click'));
  };

  /**
   * 右スワイプ時の処理
   */
  const handleSwipeRight = () => {
    if (dialogElem.classList.contains(DIALOG_ZOOM_CLASS_NAME)) {
      // ズーム中はスワイプ動作を実行しない
      return;
    }
    // 次へボタンをクリック
    const prevButtonElem = dialogElem.querySelector(`.${DIALOG_NEXT_BUTTON_CLASS_NAME}`);
    prevButtonElem?.dispatchEvent(new Event('click'));
  };

  /**
   * 縦スワイプ時の処理
   */
  const handleSwipeVertical = () => {
    if (dialogElem.classList.contains(DIALOG_ZOOM_CLASS_NAME)) {
      // ズーム中はスワイプ動作を実行しない
      return;
    }
    // ダイアログを閉じる
    dialogElem.close();
  };

  // スワイプ操作をimg要素にセット
  setupHandleSwipe(imgElem, handleSwipeLeft, handleSwipeRight, handleSwipeVertical);
}

/**
 * スワイプ操作の初期化
 * @param {HTMLElement} imgElem img要素
 * @param {function} handleSwipeLeft 左スワイプ時の処理
 * @param {function} handleSwipeRight 右スワイプ時の処理
 * @param {function} handleSwipeVertical 縦スワイプ時の処理
 */
function setupHandleSwipe(imgElem, handleSwipeLeft, handleSwipeRight, handleSwipeVertical) {
  if (window.ontouchend === undefined) {
    // タッチイベントが使えない場合は不要な処理
    return;
  }

  // タップ時の誤動作を防ぐためのスワイプ時の処理を実行しない最小距離
  const minimumDistance = 30;
  // スワイプ開始時の座標
  let startX = 0;
  let startY = 0;
  // スワイプ終了時の座標
  let endX = 0;
  let endY = 0;

  // 移動を開始した座標を取得
  imgElem.addEventListener('touchstart', (e) =>  {
    startX = e.touches[0].pageX;
    startY = e.touches[0].pageY;
  });

  // 移動した座標を取得
  imgElem.addEventListener('touchmove', (e) =>  {
    endX = e.changedTouches[0].pageX;
    endY = e.changedTouches[0].pageY;
  });

  // 移動距離から左右or上下の処理を実行
  imgElem.addEventListener('touchend', (e) =>  {
    endX = e.changedTouches[0].pageX;
    endY = e.changedTouches[0].pageY;

    // スワイプ終了時にx軸とy軸の移動量を取得
    // 左スワイプに対応するためMath.abs()で+に変換
    const distanceX = Math.abs(endX - startX);
    const distanceY = Math.abs(endY - startY);

    // 左右のスワイプ距離の方が上下より長い && 小さなスワイプは検知しないようにする
    if (distanceX > distanceY && distanceX > minimumDistance) {
      if (startX < endX) {
        // 左スワイプ
        handleSwipeLeft();
      } else {
        // 右スワイプ
        handleSwipeRight();
      }
      return false;
    }

    // 上下のスワイプ距離の方が左右より長い && 小さなスワイプは検知しないようにする
    if (distanceX < distanceY && distanceY > minimumDistance) {
      // 上下スワイプ
      handleSwipeVertical();
      return false;
    }
  });
}
