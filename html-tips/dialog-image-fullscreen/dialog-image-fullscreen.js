// @ts-check

import {
  DIALOG_CONTROLS_HIDDEN_CLASS_NAME,
  DIALOG_GROUP_IMAGES_ENABLED,
  DIALOG_LOADING_CLASS_NAME,
  DIALOG_NEXT_BUTTON_AREA_CLASS_NAME,
  DIALOG_NEXT_BUTTON_CLASS_NAME,
  DIALOG_PREV_BUTTON_AREA_CLASS_NAME,
  DIALOG_PREV_BUTTON_CLASS_NAME,
  DIALOG_SWITCHING_CLASS_NAME,
  DIALOG_ZOOM_CLASS_NAME,
  DIALOG_ZOOM_DISABLED_CLASS_NAME,
} from './const.js';
import { dialogImageOptionDefaults } from './defaults.js';
import { createDialogImageElement, resetDialog } from './dom.js';
import { managePrevNextButtonDisabled, preloadPrevNextImages, readGroupingData, readNextImageData } from './grouping.js';
import {
  setupDialogOuterClose,
  setupZoomInButton,
  setupZoomOutButton,
} from './initial-click-event.js';
import { handleKeyboardEvent } from './keyboard-event.js';
import { setupCaptionView, setupImageCounterView, setupImageSizeView } from './text-view.js';
import { setupDialogTouchMove, setupImageSwipe } from './touch-event.js';
import { readImageSize, waitDialogAnimation } from './utility.js';

/** @typedef { import('./types').DialogImageOptionType } DialogImageOptionType */
/** @typedef { import('./types').GroupImageType } GroupImageType */

/**
 * dialog要素を使った画像拡大
 */
export class DialogImage {
  /**
   * コンストラクタ
   * @param {DialogImageOptionType} config オプション指定
   */
  constructor(config) {
    /** @type {DialogImageOptionType} オプション */
    this.options = { ...dialogImageOptionDefaults, ...config };

    // dialog要素
    const modalDialog = document.querySelector(`#${this.options.dialogId}`);
    const existsDialog = modalDialog !== null && modalDialog instanceof HTMLDialogElement;
    /** @type {HTMLDialogElement} 画像拡大表示するdialog要素 */
    this.modalDialog = existsDialog ? modalDialog : createDialogImageElement(this.options);

    if (!existsDialog) {
      // 最初にdialog要素へセットするイベントを初期化
      this.setupInitialEvent();
    }

    /** @type {HTMLElement|null} 画像を囲む枠要素 */
    const imagePreviewElem = this.modalDialog.querySelector('.image_preview');
    if (!imagePreviewElem) {
      throw new Error('ERROR :: Not Found ".image_preview" element');
    }
    this.imagePreviewElem = imagePreviewElem;

    /** @type {GroupImageType[]} グループ化した画像の情報 */
    this.groupImages = [];
  }

  /**
   * 指定したリンク要素をクリックすると画像拡大のダイアログを開くように初期化
   */
  init() {
    // 開くボタンのイベント登録
    this.setupOpenLink();
  }

  /**
   * 直接ダイアログを開く
   * @param {{url: string, caption?: string}} param0
   */
  open({ url, caption = '' }) {
    // グループ化した画像の情報を初期化
    this.setupGroupImages(url);
    // 画像送りボタンの初期化
    this.setupNextPrevButton(url);
    // 拡大画像のダイアログを開く
    this.openImagePreviewDialog(url, caption).then(() => {});
  }

  /**
   * 最初にdialog要素へセットするイベントを初期化
   * @private
   */
  setupInitialEvent() {
    // ダイアログの枠外や黒塗りの部分をクリックした際にダイアログを閉じるイベントをセット
    setupDialogOuterClose(this.modalDialog);
    // ダイアログを閉じる際に実行するイベントを登録
    this.setupDialogClose();
    // 拡大ボタンのイベント登録
    setupZoomInButton(this.modalDialog);
    // 縮小ボタンのイベント登録
    setupZoomOutButton(this.modalDialog);
    // dialog要素に対するtouchmoveイベントの初期化 (※iPhoneでの背面スクロール防止策)
    setupDialogTouchMove(this.modalDialog);
  }

