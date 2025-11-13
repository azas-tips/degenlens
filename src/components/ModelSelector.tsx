// Model Selector Component
// Fetches and displays available OpenRouter models with pricing

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { OpenRouterModel } from '@/types/openrouter';

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
  onNavigateToSettings: () => void;
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
function getUniqueProviders(models: OpenRouterModel[]): string[] {
  const providers = new Set(models.map(m => extractProvider(m.id)));
  return Array.from(providers).sort();
}

export function ModelSelector({
  value,
  onChange,
  disabled,
  onNavigateToSettings,
}: ModelSelectorProps) {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);

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
        data?: OpenRouterModel[];
      }

      port.onMessage.addListener((message: ModelsResultMessage) => {
        if (message.id !== requestId) return;

        if (message.type === 'models-result') {
          if (message.error) {
            // Silent error handling - don't log to console
            setError(message.error);
            setModels([]);
          } else {
            setModels(message.data || []);
          }
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

    // Check if API key exists first
    const storage = await chrome.storage.local.get('openrouter_api_key');
    if (!storage.openrouter_api_key) {
      setLoading(false);
      setError('API key not found');
      setModels([]);
      return;
    }

    fetchModels();
  }, [fetchModels]);

  /**
   * Check if API key exists and fetch models
   */
  useEffect(() => {
    checkAndFetchModels();
  }, [checkAndFetchModels]);

  /**
   * Format price for display (per 1M tokens)
   */
  const formatPrice = (pricePerToken: string): string => {
    const pricePerMillion = parseFloat(pricePerToken) * 1_000_000;
    return `$${pricePerMillion.toFixed(2)}`;
  };

  /**
   * Calculate estimated cost for analysis
   * Conservative estimate with safety margin (~15% buffer over actual usage)
   * Actual usage: ~280 prompt + ~500 completion tokens per pair
   * Estimated with buffer: 300 prompt + 600 completion tokens per pair
   */
  const getEstimatedCost = (model: OpenRouterModel): string => {
    const maxPairs = 20; // Fixed: analyze top 20 pairs

    // Conservative estimates with safety margin
    // Prompt tokens include: system prompt + pair data formatting
    const estimatedPromptTokens = 300 * maxPairs; // 6,000 tokens (actual: ~5,600)
    // Completion tokens include: LLM analysis output
    const estimatedCompletionTokens = 600 * maxPairs; // 12,000 tokens (actual: ~10,000)

    // Calculate cost separately for prompt and completion (different pricing)
    const promptCost = parseFloat(model.pricing.prompt) * estimatedPromptTokens;
    const completionCost = parseFloat(model.pricing.completion) * estimatedCompletionTokens;
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
   * Filter models based on search query and selected providers
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
      filtered = filtered.filter(model => selectedProviders.includes(extractProvider(model.id)));
    }

    return filtered;
  }, [models, searchQuery, selectedProviders]);

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

      {/* Model Select */}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-3 bg-cyber-darker border-2 border-purple-500/30 rounded-lg focus:border-neon-purple focus:shadow-neon-purple focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-mono text-base hover:border-purple-500/50 transition-all"
        size={Math.min(filteredModels.length + 1, 6)}
      >
        <option value="">Select a model...</option>
        {filteredModels.map(model => (
          <option key={model.id} value={model.id}>
            {model.name} - In: {formatPrice(model.pricing.prompt)}/1M | Out:{' '}
            {formatPrice(model.pricing.completion)}/1M
          </option>
        ))}
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
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Context Length:</span>
            <span className="text-neon-cyan font-bold">
              {selectedModel.context_length.toLocaleString()} tokens
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Estimated Cost (20 pairs):</span>
            <span className="text-neon-green font-bold">{getEstimatedCost(selectedModel)}</span>
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
