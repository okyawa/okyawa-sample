/**
 * SelectDateCalendarのオプションobjectの型
 * @typedef {object} SelectDateCalendarOptionsType
 * @property {string} namePrefix 生成するlabel要素に付与するクラス名
 * @property {string} labelClassName 生成する input type="date" 要素のname属性値のプレフィックス
 * @property {string} errorClassName エラー文の要素に付与するクラス名
 * @property {string} rangeErrorClassName 範囲外の日付を選択した場合に付与するクラス名
 * @property {string} rangeErrorMessage 範囲外の日付を選択した場合のエラー文
 */

/**
 * セレクトボックスとinput type="date"のカレンダーを連動させるクラス
 */
class SelectDateCalendar {
  /**
   * コンストラクター
   * @param {HTMLSelectElement} selectElement 日付選択セレクトボックスの要素
   * @param {SelectDateCalendarOptionsType} params オプション指定のオブジェクト
   */
  constructor(selectElement, params) {
    /** @type {HTMLSelectElement} */
    this.selectElement = selectElement;
    /** @type {SelectDateCalendarOptionsType} */
    this.options = { ...SelectDateCalendar.defaults, ...params };
    /** @type {HTMLInputElement} */
    this.inputDateElement = this.createInputDateElement();
    this.appendInputDateElement();
  }

  /**
   * オプションの初期値
   * @type {SelectDateCalendarOptionsType}
   */
  static defaults = {
    namePrefix: 'calendar_',
    labelClassName: 'date_edit_label',
    errorClassName: 'error_status',
    rangeErrorClassName: 'date_range_error',
    rangeErrorMessage: '指定できない日付です',
  }

  /**
   * 初期化
   */
  init() {
    this.setupEvent();
    this.syncInputDateElem(this.selectElement.value);
  }

  /**
   * input type="date"の要素を生成
   * @return {HTMLInputElement} input type="date"の要素
   * @private
   */
  createInputDateElement() {
    const inputDateElement = document.createElement('input');
    inputDateElement.setAttribute('type', 'date');
    const name =
      this.options.namePrefix + this.selectElement.getAttribute('name');
    inputDateElement.setAttribute('name', name);
    // TODO: セレクトボックスのoptionの最初と最後を取得し、min と max の属性を指定
    return inputDateElement;
  }

  /**
   * セレクトボックスの後ろに input type="date" の要素を追加
   * @private
   */
  appendInputDateElement() {
    // ラベル要素
    const labelElement = document.createElement('label');
    labelElement.classList.add(this.options.labelClassName);
    // カレンダーアイコン
    const iElement = document.createElement('i');
    iElement.classList.add('fa', 'fa-calendar');
    iElement.setAttribute('aria-hidden', 'true');
    // DOMに追加
    labelElement.appendChild(this.inputDateElement);
    labelElement.appendChild(iElement);
    this.selectElement.parentNode.insertBefore(
      labelElement,
      this.selectElement.nextSibling
    );
  }

  /**
   * イベントの初期化
   * @private
   */
  setupEvent() {
    this.inputDateElement.addEventListener('click', this.clickCalendarHandler.bind(this));
    this.inputDateElement.addEventListener('input', this.syncSelectElem.bind(this));
    this.selectElement.addEventListener('input', this.selectBoxInputHandler.bind(this));
    this.selectElement.addEventListener('click', this.removeRangeError.bind(this));
  }

  /**
   * カレンダーアイコンをクリックしたときのハンドラー
   * @param {MouseEvent} event 
   * @private
   */
  clickCalendarHandler(event) {
    this.removeRangeError();
    /** @type HTMLInputElement | null */
    const targetElem = event.currentTarget;
    if (targetElem === null) {
      return;
    }
    if (targetElem.showPicker === undefined) {
      console.log('Note: This browser is not supported showPicker() method.');
    }
    targetElem.showPicker();
  }

