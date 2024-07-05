'use strict';

/** @typedef { import('./types').DialogImageOptionType } DialogImageOptionType */

/**
 * dialog要素を使った画像拡大
 */
class DialogImage {
  constructor(config) {
    /** @type {DialogImageOptionType} オプション */
    this.options = { ...this.defaults, ...config };
  }

  /**
   * オプションの初期値
   * @type {DialogImageOptionType}
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

  init() {
    const modalDialog = document.querySelector(`#${this.options.dialogId}`);
    const openLinkElements = typeof this.options.openLink === 'string'
      ? document.querySelectorAll(this.options.openLink)
      : this.options.openLink;
    if (!(modalDialog instanceof HTMLDialogElement)) {
      // dialog要素ではない場合は中断
      return;
    }
    /**
     * 開くボタンのイベント登録
     */
    openLinkElements.forEach((linkElem) => {
      linkElem.addEventListener('click', async (event) => {
        event.preventDefault();

        // ダイアログで表示する画像のURL
        const targetElem = event.currentTarget;
        const url = targetElem.getAttribute('href');
        const caption = targetElem.dataset.caption ?? '';
        openImagePreviewDialog(url, caption);
      });
    })

    /**
     * dialog要素のアニメーションがすべて終了するのを待つ関数
     */
    function waitDialogAnimation(dialog) {
      return Promise.allSettled(dialog.getAnimations().map((animation) => animation.finished));
    }

    /**
     * 画像拡大表示ダイアログを開く
     */
    async function openImagePreviewDialog(url, caption) {
      const imagePreviewElem = modalDialog.querySelector('.image_preview');
      // 拡大画像表示の処理
      imagePreviewElem.innerHTML = `<img src="${url}" alt="" />`;

      // キャプションのテキスト
      const captionElem = modalDialog.querySelector('.image_caption');
      if (caption) {
        captionElem.innerHTML = `<div class="caption_text">${caption}</div>`;
        modalDialog.classList.add('has_caption');
      } else {
        captionElem.innerHTML = '';
        modalDialog.classList.remove('has_caption');
      }

      // 表示画像自体のクリック
      modalDialog.querySelector('.image_preview img')?.addEventListener('click', (event) => {
        if (modalDialog.classList.contains('zoom')) {
          // ズーム中の場合は縮小表示に戻す
          modalDialog.classList.remove('zoom');
          return;
        }
        // コントロール表示を切り替え
        modalDialog.classList.toggle('controls_hidden');
      });

      // dialog要素の開くアニメーションがすべて終了するまで待つ
      await waitDialogAnimation(modalDialog);

      // dialog要素にデフォルトで付与していたdisplayのstyle指定を削除
      modalDialog.style.display = '';
      // モーダルダイアログを開く
      modalDialog.showModal();
      // モーダルダイアログを表示する際に、HTML要素(背景部分)がスクロールしないようにする
      document.documentElement.style.overflow = 'hidden';

      // 表示する画像に拡大ボタンが必要かを判定
      const { width, height } = await readImageSize(url);
      const zoomEnabled = width > imagePreviewElem.clientWidth || height > imagePreviewElem.clientHeight
      if (zoomEnabled) {
        modalDialog.classList.remove('zoom_disabled');
      } else {
        modalDialog.classList.add('zoom_disabled');
      }
    }

    /**
     * ダイアログの枠外をクリックした際にダイアログを閉じる
     */
    modalDialog.addEventListener('click', (event) => {
      if (event.target === event.currentTarget) {
        modalDialog.close();
      }
    });

    /**
     * ダイアログを閉じる際に実行するイベントを登録
     */
    modalDialog.addEventListener('close', async (event) => {
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
      modalDialog.classList.remove('zoom');
      modalDialog.classList.remove('zoom_disabled');
      modalDialog.classList.remove('has_caption');
      modalDialog.classList.remove('controls_hidden');
      // 背景スクロールを防ぐために追加したスタイルを削除
      document.documentElement.style.overflow = '';
    });

    /**
     * 拡大ボタンのイベント登録
     */
    modalDialog.querySelector('.zoom_in_button')?.addEventListener('click', (event) => {
      modalDialog.classList.add('zoom');
    });

    /**
     * 縮小ボタンのイベント登録
     */
    modalDialog.querySelector('.zoom_out_button')?.addEventListener('click', (event) => {
      modalDialog.classList.remove('zoom');
    });

    /**
     * 画像ファイルのサイズを取得
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
  }
}
