// App Store with Zustand
// Manages both persisted preferences and temporary UI state

import { create } from 'zustand';
import { STORAGE_KEYS } from '@/types/storage';
import { DEFAULT_TIMEFRAME, type Timeframe } from '@/types/dexscreener';
import type { AnalysisProgress, AnalysisResult } from '@/types/analysis';

// ============================================
// Types
// ============================================

// Analysis types moved to @/types/analysis

/**
 * Persisted preferences (saved to chrome.storage.local)
 */
export interface PersistedPrefs {
  chain: string;
  model: string;
  maxPairs: number;
  timeframe: Timeframe;
  pairMaxAge: number | null; // Max pair age in hours (null = all pairs)
  quoteTokens: Record<string, string[]>; // Selected quote tokens per chain
}

/**
 * Temporary UI state (not persisted)
 */
export interface TemporaryState {
  analyzing: boolean;
  progress: AnalysisProgress;
  results: AnalysisResult | null;
  error: string;
  errorCode: string;
  errorSuggestions: string[];
  retryAfterMs: number;
}

/**
 * Complete app state
 */
export interface AppState extends PersistedPrefs, TemporaryState {
  // Actions for preferences
  setChain: (chain: string) => void;
  setModel: (model: string) => void;
  setMaxPairs: (maxPairs: number) => void;
  setTimeframe: (timeframe: Timeframe) => void;
  setPairMaxAge: (pairMaxAge: number | null) => void;
  setQuoteTokensForChain: (chain: string, tokens: string[]) => void;

  // Actions for analysis state
  setAnalyzing: (analyzing: boolean) => void;
  setProgress: (progress: AnalysisProgress) => void;
  setResults: (results: AnalysisResult | null) => void;
  setError: (
    error: string,
    errorCode?: string,
    suggestions?: string[],
    retryAfterMs?: number
  ) => void;

  // Utility actions
  clearResults: () => void;
  loadPreferences: () => Promise<void>;
  savePreferences: () => Promise<void>;
}

// ============================================
// Store
// ============================================

/**
 * App store with automatic chrome.storage.local sync
 */
export const useAppStore = create<AppState>()((set, get) => ({
  // Default persisted preferences
  chain: 'solana',
  model: '',
  maxPairs: 20,
  timeframe: DEFAULT_TIMEFRAME,
  pairMaxAge: 24, // Default: Show pairs created within 24 hours
  quoteTokens: {}, // Empty by default

  // Default temporary state
  analyzing: false,
  progress: { step: '', progress: 0 },
  results: null,
  error: '',
  errorCode: '',
  errorSuggestions: [],
  retryAfterMs: 0,

  // Preference actions (auto-save to chrome.storage)
  setChain: chain => {
    set({ chain });
    get().savePreferences();
  },

  setModel: model => {
    set({ model });
    get().savePreferences();
  },

  setMaxPairs: maxPairs => {
    set({ maxPairs });
    get().savePreferences();
  },

  setTimeframe: timeframe => {
    set({ timeframe });
    get().savePreferences();
  },

  setPairMaxAge: pairMaxAge => {
    set({ pairMaxAge });
    get().savePreferences();
  },

  setQuoteTokensForChain: (chain, tokens) => {
    const quoteTokens = { ...get().quoteTokens };
    quoteTokens[chain] = tokens;
    set({ quoteTokens });
    get().savePreferences();
  },

  // Analysis state actions (memory only)
  setAnalyzing: analyzing => {
    console.log('[Store] setAnalyzing called with:', analyzing);
    set({ analyzing });
    const newState = get();
    console.log('[Store] State after setAnalyzing:', newState.analyzing);
    console.log('[Store] Full state:', {
      analyzing: newState.analyzing,
      results: !!newState.results,
    });
  },

  setProgress: progress => {
    console.log('[Store] setProgress called with:', progress);
    set({ progress });
  },

  setResults: results => {
    console.log('[Store] setResults called, analyzing -> false');
    set({
      results,
      error: '',
      errorCode: '',
      errorSuggestions: [],
      retryAfterMs: 0,
      analyzing: false,
    });
    console.log(
      '[Store] State after setResults - analyzing:',
      get().analyzing,
      'results:',
      !!get().results
    );
  },

  setError: (error, errorCode = '', suggestions = [], retryAfterMs = 0) => {
    // Only set analyzing: false if there's an actual error
    // If error is empty string, we're just clearing errors, don't change analyzing
    if (error) {
      set({
        error,
        errorCode,
        errorSuggestions: suggestions,
        retryAfterMs,
        results: null,
        analyzing: false,
      });
    } else {
      set({
        error: '',
        errorCode: '',
        errorSuggestions: [],
        retryAfterMs: 0,
      });
    }
  },

  // Utility actions
  clearResults: () =>
    set({
      results: null,
      error: '',
      errorCode: '',
      errorSuggestions: [],
      retryAfterMs: 0,
      analyzing: false,
      progress: { step: '', progress: 0 },
    }),

  /**
   * Load preferences from chrome.storage.local
   */
  loadPreferences: async () => {
    try {
      const data = await chrome.storage.local.get(STORAGE_KEYS.PREFS);
      const prefs = data[STORAGE_KEYS.PREFS];

      if (prefs) {
        set({
          chain: prefs.chain || 'solana',
          model: prefs.model || '',
          maxPairs: prefs.maxPairs || 20,
          timeframe: prefs.timeframe || DEFAULT_TIMEFRAME,
          pairMaxAge: prefs.pairMaxAge !== undefined ? prefs.pairMaxAge : 24,
          quoteTokens: prefs.quoteTokens || {},
        });
      }
    } catch (error) {
      console.error('[Store] Failed to load preferences:', error);
    }
  },

  /**
   * Save preferences to chrome.storage.local
   */
  savePreferences: async () => {
    try {
      const { chain, model, maxPairs, timeframe, pairMaxAge, quoteTokens } = get();

      await chrome.storage.local.set({
        [STORAGE_KEYS.PREFS]: {
          chain,
          model,
          maxPairs,
          timeframe,
          pairMaxAge,
          quoteTokens,
        },
      });
    } catch (error) {
      console.error('[Store] Failed to save preferences:', error);
    }
  },
}));

// ============================================
// Initialize store on load
// ============================================

/**
 * Initialize store by loading preferences from storage
 * Call this once when the popup opens
 */
export async function initializeStore() {
  await useAppStore.getState().loadPreferences();
}
