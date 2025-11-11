// DEXscreener API Client
// Handles all DEXscreener API requests with caching, rate limiting, and retry logic

import ky from 'ky';
import type { DexPair, DexPairsResponse } from '@/types/dexscreener';
import { dexLimiter } from '@/background/utils/rate-limiter';
import { cacheManager, getDexCacheKey } from '@/background/utils/cache';
import { retryWithBackoff } from '@/background/utils/retry-helper';
import { STORAGE_KEYS } from '@/types/storage';

const DEX_API_BASE = 'https://api.dexscreener.com/latest/dex';

/**
 * Create DEXscreener API client
 * API key is optional (fetched from storage if available)
 */
async function createDexClient() {
  // Get API key from storage
  const storage = await chrome.storage.local.get(STORAGE_KEYS.DEX_API_KEY);
  const apiKey = storage[STORAGE_KEYS.DEX_API_KEY] as string | undefined;

  // Create client with optional API key header
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  return ky.create({
    prefixUrl: DEX_API_BASE,
    headers,
    timeout: 30000, // 30 seconds
  });
}

/**
 * Fetch token pairs by chain
 * Uses cache and rate limiting
 *
 * @param chain - Chain name (e.g., 'solana', 'ethereum', 'bsc')
 * @param maxPairs - Maximum number of pairs to return (default: 20)
 * @returns Array of token pairs
 */
export async function fetchPairsByChain(chain: string, maxPairs: number = 20): Promise<DexPair[]> {
  const cacheKey = getDexCacheKey(chain);

  return dexLimiter.execute(async () => {
    return cacheManager.getOrFetch(cacheKey, async () => {
      console.log(`[DEX API] Fetching pairs for ${chain}`);

      const client = await createDexClient();

      // Fetch pairs for chain with retry logic
      // Note: DEXscreener API does not support pagination
      // We fetch all and slice on client side
      const response = await retryWithBackoff(
        () => client.get(`pairs/${chain}`).json<DexPairsResponse>(),
        { maxAttempts: 3 }
      );

      // Filter and sort pairs
      const pairs = response.pairs || [];

      // Sort by volume (descending)
      const sorted = pairs.sort(
        (a: DexPair, b: DexPair) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0)
      );

      // Return top N pairs
      return sorted.slice(0, maxPairs);
    });
  });
}

/**
 * Fetch specific token pair by address
 *
 * @param pairAddress - Pair contract address
 * @returns Token pair data
 */
export async function fetchPairByAddress(pairAddress: string): Promise<DexPair | null> {
  return dexLimiter.execute(async () => {
    console.log(`[DEX API] Fetching pair ${pairAddress}`);

    const client = await createDexClient();

    try {
      const response = await retryWithBackoff(
        () => client.get(`pairs/${pairAddress}`).json<DexPairsResponse>(),
        { maxAttempts: 3 }
      );

      return response.pairs?.[0] || null;
    } catch (error) {
      console.error(`[DEX API] Failed to fetch pair ${pairAddress}:`, error);
      return null;
    }
  });
}

/**
 * Search token pairs by query
 *
 * @param query - Search query (token symbol, name, or address)
 * @returns Array of matching pairs
 */
export async function searchPairs(query: string): Promise<DexPair[]> {
  return dexLimiter.execute(async () => {
    console.log(`[DEX API] Searching for: ${query}`);

    const client = await createDexClient();

    try {
      const response = await retryWithBackoff(
        () => client.get(`search?q=${encodeURIComponent(query)}`).json<DexPairsResponse>(),
        { maxAttempts: 3 }
      );

      return response.pairs || [];
    } catch (error) {
      console.error(`[DEX API] Search failed:`, error);
      return [];
    }
  });
}

/**
 * Clear DEXscreener cache for specific chain
 */
export async function clearDexCache(chain: string): Promise<void> {
  const cacheKey = getDexCacheKey(chain);
  await cacheManager.delete(cacheKey);
  console.log(`[DEX API] Cleared cache for ${chain}`);
}

/**
 * Clear all DEXscreener caches
 */
export async function clearAllDexCaches(): Promise<void> {
  // Clear common chains
  const chains = ['solana', 'ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'base'];

  for (const chain of chains) {
    await clearDexCache(chain);
  }
}
