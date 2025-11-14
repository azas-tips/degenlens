// DEXscreener API Client
// Handles all DEXscreener API requests with caching, rate limiting, and retry logic

import ky from 'ky';
import type { DexPair, DexPairsResponse, Timeframe } from '@/types/dexscreener';
import { DEFAULT_TIMEFRAME } from '@/types/dexscreener';
import { dexLimiter } from '@/background/utils/rate-limiter';
import { retryWithBackoff } from '@/background/utils/retry-helper';
import { STORAGE_KEYS } from '@/types/storage';
import { getExcludedTokens } from '@/utils/exclusion';

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
 * Calculate buy/sell pressure score
 * Higher score indicates stronger buy pressure
 */
function calculateBuySellPressure(pair: DexPair, timeframe: Timeframe): number {
  const txns = pair.txns?.[timeframe];
  if (!txns || (txns.buys === 0 && txns.sells === 0)) return 0;

  const total = txns.buys + txns.sells;
  const buyRatio = txns.buys / total;

  // Score from -1 (all sells) to +1 (all buys)
  return (buyRatio - 0.5) * 2;
}

/**
 * Calculate volume acceleration across timeframes
 * Measures if volume is increasing over time
 */
function calculateVolumeAcceleration(pair: DexPair): number {
  const m5Vol = pair.volume?.m5 || 0;
  const h1Vol = pair.volume?.h1 || 0;
  const h6Vol = pair.volume?.h6 || 0;

  if (m5Vol === 0 || h1Vol === 0 || h6Vol === 0) return 0;

  // Calculate velocity (rate of change)
  // Positive = accelerating, Negative = decelerating
  const shortTerm = (m5Vol * 12 - h1Vol) / (h1Vol + 1); // m5 to h1 velocity
  const midTerm = (h1Vol * 6 - h6Vol) / (h6Vol + 1); // h1 to h6 velocity

  // Average velocity, normalized
  return (shortTerm + midTerm) / 2;
}

/**
 * Calculate liquidity health ratio
 * Healthy tokens have liquidity proportional to market cap
 */
function calculateLiquidityHealthRatio(pair: DexPair): number {
  const liquidity = pair.liquidity?.usd || 0;
  const marketCap = pair.marketCap || 0;

  if (marketCap === 0) return 0;

  // Ideal ratio is 5-15% (healthy)
  const ratio = liquidity / marketCap;

  // Score: 1.0 for ideal range, lower for extremes
  if (ratio >= 0.05 && ratio <= 0.15) return 1.0;
  if (ratio < 0.05) return ratio / 0.05; // 0 to 1.0
  if (ratio > 0.15) return Math.max(0, 1.0 - (ratio - 0.15) * 2); // 1.0 to 0

  return 0;
}

/**
 * Calculate trend consistency across timeframes
 * Higher score = more consistent trend
 */
function calculateTrendConsistency(pair: DexPair): number {
  const m5 = pair.priceChange?.m5 || 0;
  const h1 = pair.priceChange?.h1 || 0;
  const h6 = pair.priceChange?.h6 || 0;
  const h24 = pair.priceChange?.h24 || 0;

  // Check if all timeframes have same direction
  const signs = [Math.sign(m5), Math.sign(h1), Math.sign(h6), Math.sign(h24)];
  const positiveCount = signs.filter(s => s > 0).length;
  const negativeCount = signs.filter(s => s < 0).length;

  // All same direction = 1.0, mixed = 0.0
  const directionScore = Math.max(positiveCount, negativeCount) / 4;

  // Calculate magnitude consistency (variance)
  const changes = [m5, h1, h6, h24].filter(c => c !== 0);
  if (changes.length === 0) return 0;

  const mean = changes.reduce((a, b) => Math.abs(a) + Math.abs(b), 0) / changes.length;
  const variance =
    changes.reduce((acc, c) => acc + Math.pow(Math.abs(c) - mean, 2), 0) / changes.length;
  const magnitudeScore = 1 / (1 + variance / 100); // Lower variance = higher score

  return directionScore * 0.7 + magnitudeScore * 0.3;
}

/**
 * Calculate risk penalty based on labels and pair age
 * Returns a multiplier (0-1): 1 = no risk, 0 = extreme risk
 */
