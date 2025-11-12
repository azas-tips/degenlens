import { useState, useEffect, useCallback } from 'react';
import { useTranslation, type Language } from '@/i18n';
import { STORAGE_KEYS } from '@/types/storage';
import { useAppStore, initializeStore } from '@/stores/app.store';
import { ModelSelector } from '@/components/ModelSelector';
import { TopPickDisplay } from '@/components/TopPickDisplay';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useAnalyze } from '@/hooks/useAnalyze';
import { DEFAULT_ANALYSIS_PROMPT } from '@/background/utils/prompt-builder';

type Tab = 'analysis' | 'settings';

function App() {
  const [tab, setTab] = useState<Tab>('analysis');
  const { t, language, setLanguage } = useTranslation();
  const [storeInitialized, setStoreInitialized] = useState(false);

  // Initialize store on mount
  useEffect(() => {
    initializeStore().then(() => setStoreInitialized(true));
  }, []);

  if (!storeInitialized) {
    return (
      <div className="min-h-screen bg-dark text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😈</div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-dark text-white relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 cyber-grid opacity-30 pointer-events-none"></div>

      {/* Animated Gradient Background */}
      <div
        className="fixed inset-0 opacity-20 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(189, 0, 255, 0.15) 0%, transparent 50%)',
          animation: 'gradient-shift 15s ease infinite',
        }}
      ></div>

      {/* Header with Navigation */}
      <header className="bg-cyber-card/50 backdrop-blur-md border-b border-purple-500/30 sticky top-0 z-50 shadow-neon-purple">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4 animate-slide-in">
              <div className="relative w-10 h-10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 128 128"
                  className="w-full h-full"
                >
                  <rect width="128" height="128" rx="24" fill="#0A0A0F" />
                  <circle cx="56" cy="64" r="32" fill="none" stroke="#A855F7" strokeWidth="6" />
                  <circle cx="52" cy="60" r="8" fill="#A855F7" opacity="0.4" />
                  <path
                    d="M 80 88 L 100 108"
                    stroke="#A855F7"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 84 92 L 104 112"
                    stroke="#A855F7"
                    strokeWidth="4"
                    strokeLinecap="round"
                    opacity="0.6"
                  />
                  <path d="M 36 36 Q 32 24 28 20 Q 32 22 36 32" fill="#A855F7" />
                  <path d="M 76 36 Q 80 24 84 20 Q 80 22 76 32" fill="#A855F7" />
                  <circle
                    cx="56"
                    cy="64"
                    r="32"
                    fill="none"
                    stroke="#A855F7"
                    strokeWidth="2"
                    opacity="0.3"
                  />
                  <circle
                    cx="56"
                    cy="64"
                    r="36"
                    fill="none"
                    stroke="#A855F7"
                    strokeWidth="1"
                    opacity="0.2"
                  />
                  <circle cx="48" cy="64" r="2" fill="#10b981" />
                  <circle cx="56" cy="70" r="2" fill="#10b981" />
                  <circle cx="64" cy="64" r="2" fill="#10b981" />
                  <circle cx="56" cy="58" r="2" fill="#f59e0b" />
                  <circle cx="52" cy="68" r="2" fill="#ef4444" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold neon-text tracking-wider">{t('app.title')}</h1>
                <p className="text-xs text-neon-cyan font-mono">{t('app.subtitle')}</p>
              </div>
            </div>

            {/* Tab Navigation & Donation */}
            <div className="flex items-center space-x-3">
              <nav className="flex space-x-2" role="tablist">
                <button
                  role="tab"
                  aria-selected={tab === 'analysis'}
                  onClick={() => setTab('analysis')}
                  className={`neon-button px-6 py-2 rounded-lg font-medium transition-all ${
                    tab === 'analysis'
                      ? 'bg-primary shadow-neon-purple text-white scale-105'
                      : 'text-gray-400 hover:text-white bg-cyber-card hover:shadow-neon-purple/50'
                  }`}
                >
                  <span>Analysis</span>
                </button>
                <button
                  role="tab"
                  aria-selected={tab === 'settings'}
                  onClick={() => setTab('settings')}
                  className={`neon-button px-6 py-2 rounded-lg font-medium transition-all ${
                    tab === 'settings'
                      ? 'bg-primary shadow-neon-purple text-white scale-105'
                      : 'text-gray-400 hover:text-white bg-cyber-card hover:shadow-neon-purple/50'
                  }`}
                >
                  <span>{t('footer.settings')}</span>
                </button>
              </nav>

              {/* Donation Button */}
              <a
                href="https://linqup.stream/s/70ed3496aed25440"
                target="_blank"
                rel="noopener noreferrer"
                className="neon-button px-4 py-2 rounded-lg font-bold bg-gradient-to-r from-neon-green/20 to-neon-cyan/20 hover:from-neon-green/30 hover:to-neon-cyan/30 border-2 border-neon-green/40 hover:border-neon-green/60 text-neon-green transition-all hover:scale-105 flex items-center space-x-2 group"
              >
                {/* Diamond icon */}
                <div className="relative w-4 h-4">
                  <div className="absolute inset-0 bg-neon-green/30 rotate-45 group-hover:bg-neon-green/50 transition-colors"></div>
                  <div className="absolute inset-0.5 bg-neon-green/10 rotate-45 group-hover:bg-neon-green/20 transition-colors"></div>
                  <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-neon-green rounded-full -translate-x-1/2 -translate-y-1/2 group-hover:w-1.5 group-hover:h-1.5 transition-all animate-glow-pulse"></div>
                </div>
                <span>Buy me a coffee ☕</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-6xl px-6 py-8">
        {tab === 'analysis' ? (
          <AnalysisSection onNavigateToSettings={() => setTab('settings')} />
        ) : (
          <SettingsSection language={language} setLanguage={setLanguage} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-500/20 mt-12 bg-cyber-card/30 backdrop-blur-sm relative z-10">
        <div className="container mx-auto max-w-6xl px-6 py-6">
          <div className="flex items-center justify-between text-xs mb-3">
            <p className="text-neon-pink/80 font-medium">{t('footer.warning')}</p>
            <p className="text-gray-500 font-mono">
              Shortcuts:{' '}
              <kbd className="px-2 py-1 bg-cyber-darker border border-purple-500/30 rounded shadow-neon-purple/20 text-neon-cyan">
                ⌘/Ctrl+Enter
              </kbd>{' '}
              to analyze,{' '}
              <kbd className="px-2 py-1 bg-cyber-darker border border-purple-500/30 rounded shadow-neon-purple/20 text-neon-cyan">
                Esc
              </kbd>{' '}
              to cancel
            </p>
          </div>
          <div className="flex items-center justify-center space-x-3 text-xs border-t border-purple-500/10 pt-3">
            <a
              href="https://azas-tips.github.io/degenlens/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon-cyan/70 hover:text-neon-cyan transition-colors font-mono"
            >
              Privacy Policy
            </a>
            <span className="text-gray-600">|</span>
            <a
              href="https://azas-tips.github.io/degenlens/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon-cyan/70 hover:text-neon-cyan transition-colors font-mono"
            >
              Terms of Service
            </a>
            <span className="text-gray-600">|</span>
            <a
              href="https://github.com/azas-tips/degenlens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon-cyan/70 hover:text-neon-cyan transition-colors font-mono"
            >
              GitHub
            </a>
            <span className="text-gray-600">|</span>
            <a
              href="https://github.com/azas-tips/degenlens/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon-cyan/70 hover:text-neon-cyan transition-colors font-mono"
            >
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Analysis Section Component
 */
interface AnalysisSectionProps {
  onNavigateToSettings: () => void;
}

function AnalysisSection({ onNavigateToSettings }: AnalysisSectionProps) {
  const { t } = useTranslation();

  // Use individual selectors to ensure proper subscription
  const chain = useAppStore(state => state.chain);
  const model = useAppStore(state => state.model);
  const analyzing = useAppStore(state => state.analyzing);
  const progress = useAppStore(state => state.progress);
  const results = useAppStore(state => state.results);
  const error = useAppStore(state => state.error);
  const errorSuggestions = useAppStore(state => state.errorSuggestions);
  const retryAfterMs = useAppStore(state => state.retryAfterMs);
  const setChain = useAppStore(state => state.setChain);
  const setModel = useAppStore(state => state.setModel);

  // Debug: Subscribe to store changes directly
  useEffect(() => {
    console.log('[AnalysisSection] Component mounted, setting up direct subscription');
    const unsubscribe = useAppStore.subscribe(state => {
      console.log('[AnalysisSection] STORE SUBSCRIPTION - analyzing:', state.analyzing);
    });
    return () => {
      console.log('[AnalysisSection] Component unmounting, cleaning up subscription');
      unsubscribe();
    };
  }, []);

  const { analyze, cancel } = useAnalyze();
  const canAnalyze = chain && model && !analyzing;

  // Debug: Log analyzing state (render-time)
  console.log(
    '[AnalysisSection] RENDER - analyzing:',
    analyzing,
    'progress:',
    progress,
    'results:',
    !!results
  );

  /**
   * Handle analyze button click
   */
  const handleAnalyze = useCallback(async () => {
    console.log(
      '[handleAnalyze] Called - canAnalyze:',
      canAnalyze,
      'chain:',
      chain,
      'model:',
      model
    );
    if (!canAnalyze) {
      console.log('[handleAnalyze] Cannot analyze - canAnalyze is false');
      if (!model) {
        alert('Please select an LLM model');
      }
      return;
    }
    console.log('[handleAnalyze] Calling analyze()');
    analyze();
  }, [canAnalyze, model, analyze, chain]);

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (analyzing) {
          cancel();
        } else if (canAnalyze) {
          handleAnalyze();
        }
      }
      if (e.key === 'Escape' && analyzing) {
        e.preventDefault();
        cancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [analyzing, canAnalyze, cancel, handleAnalyze]);

  return (
    <div className="space-y-6 relative z-10">
      {/* Controls Section */}
      <div className="cyber-card p-6 rounded-xl shadow-cyber-card animate-fade-in">
        <h2 className="text-xl font-bold mb-6 neon-text tracking-wide">Analysis Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chain Selector */}
          <section>
            <label htmlFor="chain-select" className="block text-sm font-medium mb-2 text-neon-cyan">
              {t('form.chain')}
            </label>
            <select
              id="chain-select"
              value={chain}
              onChange={e => setChain(e.target.value)}
              disabled={analyzing}
              className="w-full px-4 py-3 bg-cyber-darker border-2 border-purple-500/30 rounded-lg focus:border-neon-purple focus:shadow-neon-purple focus:outline-none disabled:opacity-50 transition-all font-mono text-sm hover:border-purple-500/50"
            >
              <option value="solana">Solana</option>
              <option value="ethereum">Ethereum</option>
              <option value="bsc">BSC</option>
              <option value="polygonzkevm">Polygon zkEVM</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="optimism">Optimism</option>
              <option value="base">Base</option>
            </select>
          </section>

          {/* Model Selector */}
          <ModelSelector
            value={model}
            onChange={setModel}
            disabled={analyzing}
            onNavigateToSettings={onNavigateToSettings}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6">
          {analyzing ? (
            <button
              onClick={cancel}
              className="neon-button flex-1 px-6 py-3 rounded-lg font-bold bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 shadow-neon-pink transition-all text-lg"
            >
              <span>🛑 {t('form.cancel')}</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                className={`neon-button flex-1 px-6 py-3 rounded-lg font-bold transition-all text-lg ${
                  canAnalyze
                    ? 'bg-gradient-to-r from-primary to-neon-purple hover:from-primary-light hover:to-neon-pink shadow-neon-purple hover:shadow-neon-pink hover:scale-[1.02]'
                    : 'bg-gray-700 cursor-not-allowed opacity-50'
                }`}
              >
                <span>{t('form.analyze')}</span>
              </button>
            </>
          )}
        </div>

        {/* Progress Display */}
        {(() => {
          console.log('[AnalysisSection] Checking progress display - analyzing:', analyzing);
          if (analyzing) {
            console.log('[AnalysisSection] -> Showing progress bar');
            return (
              <div className="space-y-3 mt-6">
                <div className="flex justify-between text-sm font-mono">
                  <span className="text-neon-cyan font-semibold">
                    {progress.step ? t(`progress.${progress.step}`) : t('form.analyzing')}
                  </span>
                  <span className="text-neon-green">{progress.progress}%</span>
                </div>
                <div className="w-full bg-cyber-darker rounded-full h-3 border border-purple-500/30 overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-300 relative"
                    style={{
                      width: `${progress.progress}%`,
                      background: 'linear-gradient(90deg, #8B5CF6, #BD00FF, #FF006E)',
                      boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-gradient-shift"></div>
                  </div>
                </div>
              </div>
            );
          }
          console.log('[AnalysisSection] -> No progress bar');
          return null;
        })()}
      </div>

      {/* Error Display */}
      {error && (
        <div className="cyber-card p-5 border-2 border-neon-pink/50 rounded-xl shadow-neon-pink animate-slide-in">
          <div>
            <p className="font-bold text-neon-pink text-lg mb-2">{t('error.title')}</p>
            <p className="text-gray-200">{error}</p>
          </div>
          {retryAfterMs > 0 && (
            <div className="text-sm text-neon-cyan mt-3 font-mono">
              ⏱️ {t('error.retryWait', { seconds: Math.ceil(retryAfterMs / 1000) })}
            </div>
          )}
          {errorSuggestions.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-neon-cyan mb-2">
                💡 {t('error.suggestions')}
              </p>
              <ul className="space-y-1 text-sm text-gray-300">
                {errorSuggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-neon-green mr-2">→</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Results Section */}
      <div>
        {(() => {
          console.log(
            '[AnalysisSection] Rendering results section - results:',
            !!results,
            'analyzing:',
            analyzing
          );
          if (results) {
            console.log('[AnalysisSection] -> Showing TopPickDisplay');
            return <TopPickDisplay data={results} />;
          } else if (analyzing) {
            console.log('[AnalysisSection] -> Showing LoadingSkeleton');
            return <LoadingSkeleton />;
          } else {
            console.log('[AnalysisSection] -> Showing empty state');
            return (
              <div className="gradient-border rounded-2xl p-12 text-center animate-fade-in scanline">
                <div className="mb-8 flex items-center justify-center">
                  <div className="relative w-24 h-24">
                    {/* Rotating outer ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-neon-purple border-r-neon-cyan animate-spin"></div>
                    {/* Inner hexagon */}
                    <div
                      className="absolute inset-4 bg-gradient-to-br from-primary/20 to-neon-purple/20 backdrop-blur-sm"
                      style={{
                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                      }}
                    >
                      <div
                        className="absolute inset-0 border-2 border-purple-500/50"
                        style={{
                          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                        }}
                      ></div>
                    </div>
                    {/* Center dot */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-neon-green animate-glow-pulse"></div>
                    </div>
                  </div>
                </div>
                <p className="text-lg font-mono text-neon-cyan mb-2">{t('empty.instructions')}</p>
                <p className="text-sm font-mono text-gray-400">{t('empty.thenAnalyze')}</p>
                <div className="mt-6 flex items-center justify-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-neon-green animate-glow-pulse"></div>
                  <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                    System Ready
                  </span>
                </div>
              </div>
            );
          }
        })()}
      </div>
    </div>
  );
}

/**
 * Settings Section Component
 */
interface SettingsSectionProps {
  language: Language;
  setLanguage: (lang: Language) => void;
}

function SettingsSection({ language, setLanguage }: SettingsSectionProps) {
  const { t } = useTranslation();
  const [savedKeys, setSavedKeys] = useState({ openrouter: false });
  const [openrouterInput, setOpenrouterInput] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [hasCustomPrompt, setHasCustomPrompt] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadSavedStatus();
    loadCustomPrompt();
  }, []);

  const loadSavedStatus = async () => {
    const data = await chrome.storage.local.get([STORAGE_KEYS.OPENROUTER_API_KEY]);
    setSavedKeys({
      openrouter: !!data[STORAGE_KEYS.OPENROUTER_API_KEY],
    });
  };

  const loadCustomPrompt = async () => {
    const data = await chrome.storage.local.get([STORAGE_KEYS.CUSTOM_PROMPT]);
    const stored = data[STORAGE_KEYS.CUSTOM_PROMPT] as string | undefined;
    if (stored) {
      setCustomPrompt(stored);
      setHasCustomPrompt(true);
    } else {
      setCustomPrompt('');
      setHasCustomPrompt(false);
    }
  };

  const handleSaveKeys = async () => {
    if (!openrouterInput.trim()) {
      setSaveMessage('⚠️ Please enter an API key');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    setSaving(true);
    setSaveMessage('');

    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.OPENROUTER_API_KEY]: openrouterInput.trim(),
      });

      await loadSavedStatus();
      setOpenrouterInput('');
      setSaveMessage('✅ API key saved successfully');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save API key:', error);
      setSaveMessage('❌ Failed to save');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrompt = async () => {
    setSaving(true);
    setSaveMessage('');

    try {
      if (customPrompt.trim()) {
        await chrome.storage.local.set({
          [STORAGE_KEYS.CUSTOM_PROMPT]: customPrompt.trim(),
        });
        setHasCustomPrompt(true);
        setSaveMessage('✅ Custom prompt saved successfully');
      } else {
        await chrome.storage.local.remove(STORAGE_KEYS.CUSTOM_PROMPT);
        setHasCustomPrompt(false);
        setSaveMessage('✅ Custom prompt removed');
      }
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save prompt:', error);
      setSaveMessage('❌ Failed to save prompt');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPrompt = async () => {
    if (!confirm('Reset to default prompt?')) {
      return;
    }

    try {
      await chrome.storage.local.remove(STORAGE_KEYS.CUSTOM_PROMPT);
      setCustomPrompt('');
      setHasCustomPrompt(false);
      setSaveMessage('✅ Prompt reset to default');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to reset prompt:', error);
      setSaveMessage('❌ Failed to reset prompt');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleFullReset = async () => {
    if (!confirm('This will delete all settings and data. Are you sure?')) {
      return;
    }

    try {
      await chrome.storage.local.clear();
      await chrome.storage.session.clear();
      setSavedKeys({ openrouter: false });
      setCustomPrompt('');
      setHasCustomPrompt(false);
      setSaveMessage('✅ All data has been deleted');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Failed to reset data:', error);
      setSaveMessage('❌ Failed to delete data');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 relative z-10">
      {/* Save Message */}
      {saveMessage && (
        <div className="cyber-card p-4 rounded-lg text-center border-2 border-neon-green/50 shadow-neon-green animate-slide-in">
          <p className="text-sm font-mono text-neon-green">{saveMessage}</p>
        </div>
      )}

      {/* Language Section */}
      <section className="cyber-card p-6 rounded-xl shadow-cyber-card">
        <h2 className="text-xl font-bold mb-4 neon-text">{t('options.language')}</h2>
        <select
          value={language}
          onChange={e => setLanguage(e.target.value as Language)}
          className="w-full px-4 py-3 bg-cyber-darker border-2 border-purple-500/30 rounded-lg focus:border-neon-purple focus:shadow-neon-purple focus:outline-none transition-all font-mono hover:border-purple-500/50"
        >
          <option value="en">🇺🇸 English</option>
          <option value="ja">🇯🇵 日本語</option>
        </select>
        <p className="text-xs text-neon-cyan mt-3 font-mono">
          ✓ Language preference is automatically saved
        </p>
      </section>

      {/* API Keys Section */}
      <section className="cyber-card p-6 rounded-xl shadow-cyber-card">
        <h2 className="text-xl font-bold mb-4 neon-text">API Configuration</h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-neon-cyan">
                {t('options.openrouterKey')}
              </label>
              {savedKeys.openrouter && (
                <span className="text-xs text-neon-green font-bold animate-glow-pulse">
                  ✓ Saved
                </span>
              )}
            </div>
            <input
              type="password"
              value={openrouterInput}
              onChange={e => setOpenrouterInput(e.target.value)}
              placeholder="sk-or-..."
              className="w-full px-4 py-3 bg-cyber-darker border-2 border-purple-500/30 rounded-lg focus:border-neon-purple focus:shadow-neon-purple focus:outline-none transition-all font-mono text-sm hover:border-purple-500/50"
            />
            <p className="text-xs text-gray-400 mt-2 font-mono">
              {t('options.openrouterKeyDesc')} - Get your key at{' '}
              <a
                href="https://openrouter.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neon-cyan hover:text-neon-purple hover:underline transition-colors"
              >
                openrouter.ai
              </a>
            </p>
          </div>

          <button
            onClick={handleSaveKeys}
            disabled={saving}
            className={`neon-button px-6 py-3 rounded-lg font-bold transition-all ${
              saving
                ? 'bg-gray-700 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-primary to-neon-purple hover:from-primary-light hover:to-neon-pink shadow-neon-purple hover:shadow-neon-pink'
            }`}
          >
            <span>{saving ? t('options.saving') : t('options.save')}</span>
          </button>
        </div>
      </section>

      {/* Custom Prompt Section */}
      <section className="cyber-card p-6 rounded-xl shadow-cyber-card">
        <h2 className="text-xl font-bold mb-4 neon-text">Analysis Prompt</h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-neon-cyan">
                Custom Prompt Template
              </label>
              {hasCustomPrompt && (
                <span className="text-xs text-neon-green font-bold animate-glow-pulse">
                  ✓ Using Custom Prompt
                </span>
              )}
            </div>
            <textarea
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              placeholder={DEFAULT_ANALYSIS_PROMPT}
              rows={12}
              className="w-full px-4 py-3 bg-cyber-darker border-2 border-purple-500/30 rounded-lg focus:border-neon-purple focus:shadow-neon-purple focus:outline-none font-mono text-sm hover:border-purple-500/50 transition-all resize-none"
            />
            <div className="mt-3 space-y-2">
              <p className="text-xs text-neon-cyan/80">
                Available variables:{' '}
                <code className="px-2 py-1 bg-cyber-darker border border-purple-500/30 rounded text-neon-pink font-bold">
                  {'{pairsData}'}
                </code>{' '}
                <code className="px-2 py-1 bg-cyber-darker border border-purple-500/30 rounded text-neon-pink font-bold">
                  {'{pairsCount}'}
                </code>{' '}
                <code className="px-2 py-1 bg-cyber-darker border border-purple-500/30 rounded text-neon-pink font-bold">
                  {'{chain}'}
                </code>
              </p>
              <p className="text-xs text-gray-500 font-mono">
                💡 Leave empty to use the default prompt template
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSavePrompt}
              disabled={saving}
              className={`neon-button px-6 py-3 rounded-lg font-bold transition-all ${
                saving
                  ? 'bg-gray-700 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-primary to-neon-purple hover:from-primary-light hover:to-neon-pink shadow-neon-purple hover:shadow-neon-pink'
              }`}
            >
              <span>{saving ? t('options.saving') : t('options.save')}</span>
            </button>
            {hasCustomPrompt && (
              <button
                onClick={handleResetPrompt}
                className="neon-button px-5 py-3 bg-gradient-to-r from-neon-cyan/20 to-neon-blue/20 hover:from-neon-cyan/30 hover:to-neon-blue/30 border-2 border-neon-cyan/30 hover:border-neon-cyan/50 text-neon-cyan rounded-lg font-bold transition-all"
              >
                🔄 Reset to Default
              </button>
            )}
          </div>

          {/* Show default prompt for reference */}
          {!hasCustomPrompt && (
            <details className="text-xs">
              <summary className="cursor-pointer text-neon-cyan/70 hover:text-neon-cyan font-mono transition-colors">
                📄 View default prompt template
              </summary>
              <pre className="mt-3 p-4 bg-cyber-darker border-2 border-purple-500/30 rounded-lg overflow-x-auto text-gray-400 font-mono text-xs">
                {DEFAULT_ANALYSIS_PROMPT}
              </pre>
            </details>
          )}
        </div>
      </section>

      {/* Data Management Section */}
      <section className="cyber-card p-6 rounded-xl shadow-cyber-card border-2 border-neon-pink/20">
        <h2 className="text-xl font-bold mb-4 neon-text">Data Management</h2>
        <div className="space-y-3">
          <div>
            <button
              onClick={handleFullReset}
              className="neon-button px-6 py-3 bg-gradient-to-r from-neon-pink/20 to-loss/20 hover:from-neon-pink/30 hover:to-loss/30 border-2 border-neon-pink/40 hover:border-neon-pink/60 text-neon-pink rounded-lg font-bold transition-all hover:scale-[1.02]"
            >
              Delete All Data
            </button>
            <p className="text-xs text-gray-500 mt-2 font-mono">
              <span className="text-neon-pink">WARNING:</span> Delete all settings including API
              keys (cannot be restored)
            </p>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="text-center text-sm pt-8 border-t border-purple-500/20">
        <div className="flex items-center justify-center space-x-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-neon-green animate-glow-pulse"></div>
          <p className="text-neon-cyan font-mono font-bold">DegenLens v1.0.0</p>
          <div className="w-1 h-1 rounded-full bg-purple-500"></div>
          <p className="text-gray-500 font-mono">MIT License</p>
        </div>
        <p className="text-xs text-gray-500 font-mono">
          <span className="text-neon-cyan">SECURE:</span> API keys are stored locally and never sent
          to external servers
        </p>
      </section>
    </div>
  );
}

export default App;
