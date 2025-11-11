import React, { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '@/types/storage';

function Options() {
  // APIキー保存状態
  const [savedKeys, setSavedKeys] = useState({
    dex: false,
    openrouter: false,
  });

  // 入力フィールド（常に空表示）
  const [dexInput, setDexInput] = useState('');
  const [openrouterInput, setOpenrouterInput] = useState('');

  // 保存処理中フラグ
  const [saving, setSaving] = useState(false);

  // 保存成功メッセージ
  const [saveMessage, setSaveMessage] = useState('');

  // 起動時: 保存状態のみ確認
  useEffect(() => {
    loadSavedStatus();
  }, []);

  const loadSavedStatus = async () => {
    const data = await chrome.storage.local.get([
      STORAGE_KEYS.DEX_API_KEY,
      STORAGE_KEYS.OPENROUTER_API_KEY,
    ]);

    setSavedKeys({
      dex: !!data[STORAGE_KEYS.DEX_API_KEY],
      openrouter: !!data[STORAGE_KEYS.OPENROUTER_API_KEY],
    });
  };

  // APIキー保存
  const handleSaveKeys = async () => {
    if (!dexInput.trim() && !openrouterInput.trim()) {
      setSaveMessage('⚠️ APIキーを入力してください');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    setSaving(true);
    setSaveMessage('');

    try {
      const updates: Record<string, string> = {};

      // 新規入力がある場合のみ更新
      if (dexInput.trim()) {
        updates[STORAGE_KEYS.DEX_API_KEY] = dexInput.trim();
      }

      if (openrouterInput.trim()) {
        updates[STORAGE_KEYS.OPENROUTER_API_KEY] = openrouterInput.trim();
      }

      await chrome.storage.local.set(updates);

      // 保存状態を更新
      await loadSavedStatus();

      // 入力フィールドをクリア
      setDexInput('');
      setOpenrouterInput('');

      setSaveMessage('✅ APIキーを保存しました');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save API keys:', error);
      setSaveMessage('❌ 保存に失敗しました');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  // キャッシュクリア
  const handleClearCache = async () => {
    try {
      await chrome.storage.session.clear();
      setSaveMessage('✅ キャッシュをクリアしました');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      setSaveMessage('❌ クリアに失敗しました');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  // 全データ消去
  const handleFullReset = async () => {
    if (!confirm('すべての設定とデータを消去します。よろしいですか？')) {
      return;
    }

    try {
      await chrome.storage.local.clear();
      await chrome.storage.session.clear();

      // 初期化（マイグレーションで自動的に実行される）
      setSavedKeys({ dex: false, openrouter: false });
      setSaveMessage('✅ すべてのデータを消去しました');

      // リロードして初期化を確実にする
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Failed to reset data:', error);
      setSaveMessage('❌ 消去に失敗しました');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-dark text-white">
      <div className="max-w-2xl mx-auto p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-primary">😈 DegenLens Settings</h1>
          <p className="text-gray-400 mt-2">Configure your API keys and preferences</p>
        </header>

        {/* 保存メッセージ */}
        {saveMessage && (
          <div className="mb-6 p-4 bg-dark-lighter rounded-lg text-center">
            <p className="text-sm">{saveMessage}</p>
          </div>
        )}

        <main className="space-y-8">
          {/* APIキー設定セクション */}
          <section className="bg-dark-lighter p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">API Keys</h2>
            <div className="space-y-4">
              {/* DEXscreener API Key */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">DEXscreener API Key</label>
                  {savedKeys.dex && (
                    <span className="text-xs text-profit font-medium">✓ 保存済み</span>
                  )}
                </div>
                <input
                  type="password"
                  value={dexInput}
                  onChange={e => setDexInput(e.target.value)}
                  placeholder="Enter your API key"
                  className="w-full px-4 py-2 bg-dark border border-gray-700 rounded focus:border-primary focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your key at{' '}
                  <a
                    href="https://docs.dexscreener.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    docs.dexscreener.com
                  </a>
                </p>
              </div>

              {/* OpenRouter API Key */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">OpenRouter API Key</label>
                  {savedKeys.openrouter && (
                    <span className="text-xs text-profit font-medium">✓ 保存済み</span>
                  )}
                </div>
                <input
                  type="password"
                  value={openrouterInput}
                  onChange={e => setOpenrouterInput(e.target.value)}
                  placeholder="Enter your API key"
                  className="w-full px-4 py-2 bg-dark border border-gray-700 rounded focus:border-primary focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your key at{' '}
                  <a
                    href="https://openrouter.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    openrouter.ai
                  </a>
                </p>
              </div>

              <button
                onClick={handleSaveKeys}
                disabled={saving}
                className={`px-6 py-2 rounded font-medium transition-colors ${
                  saving
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-light'
                }`}
              >
                {saving ? '保存中...' : 'Save API Keys'}
              </button>
            </div>
          </section>

          {/* データ管理セクション */}
          <section className="bg-dark-lighter p-6 rounded-lg border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">データ管理</h2>
            <div className="space-y-3">
              <div>
                <button
                  onClick={handleClearCache}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  ⚡ キャッシュクリア
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  APIレスポンスのキャッシュをクリアして最新データを取得します
                </p>
              </div>

              <div className="pt-3 border-t border-gray-800">
                <button
                  onClick={handleFullReset}
                  className="px-4 py-2 bg-loss hover:bg-red-600 text-white rounded transition-colors"
                >
                  🗑️ すべてのデータを消去
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  APIキーを含むすべての設定を削除します（復元不可）
                </p>
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-12 pt-6 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>DegenLens v0.1.0 | MIT License</p>
          <p className="mt-2">
            ⚠️ API keys are stored locally in plain text and never sent to external servers
          </p>
        </footer>
      </div>
    </div>
  );
}

export default Options;