function calculateRiskAdjustment(pair: DexPair): number {
  let riskMultiplier = 1.0;

  // Label-based risk
  const labels = pair.labels || [];
  if (labels.some(l => l.toLowerCase().includes('scam'))) return 0; // Exclude scams
  if (labels.some(l => l.toLowerCase().includes('honeypot'))) return 0; // Exclude honeypots
  if (labels.some(l => l.toLowerCase().includes('top'))) riskMultiplier *= 1.2; // Boost trusted
  if (labels.some(l => l.toLowerCase().includes('verified'))) riskMultiplier *= 1.15;

  // Age-based risk (newer = riskier)
  if (pair.pairCreatedAt) {
    const ageMs = Date.now() - pair.pairCreatedAt;
    const ageHours = ageMs / (1000 * 60 * 60);

    if (ageHours < 1)
      riskMultiplier *= 0.3; // Very new = very risky
    else if (ageHours < 24)
      riskMultiplier *= 0.6; // Less than 1 day
    else if (ageHours < 168) riskMultiplier *= 0.8; // Less than 1 week
    // Older than 1 week = no penalty
  }

  return Math.min(riskMultiplier, 1.0); // Cap at 1.0
}

/**
 * Calculate advanced momentum score
 * Combines multiple factors for comprehensive scoring
 */
