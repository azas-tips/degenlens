// Unified Model List API
// Fetches available models from OpenRouter
// Note: Gemini Nano is checked on UI side (ModelSelector) because Service Workers don't have window.ai access

import { fetchModels as fetchOpenRouterModels } from './openrouter';
import { STORAGE_KEYS } from '@/types/storage';
import type { OpenRouterModel } from '@/types/openrouter';

/**
 * Extended model type that includes Gemini Nano
 */
export interface AvailableModel extends Partial<OpenRouterModel> {
  id: string;
  name: string;
  context_length?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
  isBuiltIn?: boolean; // True for Gemini Nano
}

/**
 * Fetch available OpenRouter models
 * Note: Gemini Nano is handled on UI side (ModelSelector component)
 *
 * @returns Array of available models (OpenRouter only)
 */
export async function fetchAvailableModels(): Promise<AvailableModel[]> {
  const models: AvailableModel[] = [];

  // Check if OpenRouter API key is configured
  const storage = await chrome.storage.local.get(STORAGE_KEYS.OPENROUTER_API_KEY);
  const apiKey = storage[STORAGE_KEYS.OPENROUTER_API_KEY] as string | undefined;
  const hasOpenRouterKey = !!apiKey && apiKey.length > 0;

  // Fetch OpenRouter models if API key is set
  if (hasOpenRouterKey) {
    try {
      console.log('[Models API] Fetching OpenRouter models');
      const openRouterModels = await fetchOpenRouterModels();
      models.push(...openRouterModels);
      console.log(`[Models API] Fetched ${openRouterModels.length} OpenRouter models`);
    } catch (error) {
      console.error('[Models API] Failed to fetch OpenRouter models:', error);
    }
  } else {
    console.log('[Models API] OpenRouter API key not set, skipping OpenRouter models');
  }

  console.log(`[Models API] Total available models: ${models.length}`);
  return models;
}
