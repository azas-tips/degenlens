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
    const maxPairs = 10; // Fixed: analyze top 10 pairs

    // Conservative estimates with safety margin
    // Prompt tokens include: system prompt + pair data formatting
    const estimatedPromptTokens = 300 * maxPairs; // 3,000 tokens (actual: ~2,800)
    // Completion tokens include: LLM analysis output
    const estimatedCompletionTokens = 600 * maxPairs; // 6,000 tokens (actual: ~5,000)

    // Calculate cost separately for prompt and completion (different pricing)
    const promptCost = parseFloat(model.pricing.prompt) * estimatedPromptTokens;
    const completionCost = parseFloat(model.pricing.completion) * estimatedCompletionTokens;
    const totalCost = promptCost + completionCost;

    return totalCost < 0.01 ? '< $0.01' : `~$${totalCost.toFixed(2)}`;
  };

  /**
   * Filter models based on search query
   */
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return models;

    const query = searchQuery.toLowerCase();
    return models.filter(
      model => model.name.toLowerCase().includes(query) || model.id.toLowerCase().includes(query)
    );
  }, [models, searchQuery]);

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
            <span className="text-gray-400">Estimated Cost (10 pairs):</span>
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
