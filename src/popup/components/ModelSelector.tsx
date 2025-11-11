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
   * TODO: Implement fetch-models message to background
   */
  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setLoading(true);
    setError('');

    try {
      // TODO: Implement Port communication to fetch models from background
      // For now, use mock data
      const mockModels: OpenRouterModel[] = [
        {
          id: 'anthropic/claude-3.5-sonnet',
          name: 'Claude 3.5 Sonnet',
          context_length: 200000,
          created: Date.now() / 1000,
          pricing: {
            prompt: '0.000003',
            completion: '0.000015',
          },
        },
        {
          id: 'anthropic/claude-3-haiku',
          name: 'Claude 3 Haiku',
          context_length: 200000,
          created: Date.now() / 1000,
          pricing: {
            prompt: '0.00000025',
            completion: '0.00000125',
          },
        },
        {
          id: 'openai/gpt-4-turbo',
          name: 'GPT-4 Turbo',
          context_length: 128000,
          created: Date.now() / 1000,
          pricing: {
            prompt: '0.00001',
            completion: '0.00003',
          },
        },
        {
          id: 'openai/gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          context_length: 16385,
          created: Date.now() / 1000,
          pricing: {
            prompt: '0.0000005',
            completion: '0.0000015',
          },
        },
      ];

      setModels(mockModels);
      setLoading(false);
    } catch (err) {
      console.error('[ModelSelector] Failed to fetch models:', err);
      setError('Failed to load models');
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
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium">LLM Model</label>
        <div className="w-full px-3 py-2 bg-red-900/20 border border-red-500 rounded text-red-200 text-sm">
          {error}
          <button onClick={fetchModels} className="ml-2 underline hover:no-underline">
            Retry
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