function calculateAdvancedMomentumScore(pair: DexPair, timeframe: Timeframe): number {
  const priceChange = pair.priceChange?.[timeframe] || 0;
  const volume = pair.volume?.[timeframe] || 0;
  const liquidity = pair.liquidity?.usd || 0;

  // Base score components
  const priceScore = Math.abs(priceChange) * 10; // Price change magnitude
  const volumeScore = Math.log10(volume + 1) * 2; // Volume (log scale)
  const liquidityBonus = liquidity > 10000 ? 5 : 0; // Minimum liquidity threshold

  // Advanced components
  const buySellPressure = calculateBuySellPressure(pair, timeframe);
  const volumeAccel = calculateVolumeAcceleration(pair);
  const liquidityHealth = calculateLiquidityHealthRatio(pair);
  const trendConsistency = calculateTrendConsistency(pair);
  const riskAdjustment = calculateRiskAdjustment(pair);

  // Weighted combination
  const baseScore = priceScore + volumeScore + liquidityBonus;
  const advancedBonus =
    buySellPressure * 15 + // Buy pressure is highly valuable
    volumeAccel * 10 + // Volume acceleration indicates momentum
    liquidityHealth * 5 + // Healthy liquidity structure
    trendConsistency * 8; // Consistent trends are more reliable

  const finalScore = (baseScore + advancedBonus) * riskAdjustment;

  return finalScore;
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
 * Filter pairs by age
 * @param pairs - Array of pairs to filter
 * @param maxAgeHours - Maximum age in hours (null = no filtering)
 * @returns Filtered array of pairs
 */
function filterPairsByAge(pairs: DexPair[], maxAgeHours: number | null): DexPair[] {
  if (maxAgeHours === null) {
    return pairs; // No age filtering
  }

  const now = Date.now();
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

  const filtered = pairs.filter(pair => {
    if (!pair.pairCreatedAt) {
      return false; // Exclude pairs without creation timestamp
    }
    const ageMs = now - pair.pairCreatedAt;
    return ageMs <= maxAgeMs;
  });

  console.log(
    `[DEX API] Filtered pairs by age (max ${maxAgeHours}h): ${pairs.length} → ${filtered.length}`
  );

  return filtered;
}

/**
 * Filter pairs by quote token
 * @param pairs - Array of pairs to filter
 * @param quoteTokens - Array of allowed quote token symbols (empty = all pairs)
 * @returns Filtered array of pairs
 */
function filterPairsByQuoteToken(pairs: DexPair[], quoteTokens: string[]): DexPair[] {
  if (!quoteTokens || quoteTokens.length === 0) {
    return pairs; // No filtering
  }

  const allowedSymbols = new Set(quoteTokens.map(s => s.toUpperCase()));

  const filtered = pairs.filter(pair => {
    const quoteSymbol = pair.quoteToken?.symbol?.toUpperCase();
    return quoteSymbol && allowedSymbols.has(quoteSymbol);
  });

  console.log(
    `[DEX API] Filtered pairs by quote tokens (${quoteTokens.join(', ')}): ${pairs.length} → ${filtered.length}`
  );

  return filtered;
}

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
 * @param pairMaxAge - Max pair age in hours (null = all pairs)
 * @param quoteTokens - Array of allowed quote token symbols (empty = all pairs)
 * @returns Array of token pairs
 */
export async function fetchPairsByChain(
  chain: string,
  maxPairs: number = 20,
  timeframe: Timeframe = DEFAULT_TIMEFRAME,
  pairMaxAge: number | null = null,
  quoteTokens: string[] = []
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

        // Calculate advanced momentum scores and return top pairs
        const pairsWithScore = directResponse.pairs.map(pair => {
          const momentumScore = calculateAdvancedMomentumScore(pair, timeframe);
          return { pair, score: momentumScore };
        });

        const sorted = pairsWithScore.sort((a, b) => b.score - a.score).map(item => item.pair);

        // Filter by pair age (if specified)
        const ageFiltered = filterPairsByAge(sorted, pairMaxAge);

        // Filter by quote token (if specified)
        const quoteFiltered = filterPairsByQuoteToken(ageFiltered, quoteTokens);

        // Filter out excluded tokens (checks baseToken.address)
        const excludedTokens = await getExcludedTokens(apiChainId);
        const excludedAddresses = new Set(excludedTokens.map(t => t.tokenAddress.toLowerCase()));

        const filtered = quoteFiltered.filter(
          pair => !excludedAddresses.has(pair.baseToken?.address?.toLowerCase() || '')
        );

        if (excludedAddresses.size > 0) {
          console.log(
            `[DEX API] Filtered out ${sorted.length - filtered.length} pairs with excluded tokens for ${apiChainId}`
          );
        }

        return filtered.slice(0, maxPairs);
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

    // Fetch pairs for each search target in parallel for better performance
    const allPairs: DexPair[] = [];
    const seenPairs = new Set<string>();

    // Parallel API calls with Promise.all to reduce total request time
    const searchResults = await Promise.all(
      searchTargets.map(async target => {
        try {
          const response = await retryWithBackoff(
            () => client.get(`search?q=${encodeURIComponent(target)}`).json<DexPairsResponse>(),
            { maxAttempts: 2 }
          );

          // Filter pairs from this chain (use mapped API chain ID)
          const chainPairs = (response.pairs || []).filter(
            (pair: DexPair) => pair.chainId?.toLowerCase() === apiChainId.toLowerCase()
          );

          console.log(
            `[DEX API] Search "${target}": found ${chainPairs.length} pairs for ${apiChainId}`
          );

          return chainPairs;
        } catch (error) {
          console.warn(`[DEX API] Failed to fetch pairs for target "${target}":`, error);
          return [];
        }
      })
    );

    // Deduplicate pairs by address
    searchResults.flat().forEach(pair => {
      if (!seenPairs.has(pair.pairAddress)) {
        seenPairs.add(pair.pairAddress);
        allPairs.push(pair);
      }
    });

    console.log(`[DEX API] Total unique pairs collected for ${apiChainId}: ${allPairs.length}`);

    // Calculate advanced momentum score for each pair
    // Combines: price change, volume, liquidity, buy pressure, trend consistency, and risk
    const pairsWithScore = allPairs.map(pair => {
      const momentumScore = calculateAdvancedMomentumScore(pair, timeframe);
      return { pair, score: momentumScore };
    });

    // Sort by momentum score (descending)
    const sorted = pairsWithScore.sort((a, b) => b.score - a.score).map(item => item.pair);

    // Filter by pair age (if specified)
    const ageFiltered = filterPairsByAge(sorted, pairMaxAge);

    // Filter by quote token (if specified)
    const quoteFiltered = filterPairsByQuoteToken(ageFiltered, quoteTokens);

    // Filter out excluded tokens (checks baseToken.address)
    const excludedTokens = await getExcludedTokens(apiChainId);
    const excludedAddresses = new Set(excludedTokens.map(t => t.tokenAddress.toLowerCase()));

    const filtered = quoteFiltered.filter(
      pair => !excludedAddresses.has(pair.baseToken?.address?.toLowerCase() || '')
    );

    if (excludedAddresses.size > 0) {
      console.log(
        `[DEX API] Filtered out ${sorted.length - filtered.length} pairs with excluded tokens for ${apiChainId}`
      );
    }

    // Return top N pairs (after exclusion)
    return filtered.slice(0, maxPairs);
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