  /**
   * 開くボタンのイベント登録
   * @private
   */
  setupOpenLink() {
    if (!this.options.openLink) {
      return;
    }
    const openLinkElements =
      typeof this.options.openLink === 'string'
        ? document.querySelectorAll(this.options.openLink)
        : this.options.openLink;
    openLinkElements.forEach((linkElem) => {
      linkElem.addEventListener('click', (event) => {
        event.preventDefault();

        // ダイアログで表示する画像のURLとキャプション
        const targetElem = event.currentTarget;
        if (targetElem === null || !(targetElem instanceof HTMLAnchorElement)) {
          throw new Error('ERROR :: Not Found Target Anchor Element');
        }
        const url = targetElem.getAttribute('href') ?? '';
        const caption = targetElem.dataset.caption ?? '';

        // グループ化した画像の情報を初期化
        this.setupGroupImages(url);
        // 画像送りボタンの初期化
        this.setupNextPrevButton(url);

        // 画像拡大表示ダイアログを開く
        this.openImagePreviewDialog(url, caption).then(() => {});
      });
    });
  }

  /**
   * 画像拡大表示ダイアログを開く
   * @param {string} url 画像ファイルのURL
   * @param {string} caption 画像のキャプション
   * @private
   */
  async openImagePreviewDialog(url, caption) {
    // ローディング表示を付与
    this.modalDialog.classList.add(DIALOG_LOADING_CLASS_NAME);
    // 拡大画像をセット
    this.imagePreviewElem.innerHTML = `<img src="${url}" alt="" />`;
    // 画像のタッチイベントを初期化
    this.setupImageTouchEvent();
    // キャプションのテキストを初期化
    setupCaptionView(caption, this.modalDialog);
    // 表示画像自体のクリックした際のイベントをセット
    this.setupImageClick();
    // キーボードイベントを追加
    this.addKeyboardEvent();
    // body要素のdata属性にdialog要素のIDをセット (※キーボードイベント用)
    document.body.dataset.dialogId = this.options.dialogId;
    // dialog要素の開くアニメーションがすべて終了するまで待つ
    await waitDialogAnimation(this.modalDialog);
    // dialog要素を開く
    this.showModal();
    // 表示する画像の幅と高さを取得
    const { width, height } = await readImageSize(url);
    if (this.options.debug === 'loading') {
      // ローディング表示のデバッグモード
      return;
    }
    // ローディング表示を外す
    this.modalDialog.classList.remove(DIALOG_LOADING_CLASS_NAME);
    // キャプションの下部に画像の幅と高さを表示
    if (this.options.imageSizeVisible === true) {
      setupImageSizeView(width, height, this.modalDialog);
    }
    // 表示する画像に拡大ボタンが必要かを判定
    await this.setupDialogZoomVisible(width, height);
    // グループ化しているときの前後の画像を先読み
    preloadPrevNextImages(url, this.groupImages);
  }

  /**
   * 画像送りで画像とキャプションを切り替え
   * @param {string} url 画像ファイルのURL
   * @param {string} caption 画像のキャプション
   * @returns {Promise<{width: number, height: number}>}
   * @private
   */
  async changeImagePreview(url, caption) {
    // 拡大画像をセット
    this.imagePreviewElem.innerHTML = `<img src="${url}" alt="" />`;
    // 画像のタッチイベントを初期化
    this.setupImageTouchEvent();
    // キャプションのテキストを初期化
    setupCaptionView(caption, this.modalDialog);
    // 表示画像自体のクリックした際のイベントをセット
    this.setupImageClick();
    // 表示する画像の幅と高さを取得
    const { width, height } = await readImageSize(url);
    // キャプションの下部に画像の幅と高さを表示
    if (this.options.imageSizeVisible === true) {
      setupImageSizeView(width, height, this.modalDialog);
    }
    // 表示する画像に拡大ボタンが必要かを判定
    await this.setupDialogZoomVisible(width, height);
    // グループ化しているときの前後の画像を先読み
    preloadPrevNextImages(url, this.groupImages);

    return {
      width,
      height,
    };
  }

  /**
   * グループ化した画像の情報を初期化
   * @param {string} url 画像ファイルのURL
   * @private
   */
  setupGroupImages(url) {
    if (!this.options.groupSelector) {
      // グループ化指定なし
      return;
    }
    const groupElements = document.querySelectorAll(this.options.groupSelector);
    if (groupElements.length <= 1) {
      // グループ化で一致する要素なし
      return;
    }

    // グループ化した画像の情報をセット
    this.groupImages = Array.from(groupElements).map((elem) => {
      return {
        url: elem.getAttribute(this.options.groupUrlAttr) ?? '',
        caption: elem.getAttribute(this.options.groupCaptionAttr) ?? '',
      };
    });

    // グループ化した画像のキャプションが別の要素で指定されている場合
    if (
      this.options.groupCaptionAttr &&
      this.options.groupCaptionWrapSelector &&
      this.options.groupCaptionElemSelector
    ) {
      this.groupImages = this.groupImages.map((item) => readGroupingData(item, this.options));
    }

    // カウンター表示を初期化
    setupImageCounterView(url, this.modalDialog, this.groupImages);

    // 枠にグループ化が使われていることを示すクラス名を付与
    this.modalDialog.classList.add(DIALOG_GROUP_IMAGES_ENABLED);
  }

