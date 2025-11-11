import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '@/types/storage';
import { useTranslation, type Language } from '@/i18n';

function Options() {
  const { language, setLanguage, t } = useTranslation();

  // API key saved status
  const [savedKeys, setSavedKeys] = useState({
    dex: false,
    openrouter: false,
  });

  // Input fields (always displayed empty)
  const [dexInput, setDexInput] = useState('');
  const [openrouterInput, setOpenrouterInput] = useState('');

  // Saving in progress flag
  const [saving, setSaving] = useState(false);

  // Save success message
  const [saveMessage, setSaveMessage] = useState('');

  // On startup: Check saved status only
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

  // Save API keys
  const handleSaveKeys = async () => {
    if (!dexInput.trim() && !openrouterInput.trim()) {
      setSaveMessage('⚠️ Please enter an API key');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    setSaving(true);
    setSaveMessage('');

    try {
      const updates: Record<string, string> = {};

      // Only update if there is new input
      if (dexInput.trim()) {
        updates[STORAGE_KEYS.DEX_API_KEY] = dexInput.trim();
      }

      if (openrouterInput.trim()) {
        updates[STORAGE_KEYS.OPENROUTER_API_KEY] = openrouterInput.trim();
      }

      await chrome.storage.local.set(updates);

      // Update saved status
      await loadSavedStatus();

      // Clear input fields
      setDexInput('');
      setOpenrouterInput('');

      setSaveMessage('✅ API keys saved successfully');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save API keys:', error);
      setSaveMessage('❌ Failed to save');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Clear cache
  const handleClearCache = async () => {
    try {
      await chrome.storage.session.clear();
      setSaveMessage('✅ Cache cleared successfully');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      setSaveMessage('❌ Failed to clear cache');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  // Full data reset
  const handleFullReset = async () => {
    if (!confirm('This will delete all settings and data. Are you sure?')) {
      return;
    }

    try {
      await chrome.storage.local.clear();
      await chrome.storage.session.clear();

      // Initialize (automatically executed by migration)
      setSavedKeys({ dex: false, openrouter: false });
      setSaveMessage('✅ All data has been deleted');

      // Reload to ensure initialization
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Failed to reset data:', error);
      setSaveMessage('❌ Failed to delete data');
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

        {/* Save message */}
        {saveMessage && (
          <div className="mb-6 p-4 bg-dark-lighter rounded-lg text-center">
            <p className="text-sm">{saveMessage}</p>
          </div>
        )}

        <main className="space-y-8">
          {/* Language section */}
          <section className="bg-dark-lighter p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">{t('options.language')}</h2>
            <div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full px-4 py-2 bg-dark border border-gray-700 rounded focus:border-primary focus:outline-none"
              >
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Language preference is automatically saved
              </p>
            </div>
          </section>

          {/* API Keys section */}
          <section className="bg-dark-lighter p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">{t('options.title')}</h2>
            <div className="space-y-4">
              {/* DEXscreener API Key */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">{t('options.dexKey')}</label>
                  {savedKeys.dex && (
                    <span className="text-xs text-profit font-medium">✓ Saved</span>
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
                  {t('options.dexKeyDesc')} - Get your key at{' '}
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
                  <label className="block text-sm font-medium">{t('options.openrouterKey')}</label>
                  {savedKeys.openrouter && (
                    <span className="text-xs text-profit font-medium">✓ Saved</span>
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
                  {t('options.openrouterKeyDesc')} - Get your key at{' '}
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
                  saving ? 'bg-gray-600 cursor-not-allowed' : 'bg-primary hover:bg-primary-light'
                }`}
              >
                {saving ? t('options.saving') : t('options.save')}
              </button>
            </div>
          </section>

          {/* Data Management section */}
          <section className="bg-dark-lighter p-6 rounded-lg border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">Data Management</h2>
            <div className="space-y-3">
              <div>
                <button
                  onClick={handleClearCache}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  ⚡ Clear Cache
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Clear API response cache to fetch fresh data
                </p>
              </div>

              <div className="pt-3 border-t border-gray-800">
                <button
                  onClick={handleFullReset}
                  className="px-4 py-2 bg-loss hover:bg-red-600 text-white rounded transition-colors"
                >
                  🗑️ Delete All Data
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Delete all settings including API keys (cannot be restored)
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
