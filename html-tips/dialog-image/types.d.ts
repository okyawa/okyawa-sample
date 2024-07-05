/**
 * DialogImageのオプションの型
 */
export type DialogImageOptionType = {
    /** 画像拡大表示に使うdialog要素のID値 */
    dialogId: string,
    /** 開くリンクのセレクターか要素 */
    openLink?: string | HTMLElement[],
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
