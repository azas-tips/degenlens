// Analysis History Manager
// Manages analysis history in chrome.storage.local

import { STORAGE_KEYS } from '@/types/storage';
import type { AnalysisResult, HistoryEntry } from '@/types/analysis';
import type { Timeframe } from '@/types/dexscreener';

const MAX_HISTORY_ENTRIES = 50;

/**
 * Save analysis result to history
 * Automatically creates a history entry with metadata
 *
 * @param result - Analysis result to save
 * @param chain - Chain name
 * @param model - Model ID
 * @param timeframe - Timeframe used
 * @param maxPairs - Number of pairs analyzed
 * @param pairMaxAge - Max pair age filter in hours
 */
export async function saveToHistory(
  result: AnalysisResult,
  chain: string,
  model: string,
  timeframe: Timeframe,
  maxPairs: number,
  pairMaxAge?: number | null
): Promise<void> {
  try {
    // Create history entry
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      chain,
      model,
      timeframe,
      maxPairs,
      pairMaxAge,
      result,
      topPickSymbol: result.topPick?.symbol,
    };

    // Get existing history
    const history = await getHistory();

    // Add new entry at the beginning
    history.unshift(entry);

    // Trim to max entries
    const trimmedHistory = history.slice(0, MAX_HISTORY_ENTRIES);

    // Save back to storage
    await chrome.storage.local.set({
      [STORAGE_KEYS.ANALYSIS_HISTORY]: trimmedHistory,
    });

    console.log('[History] Saved analysis to history:', entry.id);
  } catch (error) {
    console.error('[History] Failed to save to history:', error);
  }
}

/**
 * Get all history entries
 * Returns entries sorted by timestamp (newest first)
 */
export async function getHistory(): Promise<HistoryEntry[]> {
  try {
    const storage = await chrome.storage.local.get(STORAGE_KEYS.ANALYSIS_HISTORY);
    const history = storage[STORAGE_KEYS.ANALYSIS_HISTORY] as HistoryEntry[] | undefined;

    return Array.isArray(history) ? history : [];
  } catch (error) {
    console.error('[History] Failed to get history:', error);
    return [];
  }
}

/**
 * Get history entry by ID
 *
 * @param id - Entry ID
 * @returns History entry or null if not found
 */
export async function getHistoryById(id: string): Promise<HistoryEntry | null> {
  const history = await getHistory();
  return history.find(entry => entry.id === id) || null;
}

/**
 * Delete history entry by ID
 *
 * @param id - Entry ID
 */
export async function deleteHistoryEntry(id: string): Promise<void> {
  try {
    const history = await getHistory();
    const filtered = history.filter(entry => entry.id !== id);

    await chrome.storage.local.set({
      [STORAGE_KEYS.ANALYSIS_HISTORY]: filtered,
    });

    console.log('[History] Deleted entry:', id);
  } catch (error) {
    console.error('[History] Failed to delete entry:', error);
  }
}

/**
 * Clear all history
 */
export async function clearHistory(): Promise<void> {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.ANALYSIS_HISTORY]: [],
    });

    console.log('[History] Cleared all history');
  } catch (error) {
    console.error('[History] Failed to clear history:', error);
  }
}

/**
 * Filter history by criteria
 *
 * @param chain - Filter by chain (optional)
 * @param startDate - Filter by start date (optional)
 * @param endDate - Filter by end date (optional)
 * @param searchQuery - Search in top pick symbol (optional)
 * @returns Filtered history entries
 */
export async function filterHistory(
  chain?: string,
  startDate?: Date,
  endDate?: Date,
  searchQuery?: string
): Promise<HistoryEntry[]> {
  const history = await getHistory();

  return history.filter(entry => {
    // Filter by chain
    if (chain && entry.chain !== chain) {
      return false;
    }

    // Filter by date range
    const entryDate = new Date(entry.timestamp);
    if (startDate && entryDate < startDate) {
      return false;
    }
    if (endDate && entryDate > endDate) {
      return false;
    }

    // Filter by search query (in top pick symbol)
    if (searchQuery && entry.topPickSymbol) {
      const query = searchQuery.toLowerCase();
      const symbol = entry.topPickSymbol.toLowerCase();
      if (!symbol.includes(query)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Get history statistics
 * Returns summary statistics about saved history
 */
export async function getHistoryStats(): Promise<{
  totalEntries: number;
  chainBreakdown: Record<string, number>;
  oldestEntry?: string;
  newestEntry?: string;
  totalCost: number;
}> {
  const history = await getHistory();

  const chainBreakdown: Record<string, number> = {};
  let totalCost = 0;

  history.forEach(entry => {
    // Count by chain
    chainBreakdown[entry.chain] = (chainBreakdown[entry.chain] || 0) + 1;

    // Sum costs
    if (entry.result.metadata?.estimatedCost) {
      totalCost += entry.result.metadata.estimatedCost;
    }
  });

  return {
    totalEntries: history.length,
    chainBreakdown,
    oldestEntry: history[history.length - 1]?.timestamp,
    newestEntry: history[0]?.timestamp,
    totalCost,
  };
}
