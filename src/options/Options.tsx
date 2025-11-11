import React from 'react';

function Options() {
  return (
    <div className="min-h-screen bg-dark text-white">
      <div className="max-w-2xl mx-auto p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-primary">😈 DegenLens Settings</h1>
          <p className="text-gray-400 mt-2">Configure your API keys and preferences</p>
        </header>

        <main className="space-y-8">
          {/* APIキー設定セクション */}
          <section className="bg-dark-lighter p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">API Keys</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  DEXscreener API Key
                </label>
                <input
                  type="password"
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

              <div>
                <label className="block text-sm font-medium mb-2">
                  OpenRouter API Key
                </label>
                <input
                  type="password"
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

              <button className="px-6 py-2 bg-primary hover:bg-primary-light rounded font-medium transition-colors">
                Save API Keys
              </button>
            </div>
          </section>

          {/* TODO: データ管理セクション */}
          {/* TODO: デバッグセクション */}
        </main>

        <footer className="mt-12 pt-6 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>DegenLens v0.1.0 | MIT License</p>
          <p className="mt-2">
            ⚠️ API keys are stored locally and never sent to external servers
          </p>
        </footer>
      </div>
    </div>
  );
}

export default Options;
