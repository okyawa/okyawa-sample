/**
 * DialogImageのオプションの型
 */
export type DialogImageOptionType = {
  /** 画像拡大表示に使うdialog要素のID値 */
  dialogId: string,
  /** 開くリンクのセレクターか要素 */
  openLink?: string | HTMLElement[],

  /* グループ化するセレクター */
  groupSelector: string | null,
  /** グループ化したセレクターから画像URLを取得する際の属性名 */
  groupUrlAttr: string,

  /** 前へボタンのbutton要素内HTML */
  prevButtonInnerHTML: string,
  /** 前へボタンのbutton要素のtitle属性値 */
  prevButtonTitle: string,
  /** 次へボタンのbutton要素内HTML */
  nextButtonInnerHTML: string,
  /** 次へボタンのbutton要素のtitle属性値 */
  nextButtonTitle: string,

  // ※ "groupCaptionAttr" と "groupCaptionWrapSelector" と "groupCaptionElemSelector" は全てセットで指定
  /** グループ化したセレクターから画像キャプションを取得する際の属性名 */
  groupCaptionAttr: string,
  /** グループ化した画像のキャプションを含む要素を囲う要素のセレクター */
  groupCaptionWrapSelector: string | null,
  /** グループ化した画像のキャプションを含む要素のセレクター */
  groupCaptionElemSelector: string | null,

  /** 画像の幅と高さを表示するかどうか */
  imageSizeVisible: boolean,

  /** 拡大ボタンのbutton要素内HTML */
  zoomInButtonInnerHTML: string,
  /** 拡大ボタンのbutton要素のtitle属性値 */
  zoomInButtonTitle: string,
  /** 縮小ボタンのbutton要素内HTML */
  zoomOutButtonInnerHTML: string,
  /** 縮小ボタンのbutton要素のtitle属性値 */
  zoomOutButtonTitle: string,

  /** 閉じるボタンのbutton要素内HTML */
  closeButtonInnerHTML: string,
  /** 閉じるボタンのbutton要素のtitle属性値 */
  closeButtonTitle: string,
};

/**
 * グループ化した画像の情報
 */
export type GroupImageType = {
  /** 画像のURL */
  url: string,
  /** 画像のキャプション */
  caption: string,
};
