// OpenRouter API Client
// Handles all OpenRouter API requests with rate limiting

import ky from 'ky';
import type {
  OpenRouterChatRequest,
  OpenRouterChatResponse,
  OpenRouterModel,
  OpenRouterModelsResponse,
} from '@/types/openrouter';
import { llmLimiter } from '@/background/utils/rate-limiter';
import { cacheManager, getModelsCacheKey } from '@/background/utils/cache';
import { STORAGE_KEYS } from '@/types/storage';

const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';

/**
 * Create OpenRouter API client
 * Requires API key from storage
 */
async function createOpenRouterClient() {
  // Get API key from storage
  const storage = await chrome.storage.local.get(STORAGE_KEYS.OPENROUTER_API_KEY);
  const apiKey = storage[STORAGE_KEYS.OPENROUTER_API_KEY] as string | undefined;

  if (!apiKey) {
    throw new Error('OpenRouter API key not found. Please configure in settings.');
  }

  return ky.create({
    prefixUrl: OPENROUTER_API_BASE,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://github.com/yourusername/degenlens', // TODO: Update with actual repo URL
      'X-Title': 'DegenLens',
    },
    timeout: 60000, // 60 seconds (LLM calls can be slow)
  });
}

/**
 * Fetch available models
 * Uses cache to avoid excessive API calls
 *
 * @returns Array of available models
 */
export async function fetchModels(): Promise<OpenRouterModel[]> {
  const cacheKey = getModelsCacheKey();

  return llmLimiter.execute(async () => {
    return cacheManager.getOrFetch(cacheKey, async () => {
      console.log('[OpenRouter API] Fetching models list');

      const client = await createOpenRouterClient();

      const response = await client.get('models').json<OpenRouterModelsResponse>();

      return response.data;
    });
  });
}

/**
 * Send chat completion request
 * Uses rate limiting but NOT caching (each analysis should be fresh)
 *
 * @param request - Chat completion request
 * @returns Chat completion response
 */
export async function chatCompletion(
  request: OpenRouterChatRequest
): Promise<OpenRouterChatResponse> {
  return llmLimiter.execute(async () => {
    console.log(`[OpenRouter API] Chat completion with model: ${request.model}`);

    const client = await createOpenRouterClient();

    // Always include usage tracking
    const requestWithUsage: OpenRouterChatRequest = {
      ...request,
      usage: {
        include: true,
      },
    };

    const response = await client
      .post('chat/completions', {
        json: requestWithUsage,
      })
      .json<OpenRouterChatResponse>();

    // Log usage info
    if (response.usage) {
      console.log(
        `[OpenRouter API] Tokens used: ${response.usage.total_tokens} (prompt: ${response.usage.prompt_tokens}, completion: ${response.usage.completion_tokens})`
      );
    }

    return response;
  });
}

/**
 * Clear models cache
 */
export async function clearModelsCache(): Promise<void> {
  const cacheKey = getModelsCacheKey();
  await cacheManager.delete(cacheKey);
  console.log('[OpenRouter API] Cleared models cache');
}