  /**
   * 画像送りボタンの初期化
   * @param {string} url 最初に表示する画像ファイルのURL
   * @private
   */
  setupNextPrevButton(url) {
    // 画像送りボタンの枠要素
    const prevAreaElem = this.modalDialog.querySelector(`.${DIALOG_PREV_BUTTON_AREA_CLASS_NAME}`);
    const nextAreaElem = this.modalDialog.querySelector(`.${DIALOG_NEXT_BUTTON_AREA_CLASS_NAME}`);
    if (prevAreaElem === null || nextAreaElem === null) {
      throw new Error(
        `ERROR :: Not Found ".${DIALOG_PREV_BUTTON_AREA_CLASS_NAME}" or ".${DIALOG_NEXT_BUTTON_AREA_CLASS_NAME}" element`,
      );
    }

    // 一旦中身をクリア
    prevAreaElem.innerHTML = '';
    nextAreaElem.innerHTML = '';

    // 前へボタン
    const prevButtonElem = this.createPrevButtonElement();
    // 次へボタン
    const nextButtonElem = this.createNextButtonElement();

    // DOMに生成したボタンを追加
    prevAreaElem.appendChild(prevButtonElem);
    nextAreaElem.appendChild(nextButtonElem);

    // 画像送りできないボタンをdisabledにする
    managePrevNextButtonDisabled(url, this.modalDialog, this.groupImages);
  }

  /**
   * 前へボタンの要素を生成
   * @returns {HTMLButtonElement}
   * @private
   */
  createPrevButtonElement() {
    const prevButtonElem = document.createElement('button');
    prevButtonElem.type = 'button';
    prevButtonElem.classList.add(DIALOG_PREV_BUTTON_CLASS_NAME);
    prevButtonElem.title = this.options.prevButtonTitle;
    prevButtonElem.innerHTML = this.options.prevButtonInnerHTML;
    prevButtonElem.addEventListener('click', async () => {
      await this.switchImage('prev');
    });
    return prevButtonElem;
  }

  /**
   * 前へボタンの要素を生成
   * @returns {HTMLButtonElement}
   * @private
   */
  createNextButtonElement() {
    const nextButtonElem = document.createElement('button');
    nextButtonElem.type = 'button';
    nextButtonElem.classList.add(DIALOG_NEXT_BUTTON_CLASS_NAME);
    nextButtonElem.title = this.options.nextButtonTitle;
    nextButtonElem.innerHTML = this.options.nextButtonInnerHTML;
    nextButtonElem.addEventListener('click', async () => {
      await this.switchImage('next');
    });
    return nextButtonElem;
  }

  /**
   * 画像を送りを実行
   * @param {'prev' | 'next'} direction 画像を送る方向
   * @returns {Promise<void>}
   * @private
   */
  async switchImage(direction) {
    if (this.modalDialog.classList.contains(DIALOG_ZOOM_CLASS_NAME)) {
      // ズーム時は画像送りしない
      return;
    }
    // 画像送り開始
    this.modalDialog.classList.add(DIALOG_SWITCHING_CLASS_NAME);

    // 現在表示中の画像URL
    const currentUrl = this.imagePreviewElem.querySelector('img')?.getAttribute('src') ?? '';
    const imageData = readNextImageData(direction, currentUrl, this.groupImages);
    if (imageData === null) {
      this.modalDialog.classList.remove(DIALOG_SWITCHING_CLASS_NAME);
      return;
    }
    const { width, height } = await this.changeImagePreview(imageData.url, imageData.caption);

    // 一旦、ズームボタンを非表示にする
    this.modalDialog.classList.add(DIALOG_ZOOM_DISABLED_CLASS_NAME);

    // 画像送りできないボタンをdisabledにする
    managePrevNextButtonDisabled(imageData.url, this.modalDialog, this.groupImages);
    // 画像送りのカウンター表示を更新
    setupImageCounterView(imageData.url, this.modalDialog, this.groupImages);

    // 画像送り完了
    this.modalDialog.classList.remove(DIALOG_SWITCHING_CLASS_NAME);

    // dialog要素の開くアニメーションがすべて終了するまで待つ
    await waitDialogAnimation(this.modalDialog);

    // 表示する画像に拡大ボタンが必要かを判定
    await this.setupDialogZoomVisible(width, height);

    // 左右の矢印キーで移動した場合、該当の画像ボタンをフォーカス
    if (this.modalDialog.dataset.direction === 'prev') {
      /** @type {HTMLButtonElement | null} */
      const prevButtonElem = this.modalDialog.querySelector(`.${DIALOG_PREV_BUTTON_CLASS_NAME}`);
      prevButtonElem?.focus();
    }
    if (this.modalDialog.dataset.direction === 'next') {
      /** @type {HTMLButtonElement | null} */
      const nextButtonElem = this.modalDialog.querySelector(`.${DIALOG_NEXT_BUTTON_CLASS_NAME}`);
      nextButtonElem?.focus();
    }
  }

