// Model Selector Component
// Fetches and displays available OpenRouter models with pricing

import { useState, useEffect } from 'react';
import type { OpenRouterModel } from '@/types/openrouter';

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
}

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /**
   * Fetch models from background on mount
   */
  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setLoading(true);
    setError('');

    try {
      // Connect to background for model fetching
      const port = chrome.runtime.connect({ name: 'fetch-models' });
      const requestId = crypto.randomUUID();

      // Listen for response
      port.onMessage.addListener((message: any) => {
        if (message.id !== requestId) return;

        if (message.type === 'models-result') {
          if (message.error) {
            console.error('[ModelSelector] Failed to fetch models:', message.error);
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
    } catch (err) {
      console.error('[ModelSelector] Failed to fetch models:', err);
      setError('Failed to connect to background service');
      setModels([]);
      setLoading(false);
    }
  };

  /**
   * Format price for display (per 1M tokens)
   */
  const formatPrice = (pricePerToken: string): string => {
    const pricePerMillion = parseFloat(pricePerToken) * 1_000_000;
    return `$${pricePerMillion.toFixed(2)}`;
  };

  /**
   * Calculate estimated cost for analysis
   * Assumes ~1000 tokens per pair * maxPairs
   */
  const getEstimatedCost = (model: OpenRouterModel, maxPairs: number = 20): string => {
    const estimatedPromptTokens = 1000 * maxPairs;
    const estimatedCompletionTokens = 500; // Conservative estimate for analysis

    const promptCost = parseFloat(model.pricing.prompt) * estimatedPromptTokens;
    const completionCost = parseFloat(model.pricing.completion) * estimatedCompletionTokens;
    const totalCost = promptCost + completionCost;

    return totalCost < 0.01 ? '< $0.01' : `~$${totalCost.toFixed(2)}`;
  };

  const selectedModel = models.find(m => m.id === value);

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium">LLM Model</label>
        <div className="w-full px-3 py-2 bg-dark-lighter border border-gray-700 rounded text-gray-500">
          Loading models...
        </div>
      </div>
    );
  }

  if (error) {
    // Check if it's an API key error
    const isApiKeyError = error.includes('API key not found') || error.includes('not found');

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium">LLM Model</label>
        <div className="w-full px-3 py-2 bg-red-900/20 border border-red-500 rounded text-sm space-y-2">
          <p className="text-red-200">{error}</p>
          {isApiKeyError ? (
            <button
              onClick={() => chrome.runtime.openOptionsPage()}
              className="px-3 py-1.5 bg-primary hover:bg-primary-light rounded text-white text-xs font-medium transition-colors"
            >
              ⚙️ Go to Settings
            </button>
          ) : (
            <button
              onClick={fetchModels}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs font-medium transition-colors"
            >
              🔄 Retry
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
        <label className="block text-sm font-medium">LLM Model</label>
        <div className="w-full px-3 py-2 bg-yellow-900/20 border border-yellow-600 rounded text-sm space-y-2">
          <p className="text-yellow-200">⚠️ No models available</p>
          <p className="text-yellow-300 text-xs">
            Please configure your OpenRouter API key in settings to access AI models.
          </p>
          <button
            onClick={() => chrome.runtime.openOptionsPage()}
            className="px-3 py-1.5 bg-primary hover:bg-primary-light rounded text-white text-xs font-medium transition-colors"
          >
            ⚙️ Go to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">LLM Model</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 bg-dark-lighter border border-gray-700 rounded focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">Select a model...</option>
        {models.map(model => (
          <option key={model.id} value={model.id}>
            {model.name} - In: {formatPrice(model.pricing.prompt)}/1M | Out:{' '}
            {formatPrice(model.pricing.completion)}/1M
          </option>
        ))}
      </select>

      {/* Selected Model Info */}
      {selectedModel && (
        <div className="text-xs text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Context Length:</span>
            <span className="text-gray-300">
              {selectedModel.context_length.toLocaleString()} tokens
            </span>
          </div>
          <div className="flex justify-between">
            <span>Estimated Cost (20 pairs):</span>
            <span className="text-primary font-medium">{getEstimatedCost(selectedModel)}</span>
          </div>
        </div>
      )}

      {!value && <p className="text-xs text-gray-500">Please select a model to continue</p>}
    </div>
  );
}
