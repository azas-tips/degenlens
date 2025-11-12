// DEXscreener API Client
// Handles all DEXscreener API requests with caching, rate limiting, and retry logic

import ky from 'ky';
import type { DexPair, DexPairsResponse, Timeframe } from '@/types/dexscreener';
import { DEFAULT_TIMEFRAME } from '@/types/dexscreener';
import { dexLimiter } from '@/background/utils/rate-limiter';
import { retryWithBackoff } from '@/background/utils/retry-helper';
import { STORAGE_KEYS } from '@/types/storage';

const DEX_API_BASE = 'https://api.dexscreener.com/latest/dex';

/**
 * Map user-facing chain names to DEXscreener API chain IDs
 * Some chains have different names in the API vs. what users expect
 */
function mapChainName(chain: string): string {
  const chainMap: Record<string, string> = {
    // No mapping needed for polygon - it exists as 'polygon' in DEXscreener (Polygon PoS)
    // polygonzkevm is a separate chain
  };

  return chainMap[chain.toLowerCase()] || chain.toLowerCase();
}

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
 * Get popular search queries for each chain
 */
const CHAIN_POPULAR_QUERIES: Record<string, string[]> = {
  solana: ['SOL', 'USDC', 'RAY', 'BONK', 'JTO', 'JUP', 'PYTH', 'WIF'],
  ethereum: ['ETH', 'USDT', 'USDC', 'WBTC', 'LINK', 'UNI', 'PEPE', 'SHIB'],
  bsc: ['BNB', 'BUSD', 'CAKE', 'USDT', 'ETH', 'BTCB'],
  polygonzkevm: ['ETH', 'USDC', 'USDT', 'WBTC', 'MATIC'], // Polygon zkEVM
  arbitrum: ['ARB', 'ETH', 'USDC', 'USDT', 'GMX'],
  optimism: ['OP', 'ETH', 'USDC', 'USDT', 'SNX'],
  base: ['ETH', 'USDC', 'DEGEN', 'BRETT'],
};

/**
 * Fetch boosted tokens (tokens with active boosts)
 * These are typically trending/promoted tokens
 *
 * @param chain - Chain name to filter by
 * @returns Array of token addresses
 */
async function fetchBoostedTokens(chain: string): Promise<string[]> {
  try {
    const client = await createDexClient();
    const response = await retryWithBackoff(
      () =>
        client
          .get('https://api.dexscreener.com/token-boosts/top/v1', {
            prefixUrl: '', // Override prefixUrl to use full URL
          })
          .json<
            Array<{
              chainId: string;
              tokenAddress: string;
              amount: number;
            }>
          >(),
      { maxAttempts: 2 }
    );

    // Filter by chain and return token addresses
    return response
      .filter(boost => boost.chainId?.toLowerCase() === chain.toLowerCase())
      .map(boost => boost.tokenAddress)
      .slice(0, 10); // Top 10 boosted tokens
  } catch (error) {
    console.warn('[DEX API] Failed to fetch boosted tokens:', error);
    return [];
  }
}

/**
 * Fetch token pairs by chain
 * Uses search API + boosted tokens to find hot pairs on the chain
 *
 * @param chain - Chain name (e.g., 'solana', 'ethereum', 'bsc')
 * @param maxPairs - Maximum number of pairs to return (default: 20)
 * @param timeframe - Timeframe for scoring pairs (default: DEFAULT_TIMEFRAME)
 * @returns Array of token pairs
 */
