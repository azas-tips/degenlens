import { useAppStore } from './stores/app.store';
import { ModelSelector } from './components/ModelSelector';
import { ResultsTable } from './components/ResultsTable';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { useAnalyze } from './hooks/useAnalyze';
import { useTranslation } from '@/i18n';

function App() {
  const { t } = useTranslation();
  const {
    chain,
    model,
    maxPairs,
    analyzing,
    progress,
    results,
    error,
    errorCode,
    errorSuggestions,
    retryAfterMs,
    setChain,
    setModel,
    setMaxPairs,
    clearResults,
  } = useAppStore();

  // Analysis hook
  const { analyze, cancel } = useAnalyze();

  // Check if analysis can be started
  const canAnalyze = chain && model && !analyzing;

  /**
   * Handle cache clear
   */
  const handleClearCache = async () => {
    try {
      await chrome.storage.session.clear();
      clearResults();
      alert('Cache cleared successfully');
    } catch (err) {
      console.error('[App] Failed to clear cache:', err);
      alert('Failed to clear cache');
    }
  };

  /**
   * Handle analyze button click
   */
  const handleAnalyze = async () => {
    if (!canAnalyze) {
      if (!model) {
        alert('Please select an LLM model');
      }
      return;
    }

    analyze();
  };

  return (
    <div className="w-96 min-h-[500px] bg-dark text-white p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-primary">😈 {t('app.title')}</h1>
        <p className="text-sm text-gray-400 mt-1">{t('app.subtitle')}</p>
      </header>

      <main className="space-y-4">
        {/* Chain Selector */}
        <section>
          <label className="block text-sm font-medium mb-2">{t('form.chain')}</label>
          <select
            value={chain}
            onChange={e => setChain(e.target.value)}
            disabled={analyzing}
            className="w-full px-3 py-2 bg-dark-lighter border border-gray-700 rounded focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="solana">Solana</option>
            <option value="ethereum">Ethereum</option>
            <option value="bsc">BSC</option>
            <option value="polygon">Polygon</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="optimism">Optimism</option>
            <option value="base">Base</option>
          </select>
        </section>

        {/* Model Selector */}
        <ModelSelector value={model} onChange={setModel} disabled={analyzing} />

        {/* Max Pairs Input */}
        <section>
          <label className="block text-sm font-medium mb-2">
            {t('form.maxPairs', { count: maxPairs })}
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={maxPairs}
            onChange={e => setMaxPairs(Number(e.target.value))}
            disabled={analyzing}
            className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>100</span>
          </div>
        </section>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-500 rounded text-red-200 text-sm space-y-2">
            <div>
              <p className="font-medium">{t('error.title')}</p>
              <p className="mt-1">{error}</p>
            </div>

            {/* Show retry wait time for rate limits */}
            {retryAfterMs > 0 && (
              <div className="text-xs text-red-300">
                {t('error.retryWait', { seconds: Math.ceil(retryAfterMs / 1000) })}
              </div>
            )}

            {/* Show actionable suggestions */}
            {errorSuggestions.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-red-300 mb-1">{t('error.suggestions')}</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-red-200">
                  {errorSuggestions.map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Show "Go to Settings" button for API key errors */}
            {(errorCode === 'E_DEX_UNAUTHORIZED' || errorCode === 'E_LLM_UNAUTHORIZED') && (
              <button
                onClick={() => chrome.runtime.openOptionsPage()}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-white text-xs font-medium transition-colors"
              >
                {t('error.goToSettings')}
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {analyzing ? (
            <button
              onClick={cancel}
              className="flex-1 px-4 py-2 rounded font-medium bg-red-600 hover:bg-red-700 transition-colors"
            >
              {t('form.cancel')}
            </button>
          ) : (
            <>
              <button
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                className={`flex-1 px-4 py-2 rounded font-medium transition-colors ${
                  canAnalyze
                    ? 'bg-primary hover:bg-primary-light'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                {t('form.analyze')}
              </button>

              <button
                onClick={handleClearCache}
                className="px-3 py-2 bg-dark-lighter border border-gray-700 rounded hover:bg-gray-800 transition-colors"
                title={t('form.clearCache')}
              >
                🔄
              </button>
            </>
          )}
        </div>

        {/* Progress Display */}
        {analyzing && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>{progress.step ? t(`progress.${progress.step}`) : t('form.analyzing')}</span>
              <span>{progress.progress}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Results Display */}
        <section className="mt-6">
          {results ? (
            <ResultsTable data={results} />
          ) : analyzing ? (
            <LoadingSkeleton />
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-sm">
                {t('empty.instructions')}
                <br />
                {t('empty.thenAnalyze')}
              </p>
            </div>
          )}
        </section>
      </main>

      <footer className="mt-6 pt-4 border-t border-gray-800 text-xs text-gray-500">
        {t('footer.warning')}
      </footer>
    </div>
  );
}

export default App;
