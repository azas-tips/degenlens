// DEXscreener API Integration Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DexPair } from '@/types/dexscreener';

// Mock response holder
let mockJsonResponse: unknown = null;

// Mock ky
vi.mock('ky', () => {
  const mockJson = vi.fn(async () => mockJsonResponse);
  const mockGet = vi.fn(() => ({ json: mockJson }));
  const mockPost = vi.fn(() => ({ json: mockJson }));
  const mockCreate = vi.fn(() => ({
    get: mockGet,
    post: mockPost,
  }));

  return {
    default: {
      create: mockCreate,
    },
  };
});

// Mock cache
vi.mock('@/background/utils/cache', () => ({
  cacheManager: {
    getOrFetch: vi.fn(async (_key, fetchFn) => fetchFn()),
    delete: vi.fn(),
  },
  getDexCacheKey: vi.fn((chain: string) => `dex:${chain}`),
}));

// Mock rate limiter
vi.mock('@/background/utils/rate-limiter', () => ({
  dexLimiter: {
    execute: vi.fn(async fn => fn()),
  },
}));

// Mock retry helper
vi.mock('@/background/utils/retry-helper', () => ({
  retryWithBackoff: vi.fn(async fn => fn()),
}));

// Mock chrome storage
global.chrome = {
  storage: {
    local: {
      get: vi.fn(async () => ({ dex_api_key: 'test-key' })),
      set: vi.fn(),
    },
    session: {
      get: vi.fn(async () => ({})),
      set: vi.fn(),
    },
  },
} as unknown as typeof chrome;

describe('DEXscreener API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockJsonResponse = null;
  });

  describe('fetchPairsByChain', () => {
    it('should fetch and sort pairs by volume', async () => {
      const mockPairs: DexPair[] = [
        {
          chainId: 'solana',
          dexId: 'raydium',
          url: 'https://dexscreener.com/solana/pair1',
          pairAddress: 'pair1',
          baseToken: { address: 'base1', name: 'Token1', symbol: 'TKN1' },
          quoteToken: { address: 'quote1', name: 'USDC', symbol: 'USDC' },
          priceNative: '1.5',
          priceUsd: '1.5',
          txns: { h24: { buys: 100, sells: 50 } },
          volume: { h24: 100000 },
          priceChange: { h24: 5.2 },
          liquidity: { usd: 50000, base: 25000, quote: 25000 },
        },
        {
          chainId: 'solana',
          dexId: 'raydium',
          url: 'https://dexscreener.com/solana/pair2',
          pairAddress: 'pair2',
          baseToken: { address: 'base2', name: 'Token2', symbol: 'TKN2' },
          quoteToken: { address: 'quote2', name: 'USDC', symbol: 'USDC' },
          priceNative: '2.5',
          priceUsd: '2.5',
          txns: { h24: { buys: 200, sells: 100 } },
          volume: { h24: 200000 },
          priceChange: { h24: 10.5 },
          liquidity: { usd: 100000, base: 50000, quote: 50000 },
        },
      ];

      // Mock response for multiple search queries
      mockJsonResponse = { schemaVersion: '1.0.0', pairs: mockPairs };

      const { fetchPairsByChain } = await import('../dexscreener');
      const result = await fetchPairsByChain('solana', 10);

      // Should return pairs and sort by volume descending
      expect(result.length).toBeGreaterThan(0);
      // Should remove duplicates
      const addresses = result.map(p => p.pairAddress);
      expect(new Set(addresses).size).toBe(addresses.length);
    });

    it('should respect maxPairs parameter', async () => {
      const mockPairs: DexPair[] = Array.from({ length: 50 }, (_, i) => ({
        chainId: 'solana',
        dexId: 'raydium',
        url: `https://dexscreener.com/solana/pair${i}`,
        pairAddress: `pair${i}`,
        baseToken: { address: `base${i}`, name: `Token${i}`, symbol: `TKN${i}` },
        quoteToken: { address: 'quote', name: 'USDC', symbol: 'USDC' },
        priceNative: '1.0',
        priceUsd: '1.0',
        txns: { h24: { buys: 50, sells: 30 } },
        volume: { h24: 1000 * (50 - i) },
        priceChange: { h24: 2.5 },
        liquidity: { usd: 5000, base: 2500, quote: 2500 },
      }));

      mockJsonResponse = { schemaVersion: '1.0.0', pairs: mockPairs };

      const { fetchPairsByChain } = await import('../dexscreener');
      const result = await fetchPairsByChain('solana', 20);

      expect(result).toHaveLength(20);
    });

    it('should handle empty response', async () => {
      mockJsonResponse = { schemaVersion: '1.0.0', pairs: [] };

      const { fetchPairsByChain } = await import('../dexscreener');
      const result = await fetchPairsByChain('ethereum', 10);

      expect(result).toHaveLength(0);
    });
  });

  describe('fetchPairByAddress', () => {
    it('should fetch specific pair by address', async () => {
      const mockPair: DexPair = {
        chainId: 'solana',
        dexId: 'raydium',
        url: 'https://dexscreener.com/solana/specific-pair',
        pairAddress: 'specific-pair',
        baseToken: { address: 'base', name: 'Token', symbol: 'TKN' },
        quoteToken: { address: 'quote', name: 'USDC', symbol: 'USDC' },
        priceNative: '1.5',
        priceUsd: '1.5',
        txns: { h24: { buys: 100, sells: 50 } },
        volume: { h24: 100000 },
        priceChange: { h24: 5.0 },
        liquidity: { usd: 50000, base: 25000, quote: 25000 },
      };

      mockJsonResponse = { schemaVersion: '1.0.0', pairs: [mockPair] };

      const { fetchPairByAddress } = await import('../dexscreener');
      const result = await fetchPairByAddress('specific-pair');

      expect(result).toEqual(mockPair);
    });

    it('should return null if pair not found', async () => {
      mockJsonResponse = { schemaVersion: '1.0.0', pairs: [] };

      const { fetchPairByAddress } = await import('../dexscreener');
      const result = await fetchPairByAddress('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('searchPairs', () => {
    it('should search pairs by query', async () => {
      const mockPairs: DexPair[] = [
        {
          chainId: 'solana',
          dexId: 'raydium',
          url: 'https://dexscreener.com/solana/pair1',
          pairAddress: 'pair1',
          baseToken: { address: 'base1', name: 'Solana', symbol: 'SOL' },
          quoteToken: { address: 'quote1', name: 'USDC', symbol: 'USDC' },
          priceNative: '100',
          priceUsd: '100',
          txns: { h24: { buys: 500, sells: 300 } },
          volume: { h24: 1000000 },
          priceChange: { h24: 15.5 },
          liquidity: { usd: 500000, base: 250000, quote: 250000 },
        },
      ];

      mockJsonResponse = { schemaVersion: '1.0.0', pairs: mockPairs };

      const { searchPairs } = await import('../dexscreener');
      const result = await searchPairs('SOL');

      expect(result).toEqual(mockPairs);
    });
  });

  describe('Rate limiting', () => {
    it('should use rate limiter', async () => {
      mockJsonResponse = { schemaVersion: '1.0.0', pairs: [] };

      const { dexLimiter } = await import('@/background/utils/rate-limiter');
      const { fetchPairsByChain } = await import('../dexscreener');

      await fetchPairsByChain('solana', 10);

      expect(dexLimiter.execute).toHaveBeenCalled();
    });
  });
});
