import React from 'react';

function App() {
  return (
    <div className="w-96 min-h-[500px] bg-dark text-white p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-primary">😈 DegenLens</h1>
        <p className="text-sm text-gray-400 mt-1">AI-powered DEX scanner</p>
      </header>

      <main className="space-y-4">
        <div className="p-8 text-center text-gray-500">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-sm">
            開発中...
            <br />
            Environment setup complete!
          </p>
        </div>

        {/* TODO: チェーン選択 */}
        {/* TODO: モデル選択 */}
        {/* TODO: 分析実行ボタン */}
        {/* TODO: 結果表示 */}
      </main>

      <footer className="mt-6 pt-4 border-t border-gray-800 text-xs text-gray-500">
        ⚠️ Not financial advice. DYOR.
      </footer>
    </div>
  );
}

export default App;
