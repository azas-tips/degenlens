// Unified Model List API
// Fetches available models from OpenRouter and/or Gemini Nano

import { fetchModels as fetchOpenRouterModels } from './openrouter';
import { getGeminiNanoCapabilities } from './gemini-nano';
import { GEMINI_NANO_MODEL_ID } from '@/types/gemini-nano';
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
 * Fetch all available models
 * - If OpenRouter API key is set: Returns OpenRouter models + Gemini Nano (if available)
 * - If OpenRouter API key is not set: Returns only Gemini Nano (if available)
 *
 * @returns Array of available models
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
      // Continue to check Gemini Nano even if OpenRouter fails
    }
  } else {
    console.log('[Models API] OpenRouter API key not set, skipping OpenRouter models');
  }

  // Check Gemini Nano availability
  try {
    console.log('[Models API] Checking Gemini Nano availability');
    const capabilities = await getGeminiNanoCapabilities();

    if (capabilities && capabilities.available !== 'no') {
      const geminiNanoModel: AvailableModel = {
        id: GEMINI_NANO_MODEL_ID,
        name: 'Gemini Nano (Built-in, Free)',
        context_length: 4096, // Estimated - actual value may vary
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

      models.push(geminiNanoModel);
      console.log('[Models API] Gemini Nano is available:', capabilities.available);
    } else {
      console.log('[Models API] Gemini Nano is not available on this device');
    }
  } catch (error) {
    console.error('[Models API] Failed to check Gemini Nano availability:', error);
  }

  console.log(`[Models API] Total available models: ${models.length}`);
  return models;
}
