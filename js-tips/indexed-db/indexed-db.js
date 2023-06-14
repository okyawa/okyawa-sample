/**
 * IndexDBが利用可能なブラウザかどうか
 * @returns {boolean}
 */
function enabledIndexedDB() {
  return 'indexedDB' in window
}

const DB_NAME = 'todo-db'
const DB_VERSION = 1
const OBJECT_STORE_TASKS = 'tasks'

/** @type {IDBDatabase} */
let db

/**
 * データベースの初期化
 */
function setupDB() {
  // データベースを開く
  const dbOpenRequest = window.indexedDB.open(DB_NAME, DB_VERSION)
  dbOpenRequest.onsuccess = (event) => {
    updateMessage(`データベースを初期化しました。`)
    db = dbOpenRequest.result;
    fetchAll()
  }

  // データベースがまだ作成されていないか、新しいバージョン番号が指定されか、の場合に
  // 新しいバージョンのデータベースを作成する必要がある場合に必要な処理を指定
  dbOpenRequest.onupgradeneeded = (event) => {
    const db = event.target.result

    db.onerror = (e) => {
      updateMessage(`データベースの読み込み中にエラーが発生しました。`)
    }

    // オブジェクトストアを作成
    const objectStore = db.createObjectStore(OBJECT_STORE_TASKS, { keyPath: 'id', autoIncrement: true })

    // オブジェクトストアに格納するデータアイテムを定義
    objectStore.createIndex('name', 'name', { unique: false})
    objectStore.createIndex('priority', 'priority', { unique: false})
    objectStore.createIndex('completed', 'completed', { unique: false})

    updateMessage('オブジェクトストアを作成しました。')
  }
}

/**
 * DBのオブジェクトストアにアイテムを追加
 */
function setupAddItemButton() {
  const buttonElement = document.getElementById('add_button')
  buttonElement.addEventListener('click', () => {
    if (!db) {
      return
    }

    const nameInputElement = document.getElementById('name')
    const priorityInputElement = document.getElementById('priority')
    const newItem = {
      name: nameInputElement.value,
      priority: priorityInputElement.value,
      completed: false,
    }

    // 読み書き用のトランザクションを開き、データを追加する準備
    const transaction = db.transaction([OBJECT_STORE_TASKS], 'readwrite')
    transaction.oncomplete = (event) => {
      updateMessage(`データ追加のトランザクションが完了しました。`)
    }
    transaction.onerror = (event) => {
      updateMessage(`トランザクションはエラーのため開けませんでした。アイテムの重複は許可されていません。`)
    }

    // トランザクションでオブジェクトストアを作成
    const objectStore = transaction.objectStore(OBJECT_STORE_TASKS)
    // オブジェクトストアにオブジェクトを追加する要求
    const objectStoreRequest = objectStore.add(newItem)
    objectStoreRequest.onsuccess = (event) => {
      updateMessage(`データを追加の要求は成功しました。`)
      fetchAll()
      clearInputFields()
    }
  })
}

/**
 * DBのオブジェクトストアからアイテムを取得して表示
 */
function fetchAll() {
  const transaction = db.transaction([OBJECT_STORE_TASKS], 'readonly')
  const objectStore = transaction.objectStore(OBJECT_STORE_TASKS)
  objectStore.getAll().onsuccess = (event) => {
    /** @type Array<object> */
    const rows = event.target.result
    console.log(rows)
    // 表示の更新
    clearTaskTable()
    rows.forEach(row => {
      insertTaskTableRow(row)
    });
  }
}

/**
 * 入力欄をクリア
 */
function clearInputFields() {
  const nameInputElement = document.getElementById('name')
  const priorityInputElement = document.getElementById('priority')
  nameInputElement.value = ''
  priorityInputElement.value = ''
}

/**
 * テーブルの中身をクリア
 */
function clearTaskTable() {
  const tbodyElement = document.getElementById('task_list')
  tbodyElement.innerHTML = ''
}

/**
 * テーブルに行を追加
 * @param {object} data 
 */
function insertTaskTableRow(data) {
  const tbodyElement = document.getElementById('task_list')
  const trElement = document.createElement('tr')
  const idTdElement = document.createElement('td')
  const taskTdElement = document.createElement('td')
  const priorityTdElement = document.createElement('td')
  idTdElement.textContent = data.id
  taskTdElement.textContent = data.name
  priorityTdElement.textContent = data.priority
  trElement.appendChild(idTdElement)
  trElement.appendChild(taskTdElement)
  trElement.appendChild(priorityTdElement)
  tbodyElement.appendChild(trElement)
}

/**
 * メッセージ文をクリアする
 */
function clearMessage() {
    document.getElementById('message').textContent = ''
}

/**
 * メッセージ文を更新する
 * @param {string} text 
 */
function updateMessage(text) {
    document.getElementById('message').textContent = text
}

/**
 * 画面読み込み時の初期化処理
 */
function init() {
  if (!enabledIndexedDB()) {
    document.getElementById('message').textContent = `[Note]: This browser doesn't support IndexedDB.`
    return
  }
  setupDB()
  setupAddItemButton()
}

window.addEventListener('DOMContentLoaded', () => {
  init()
})