  /**
   * 画像のタッチイベントを初期化
   * @private
   */
  setupImageTouchEvent() {
    // メインで表示している画像の要素
    const imgElem = this.imagePreviewElem.querySelector('img');
    if (imgElem === null) {
      throw new Error('ERROR :: Not Found "img" element in this.imagePreviewElem');
    }
    // メインで表示している画像のスワイプ操作を初期化
    setupImageSwipe(imgElem, this.modalDialog);
  }

  /**
   * 表示画像自体のクリックした際のイベントをセット
   * @private
   */
  setupImageClick() {
    const imgElem = this.modalDialog.querySelector('.image_preview img');
    imgElem?.addEventListener('click', () => {
      if (this.modalDialog.classList.contains(DIALOG_ZOOM_CLASS_NAME)) {
        // ズーム中の場合は縮小表示に戻す
        this.modalDialog.classList.remove(DIALOG_ZOOM_CLASS_NAME);
        return;
      }
      // コントロール表示を切り替え
      this.modalDialog.classList.toggle(DIALOG_CONTROLS_HIDDEN_CLASS_NAME);
    });
  }

  /**
   * dialog要素を開く
   * @private
   */
  showModal() {
    // dialog要素にデフォルトで付与していたdisplayのstyle指定を削除
    this.modalDialog.style.display = '';
    // モーダルダイアログを開く
    this.modalDialog.showModal();
    // モーダルダイアログを表示する際に、HTML要素(背景部分)がスクロールしないようにする
    document.documentElement.style.overflow = 'hidden';
  }

  /**
   * 表示する画像に拡大ボタンが必要かを判定
   * @param {number} width 画像の幅
   * @param {number} height 画像の高さ
   * @private
   */
  async setupDialogZoomVisible(width, height) {
    const zoomEnabled =
      width > this.imagePreviewElem.clientWidth || height > this.imagePreviewElem.clientHeight;
    if (zoomEnabled) {
      this.modalDialog.classList.remove(DIALOG_ZOOM_DISABLED_CLASS_NAME);
    } else {
      this.modalDialog.classList.add(DIALOG_ZOOM_DISABLED_CLASS_NAME);
    }
  }

  /**
   * キーボードイベントを追加
   * @private
   */
  addKeyboardEvent() {
    if (this.groupImages.length === 0) {
      // グループ化を使っていない場合は、キーボードイベントの登録は不要
      return;
    }
    document.addEventListener('keydown', handleKeyboardEvent);
  }

  /**
   * キーボードイベントを削除
   * @private
   */
  removeKeyboardEvent() {
    document.removeEventListener('keydown', handleKeyboardEvent);
  }

  /**
   * ダイアログを閉じる際に実行するイベントを登録
   * @private
   */
  setupDialogClose() {
    this.modalDialog.addEventListener('close', async (event) => {
      const dialog = event.currentTarget;
      if (!(dialog instanceof HTMLDialogElement)) {
        // dialog要素ではない場合は中断
        return;
      }
      // 背景スクロールを防ぐために追加したスタイルを削除
      document.documentElement.style.overflow = '';
      // dialog要素の閉じるアニメーションがすべて終了するまで待つ
      await waitDialogAnimation(dialog);
      // キーボードイベントを削除
      this.removeKeyboardEvent();
      // グループ化した画像の情報を初期化
      this.groupImages = [];
      // dialog要素の状態をリセット
      resetDialog(dialog);
    });
  }
}

// WindowオブジェクトからDialogImageクラスにアクセスできるようにする
window.DialogImage = DialogImage;
