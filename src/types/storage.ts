// Storage Type Definitions
// Version-managed storage schema

/**
 * Storage Schema V1
 *
 * Persisted data:
 * - API keys (plain text)
 * - User preferences (chain, model)
 * - Storage version
 *
 * NOT persisted:
 * - API analysis results (should be cleared when popup closes for security/privacy)
 * - Temporary UI state
 */
export interface AppStorageV1 {
  version: 1;
  dex_api_key?: string;
  openrouter_api_key?: string;
  prefs: {
    chain: string; // 'solana' | 'ethereum' | 'bsc', etc.
    model: string; // OpenRouter model ID
    maxPairs: number; // Number of pairs to analyze (1-100)
  };
  custom_prompt?: string; // Custom analysis prompt (optional)
  telemetry_enabled?: boolean; // Local error logging enabled (default: false)
}

// Future versions go here
// export interface AppStorageV2 extends AppStorageV1 {
//   version: 2;
//   newField: string;
// }

// Current storage type (will become Union type in future)
export type AppStorage = AppStorageV1;

// Default values
export const DEFAULT_STORAGE: AppStorageV1 = {
  version: 1,
  prefs: {
    chain: 'solana',
    model: '',
    maxPairs: 20, // Fixed: Top 20 pairs for comprehensive analysis
  },
  telemetry_enabled: false,
};

/**
 * Excluded Token
 * Represents a token that should be excluded from analysis (all pairs containing this token)
 */
export interface ExcludedToken {
  tokenAddress: string; // Token contract address (primary identifier)
  symbol: string; // Token symbol (e.g., "BONK", "POPFROG")
  chainId: string; // Chain identifier
  excludedAt: string; // ISO timestamp when excluded
}

// Storage key constants
export const STORAGE_KEYS = {
  VERSION: 'version',
  DEX_API_KEY: 'dex_api_key',
  OPENROUTER_API_KEY: 'openrouter_api_key',
  PREFS: 'prefs',
  CUSTOM_PROMPT: 'custom_prompt',
  TELEMETRY_ENABLED: 'telemetry_enabled',
  LANGUAGE: 'language',
  ANALYSIS_HISTORY: 'analysis_history',
  EXCLUDED_TOKENS: 'excluded_tokens',
} as const;
