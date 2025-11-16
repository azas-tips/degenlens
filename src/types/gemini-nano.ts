// Gemini Nano (Chrome Built-in AI) Type Definitions
// Based on Chrome AI Prompt API documentation

/**
 * Gemini Nano model identifier
 */
export const GEMINI_NANO_MODEL_ID = 'gemini-nano' as const;

/**
 * Gemini Nano availability status
 */
export type GeminiNanoAvailability = 'readily' | 'after-download' | 'no';

/**
 * Gemini Nano capabilities response
 */
export interface GeminiNanoCapabilities {
  available: GeminiNanoAvailability;
  defaultTopK?: number;
  maxTopK?: number;
  defaultTemperature?: number;
}

/**
 * Gemini Nano session options
 */
export interface GeminiNanoSessionOptions {
  topK?: number;
  temperature?: number;
  monitor?: (monitor: GeminiNanoMonitor) => void;
}

/**
 * Gemini Nano download progress monitor
 */
export interface GeminiNanoMonitor {
  addEventListener(
    event: 'downloadprogress',
    listener: (e: { loaded: number; total: number }) => void
  ): void;
}

/**
 * Gemini Nano session interface
 */
export interface GeminiNanoSession {
  prompt(input: string): Promise<string>;
  promptStreaming(input: string): AsyncIterable<string>;
  destroy(): void;
}

/**
 * Chrome AI Language Model API
 */
export interface ChromeAILanguageModel {
  capabilities(): Promise<GeminiNanoCapabilities>;
  create(options?: GeminiNanoSessionOptions): Promise<GeminiNanoSession>;
}

/**
 * Chrome AI API (global.ai)
 */
export interface ChromeAI {
  languageModel: ChromeAILanguageModel;
}

/**
 * Extend Window interface to include Chrome AI
 */
declare global {
  interface Window {
    ai?: ChromeAI;
  }
  const ai: ChromeAI | undefined;
}
