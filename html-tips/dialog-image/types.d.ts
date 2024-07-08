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
    /** グループ化したセレクターから画像タイトルを取得する際の属性名 */
    groupTitleAttr: string,
    /** 画像の幅と高さを表示するかどうか */
    imageSizeVisible: boolean,
    /** 拡大ボタンのbutton要素内HTML */
    zoomInButtonInnerHTML: sting,
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
