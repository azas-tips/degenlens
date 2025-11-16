// Model Selector Component
// Fetches and displays available models (OpenRouter + Gemini Nano)

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from '@/i18n';
import type { AvailableModel } from '@/api/models';
import { getGeminiNanoCapabilities } from '@/api/gemini-nano';
import type { GeminiNanoCapabilities } from '@/types/gemini-nano';
import { GEMINI_NANO_MODEL_ID } from '@/types/gemini-nano';

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
  onNavigateToSettings: () => void;
  maxPairs?: number;
  layoutMode?: 'single-column' | 'two-column';
}

/**
 * Extract provider name from model ID
 * Example: "anthropic/claude-3.5-sonnet" → "Anthropic"
 */
function extractProvider(modelId: string): string {
  const providerMap: Record<string, string> = {
    anthropic: 'Anthropic',
    openai: 'OpenAI',
    google: 'Google',
    meta: 'Meta',
    'meta-llama': 'Meta',
    mistralai: 'Mistral',
    cohere: 'Cohere',
    'x-ai': 'xAI',
    deepseek: 'DeepSeek',
    qwen: 'Qwen',
    perplexity: 'Perplexity',
    nvidia: 'NVIDIA',
    microsoft: 'Microsoft',
  };

  const prefix = modelId.split('/')[0]?.toLowerCase() || '';
  return providerMap[prefix] || 'Other';
}

/**
 * Get unique providers from models list
 */
function getUniqueProviders(models: AvailableModel[]): string[] {
  const providers = new Set(models.map(m => (m.isBuiltIn ? 'Built-in' : extractProvider(m.id))));
  return Array.from(providers).sort();
}