  /**
   * 日付選択セレクトボックスのinputイベントのハンドラー
   * @param {InputEvent} event 日付選択セレクトボックスのinputイベント
   * @private
   */
  selectBoxInputHandler(event) {
    /** @type {HTMLSelectElement | null} */
    const targetElem = event.currentTarget;
    if (targetElem === null) {
      return;
    }
    const dateValue = targetElem.value;
    this.syncInputDateElem(dateValue);
  }

  /**
   * セレクトボックスの値を input type="date" の要素の値に同期させる
   * @param {string} dateValue 日付選択セレクトボックスの選択値
   * @private
   */
  syncInputDateElem(dateValue) {
    this.removeRangeError();
    if (dateValue === undefined) {
      this.inputDateElement.value = '';
      return;
    }
    this.inputDateElement.value = dateValue;
    if (this.inputDateElement.value === '') {
      // リストアップしていないものをセットした場合、未選択のラベルが表示されるようにする
      this.inputDateElement.value = '';
    }
  }

  /**
   * input type="date" の値を日付選択セレクトボックスの値に同期させる
   * @param {InputEvent} event input type="date" のinputイベント
   * @private
   */
  syncSelectElem(event) {
    this.removeRangeError();
    /** @type {HTMLInputElement | null} */
    const targetElem = event.currentTarget;
    if (targetElem === null) {
      return;
    }
    const dateValue = targetElem.value;
    if (dateValue === undefined) {
      this.selectElement.value = '';
      return;
    }
    this.selectElement.value = dateValue;
    if (dateValue && this.selectElement.value === '') {
      // カレンダーから範囲外の値を選択
      this.showRangeError();
      // セレクトボックスが未選択ラベルの状態 ("") となるようにする
      this.selectElement.value = '';
    }
  }

  /**
   * 範囲外の日付をカレンダーから選択した場合にエラー文を表示
   */
  showRangeError() {
    // エラー文の要素を生成
    const spanElement = document.createElement('span');
    spanElement.classList.add(this.options.rangeErrorClassName, this.options.errorClassName);
    spanElement.textContent = this.options.rangeErrorMessage;
    // label要素
    const labelElement = this.inputDateElement.closest('label');
    if (labelElement === null) {
      return;
    }
    // DOM二追加
    labelElement.parentNode.insertBefore(
      spanElement,
      labelElement.nextSibling
    );
  }


  /**
   * 範囲外の日付をカレンダーから選択した場合にエラー文を削除
   */
  removeRangeError() {
    // label要素
    const labelElement = this.inputDateElement.closest('label');
    if (labelElement === null) {
      return;
    }
    // エラー文の要素
    const errorElement = labelElement.parentNode.querySelector('.' + this.options.rangeErrorClassName);
    if (errorElement === null) {
      // エラー表示なし
      return;
    }
    // エラー文の要素を削除
    errorElement.parentNode.removeChild(errorElement);
  }
}

/**
 * SelectDateCalendarの初期化
 * @param {string} selector 対象の日付選択セレクトボックスのセレクター
 * @param {object} params オプション指定のオブジェクト
 */
function setupSelectDateCalendar(selectElement, params) {
  if (!selectElement instanceof HTMLSelectElement) {
    console.error('Error: setupSelectDateCalendar() - "selectElement" is not instanceof HTMLSelectElement.')
    return;
  }
  const selectDateCalendar = new SelectDateCalendar(selectElement, params);
  selectDateCalendar.init();
}

/**
 * 対象のセレクトボックス全てにSelectDateCalendarを初期化
 * @param {string} selector 対象の日付選択セレクトボックスのセレクター
 * @param {object} params オプション指定のオブジェクト
 */
function setupSelectDateCalendarAll(selector, params) {
  const selectElements = document.querySelectorAll(selector);
  selectElements.forEach((selectElement) => {
    setupSelectDateCalendar(selectElement, params);
  });
}

window.SelectDateCalendar = SelectDateCalendar;
window.setupSelectDateCalendar = setupSelectDateCalendar;
window.setupSelectDateCalendarAll = setupSelectDateCalendarAll;
