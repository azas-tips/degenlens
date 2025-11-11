// Cache Manager Utility
// Manages cache in chrome.storage.session with TTL and LRU eviction

const TTL_MS = 60_000; // 1 minute
const MAX_ENTRIES = 5;
const INDEX_KEY = 'cache_index';

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Cache Manager
 * Manages cache entries with TTL and LRU eviction
 */
export class CacheManager {
  /**
   * Get cache index (list of cache keys in LRU order)
   */
  private async getCacheIndex(): Promise<string[]> {
    const obj = await chrome.storage.session.get(INDEX_KEY);
    return Array.isArray(obj[INDEX_KEY]) ? obj[INDEX_KEY] : [];
  }

  /**
   * Set cache index
   */
  private async setCacheIndex(keys: string[]): Promise<void> {
    await chrome.storage.session.set({ [INDEX_KEY]: keys });
  }

  /**
   * Promote key to front of LRU list
   * Also evicts old entries if MAX_ENTRIES is exceeded
   */
  private async promoteKey(key: string): Promise<void> {
    let index = await this.getCacheIndex();

    // Remove key if it exists
    index = index.filter(k => k !== key);

    // Add to front
    index.unshift(key);

    // Evict oldest entries if exceeding max
    if (index.length > MAX_ENTRIES) {
      const removed = index.splice(MAX_ENTRIES);
      await chrome.storage.session.remove(removed);
    }

    await this.setCacheIndex(index);
  }

  /**
   * Get cached value
   * Returns null if not found or expired
   */
  async get<T>(key: string): Promise<T | null> {
    const obj = await chrome.storage.session.get(key);
    const hit = obj[key] as CacheEntry<T> | undefined;

    if (!hit) return null;

    // Check TTL
    if (Date.now() - hit.timestamp > TTL_MS) {
      // Expired, remove it
      await chrome.storage.session.remove(key);
      return null;
    }

    // Valid cache hit, promote to front
    await this.promoteKey(key);
    return hit.data;
  }

  /**
   * Set cached value
   */
  async set<T>(key: string, data: T, metadata?: Record<string, unknown>): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      metadata,
    };

    await chrome.storage.session.set({ [key]: entry });
    await this.promoteKey(key);
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<void> {
    await chrome.storage.session.remove(key);

    // Remove from index
    const index = await this.getCacheIndex();
    const filtered = index.filter(k => k !== key);
    await this.setCacheIndex(filtered);
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    await chrome.storage.session.clear();
  }

  /**
   * Get or fetch with caching
   * If cache hit, return cached value
   * If cache miss, execute fetcher and cache result
   */
  async getOrFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      console.log(`[Cache] Hit: ${key}`);
      return cached;
    }

    // Cache miss, fetch data
    console.log(`[Cache] Miss: ${key}`);
    const data = await fetcher();

    // Cache the result
    await this.set(key, data);

    return data;
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();

/**
 * Helper: Generate cache key for DEXscreener pairs
 */
export function getDexCacheKey(chain: string): string {
  return `dex_${chain}`;
}

/**
 * Helper: Generate cache key for OpenRouter models
 */
export function getModelsCacheKey(): string {
  return 'models_list';
}
