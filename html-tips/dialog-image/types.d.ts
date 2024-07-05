/**
 * DialogImageのオプションの型
 */
export type DialogImageOptionType = {
    /** 画像拡大表示に使うdialog要素のID値 */
    dialogId: string,
    /** 開くリンクのセレクターか要素 */
    openLink: string | HTMLElement[],
};
