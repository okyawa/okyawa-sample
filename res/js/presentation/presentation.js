/**
 * プレゼンテーション用にアコーディオンの動作となるモードにする
 */
function switchPresentationMode() {
  const detailsElements = document.querySelectorAll('section > details');
  detailsElements.forEach((detailsElement) => {
    // detailsの中で1つだけを開く指定
    detailsElement.name = 'section';
  });
}

/**
 * 全てのdetails要素を閉じる
 */
function closeAllDetails() {
  const detailsElements = document.querySelectorAll('details');
  detailsElements.forEach((detailsElement) => {
    detailsElement.open = false;
  });
}
