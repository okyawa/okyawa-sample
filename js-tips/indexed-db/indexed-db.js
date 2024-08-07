import { IDB } from './idb.js'

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
 * 新しいバージョンのデータベースを作成時のコールバック関数
 * @param {IDBDatabase} db 
 */
function onUpgradeNeededCallback(db) {
  // オブジェクトストアを作成
  const objectStore = db.createObjectStore(this.storeName, {
    keyPath: 'id',
    autoIncrement: true,
  });

  // オブジェクトストアに格納するデータアイテムを定義
  objectStore.createIndex('name', 'name', { unique: false });
  objectStore.createIndex('priority', 'priority', { unique: false });
  objectStore.createIndex('completed', 'completed', { unique: false });
}

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
 * @param {IDB} idb 
 */
/* 
function setupAddItemButton(idb) {
  const buttonElement = document.getElementById('add_button')
  buttonElement.addEventListener('click', () => {
    const nameInputElement = document.getElementById('name')
    const priorityInputElement = document.getElementById('priority')
    const newItem = {
      name: nameInputElement.value,
      priority: priorityInputElement.value,
      completed: false,
    }

    idb.insertOne(newItem)
  })
}
*/

/**
 * DBのオブジェクトストアにアイテムを追加
 */
function setupAddItemButton() {
  const formElement = document.getElementById('add_form')
  formElement.addEventListener('submit', (event) => {
    event.preventDefault()
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
 * DBのオブジェクトストアからアイテムを削除
 * @param {string} id 
 */
function deleteOne(id) {
  // 読み書き用のトランザクションを開き、データを削除する準備
  const transaction = db.transaction([OBJECT_STORE_TASKS], 'readwrite')
  const objectStore = transaction.objectStore(OBJECT_STORE_TASKS)

  // トランザクションでオブジェクトストアから対象のキーの項目を削除
  const request = objectStore.delete(Number(id));
  request.onsuccess = (event) => {
    updateMessage(`データの削除に成功しました。`);
    fetchAll();
  };
  request.onerror = (event) => {
    updateMessage(`データの削除に失敗しました。`);
  }
}

/**
 * DBのオブジェクトストアの中身を全て削除
 */
function deleteAll() {
  // 読み書き用のトランザクションを開き、データを削除する準備
  const transaction = db.transaction([OBJECT_STORE_TASKS], 'readwrite')
  const objectStore = transaction.objectStore(OBJECT_STORE_TASKS)

  // トランザクションでオブジェクトストアの中身を全て削除
  const request = objectStore.clear();
  request.onsuccess = (event) => {
    updateMessage(`全てのデータ削除に成功しました。`);
    fetchAll();
  };
  request.onerror = (event) => {
    updateMessage(`全てのデータ削除に失敗しました。`);
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
 * 対象のアイテムを削除
 * @param {Event} event 
 */
function deleteItem(event) {
  const targetElement = event.currentTarget;
  const id = targetElement.dataset.id;
  deleteOne(id);
}

/**
 * 全てクリアするボタンのイベントを登録
 * @param {IDB} idb 
 */
/*
function setupAllClearButton(idb) {
  const buttonElement = document.getElementById('clear_all_button')
  buttonElement.addEventListener('click', () => {
    idb.deleteAll();
  });
}
*/

/**
 * 全てクリアするボタンのイベントを登録
 */
function setupAllClearButton() {
  const buttonElement = document.getElementById('clear_all_button')
  buttonElement.addEventListener('click', () => {
    deleteAll();
  });
}

/**
 * テーブルに行を追加
 * @param {object} data 
 * @param {IDB} idb
 */
/* 
function insertTaskTableRow(data, idb) {
  const tbodyElement = document.getElementById('task_list')
  const trElement = document.createElement('tr')
  const idTdElement = document.createElement('td')
  const taskTdElement = document.createElement('td')
  const priorityTdElement = document.createElement('td')
  const deleteTdElement = document.createElement('td')
  const deleteButtonElement = document.createElement('button')
  idTdElement.textContent = data.id
  taskTdElement.textContent = data.name
  priorityTdElement.textContent = data.priority
  deleteButtonElement.textContent = '削除';
  deleteButtonElement.dataset.id = data.id;
  deleteButtonElement.setAttribute('type', 'button');
  // deleteButtonElement.addEventListener('click', deleteItem);
  // FIXME: 削除ボタンをクリック時に `idb.deleteOne` が無い旨のエラーになる
  deleteButtonElement.addEventListener('click', () => {
    idb.deleteOne(data.id);
  });
  deleteTdElement.appendChild(deleteButtonElement);
  trElement.appendChild(idTdElement)
  trElement.appendChild(taskTdElement)
  trElement.appendChild(priorityTdElement)
  trElement.appendChild(deleteTdElement)
  tbodyElement.appendChild(trElement)
}
 */

/**
 * IndexDBで保存されているデータを1件更新
 */
function putIndexDB(id, key, value) {
    // 読み書き用のトランザクションを開き、データを追加する準備
    const transaction = db.transaction([OBJECT_STORE_TASKS], 'readwrite')
    transaction.oncomplete = (event) => {
      updateMessage(`データ更新のトランザクションが完了しました。`)
    }
    transaction.onerror = (event) => {
      updateMessage(`トランザクションはエラーのため開けませんでした。アイテムの重複は許可されていません。`)
    }

    // トランザクションでオブジェクトストアを作成
    const objectStore = transaction.objectStore(OBJECT_STORE_TASKS)

    // 保存されているデータを1件取得する要求
    const objectStoreGetRequest = objectStore.get(id)

    objectStoreGetRequest.onsuccess = () => {
      // IndexDBから取得したデータ
      const item = objectStoreGetRequest.result
      // 更新内容を反映
      item[key] = value

      // オブジェクトストアにオブジェクトを追加する要求
      const objectStorePutRequest = objectStore.put(item)

      objectStorePutRequest.onsuccess = () => {
        updateMessage(`データを更新の要求は成功しました。 ( ${key} を ${value} に更新)`)
        fetchAll()
        clearInputFields()
      }
    }
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
  const priorityInputElement = document.createElement('input')
  const deleteTdElement = document.createElement('td')
  const deleteButtonElement = document.createElement('button')
  idTdElement.textContent = data.id
  taskTdElement.textContent = data.name
  priorityInputElement.value = data.priority
  priorityInputElement.setAttribute('type', 'number')
  priorityInputElement.setAttribute('min', '1')
  priorityInputElement.setAttribute('max', '5')
  priorityInputElement.addEventListener('change', (event) => {
    // 優先度の更新処理
    const targetElement = event.currentTarget;
    const value = targetElement.value;
    if (!['1', '2', '3', '4', '5'].includes(value)) {
      return
    }
    // IndexDBの更新処理を実行
    putIndexDB(data.id, 'priority', value)
  })
  priorityTdElement.appendChild(priorityInputElement)
  deleteButtonElement.textContent = '削除';
  deleteButtonElement.dataset.id = data.id;
  deleteButtonElement.setAttribute('type', 'button');
  deleteButtonElement.addEventListener('click', deleteItem);
  deleteTdElement.appendChild(deleteButtonElement);
  trElement.appendChild(idTdElement)
  trElement.appendChild(taskTdElement)
  trElement.appendChild(priorityTdElement)
  trElement.appendChild(deleteTdElement)
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
  // TODO: IDBをインスタンス化し、処理を置き換える →難しそう。。？
/* 
  const idb = new IDB(
    DB_NAME,
    DB_VERSION,
    OBJECT_STORE_TASKS,
    onUpgradeNeededCallback,
    updateMessage,
    (row) => {
      insertTaskTableRow(row, idb)
    },
    clearTaskTable,
    clearInputFields,
  )
  setupAddItemButton(idb)
  setupAllClearButton(idb)
*/

  setupDB()
  setupAddItemButton()
  setupAllClearButton()
}

window.addEventListener('DOMContentLoaded', () => {
  init()
})
