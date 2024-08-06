// @ts-check

/** @typedef { import('./types').DialogImageOptionType } DialogImageOptionType */

/**
 * オプションの初期値
 * @type {DialogImageOptionType}
 */
export const dialogImageOptionDefaults = {
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
  debug: null,
};
