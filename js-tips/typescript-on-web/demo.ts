interface Demo {
  e: string;
  f: number;
  g: boolean;
}

const demo: Demo = {
  e: 'eee',
  f: 222,
  g: false,
};

export function execute(statusElement: HTMLElement, dataElement: HTMLElement): Promise<Demo> {
  return new Promise(async (resolve, reject) => {
    // 擬似的に通信時の遅延状態を再現
    await new Promise<void>(done => setTimeout(done, 100));

    // 結果を画面に表示
    statusElement.textContent = 'Complete!';
    dataElement.textContent = JSON.stringify(demo);

    resolve(demo);
  });
}
