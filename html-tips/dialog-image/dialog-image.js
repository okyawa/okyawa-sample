'use strict';

/** @typedef { import('./types').DialogImageOptionType } DialogImageOptionType */

/**
 * dialog要素を使った画像拡大
 */
class DialogImage {
  /**
   * コンストラクタ 
   * @param @type {DialogImageOptionType} config オプション指定
   */
  constructor(config) {
    /** @type {DialogImageOptionType} オプション */
    this.options = { ...this.defaults, ...config };

    /** @type {HTMLDialogElement} 画像拡大表示するdialog要素 */
    this.modalDialog = document.querySelector(`#${this.options.dialogId}`);

    const imagePreviewElem = this.modalDialog.querySelector('.image_preview');
    if (!imagePreviewElem) {
      throw new Error('ERROR :: Not Found ".image_preview" element');
    }
    /** @type {HTMLElement} 画像を囲む枠要素 */
    this.imagePreviewElem = imagePreviewElem;
  }

  /**
   * オプションの初期値
   * @type {DialogImageOptionType}
   * @private
   */
  get defaults() {
    // ※PHPStormでツールチップ表示やジャンプが動作するよう、敢えて一旦変数へ格納し、型指定を当てている
    // ※これをしないと、PHPStormでツールチップ表示やジャンプが動作しない
    /** @type {DialogImageOptionType} */
    const values = {
      dialogId: 'dialog_image',
      openLink: '.popup_img',
    };
    return values;
  }

  /**
   * 初期化処理
   */
  init() {
    if (!(this.modalDialog instanceof HTMLDialogElement)) {
      // dialog要素ではない場合は中断
      return;
    }

    // 開くボタンのイベント登録
    this.setupOpenLink();

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
    const openLinkElements = typeof this.options.openLink === 'string'
      ? document.querySelectorAll(this.options.openLink)
      : this.options.openLink;
    openLinkElements.forEach((linkElem) => {
      linkElem.addEventListener('click', async (event) => {
        event.preventDefault();

        // ダイアログで表示する画像のURL
        const targetElem = event.currentTarget;
        const url = targetElem.getAttribute('href');
        const caption = targetElem.dataset.caption ?? '';
        this.openImagePreviewDialog(url, caption);
      });
    })
  }

  /**
   * 画像拡大表示ダイアログを開く
   * @private
   */
  async openImagePreviewDialog(url, caption) {
    // 拡大画像をセット
    this.imagePreviewElem.innerHTML = `<img src="${url}" alt="" />`;
    // キャプションのテキストを初期化
    this.setupCaption(caption);
    // 表示画像自体のクリックした際のイベントをセット
    this.setupImageClick();
    // dialog要素の開くアニメーションがすべて終了するまで待つ
    await waitDialogAnimation(this.modalDialog);
    // dialog要素を開く
    this.showModal();
    // 表示する画像に拡大ボタンが必要かを判定
    await this.setupDialogZoomVisible(url)
  }

  /**
   * キャプションのテキストを初期化
   * @param {string} caption キャプションのテキスト
   * @private
   */
  setupCaption(caption) {
    const captionElem = this.modalDialog.querySelector('.image_caption');
    if (caption) {
      captionElem.innerHTML = `<div class="caption_text">${caption}</div>`;
      this.modalDialog.classList.add('has_caption');
    } else {
      captionElem.innerHTML = '';
      this.modalDialog.classList.remove('has_caption');
    }
  }

  /**
   * 表示画像自体のクリックした際のイベントをセット
   * @private
   */
  setupImageClick() {
    this.modalDialog.querySelector('.image_preview img')?.addEventListener('click', (event) => {
      if (this.modalDialog.classList.contains('zoom')) {
        // ズーム中の場合は縮小表示に戻す
        this.modalDialog.classList.remove('zoom');
        return;
      }
      // コントロール表示を切り替え
      this.modalDialog.classList.toggle('controls_hidden');
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
   * @private
   */
  async setupDialogZoomVisible(url) {
    const { width, height } = await readImageSize(url);
    const zoomEnabled = width > this.imagePreviewElem.clientWidth || height > this.imagePreviewElem.clientHeight
    if (zoomEnabled) {
      this.modalDialog.classList.remove('zoom_disabled');
    } else {
      this.modalDialog.classList.add('zoom_disabled');
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
      // 判定用に付与したクラス名を初期化
      this.modalDialog.classList.remove('zoom');
      this.modalDialog.classList.remove('zoom_disabled');
      this.modalDialog.classList.remove('has_caption');
      this.modalDialog.classList.remove('controls_hidden');
      // 背景スクロールを防ぐために追加したスタイルを削除
      document.documentElement.style.overflow = '';
    });
  }

  /**
   * 拡大ボタンのイベント登録
   * @private
   */
  setupZoomInButton() {
    this.modalDialog.querySelector('.zoom_in_button')?.addEventListener('click', (event) => {
      this.modalDialog.classList.add('zoom');
    }); 
  }

  /**
   * 縮小ボタンのイベント登録
   * @private
   */
  setupZoomOutButton() {
    this.modalDialog.querySelector('.zoom_out_button')?.addEventListener('click', (event) => {
      this.modalDialog.classList.remove('zoom');
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
      .map((animation) => animation.finished)
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
