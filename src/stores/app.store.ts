// App Store with Zustand
// Manages both persisted preferences and temporary UI state

import { create } from 'zustand';
import { STORAGE_KEYS } from '@/types/storage';

// ============================================
// Types
// ============================================

/**
 * Progress information during analysis
 */
export interface AnalysisProgress {
  step: 'fetching_pairs' | 'analyzing_llm' | 'formatting_results' | '';
  progress: number; // 0-100
}

/**
 * Analyzed token pair data
 */
export interface AnalyzedPair {
  symbol?: string;
  priceUsd?: string;
  volume6h?: number;
  liquidity?: number;
  priceChange6h?: number;
  risk?: string;
  observations?: string;
  score?: number;
  analysis?: string;
  momentum?: number;
  catalyst?: string;
  moonshotPotential?: string;
}

/**
 * Analysis result data
 */
export interface AnalysisResult {
  pairs: AnalyzedPair[];
  analysis: string;
  topPick?: {
    symbol?: string;
    reason?: string;
    momentum?: number;
    catalyst?: string;
    moonshotPotential?: string;
    momentumPhase?: string;
    contractAddress?: string;
    chainId?: string;
    pairAddress?: string;
  };
  runnerUps?: Array<{
    symbol?: string;
    reason?: string;
  }>;
  metadata?: {
    tokensUsed?: number;
    estimatedCost?: number;
  };
}

/**
 * Persisted preferences (saved to chrome.storage.local)
 */
export interface PersistedPrefs {
  chain: string;
  model: string;
  maxPairs: number;
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
      const { chain, model, maxPairs } = get();

      await chrome.storage.local.set({
        [STORAGE_KEYS.PREFS]: {
          chain,
          model,
          maxPairs,
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
