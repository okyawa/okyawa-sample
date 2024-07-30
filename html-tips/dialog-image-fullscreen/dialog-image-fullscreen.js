'use strict';

/** @typedef { import('./types').DialogImageOptionType } DialogImageOptionType */
/** @typedef { import('./types').GroupImageType } GroupImageType */

/** キャプションが含まれる場合にdialog要素へ付与されるクラス名 */
const DIALOG_HAS_CAPTION_CLASS_NAME = 'has_caption';
/** 画像を拡大中の場合にdialog要素へ付与されるクラス名 */
const DIALOG_ZOOM_CLASS_NAME = 'zoom';
/** 拡大/縮小ボタンが不要な場合にdialog要素へ付与されるクラス名 */
const DIALOG_ZOOM_DISABLED_CLASS_NAME = 'zoom_disabled';
/** ダイアログ内のコントロールボタンとキャプションを非表示にした際にdialog要素へ付与されるクラス名 */
const DIALOG_CONTROLS_HIDDEN_CLASS_NAME = 'controls_hidden';
/** ダイアログ内に画像の幅と高さを表示する場合にdialog要素へ付与されるクラス名 */
const DIALOG_IMAGE_SIZE_ENABLED_CLASS_NAME = 'image_size_enabled';
/** 画像のグループ化が有効な場合にdialog要素へ付与されるクラス名 */
const DIALOG_GROUP_IMAGES_ENABLED = 'image_group_enabled';
/** 前へボタン要素のクラス名 */
const DIALOG_NEXT_BUTTON_CLASS_NAME = 'next_button';
/** 次へボタン要素のクラス名 */
const DIALOG_PREV_BUTTON_CLASS_NAME = 'prev_button';
/** 画像送り中にdialog要素へ付与されるクラス名 */
const DIALOG_SWITCHING_CLASS_NAME = 'switching';

/**
 * dialog要素を使った画像拡大
 */
class DialogImage {
  /**
   * コンストラクタ
   * @param {DialogImageOptionType} config オプション指定
   */
  constructor(config) {
    /** @type {DialogImageOptionType} オプション */
    this.options = { ...this.defaults, ...config };

    // dialog要素
    const modalDialog = document.querySelector(`#${this.options.dialogId}`);
    const existsDialog = modalDialog !== null && modalDialog instanceof HTMLDialogElement;
    /** @type {HTMLDialogElement} 画像拡大表示するdialog要素 */
    this.modalDialog = existsDialog
      ? modalDialog
      : createDialogImageElement(this.options);

    if (!existsDialog) {
      // 最初にdialog要素へセットするイベントを初期化
      this.setupInitialEvent();
    }

    const imagePreviewElem = this.modalDialog.querySelector('.image_preview');
    if (!imagePreviewElem) {
      throw new Error('ERROR :: Not Found ".image_preview" element');
    }
    /** @type {HTMLElement} 画像を囲む枠要素 */
    this.imagePreviewElem = imagePreviewElem;

    /** @type {GroupImageType[]} グループ化した画像の情報 */
    this.groupImages = [];
  }