export async function fetchPairsByChain(
  chain: string,
  maxPairs: number = 20,
  timeframe: Timeframe = DEFAULT_TIMEFRAME
): Promise<DexPair[]> {
  return dexLimiter.execute(async () => {
    // Map chain name to DEXscreener API chain ID
    const apiChainId = mapChainName(chain);
    console.log(
      `[DEX API] Fetching pairs for ${chain}${chain !== apiChainId ? ` (mapped to ${apiChainId})` : ''}`
    );

    const client = await createDexClient();

    // Try fetching pairs directly by chain ID first
    try {
      console.log(`[DEX API] Trying direct fetch: pairs/${apiChainId}`);
      const directResponse = await retryWithBackoff(
        () => client.get(`pairs/${apiChainId}`).json<DexPairsResponse>(),
        { maxAttempts: 2 }
      );

      if (directResponse.pairs && directResponse.pairs.length > 0) {
        console.log(`[DEX API] Direct fetch returned ${directResponse.pairs.length} pairs`);

        // Calculate momentum scores and return top pairs
        const pairsWithScore = directResponse.pairs.map(pair => {
          const priceChange = pair.priceChange?.[timeframe] || 0;
          const volume = pair.volume?.[timeframe] || 0;
          const liquidity = pair.liquidity?.usd || 0;

          const momentumScore =
            Math.abs(priceChange) * 10 + Math.log10(volume + 1) * 2 + (liquidity > 10000 ? 5 : 0);

          return { pair, score: momentumScore };
        });

        const sorted = pairsWithScore.sort((a, b) => b.score - a.score).map(item => item.pair);

        return sorted.slice(0, maxPairs);
      }
    } catch (error) {
      console.warn(
        `[DEX API] Direct fetch failed for ${apiChainId}, falling back to search:`,
        error
      );
    }

    // Fallback: Use search-based approach
    // Strategy 1: Fetch boosted tokens (trending/promoted)
    const boostedTokens = await fetchBoostedTokens(apiChainId);
    console.log(`[DEX API] Found ${boostedTokens.length} boosted tokens for ${apiChainId}`);

    // Strategy 2: Get popular token queries for this chain
    // Use original chain name for lookups, then use mapped apiChainId for API calls
    const queries = CHAIN_POPULAR_QUERIES[apiChainId.toLowerCase()] ||
      CHAIN_POPULAR_QUERIES[chain.toLowerCase()] || [''];

    // Combine both strategies: boosted tokens + popular queries
    const searchTargets = [
      ...boostedTokens,
      ...queries.slice(0, 3), // Limit popular queries
    ];

    console.log(`[DEX API] Search targets for ${apiChainId}:`, searchTargets);

    // Fetch pairs for each search target
    const allPairs: DexPair[] = [];
    const seenPairs = new Set<string>();

    for (const target of searchTargets) {
      try {
        const response = await retryWithBackoff(
          () => client.get(`search?q=${encodeURIComponent(target)}`).json<DexPairsResponse>(),
          { maxAttempts: 2 }
        );

        // Add unique pairs from this chain (use mapped API chain ID)
        const chainPairs = (response.pairs || []).filter(
          (pair: DexPair) =>
            pair.chainId?.toLowerCase() === apiChainId.toLowerCase() &&
            !seenPairs.has(pair.pairAddress)
        );

        console.log(
          `[DEX API] Search "${target}": found ${chainPairs.length} pairs for ${apiChainId}`
        );

        chainPairs.forEach((pair: DexPair) => {
          seenPairs.add(pair.pairAddress);
          allPairs.push(pair);
        });
      } catch (error) {
        console.warn(`[DEX API] Failed to fetch pairs for target "${target}":`, error);
      }
    }

    console.log(`[DEX API] Total unique pairs collected for ${apiChainId}: ${allPairs.length}`);

    // Calculate momentum score for each pair
    // Prioritizes: price change, volume acceleration, and liquidity
    const pairsWithScore = allPairs.map(pair => {
      const priceChange = pair.priceChange?.[timeframe] || 0;
      const volume = pair.volume?.[timeframe] || 0;
      const liquidity = pair.liquidity?.usd || 0;

      // Momentum score formula:
      // - High weight on price change (volatility = opportunity)
      // - Volume matters but less than price movement
      // - Minimum liquidity requirement to filter out scams
      const momentumScore =
        Math.abs(priceChange) * 10 + // Price change is most important
        Math.log10(volume + 1) * 2 + // Log scale for volume
        (liquidity > 10000 ? 5 : 0); // Bonus for sufficient liquidity

      return { pair, score: momentumScore };
    });

    // Sort by momentum score (descending)
    const sorted = pairsWithScore.sort((a, b) => b.score - a.score).map(item => item.pair);

    // Return top N pairs
    return sorted.slice(0, maxPairs);
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
