/**
 * IndexedDBの操作クラス
 */
export class IDB {
  /**
   * コンストラクタ
   * @param {string} dbName 
   * @param {number} dbVersion 
   * @param {string} storeName 
   * @param {function(IDBDatabase | null):void} onUpgradeNeededCallback 
   * @param {function(string):void} messageCallback 
   * @param {function(object):void} insertRowCallback 
   */
  constructor(dbName, dbVersion, storeName, onUpgradeNeededCallback, messageCallback, insertRowCallback) {
    this.storeName = storeName;
    this.messageCallback = messageCallback ?? ((_) => {});
    this.insertRowCallback = insertRowCallback ?? ((_) => {});
    this.onUpgradeNeededCallback = onUpgradeNeededCallback ?? ((_) => {});
    /** @type IDBDatabase | null */
    this.db = null;

    if (!this.enabledIndexedDB()) {
      throw new Error('ERROR :: IndexedDB is not available.')
    }

    // データベースを開く
    const dbOpenRequest = window.indexedDB.open(dbName, dbVersion);

    this.initDB(dbOpenRequest);
  }

  /**
   * データベースの初期化
   * @param {IDBOpenDBRequest} dbOpenRequest 
   */
  initDB(dbOpenRequest) {
    dbOpenRequest.onsuccess = (event) => {
      this.messageCallback(`データベースを初期化しました。`)
      this.db= dbOpenRequest.result;
      this.fetchAll();
    };

    // データベースがまだ作成されていないか、新しいバージョン番号が指定されか、の場合に
    // 新しいバージョンのデータベースを作成する必要がある場合に必要な処理を指定
    dbOpenRequest.onupgradeneeded = (event) => {
      const db= event.target.result;

      db.onerror = (e) => {
        this.messageCallback(`データベースの読み込み中にエラーが発生しました。`)
      };

      this.onUpgradeNeededCallback(db)
/*
      // オブジェクトストアを作成
      const objectStore = db.createObjectStore(this.storeName, {
        keyPath: 'id',
        autoIncrement: true,
      });

      // オブジェクトストアに格納するデータアイテムを定義
      objectStore.createIndex('name', 'name', { unique: false });
      objectStore.createIndex('priority', 'priority', { unique: false });
      objectStore.createIndex('completed', 'completed', { unique: false });
*/

      this.messageCallback('オブジェクトストアを作成しました。');
    };
  }

  /**
   * IndexDBが利用可能なブラウザかどうか
   * @returns {boolean}
   */
  static enabledIndexedDB() {
    return 'indexedDB' in window
  }

  /**
   * DBのオブジェクトストアにアイテムを追加
   * @param {object} newItem 
   */
  insertOne(newItem) {
    // 読み書き用のトランザクションを開き、データを追加する準備
    const transaction = this.db.transaction([this.storeName], 'readwrite');
    transaction.oncomplete = (event) => {
      this.messageCallback(`データ追加のトランザクションが完了しました。`);
    };
    transaction.onerror = (event) => {
      this.messageCallback(
        `トランザクションはエラーのため開けませんでした。アイテムの重複は許可されていません。`
      );
    };

    // トランザクションでオブジェクトストアを作成
    const objectStore = transaction.objectStore(this.storeName);
    // オブジェクトストアにオブジェクトを追加する要求
    const objectStoreRequest = objectStore.add(newItem);
    objectStoreRequest.onsuccess = (event) => {
      this.messageCallback(`データを追加の要求は成功しました。`);
      this.fetchAll();
      clearInputFields();
    };
  }

  /**
   * DBのオブジェクトストアからアイテムを取得して表示
   */
  fetchAll() {
    const transaction = this.db.transaction([this.storeName], 'readonly')
    const objectStore = transaction.objectStore(this.storeName)
    objectStore.getAll().onsuccess = (event) => {
      /** @type Array<object> */
      const rows = event.target.result
      console.log(rows)
      // 表示の更新
      clearTaskTable()
      rows.forEach(row => {
        this.insertRowCallback(row)
      });
    }
  }

  /**
   * DBのオブジェクトストアからアイテムを削除
   * @param {string} id 
   */
  deleteOne(id) {
    // 読み書き用のトランザクションを開き、データを削除する準備
    const transaction = this.db.transaction([this.storeName], 'readwrite')
    const objectStore = transaction.objectStore(this.storeName)

    // トランザクションでオブジェクトストアから対象のキーの項目を削除
    const request = objectStore.delete(Number(id));
    request.onsuccess = (event) => {
      this.messageCallback(`データの削除に成功しました。`);
      this.fetchAll();
    };
    request.onerror = (event) => {
      this.messageCallback(`データの削除に失敗しました。`);
    }
  }

  /**
   * DBのオブジェクトストアの中身を全て削除
   */
  deleteAll() {
    // 読み書き用のトランザクションを開き、データを削除する準備
    const transaction = this.db.transaction([this.storeName], 'readwrite')
    const objectStore = transaction.objectStore(this.storeName)

    // トランザクションでオブジェクトストアの中身を全て削除
    const request = objectStore.clear();
    request.onsuccess = (event) => {
      this.messageCallback(`全てのデータ削除に成功しました。`);
      this.fetchAll();
    };
    request.onerror = (event) => {
      this.messageCallback(`全てのデータ削除に失敗しました。`);
    }
  }
}
