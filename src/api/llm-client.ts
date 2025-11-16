// Unified LLM Client Interface
// Provides a unified interface for both OpenRouter and Gemini Nano

import { chatCompletion } from './openrouter';
import { geminiNanoPrompt } from './gemini-nano';
import { GEMINI_NANO_MODEL_ID } from '@/types/gemini-nano';

/**
 * Unified LLM response interface
 */
export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  model?: string;
}

/**
 * Call LLM with unified interface
 * Automatically routes to OpenRouter or Gemini Nano based on model ID
 *
 * @param model - Model ID (e.g., 'anthropic/claude-3.5-sonnet' or 'gemini-nano')
 * @param prompt - User prompt
 * @param temperature - Temperature for generation (default: 0.3)
 * @returns Unified LLM response
 */
export async function callLLM(
  model: string,
  prompt: string,
  temperature = 0.3
): Promise<LLMResponse> {
  // Route to Gemini Nano if model ID matches
  if (model === GEMINI_NANO_MODEL_ID) {
    console.log('[LLM Client] Routing to Gemini Nano');
    const content = await geminiNanoPrompt(prompt, { temperature });

    return {
      content,
      usage: {
        total_tokens: 0, // Gemini Nano doesn't provide token counts
      },
      model: GEMINI_NANO_MODEL_ID,
    };
  }

  // Otherwise, route to OpenRouter
  console.log(`[LLM Client] Routing to OpenRouter (${model})`);
  const response = await chatCompletion({
    model,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature,
  });

  // Convert OpenRouter response to unified format
  const content = response.choices?.[0]?.message?.content || '';

  return {
    content,
    usage: {
      prompt_tokens: response.usage?.prompt_tokens,
      completion_tokens: response.usage?.completion_tokens,
      total_tokens: response.usage?.total_tokens,
    },
    model: response.model,
  };
}
