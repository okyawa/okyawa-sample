// @ts-check

import {
  DIALOG_CONTROLS_HIDDEN_CLASS_NAME,
  DIALOG_GROUP_IMAGES_ENABLED,
  DIALOG_HAS_CAPTION_CLASS_NAME,
  DIALOG_IMAGE_SIZE_ENABLED_CLASS_NAME,
  DIALOG_LOADING_CLASS_NAME,
  DIALOG_NEXT_BUTTON_CLASS_NAME,
  DIALOG_PREV_BUTTON_CLASS_NAME,
  DIALOG_SWITCHING_CLASS_NAME,
  DIALOG_ZOOM_CLASS_NAME,
  DIALOG_ZOOM_DISABLED_CLASS_NAME,
} from './const.js';
import { dialogImageOptionDefaults } from './defaults.js';
import { createDialogImageElement, resetDialog } from './dom.js';
import { handleKeyboardEvent } from './keyboard-event.js';
import { setupImageSwipe } from './touch-event.js';
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
    this.setupDialogOuterClose();
    // ダイアログを閉じる際に実行するイベントを登録
    this.setupDialogClose();
    // 拡大ボタンのイベント登録
    this.setupZoomInButton();
    // 縮小ボタンのイベント登録
    this.setupZoomOutButton();
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
    this.setupCaptionView(caption);
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
    this.setupImageSizeView(width, height);
    // 表示する画像に拡大ボタンが必要かを判定
    await this.setupDialogZoomVisible(width, height);
    // グループ化しているときの前後の画像を先読み
    this.preloadPrevNextImages(url);
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
    this.setupCaptionView(caption);
    // 表示画像自体のクリックした際のイベントをセット
    this.setupImageClick();
    // 表示する画像の幅と高さを取得
    const { width, height } = await readImageSize(url);
    // キャプションの下部に画像の幅と高さを表示
    this.setupImageSizeView(width, height);
    // 表示する画像に拡大ボタンが必要かを判定
    await this.setupDialogZoomVisible(width, height);
    // グループ化しているときの前後の画像を先読み
    this.preloadPrevNextImages(url);

    return {
      width,
      height,
    };
  }

  /**
   * グループ化しているときの前後の画像を先読み
   * @param {string} currentUrl 現在表示中の画像のURL
   * @returns
   * @private
   */
  preloadPrevNextImages(currentUrl) {
    if (this.groupImages.length === 0) {
      // プリロードする画像なし
      return;
    }
    const urlList = this.groupImages.map((image) => image.url);
    const currentIndex = urlList.indexOf(currentUrl);
    if (this.groupImages[currentIndex - 1]) {
      // 前の画像をプリロード
      new Image().src = this.groupImages[currentIndex - 1].url;
    }
    if (this.groupImages[currentIndex + 1]) {
      // 次の画像をプリロード
      new Image().src = this.groupImages[currentIndex + 1].url;
    }
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
      this.groupImages = this.groupImages.map((item) => {
        const activeElem = document.querySelector(
          `${this.options.groupSelector}[${this.options.groupUrlAttr}="${item.url}"]`,
        );
        if (activeElem === null) {
          throw new Error('ERROR :: Not Found Active Element');
        }
        // グループ化した画像のキャプションが指定されている要素からキャプション情報を取り出す
        /** @type {HTMLInputElement | null | undefined } */
        const captionElem = activeElem
          .closest(this.options.groupCaptionWrapSelector ?? '')
          ?.querySelector(this.options.groupCaptionElemSelector ?? '');
        let caption = '';
        if (captionElem) {
          if (this.options.groupCaptionAttr === 'value') {
            // input要素など
            caption = captionElem.value;
          } else {
            // リンクなど
            caption = captionElem.getAttribute(this.options.groupCaptionAttr) ?? '';
          }
        }
        return {
          url: item.url,
          caption: caption ?? '',
        };
      });
    }

    // カウンター表示を初期化
    this.setupImageCounterView(url);

    // 枠にグループ化が使われていることを示すクラス名を付与
    this.modalDialog.classList.add(DIALOG_GROUP_IMAGES_ENABLED);
  }

  /**
   * 画像送りのカウンター表示を初期化
   * @param {string} currentUrl 現在表示中のURL
   * @private
   */
  setupImageCounterView(currentUrl) {
    const counterElem = this.modalDialog.querySelector('.image_counter');
    if (counterElem === null) {
      return;
    }
    // 現在表示中の画像の並び順
    const currentIndex = this.groupImages.findIndex((image) => image.url === currentUrl);
    if (currentIndex === -1) {
      return;
    }
    // カウンター表示に反映
    counterElem.innerHTML = `<span class="counter_value">${
      currentIndex + 1
    }<span class="slash">/</span>${this.groupImages.length}</span>`;
  }

  /**
   * 画像送りボタンの初期化
   * @param {string} url 最初に表示する画像ファイルのURL
   * @private
   */
  setupNextPrevButton(url) {
    // 画像送りボタンの枠要素
    const prevAreaElem = this.modalDialog.querySelector('.prev_button_area');
    const nextAreaElem = this.modalDialog.querySelector('.next_button_area');
    if (prevAreaElem === null || nextAreaElem === null) {
      throw new Error('ERROR :: Not Found ".prev_button_area" or ".next_button_area" element');
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
    this.managePrevNextButtonDisabled(url);
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
    const imageData = this.readNextImageData(direction, currentUrl);
    if (imageData === null) {
      this.modalDialog.classList.remove(DIALOG_SWITCHING_CLASS_NAME);
      return;
    }
    const { width, height } = await this.changeImagePreview(imageData.url, imageData.caption);

    // 一旦、ズームボタンを非表示にする
    this.modalDialog.classList.add(DIALOG_ZOOM_DISABLED_CLASS_NAME);

    // 画像送りできないボタンをdisabledにする
    this.managePrevNextButtonDisabled(imageData.url);
    // 画像送りのカウンター表示を更新
    this.setupImageCounterView(imageData.url);

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
   * 画像送りできないボタンをdisabledにする
   * @param {string} currentUrl 現在表示中の画像のURL
   * @private
   */
  managePrevNextButtonDisabled(currentUrl) {
    const prevImageData = this.readNextImageData('prev', currentUrl);
    const nextImageData = this.readNextImageData('next', currentUrl);
    /** @type {HTMLButtonElement | null} */
    const prevButtonElem = this.modalDialog.querySelector(`.${DIALOG_PREV_BUTTON_CLASS_NAME}`);
    /** @type {HTMLButtonElement | null} */
    const nextButtonElem = this.modalDialog.querySelector(`.${DIALOG_NEXT_BUTTON_CLASS_NAME}`);
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
   * @returns {GroupImageType | null}
   * @private
   */
  readNextImageData(direction, currentUrl) {
    // 現在表示中の画像URL
    // const currentUrl = this.imagePreviewElem.querySelector('img')?.getAttribute('src') ?? '';
    const currentIndex = this.groupImages.findIndex((image) => image.url === currentUrl);

    if (
      (direction === 'prev' && this.groupImages[currentIndex - 1] === undefined) ||
      (direction === 'next' && this.groupImages[currentIndex + 1] === undefined)
    ) {
      // 表示する画像なし
      return null;
    }

    // 次に表示する画像URL
    const url =
      direction === 'prev'
        ? this.groupImages[currentIndex - 1].url
        : this.groupImages[currentIndex + 1].url;
    // 次に表示するキャプション
    const caption =
      direction === 'prev'
        ? this.groupImages[currentIndex - 1].caption
        : this.groupImages[currentIndex + 1].caption;

    return { url, caption };
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
   * キャプションのテキストを初期化
   * @param {string} caption キャプションのテキスト
   * @private
   */
  setupCaptionView(caption) {
    const captionElem = this.modalDialog.querySelector('.image_caption');
    if (captionElem === null) {
      throw new Error('ERROR :: Not Found ".image_caption" element');
    }
    if (caption) {
      const divElem = document.createElement('div');
      divElem.classList.add('caption_text');
      divElem.textContent = caption;
      captionElem.innerHTML = divElem.outerHTML;
      this.modalDialog.classList.add(DIALOG_HAS_CAPTION_CLASS_NAME);
    } else {
      captionElem.innerHTML = '';
      this.modalDialog.classList.remove(DIALOG_HAS_CAPTION_CLASS_NAME);
    }
  }

  /**
   * 画像の幅と高さの表示を初期化
   * @param {number} width 画像の幅
   * @param {number} height 画像の高さ
   * @private
   */
  setupImageSizeView(width, height) {
    if (this.options.imageSizeVisible !== true) {
      return;
    }
    const imageSizeElem = this.modalDialog.querySelector('.image_size');
    if (imageSizeElem === null) {
      throw new Error('ERROR :: Not Found ".image_size" element');
    }

    const divElem = document.createElement('div');
    divElem.classList.add('image_size_text');
    divElem.textContent = `(${width}x${height})`;

    imageSizeElem.innerHTML = divElem.outerHTML;
    this.modalDialog.classList.add(DIALOG_IMAGE_SIZE_ENABLED_CLASS_NAME);
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
   * ダイアログの枠外や黒塗りの部分をクリックした際にダイアログを閉じるイベントをセット
   * @private
   */
  setupDialogOuterClose() {
    this.modalDialog.addEventListener('click', (event) => {
      if (event.target === event.currentTarget) {
        this.modalDialog.close();
      }
    });
    const imagePreviewWrapperElem = this.modalDialog.querySelector('.image_preview_wrapper');
    if (imagePreviewWrapperElem === null) {
      throw new Error('ERROR :: Not Found ".image_preview_wrapper" element');
    }
    imagePreviewWrapperElem.addEventListener('click', (event) => {
      if (event.target === event.currentTarget) {
        this.modalDialog.close();
      }
    });
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

  /**
   * 拡大ボタンのイベント登録
   * @private
   */
  setupZoomInButton() {
    this.modalDialog.querySelector('.zoom_in_button')?.addEventListener('click', () => {
      this.modalDialog.classList.add(DIALOG_ZOOM_CLASS_NAME);
      this.scrollToZoomCenter();
    });
  }

  /**
   * 縮小ボタンのイベント登録
   * @private
   */
  setupZoomOutButton() {
    this.modalDialog.querySelector('.zoom_out_button')?.addEventListener('click', () => {
      this.modalDialog.classList.remove(DIALOG_ZOOM_CLASS_NAME);
    });
  }

  /**
   * 画像を拡大表示した際に、中央を表示するようにスクロール
   * @private
   */
  scrollToZoomCenter() {
    /** overflow: auto; でスクロールする枠要素 */
    const imagePreviewElem = this.modalDialog.querySelector('.image_preview');
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
}

// WindowオブジェクトからDialogImageクラスにアクセスできるようにする
window.DialogImage = DialogImage;
