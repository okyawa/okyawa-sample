/**
 * Markdownのテキストが入った要素をHTMLに変換する
 * @param {HTMLElement} element Markdownのテキストが入った要素
 */
function convertMarkdownToHTML(element) {
  element.innerHTML = marked.parse(element.innerHTML);
}

/**
 * 画面読み込み時に、対象のMarkdownのテキストが入った要素を全てHTMLに変換する
 */
window.addEventListener('DOMContentLoaded', () => {
  const markdownContentElement = document.querySelectorAll('.markdown_content');
  markdownContentElement.forEach((contentElement) => {
    convertMarkdownToHTML(contentElement);
  });
});
