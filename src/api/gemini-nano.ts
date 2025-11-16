// Gemini Nano (Chrome Built-in AI) API Client
// Handles all Gemini Nano API requests

import type {
  GeminiNanoCapabilities,
  GeminiNanoSession,
  GeminiNanoSessionOptions,
} from '@/types/gemini-nano';

/**
 * Check if Gemini Nano is available in the current browser
 * @returns true if available, false otherwise
 */
export function isGeminiNanoSupported(): boolean {
  if (typeof window === 'undefined') {
    console.log('[Gemini Nano] window is undefined (running in non-browser context)');
    return false;
  }
  if (!('ai' in window)) {
    console.log('[Gemini Nano] window.ai is not available (Chrome 127+ required)');
    return false;
  }
  if (!window.ai?.languageModel) {
    console.log('[Gemini Nano] window.ai.languageModel is not available');
    return false;
  }
  console.log('[Gemini Nano] Browser supports Gemini Nano API');
  return true;
}

/**
 * Get Gemini Nano capabilities
 * @returns Capabilities object (never null - returns 'no' for unsupported browsers)
 */
export async function getGeminiNanoCapabilities(): Promise<GeminiNanoCapabilities> {
  if (!isGeminiNanoSupported()) {
    console.log('[Gemini Nano] Not supported in this browser');
    return { available: 'no' };
  }

  try {
    const capabilities = await window.ai!.languageModel.capabilities();
    console.log('[Gemini Nano] Capabilities:', capabilities);
    return capabilities;
  } catch (error) {
    console.error('[Gemini Nano] Failed to get capabilities:', error);
    return { available: 'no' };
  }
}

/**
 * Check if Gemini Nano is ready to use
 * @returns true if readily available, false otherwise
 */
export async function isGeminiNanoReady(): Promise<boolean> {
  const capabilities = await getGeminiNanoCapabilities();
  return capabilities?.available === 'readily';
}

/**
 * Create a Gemini Nano session
 * @param options - Session options
 * @returns Session object
 */
export async function createGeminiNanoSession(
  options?: GeminiNanoSessionOptions
): Promise<GeminiNanoSession> {
  if (!isGeminiNanoSupported()) {
    throw new Error('Gemini Nano is not supported in this browser');
  }

  console.log('[Gemini Nano] Creating session with options:', options);

  try {
    const session = await window.ai!.languageModel.create(options);
    console.log('[Gemini Nano] Session created successfully');
    return session;
  } catch (error) {
    console.error('[Gemini Nano] Failed to create session:', error);
    throw new Error('Failed to create Gemini Nano session. The model may need to be downloaded.');
  }
}

/**
 * Send prompt to Gemini Nano
 * @param prompt - User prompt
 * @param options - Session options
 * @returns Model response
 */
export async function geminiNanoPrompt(
  prompt: string,
  options?: GeminiNanoSessionOptions
): Promise<string> {
  const session = await createGeminiNanoSession(options);

  try {
    console.log('[Gemini Nano] Sending prompt:', {
      promptLength: prompt.length,
      options,
    });

    const response = await session.prompt(prompt);

    console.log('[Gemini Nano] Response received:', {
      responseLength: response.length,
    });

    return response;
  } catch (error) {
    console.error('[Gemini Nano] Prompt failed:', error);
    throw error;
  } finally {
    session.destroy();
  }
}