export function ModelSelector({
  value,
  onChange,
  disabled,
  onNavigateToSettings,
  maxPairs,
  layoutMode = 'single-column',
}: ModelSelectorProps) {
  const { t } = useTranslation();
  const [models, setModels] = useState<AvailableModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [favoriteModels, setFavoriteModels] = useState<string[]>([]);
  const [geminiNanoCapabilities, setGeminiNanoCapabilities] =
    useState<GeminiNanoCapabilities | null>(null);

  const fetchModels = useCallback(async () => {
    try {
      // Connect to background for model fetching
      const port = chrome.runtime.connect({ name: 'fetch-models' });
      const requestId = crypto.randomUUID();

      // Listen for response
      interface ModelsResultMessage {
        id: string;
        type: string;
        error?: string;
        data?: AvailableModel[];
      }

      port.onMessage.addListener(async (message: ModelsResultMessage) => {
        if (message.id !== requestId) return;

        if (message.type === 'models-result') {
          let allModels: AvailableModel[] = [];

          if (message.error) {
            console.error('[ModelSelector] Error fetching models:', message.error);
            setError(message.error);
          } else {
            console.log('[ModelSelector] Received OpenRouter models:', message.data?.length || 0);
            allModels = message.data || [];
          }

          // Check Gemini Nano availability on UI side (Service Worker doesn't have window.ai)
          try {
            const capabilities = await getGeminiNanoCapabilities();
            if (capabilities.available !== 'no') {
              const geminiNanoModel: AvailableModel = {
                id: GEMINI_NANO_MODEL_ID,
                name: 'Gemini Nano (Built-in, Free)',
                context_length: 4096,
                pricing: {
                  prompt: '0',
                  completion: '0',
                },
                isBuiltIn: true,
                description:
                  'Chrome built-in AI model. Runs locally on your device. No API key required. ' +
                  (capabilities.available === 'after-download'
                    ? 'Model needs to be downloaded first.'
                    : 'Ready to use.'),
              };
              allModels.push(geminiNanoModel);
              console.log('[ModelSelector] Added Gemini Nano to models list');
            }
          } catch (error) {
            console.error('[ModelSelector] Failed to check Gemini Nano:', error);
          }

          setModels(allModels);
          setLoading(false);
          port.disconnect();
        }
      });

      // Send request
      port.postMessage({
        type: 'fetch-models',
        id: requestId,
      });
    } catch {
      setError('Failed to connect to background service');
      setModels([]);
      setLoading(false);
    }
  }, []);

  const checkAndFetchModels = useCallback(async () => {
    setLoading(true);
    setError('');

    // Always fetch models (fetchAvailableModels handles API key logic)
    // If no OpenRouter API key: returns only Gemini Nano (if available)
    // If OpenRouter API key exists: returns OpenRouter models + Gemini Nano
    fetchModels();
  }, [fetchModels]);

  /**
   * Check if API key exists and fetch models
   */
  useEffect(() => {
    checkAndFetchModels();
  }, [checkAndFetchModels]);

  /**
   * Load favorite models from storage
   */
  useEffect(() => {
    chrome.storage.local.get(['favoriteModels'], result => {
      if (result.favoriteModels && Array.isArray(result.favoriteModels)) {
        setFavoriteModels(result.favoriteModels);
      }
    });
  }, []);

  /**
   * Check Gemini Nano capabilities when selected
   */
  useEffect(() => {
    if (value === GEMINI_NANO_MODEL_ID) {
      getGeminiNanoCapabilities().then(capabilities => {
        setGeminiNanoCapabilities(capabilities);
      });
    } else {
      setGeminiNanoCapabilities(null);
    }
  }, [value]);

  /**
   * Toggle favorite status of a model
   */
  const toggleFavorite = (modelId: string) => {
    setFavoriteModels(prev => {
      const newFavorites = prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId];

      // Save to storage
      chrome.storage.local.set({ favoriteModels: newFavorites });

      return newFavorites;
    });
  };

  /**
   * Format price for display (per 1M tokens)
   */
  const formatPrice = (pricePerToken: string): string => {
    const pricePerMillion = parseFloat(pricePerToken) * 1_000_000;
    return `$${pricePerMillion.toFixed(2)}`;
  };

  /**
   * Calculate estimated prompt tokens based on pair count
   * Conservative estimate with safety margin (~15% buffer over actual usage)
   * Actual usage: ~280 prompt tokens per pair
   * Estimated with buffer: 300 prompt tokens per pair
   */
  const calculateEstimatedPromptTokens = (pairCount: number): number => {
    return 300 * pairCount;
  };

  /**
   * Calculate estimated cost for analysis
   * Conservative estimate with safety margin (~15% buffer over actual usage)
   * Actual usage: ~280 prompt + ~500 completion tokens per pair
   * Estimated with buffer: 300 prompt + 600 completion tokens per pair
   */
  const getEstimatedCost = (model: AvailableModel, pairCount: number = 20): string => {
    // Gemini Nano is free
    if (model.isBuiltIn) {
      return 'Free';
    }

    // Conservative estimates with safety margin
    // Prompt tokens include: system prompt + pair data formatting
    const estimatedPromptTokens = calculateEstimatedPromptTokens(pairCount);
    // Completion tokens include: LLM analysis output
    const estimatedCompletionTokens = 600 * pairCount;

    // Calculate cost separately for prompt and completion (different pricing)
    const promptCost = parseFloat(model.pricing?.prompt || '0') * estimatedPromptTokens;
    const completionCost = parseFloat(model.pricing?.completion || '0') * estimatedCompletionTokens;
    const totalCost = promptCost + completionCost;

    return totalCost < 0.01 ? '< $0.01' : `~$${totalCost.toFixed(2)}`;
  };

  /**
   * Get available providers
   */
  const availableProviders = useMemo(() => getUniqueProviders(models), [models]);

  /**
   * Toggle provider selection
   */
  const toggleProvider = (provider: string) => {
    setSelectedProviders(prev =>
      prev.includes(provider) ? prev.filter(p => p !== provider) : [...prev, provider]
    );
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedProviders([]);
  };

  /**
   * Filter models based on search query, selected providers, and max input tokens
   */
  const filteredModels = useMemo(() => {
    let filtered = models;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        model => model.name.toLowerCase().includes(query) || model.id.toLowerCase().includes(query)
      );
    }

    // Filter by selected providers
    if (selectedProviders.length > 0) {
      filtered = filtered.filter(model =>
        selectedProviders.includes(model.isBuiltIn ? 'Built-in' : extractProvider(model.id))
      );
    }

    // Filter by max input tokens (based on pair count)
    if (maxPairs && maxPairs > 0) {
      const requiredTokens = calculateEstimatedPromptTokens(maxPairs);
      filtered = filtered.filter(model => {
        const contextLength = model.context_length || 4096;
        const maxCompletionTokens = model.top_provider?.max_completion_tokens || 8192;
        const maxInputTokens = contextLength - maxCompletionTokens;
        return maxInputTokens >= requiredTokens;
      });
    }

    return filtered;
  }, [models, searchQuery, selectedProviders, maxPairs]);

  const selectedModel = models.find(m => m.id === value);

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neon-cyan">LLM Model</label>
        <div className="w-full px-4 py-3 bg-cyber-darker border-2 border-purple-500/30 rounded-lg text-neon-cyan font-mono animate-pulse">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-neon-purple animate-glow-pulse"></div>
            <span>Loading models...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    // Check if it's an API key error
    const isApiKeyError = error.includes('API key not found') || error.includes('not found');

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neon-cyan">LLM Model</label>
        <div className="w-full px-4 py-3 bg-neon-pink/10 border-2 border-neon-pink/50 rounded-lg text-sm space-y-3 shadow-neon-pink">
          <p className="text-neon-pink font-mono font-bold flex items-center space-x-2">
            <span>⚠️</span>
            <span>{error}</span>
          </p>
          {isApiKeyError ? (
            <button
              onClick={onNavigateToSettings}
              className="neon-button px-4 py-2 bg-gradient-to-r from-primary to-neon-purple hover:from-primary-light hover:to-neon-pink rounded-lg font-bold text-sm transition-all shadow-neon-purple hover:shadow-neon-pink"
            >
              Go to Settings
            </button>
          ) : (
            <button
              onClick={fetchModels}
              className="neon-button px-4 py-2 bg-gradient-to-r from-neon-cyan/20 to-neon-blue/20 hover:from-neon-cyan/30 hover:to-neon-blue/30 border-2 border-neon-cyan/30 hover:border-neon-cyan/50 text-neon-cyan rounded-lg font-bold text-sm transition-all"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // No models available
  if (models.length === 0) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neon-cyan">LLM Model</label>
        <div className="w-full px-4 py-3 bg-neon-cyan/10 border-2 border-neon-cyan/50 rounded-lg text-sm space-y-3 shadow-neon-cyan">
          <p className="text-neon-cyan font-mono font-bold">⚠️ No models available</p>
          <p className="text-neon-cyan/70 text-xs font-mono">
            Please configure your OpenRouter API key in settings to access AI models.
          </p>
          <button
            onClick={onNavigateToSettings}
            className="neon-button px-4 py-2 bg-gradient-to-r from-primary to-neon-purple hover:from-primary-light hover:to-neon-pink rounded-lg font-bold text-sm transition-all shadow-neon-purple hover:shadow-neon-pink"
          >
            ⚙️ Go to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-neon-cyan">LLM Model</label>

      {/* Search Input */}
      <input
        type="text"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="🔍 Search models..."
        disabled={disabled}
        className="w-full px-4 py-3 bg-cyber-darker border-2 border-purple-500/30 rounded-lg focus:border-neon-purple focus:shadow-neon-purple focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-base font-mono hover:border-purple-500/50 transition-all"
      />

      {/* Provider Filters */}
      {availableProviders.length > 0 && (
        <div className="bg-cyber-darker/50 border border-purple-500/20 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-gray-400">
              Providers:{' '}
              {selectedProviders.length > 0 ? (
                <span className="text-neon-cyan font-bold">
                  {selectedProviders.length} selected
                </span>
              ) : (
                <span className="text-gray-500">All</span>
              )}
            </span>
            {(searchQuery || selectedProviders.length > 0) && (
              <button
                onClick={clearFilters}
                className="text-xs text-neon-pink hover:text-neon-pink/80 font-mono transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {availableProviders.map(provider => (
              <label
                key={provider}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono cursor-pointer transition-all ${
                  selectedProviders.includes(provider)
                    ? 'bg-neon-purple/20 border-2 border-neon-purple/50 text-neon-cyan shadow-neon-purple/30'
                    : 'bg-cyber-darker border border-purple-500/30 text-gray-400 hover:border-purple-500/50'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedProviders.includes(provider)}
                  onChange={() => !disabled && toggleProvider(provider)}
                  disabled={disabled}
                  className="sr-only"
                />
                <span className={selectedProviders.includes(provider) ? 'font-bold' : ''}>
                  {provider}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Available Models Count */}
      {maxPairs && maxPairs > 0 && (
        <div className="text-xs text-gray-400 font-mono">
          <span className="text-neon-cyan font-bold">{filteredModels.length}</span> /{' '}
          {models.length} models available for {maxPairs} pair
          {maxPairs !== 1 ? 's' : ''}
          {filteredModels.length < models.length && (
            <span className="text-yellow-500 ml-2">
              ({models.length - filteredModels.length} filtered due to token limits)
            </span>
          )}
        </div>
      )}

      {/* Model Select */}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-4 py-3 bg-cyber-darker border-2 border-purple-500/30 rounded-lg focus:border-neon-purple focus:shadow-neon-purple focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-mono hover:border-purple-500/50 transition-all ${
          layoutMode === 'two-column' ? 'text-xs' : 'text-base'
        }`}
        size={Math.min(filteredModels.length + 1, 6)}
      >
        <option value="">Select a model...</option>

        {/* Favorites Section */}
        {filteredModels.filter(m => favoriteModels.includes(m.id)).length > 0 && (
          <optgroup label={t('form.favorites')}>
            {filteredModels
              .filter(m => favoriteModels.includes(m.id))
              .map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                  {model.isBuiltIn
                    ? ' - Free (Built-in)'
                    : ` - In: ${formatPrice(model.pricing?.prompt || '0')}/1M | Out: ${formatPrice(model.pricing?.completion || '0')}/1M`}
                </option>
              ))}
          </optgroup>
        )}

        {/* Other Models Section */}
        {filteredModels.filter(m => !favoriteModels.includes(m.id)).length > 0 && (
          <optgroup label={t('form.otherModels')}>
            {filteredModels
              .filter(m => !favoriteModels.includes(m.id))
              .map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                  {model.isBuiltIn
                    ? ' - Free (Built-in)'
                    : ` - In: ${formatPrice(model.pricing?.prompt || '0')}/1M | Out: ${formatPrice(model.pricing?.completion || '0')}/1M`}
                </option>
              ))}
          </optgroup>
        )}
      </select>

      {/* Show filtered count */}
      {searchQuery && (
        <p className="text-xs text-neon-cyan/70 font-mono">
          {filteredModels.length} of {models.length} models shown
        </p>
      )}

      {/* Selected Model Info */}
      {selectedModel && (
        <div className="text-sm font-mono space-y-2 bg-cyber-darker/50 border border-purple-500/20 rounded-lg p-4">
          {/* Selected Model Name */}
          <div className="pb-2 border-b border-purple-500/20">
            <div className="text-xs text-gray-400 mb-1">Selected Model:</div>
            <div className="text-neon-cyan font-bold break-words">{selectedModel.name}</div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">{t('form.maxInputTokens')}:</span>
            <span className="text-neon-cyan font-bold">
              {(
                (selectedModel.context_length || 4096) -
                (selectedModel.top_provider?.max_completion_tokens || 8192)
              ).toLocaleString()}{' '}
              tokens
            </span>
          </div>

          {/* Gemini Nano specific info */}
          {selectedModel.isBuiltIn && geminiNanoCapabilities && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status:</span>
                <span
                  className={`font-bold ${
                    geminiNanoCapabilities.available === 'readily'
                      ? 'text-neon-green'
                      : geminiNanoCapabilities.available === 'after-download'
                        ? 'text-yellow-500'
                        : 'text-neon-pink'
                  }`}
                >
                  {geminiNanoCapabilities.available === 'readily'
                    ? '✓ Ready'
                    : geminiNanoCapabilities.available === 'after-download'
                      ? '⬇ Download Required'
                      : '✗ Not Available'}
                </span>
              </div>

              {/* System Requirements Info */}
              <div className="pt-2 border-t border-purple-500/20">
                <div className="text-xs text-gray-400 mb-2">System Requirements:</div>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• Chrome 127+ required</li>
                  <li>• RAM: 8GB minimum (12GB+ recommended)</li>
                  <li>• Storage: 4GB minimum (10GB+ recommended)</li>
                  <li>• 64-bit processor required</li>
                  <li>• GPU: Integrated GPU minimum (Dedicated GPU recommended)</li>
                </ul>
              </div>

              {geminiNanoCapabilities.available === 'after-download' && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-xs text-yellow-500 font-mono">
                    ⚠️ Model needs to be downloaded first. This may take some time depending on your
                    connection.
                  </p>
                </div>
              )}

              {geminiNanoCapabilities.available === 'no' && (
                <div className="p-3 bg-neon-pink/10 border border-neon-pink/30 rounded-lg space-y-2">
                  <p className="text-xs text-neon-pink font-mono font-bold">
                    ⚠️ Gemini Nano is not available on this browser
                  </p>
                  <p className="text-xs text-gray-300">
                    Gemini Nano requires Chrome 127+ and may not be available in all regions or
                    device configurations. Please use an OpenRouter model instead, or update your
                    browser to the latest version.
                  </p>
                </div>
              )}
            </>
          )}

          <div className="flex justify-between items-center">
            <span className="text-gray-400">
              {t('form.estimatedCost', { count: maxPairs || 20 })}:
            </span>
            <span className="text-neon-green font-bold">
              {getEstimatedCost(selectedModel, maxPairs || 20)}
            </span>
          </div>
          <div className="pt-2 border-t border-purple-500/20">
            <button
              onClick={() => toggleFavorite(selectedModel.id)}
              className="w-full px-3 py-2 bg-cyber-darker border border-neon-cyan/30 hover:border-neon-cyan/50 text-neon-cyan rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2"
              title={
                favoriteModels.includes(selectedModel.id)
                  ? t('form.removeFromFavorites')
                  : t('form.addToFavorites')
              }
            >
              <span className="text-lg">
                {favoriteModels.includes(selectedModel.id) ? '⭐' : '☆'}
              </span>
              <span>
                {favoriteModels.includes(selectedModel.id)
                  ? t('form.removeFromFavorites')
                  : t('form.addToFavorites')}
              </span>
            </button>
          </div>
        </div>
      )}

      {!value && (
        <p className="text-xs text-gray-500 font-mono flex items-center space-x-2">
          <span className="text-neon-cyan">💡</span>
          <span>Please select a model to continue</span>
        </p>
      )}
    </div>
  );
}
