class ContentPreview extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  /**
   * 要素がdocumentに追加された際に実行される
   */
  connectedCallback() {
    if (this.shadowRoot === null) {
      return;
    }
    const mountPoint = document.createElement('div');
    this.shadowRoot.appendChild(mountPoint);

    // 外部CSSファイルを読み込み
    this.#appendCSSFile('preview.css')

    // Web Components の属性値を取得し、Reactコンポーネントをマウント
    const value = this.getAttribute('value') || '';
    mountPoint.innerHTML = value;
  }

  /**
   * 変更を監視する属性名の配列を指定
   */
  static get observedAttributes() {
    return [
      'value',
    ];
  }

  /**
   * observedAttributesで列挙したいずれかの属性が変更されたときに呼ばれる
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'value' && oldValue !== newValue) {
      // 更新された Web Components の属性値を反映
      const rootElement = this.shadowRoot.querySelector('div');
      rootElement.innerHTML = newValue;
    }
  }

  /**
   * 要素がdocumentから削除された際に実行される
   */
  disconnectedCallback() {
    if (this.shadowRoot === null) {
      return;
    }
    ReactDOM.unmountComponentAtNode(this.shadowRoot);
  }

  /**
   * 外部CSSファイルを読み込み
   */
  #appendCSSFile(filePath) {
    if (this.shadowRoot === null) {
      return
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = filePath;
    this.shadowRoot.appendChild(link);
  }
}

/**
 * Custom Elementsの登録
 */
customElements.define('content-preview', ContentPreview);
