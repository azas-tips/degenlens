// Background Service Worker
// すべての外部API通信を担当

console.log('DegenLens background service worker loaded');

// Service Worker installation
chrome.runtime.onInstalled.addListener(async details => {
  console.log('Extension installed:', details.reason);

  // 新規インストール時はOptions画面を開く
  if (details.reason === 'install') {
    chrome.runtime.openOptionsPage();
  }

  // TODO: ストレージマイグレーション実装
  // await migrateStorage();
});

// Port通信のリスナー（LLM長時間処理対応）
chrome.runtime.onConnect.addListener(port => {
  console.log('Port connected:', port.name);

  let aborted = false;

  // Port切断監視
  port.onDisconnect.addListener(() => {
    aborted = true;
    console.log('Port disconnected');
  });

  // 安全なメッセージ送信（二重送信防止）
  const safePost = (msg: unknown) => {
    if (!aborted) {
      port.postMessage(msg);
    }
  };

  // メッセージハンドラー
  port.onMessage.addListener(async (message: unknown) => {
    if (aborted) return;

    console.log('Received message:', message);

    // TODO: メッセージのバリデーション（zod）
    // TODO: 各ハンドラーの実装（analyze, fetch-models等）

    // 一時的なエコー応答
    safePost({
      type: 'result',
      data: { echo: message },
    });
  });
});

// Service Worker の健全性チェック（5分毎）
chrome.alarms.create('health-check', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'health-check') {
    console.log('[Health Check] Service Worker is alive');
    // TODO: 古いキャッシュのクリーンアップ
  }
});
