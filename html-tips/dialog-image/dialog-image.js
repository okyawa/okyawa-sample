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
    this.setupGroupImages();
    // 画像送りボタンの初期化
    this.setupNextPrevButton();

    // 拡大画像のダイアログを開く
    this.openImagePreviewDialog(url, caption).then(() => {});
  }

  /**
   * 最初にdialog要素へセットするイベントを初期化
   * @private
   */
  setupInitialEvent() {
    // ダイアログの枠外をクリックした際にダイアログを閉じるイベントをセット
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
        this.setupGroupImages();
        // 画像送りボタンの初期化
        this.setupNextPrevButton();

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
    // dialog要素の開くアニメーションがすべて終了するまで待つ
    await waitDialogAnimation(this.modalDialog);
    // dialog要素を開く
    this.showModal();
    // 表示する画像の幅と高さを取得
    const { width, height } = await readImageSize(url);
    // キャプションの下部に画像の幅と高さを表示
    this.setupImageSizeView(width, height);
    // 表示する画像に拡大ボタンが必要かを判定
    await this.setupDialogZoomVisible(url, width, height);
    // グループ化しているときの前後の画像を先読み
    this.preloadPrevNextImages(url);
  }

  /**
   * 画像送りで画像とキャプションを切り替え
   * @param {'prev' | 'next'} direction 画像ファイルのURL
   * @private
   */
  async changeImagePreview(direction) {
    // 現在表示中の画像URL
    const currentUrl = this.imagePreviewElem.querySelector('img')?.getAttribute('src') ?? '';
    const currentIndex = this.groupImages.findIndex((image) => image.url === currentUrl);
    if (
      (direction === 'prev' && this.groupImages[currentIndex - 1] === undefined)
      || (direction === 'next' && this.groupImages[currentIndex + 1] === undefined)
    ) {
      // 表示する画像なし
      return;
    }
    // 次に表示する画像URL
    const url = direction === 'prev'
      ? this.groupImages[currentIndex - 1].url
      : this.groupImages[currentIndex + 1].url;
    // 次に表示するキャプション
    const caption = direction === 'prev'
      ? this.groupImages[currentIndex - 1].caption
      : this.groupImages[currentIndex + 1].caption;

    // 拡大画像をセット
    this.imagePreviewElem.innerHTML = `<img src="${url}" alt="" />`;
    // キャプションのテキストを初期化
    this.setupCaptionView(caption);
    // 表示する画像の幅と高さを取得
    const { width, height } = await readImageSize(url);
    // キャプションの下部に画像の幅と高さを表示
    this.setupImageSizeView(width, height);
    // 表示する画像に拡大ボタンが必要かを判定
    await this.setupDialogZoomVisible(url, width, height);
    // グループ化しているときの前後の画像を先読み
    this.preloadPrevNextImages(url);
  }

  /**
   * グループ化しているときの前後の画像を先読み
   * @param {string} currentUrl 現在表示中の画像のURL
   * @returns 
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
   * @private 
   */
  setupGroupImages() {
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
    // 枠にグループ化が使われていることを示すクラス名を付与
    this.modalDialog.classList.add(DIALOG_GROUP_IMAGES_ENABLED);
  }

  /**
   * 画像送りボタンの初期化
   * @private
   */
  setupNextPrevButton() {
    // 前へボタン
    const prevButtonElem = document.createElement('button');
    prevButtonElem.type = 'button';
    prevButtonElem.classList.add('prev_button');
    prevButtonElem.title = 'Previous';
    prevButtonElem.innerHTML = '<';
    prevButtonElem.addEventListener('click', async () => {
      await this.changeImagePreview('prev');
    });

    // 次へボタン
    const nextButtonElem = document.createElement('button');
    nextButtonElem.type = 'button';
    nextButtonElem.classList.add('next_button');
    nextButtonElem.title = 'Next';
    nextButtonElem.innerHTML = '>';
    nextButtonElem.addEventListener('click', async () => {
      await this.changeImagePreview('next');
    });

    // DOMにボタンを追加
    const prevAreaElem = this.modalDialog.querySelector('.prev_button_area');
    const nextAreaElem = this.modalDialog.querySelector('.next_button_area');
    prevAreaElem.appendChild(prevButtonElem);
    nextAreaElem.appendChild(nextButtonElem); 
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
    this.modalDialog.querySelector('.image_preview img')?.addEventListener('click', () => {
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
   * @param {string} url 画像ファイルのURL
   * @param {number} width 画像の幅
   * @param {number} height 画像の高さ
   * @private
   */
  async setupDialogZoomVisible(url, width, height) {
    const zoomEnabled = width > this.imagePreviewElem.clientWidth || height > this.imagePreviewElem.clientHeight;
    if (zoomEnabled) {
      this.modalDialog.classList.remove(DIALOG_ZOOM_DISABLED_CLASS_NAME);
    } else {
      this.modalDialog.classList.add(DIALOG_ZOOM_DISABLED_CLASS_NAME);
    }
  }

  /**
   * ダイアログの枠外をクリックした際にダイアログを閉じるイベントをセット
   * @private
   */
  setupDialogOuterClose() {
    this.modalDialog.addEventListener('click', (event) => {
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
      // 表示テキストを全てクリア
      this.modalDialog.querySelector('.image_caption').innerHTML = '';
      this.modalDialog.querySelector('.image_size').innerHTML = '';
      // 画像送りボタンをクリア
      this.modalDialog.querySelector('.prev_button_area').innerHTML = '';
      this.modalDialog.querySelector('.next_button_area').innerHTML = '';
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
      <div class="prev_button_area"></div>
      <div class="image_main_area">
        <div class="image_preview"></div>
        <div class="image_caption"></div>
        <div class="image_size"></div>
        <div class="preview_controls">
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
      <div class="next_button_area"></div>
    </div>
  `;
  // 生成したdialog要素をbody要素の末尾に追加
  document.querySelector('body').appendChild(dialogElem);

  return dialogElem;
}