  /**
   * オプションの初期値
   * @type {DialogImageOptionType}
   * @private
   */
  get defaults() {
    /** @type {DialogImageOptionType} */
    return {
      dialogId: 'dialog_image',
      openLink: '.popup_img',
      groupSelector: null,
      groupUrlAttr: 'href',
      groupCaptionAttr: 'data-caption',
      groupCaptionWrapSelector: null,
      groupCaptionElemSelector: null,
      prevButtonInnerHTML: '&lt;',
      prevButtonTitle: 'Previous',
      nextButtonTitle: 'Next',
      nextButtonInnerHTML: '&gt;',
      imageSizeVisible: false,
      zoomInButtonInnerHTML: '🔍',
      zoomInButtonTitle: 'Zoom in',
      zoomOutButtonInnerHTML: '🔎',
      zoomOutButtonTitle: 'Zoom out',
      closeButtonInnerHTML: 'x',
      closeButtonTitle: 'Close',
    };
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
  open({ url, caption = ''}) {
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
    const openLinkElements = typeof this.options.openLink === 'string'
      ? document.querySelectorAll(this.options.openLink)
      : this.options.openLink;
    openLinkElements.forEach((linkElem) => {
      linkElem.addEventListener('click', (event) => {
        event.preventDefault();

        // ダイアログで表示する画像のURLとキャプション
        const targetElem = event.currentTarget;
        const url = targetElem.getAttribute('href');
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
    // 拡大画像をセット
    this.imagePreviewElem.innerHTML = `<img src="${url}" alt="" />`;
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
    }
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
      (new Image()).src = this.groupImages[currentIndex - 1].url;
    }
    if (this.groupImages[currentIndex + 1]) {
      // 次の画像をプリロード
      (new Image()).src = this.groupImages[currentIndex + 1].url;
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
      this.options.groupCaptionAttr
      && this.options.groupCaptionWrapSelector
      && this.options.groupCaptionElemSelector
    ) {
      this.groupImages = this.groupImages.map((item) => {
        const activeElem = document.querySelector(
          `${this.options.groupSelector}[${this.options.groupUrlAttr}="${item.url}"]`,
        );
        // グループ化した画像のキャプションが指定されている要素からキャプション情報を取り出す
        const captionElem = activeElem
          .closest(this.options.groupCaptionWrapSelector)
          ?.querySelector(this.options.groupCaptionElemSelector);
        let caption = '';
        if (captionElem) {
          if (this.options.groupCaptionAttr === 'value') {
            caption = captionElem.value;
          } else {
            caption = captionElem.getAttribute(this.options.groupCaptionAttr);
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
    counterElem.innerHTML = `<span className="counter_value">${currentIndex + 1}<span class="slash">/</span>${this.groupImages.length}</span>`;
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
   * @returns {Promise<GroupImageType | null>}
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
      this.modalDialog.querySelector(`.${DIALOG_PREV_BUTTON_CLASS_NAME}`)?.focus();
    }
    if (this.modalDialog.dataset.direction === 'next') {
      this.modalDialog.querySelector(`.${DIALOG_NEXT_BUTTON_CLASS_NAME}`)?.focus();
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
    this.modalDialog.querySelector(`.${DIALOG_PREV_BUTTON_CLASS_NAME}`).disabled = prevImageData === null;
    this.modalDialog.querySelector(`.${DIALOG_NEXT_BUTTON_CLASS_NAME}`).disabled = nextImageData === null;
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
      (direction === 'prev' && this.groupImages[currentIndex - 1] === undefined)
      || (direction === 'next' && this.groupImages[currentIndex + 1] === undefined)
    ) {
      // 表示する画像なし
      return null;
    }

    // 次に表示する画像URL
    const url = direction === 'prev'
      ? this.groupImages[currentIndex - 1].url
      : this.groupImages[currentIndex + 1].url;
    // 次に表示するキャプション
    const caption = direction === 'prev'
      ? this.groupImages[currentIndex - 1].caption
      : this.groupImages[currentIndex + 1].caption;

    return { url, caption };
  }


  /**
   * キャプションのテキストを初期化
   * @param {string} caption キャプションのテキスト
   * @private
   */
  setupCaptionView(caption) {
    const captionElem = this.modalDialog.querySelector('.image_caption');
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
    const zoomEnabled = width > this.imagePreviewElem.clientWidth || height > this.imagePreviewElem.clientHeight;
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
    this.modalDialog.querySelector('.image_preview_wrapper').addEventListener('click', (event) => {
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
      // dialog要素の閉じるアニメーションがすべて終了するまで待つ
      await waitDialogAnimation(dialog);
      // dialog要素のstyle指定で非表示にする
      dialog.style.display = 'none';
      // image_preview内の画像を削除
      const imagePreviewElem = this.modalDialog.querySelector('.image_preview');
      if (imagePreviewElem) {
        imagePreviewElem.innerHTML = '';
      }
      // キーボードイベントを削除
      this.removeKeyboardEvent();
      // body要素に付与されたdata属性を削除
      delete document.body.dataset.dialogId;
      delete this.modalDialog.dataset.direction
      // グループ化した画像の情報を初期化
      this.groupImages = [];
      // 表示テキストを全てクリア
      this.modalDialog.querySelector('.image_caption').innerHTML = '';
      this.modalDialog.querySelector('.image_size').innerHTML = '';
      // 画像送りボタンをクリア
      this.modalDialog.querySelector('.prev_button_area').innerHTML = '';
      this.modalDialog.querySelector('.next_button_area').innerHTML = '';
      // 画像送りのカウンター表示をクリア
      this.modalDialog.querySelector('.image_counter').innerHTML = '';
      // 判定用に付与したクラス名を初期化
      this.modalDialog.classList.remove(DIALOG_ZOOM_CLASS_NAME);
      this.modalDialog.classList.remove(DIALOG_ZOOM_DISABLED_CLASS_NAME);
      this.modalDialog.classList.remove(DIALOG_HAS_CAPTION_CLASS_NAME);
      this.modalDialog.classList.remove(DIALOG_CONTROLS_HIDDEN_CLASS_NAME);
      this.modalDialog.classList.remove(DIALOG_IMAGE_SIZE_ENABLED_CLASS_NAME);
      this.modalDialog.classList.remove(DIALOG_GROUP_IMAGES_ENABLED);
      // 背景スクロールを防ぐために追加したスタイルを削除
      document.documentElement.style.overflow = '';
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

window.DialogImage = DialogImage;

/**
 * dialog要素のアニメーションがすべて終了するのを待つ関数
 * @type {HTMLDialogElement} dialog dialog要素
 * @returns {Promise<PromiseSettledResult<any>[]>}
 */
function waitDialogAnimation(dialog) {
  return Promise.allSettled(
    dialog.getAnimations()
      .map((animation) => animation.finished),
  );
}

/**
 * 画像ファイルのサイズを取得
 * @param {string} url 画像ファイルのURL
 * @private
 */
async function readImageSize(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const size = {
        width: img.naturalWidth,
        height: img.naturalHeight,
      };

      URL.revokeObjectURL(img.src);
      resolve(size);
    };

    img.onerror = (error) => {
      reject(error);
    };

    img.src = url;
  });
}

/**
 * 文字列をHTMLエスケープ
 * @param {string} value
 * @returns
 */
function htmlEscape(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * キーボードイベントのイベントハンドラー
 * @param {KeyboardEvent} event キーボードイベント
 * @private
 */
function handleKeyboardEvent(event) {
  /** dialog要素のid値 */
  const dialogId = document.querySelector('body')?.dataset.dialogId;
  if (!dialogId) {
    return;
  }

  if (['ArrowLeft', 'ArrowRight'].includes(event.key) === false) {
    return;
  }

  /** dialog要素 */
  const dialogElem = document.querySelector(`#${dialogId}`);

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

/**
 * 画像拡大に使うdialog要素を生成
 * @param {DialogImageOptionType} options
 * @returns
 */
function createDialogImageElement(options) {
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
  document.querySelector('body').appendChild(dialogElem);

  return dialogElem;
}
