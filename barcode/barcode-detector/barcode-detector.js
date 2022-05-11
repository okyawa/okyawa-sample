let barcodeDetector;
if (('BarcodeDetector' in window)) {
  barcodeDetector = new BarcodeDetector();
}

// streamを入力するvideoを作成する
const video = document.createElement("video");

// 検出と加工する非表示のcanvasを作成する
const offscreen_canvas = document.createElement("canvas");
const offscreen_context = offscreen_canvas.getContext("2d");

// 最終的に取得した画像を表示するcanvasを取得する
const canvas = document.querySelector("#preview");
const canvas_context = canvas.getContext("2d");

// カメラと中間処理のキャンバスのサイズを最終的に表示するキャンバスを基準に設定
// canvas.width = window.innerWidth;
// canvas.height = window.innerHeight;

offscreen_canvas.width = canvas.width;
video.videoWidth = canvas.width;
offscreen_canvas.height = canvas.height;
video.videoHeight = canvas.height;

const startButtonElem = document.getElementById('start_button');
const stopButtonElem = document.getElementById('stop_button');
const messageElem = document.getElementById('message');

const result_format = document.getElementById('format');
const result_raw_value = document.getElementById('raw_value');
const result_width = document.getElementById('width');
const result_height = document.getElementById('height');
const result_top_left_x = document.getElementById('top_left_x');
const result_top_left_y = document.getElementById('top_left_y');

const loadVideo = async (event) => {

  if (!('BarcodeDetector' in window)) {
    messageElem.textContent = 'ご利用のブラウザはBarcodeDetectorに対応していません。'
    return;
  }

  // 開始ボタンを非表示
  event.currentTarget.style.display = 'none';
  // 停止ボタンを表示
  stopButtonElem.style.display = '';
  // メッセージを削除
  messageElem.textContent = '';

  try {
    // カメラを取得
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 320 },
        height: { ideal: 240 },
        facingMode: {
          exact: "environment", // リアカメラを利用
        },
        // facingMode: "user", // フロントカメラを利用
      },
      audio: false,
    });

    // オブジェクトと関連付ける
    video.srcObject = stream;
    video.play();

    // バーコードの解析処理自体の実行
    analysis();

  } catch (error) {
    // 許可されなかった場合
    // 開始ボタンを表示
    startButtonElem.style.display = "";
    // 停止ボタンを非表示
    stopButtonElem.style.display = "none";
    // エラーメッセージを表示
    messageElem.textContent = "利用するには、カメラの使用を許可する必要があります。";
  }
};

const updateResultTable = (barcode) => {
  result_format.textContent = barcode ? barcode.format : '';
  result_raw_value.textContent = barcode ? barcode.rawValue : '';
  result_width.textContent = barcode ? barcode.boundingBox.width : '';
  result_height.textContent = barcode ? barcode.boundingBox.height : '';
  result_top_left_x.textContent = barcode ? barcode.cornerPoints[0].x : '';
  result_top_left_y.textContent = barcode ? barcode.cornerPoints[0].y : '';
};

const analysis = async () => {
  // カメラの入力をCanvasに書き込む
  offscreen_context.drawImage(video, 0, 0, canvas.width, canvas.height);

  let code = null;

  try {
    code = await barcodeDetector.detect(offscreen_canvas);
  } catch (e) {
    console.log(e);
  }

  let state = true;

  if (code == null) {
    state = false;
  }
  if (state == true && code.length == 0) {
    state = false;
  }

  // バーコードの値が取れていた場合、赤い線で囲む
  if (state) {
    // バーコードを囲む処理
    offscreen_context.strokeStyle = "rgb(255, 100, 100) ";
    offscreen_context.lineWidth = 10;
    offscreen_context.beginPath(
      code[0].cornerPoints[0].x,
      code[0].cornerPoints[0].y
    );
    offscreen_context.lineTo(
      code[0].cornerPoints[1].x,
      code[0].cornerPoints[1].y
    );
    offscreen_context.lineTo(
      code[0].cornerPoints[2].x,
      code[0].cornerPoints[2].y
    );
    offscreen_context.lineTo(
      code[0].cornerPoints[3].x,
      code[0].cornerPoints[3].y
    );
    offscreen_context.lineTo(
      code[0].cornerPoints[0].x,
      code[0].cornerPoints[0].y
    );
    offscreen_context.closePath();
    offscreen_context.stroke();

    // バーコードから取得した文字列の表示前加工
    // バーコードを囲んだ四角の中に文字列が収まるように、収まる文字数と改行の回数を計算する
    const w = code[0].boundingBox.width - 20;
    const split_chr_count = Math.floor(w / 5);
    // const split_chr_count = Math.floor(w / 25);
    const split_loop_count = Math.ceil(
      code[0].rawValue.length / split_chr_count
    );

    let viewertext = [];
    for (let i = 0; i < split_loop_count; i++) {
      if (code[0].rawValue.length > i * split_chr_count) {
        const a = code[0].rawValue.substr(i * split_chr_count, split_chr_count);
        viewertext.push(
          `${code[0].rawValue.substr(i * split_chr_count, split_chr_count)}\n`
        );
      } else {
        const a = code[0].rawValue.substr(
          i * split_chr_count,
          code[0].rawValue.length - 1
        );
        viewertext.push(
          `${code[0].rawValue.substr(
            i * split_chr_count,
            code[0].rawValue.length - 1
          )}`
        );
      }
    }
    offscreen_context.fillStyle = "rgb(255, 100, 100) ";
    offscreen_context.font = "bold 10px Times Roman";
    // offscreen_context.font = "bold 50px Times Roman";
    offscreen_context.textAlign = "start";

    viewertext.forEach((text, index) => {
      offscreen_context.fillText(
        text,
        // code[0].cornerPoints[0].x + 10,
        code[0].cornerPoints[0].x + 5,
        // code[0].cornerPoints[0].y + 50 * (index + 1)
        code[0].cornerPoints[0].y + 15 * (index + 1)
      );
    });

    // 結果のテキストをテーブル表示を更新
    updateResultTable(code[0]);
  }

  canvas_context.drawImage(offscreen_canvas, 0, 0, canvas.width, canvas.height);
  window.requestAnimationFrame(analysis);
};

stopButtonElem.addEventListener('click', function (event) {
  // BarcodeDetectorを停止

  // MediaStreamTrackを停止
  let stream = video.srcObject;
  let tracks = stream.getTracks();
  tracks.forEach(function(track) {
    track.stop();
  });
  video.srcObject = null;

  // Canvasの描画をクリア
  // TODO: ↓これが効いてない状態
  canvas_context.clearRect(0, 0, 320, 240);

  // 結果のテキストをテーブル表示をクリア
  updateResultTable(null);

  // 開始ボタンを表示
  startButtonElem.style.display = '';
  // 停止ボタンを非表示
  stopButtonElem.style.display = 'none';
  // メッセージを表示
  messageElem.textContent = 'カメラの使用を停止しました。';
});

startButtonElem.addEventListener('click', loadVideo);
