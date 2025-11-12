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
import { retryWithBackoff } from '@/background/utils/retry-helper';
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
    timeout: 300000, // 5 minutes (LLM analysis can take time with large token counts)
  });
}

/**
 * Fetch available models
 * Filters models to only include chat-compatible models
 *
 * @returns Array of available models
 */
export async function fetchModels(): Promise<OpenRouterModel[]> {
  return llmLimiter.execute(async () => {
    console.log('[OpenRouter API] Fetching models list');

    const client = await createOpenRouterClient();

    const response = await retryWithBackoff(
      () => client.get('models').json<OpenRouterModelsResponse>(),
      { maxAttempts: 3 }
    );

    // Filter models to only include chat-compatible ones
    const excludedModels: Record<string, string[]> = {
      modality: [],
      pricing: [],
      extended: [],
      top_provider: [],
    };

    const filteredModels = response.data.filter(model => {
      // Must output text (exclude image/audio generation models)
      // Accept: "text->text", "text+image->text", etc.
      // Reject: "text->image", "text+image->text+image", "text->audio", etc.
      const modality = model.architecture?.modality;
      if (modality && !modality.endsWith('->text')) {
        excludedModels.modality.push(model.id);
        return false;
      }

      // Must have pricing info
      if (!model.pricing || !model.pricing.prompt || !model.pricing.completion) {
        excludedModels.pricing.push(model.id);
        return false;
      }

      // Exclude models with ':extended' suffix (often not available)
      if (model.id.includes(':extended')) {
        excludedModels.extended.push(model.id);
        return false;
      }

      // Must have top_provider (indicates model is actually available)
      if (!model.top_provider) {
        excludedModels.top_provider.push(model.id);
        return false;
      }

      return true;
    });

    console.log(
      `[OpenRouter API] Filtered ${response.data.length} models to ${filteredModels.length} chat-compatible models`
    );
    console.log('[OpenRouter API] Excluded models by reason:', {
      modality: excludedModels.modality.length,
      pricing: excludedModels.pricing.length,
      extended: excludedModels.extended.length,
      top_provider: excludedModels.top_provider.length,
    });

    // Log specific models if gpt-5 or grok are excluded
    const gpt5Models = [
      ...excludedModels.modality,
      ...excludedModels.pricing,
      ...excludedModels.extended,
      ...excludedModels.top_provider,
    ].filter(id => id.includes('gpt-5') || id.includes('o3'));
    const grokModels = [
      ...excludedModels.modality,
      ...excludedModels.pricing,
      ...excludedModels.extended,
      ...excludedModels.top_provider,
    ].filter(id => id.includes('grok'));

    if (gpt5Models.length > 0) {
      console.log('[OpenRouter API] GPT-5/O3 models excluded:', gpt5Models);
      gpt5Models.forEach(id => {
        if (excludedModels.modality.includes(id))
          console.log(`  ${id}: missing text->text modality`);
        if (excludedModels.pricing.includes(id)) console.log(`  ${id}: missing pricing info`);
        if (excludedModels.extended.includes(id)) console.log(`  ${id}: has :extended suffix`);
        if (excludedModels.top_provider.includes(id)) console.log(`  ${id}: missing top_provider`);
      });
    }

    if (grokModels.length > 0) {
      console.log('[OpenRouter API] Grok models excluded:', grokModels);
      grokModels.forEach(id => {
        if (excludedModels.modality.includes(id))
          console.log(`  ${id}: missing text->text modality`);
        if (excludedModels.pricing.includes(id)) console.log(`  ${id}: missing pricing info`);
        if (excludedModels.extended.includes(id)) console.log(`  ${id}: has :extended suffix`);
        if (excludedModels.top_provider.includes(id)) console.log(`  ${id}: missing top_provider`);
      });
    }

    // Sort by provider + name for consistent ordering
    const sortedModels = filteredModels.sort((a, b) => {
      // Extract provider from model ID (e.g., "anthropic/claude-3.5-sonnet" -> "anthropic")
      const providerA = a.id.split('/')[0];
      const providerB = b.id.split('/')[0];

      // First sort by provider
      if (providerA !== providerB) {
        return providerA.localeCompare(providerB);
      }

      // Then sort by name within same provider
      return a.name.localeCompare(b.name);
    });

    return sortedModels;
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
    console.log(`[OpenRouter API] Chat completion request:`, {
      model: request.model,
      messageCount: request.messages.length,
      temperature: request.temperature,
    });

    const client = await createOpenRouterClient();

    // Always include usage tracking
    const requestWithUsage: OpenRouterChatRequest = {
      ...request,
      usage: {
        include: true,
      },
    };

    try {
      const response = await retryWithBackoff(
        () =>
          client
            .post('chat/completions', {
              json: requestWithUsage,
            })
            .json<OpenRouterChatResponse>(),
        { maxAttempts: 3 }
      );

      console.log(`[OpenRouter API] Success:`, {
        model: response.model,
        tokens: response.usage?.total_tokens,
      });

      return response;
    } catch (error) {
      console.error(`[OpenRouter API] Failed for model "${request.model}":`, error);
      throw error;
    }
  });
}
