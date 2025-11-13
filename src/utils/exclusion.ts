// Exclusion List Management
// Utilities for managing excluded tokens (not pairs - excludes all pairs containing the token)

import { STORAGE_KEYS, type ExcludedToken } from '@/types/storage';

/**
 * Add a token to the exclusion list
 * @param token - Token information to exclude
 */
export async function addExcludedToken(token: ExcludedToken): Promise<void> {
  try {
    const existingList = await getExcludedTokens();

    // Check if token already excluded
    const alreadyExcluded = existingList.some(
      excluded =>
        excluded.tokenAddress.toLowerCase() === token.tokenAddress.toLowerCase() &&
        excluded.chainId.toLowerCase() === token.chainId.toLowerCase()
    );

    if (alreadyExcluded) {
      console.log('[Exclusion] Token already excluded:', token.symbol);
      return;
    }

    // Add to list with timestamp
    const updatedList = [
      ...existingList,
      {
        ...token,
        excludedAt: new Date().toISOString(),
      },
    ];

    await chrome.storage.local.set({
      [STORAGE_KEYS.EXCLUDED_TOKENS]: updatedList,
    });

    console.log('[Exclusion] Added token to exclusion list:', token.symbol);
  } catch (error) {
    console.error('[Exclusion] Failed to add to exclusion list:', error);
    throw error;
  }
}

/**
 * Get all excluded tokens
 * @param chainId - Optional chain filter
 * @returns Array of excluded tokens
 */
export async function getExcludedTokens(chainId?: string): Promise<ExcludedToken[]> {
  try {
    const storage = await chrome.storage.local.get(STORAGE_KEYS.EXCLUDED_TOKENS);
    const list = (storage[STORAGE_KEYS.EXCLUDED_TOKENS] as ExcludedToken[]) || [];

    // Filter by chain if specified
    if (chainId) {
      return list.filter(token => token.chainId.toLowerCase() === chainId.toLowerCase());
    }

    return list;
  } catch (error) {
    console.error('[Exclusion] Failed to get exclusion list:', error);
    return [];
  }
}

/**
 * Remove a token from the exclusion list
 * @param tokenAddress - Token address to remove
 * @param chainId - Chain identifier
 */
export async function removeExcludedToken(tokenAddress: string, chainId: string): Promise<void> {
  try {
    const existingList = await getExcludedTokens();

    const updatedList = existingList.filter(
      token =>
        !(
          token.tokenAddress.toLowerCase() === tokenAddress.toLowerCase() &&
          token.chainId.toLowerCase() === chainId.toLowerCase()
        )
    );

    await chrome.storage.local.set({
      [STORAGE_KEYS.EXCLUDED_TOKENS]: updatedList,
    });

    console.log('[Exclusion] Removed token from exclusion list:', tokenAddress);
  } catch (error) {
    console.error('[Exclusion] Failed to remove from exclusion list:', error);
    throw error;
  }
}

/**
 * Clear all excluded tokens
 * @param chainId - Optional: clear only tokens from specific chain
 */
export async function clearExcludedTokens(chainId?: string): Promise<void> {
  try {
    if (chainId) {
      // Clear only for specific chain
      const existingList = await getExcludedTokens();
      const updatedList = existingList.filter(
        token => token.chainId.toLowerCase() !== chainId.toLowerCase()
      );

      await chrome.storage.local.set({
        [STORAGE_KEYS.EXCLUDED_TOKENS]: updatedList,
      });
      console.log('[Exclusion] Cleared exclusion list for chain:', chainId);
    } else {
      // Clear all
      await chrome.storage.local.set({
        [STORAGE_KEYS.EXCLUDED_TOKENS]: [],
      });
      console.log('[Exclusion] Cleared all exclusions');
    }
  } catch (error) {
    console.error('[Exclusion] Failed to clear exclusion list:', error);
    throw error;
  }
}

/**
 * Check if a token is excluded
 * @param tokenAddress - Token address to check
 * @param chainId - Chain identifier
 * @returns True if excluded
 */
export async function isTokenExcluded(tokenAddress: string, chainId: string): Promise<boolean> {
  try {
    const list = await getExcludedTokens(chainId);
    return list.some(token => token.tokenAddress.toLowerCase() === tokenAddress.toLowerCase());
  } catch (error) {
    console.error('[Exclusion] Failed to check exclusion status:', error);
    return false;
  }
}

/**
 * Get exclusion list statistics
 * @returns Statistics about excluded tokens
 */
export async function getExclusionStats(): Promise<{
  total: number;
  byChain: Record<string, number>;
}> {
  try {
    const list = await getExcludedTokens();

    const byChain: Record<string, number> = {};
    list.forEach(token => {
      byChain[token.chainId] = (byChain[token.chainId] || 0) + 1;
    });

    return {
      total: list.length,
      byChain,
    };
  } catch (error) {
    console.error('[Exclusion] Failed to get exclusion stats:', error);
    return { total: 0, byChain: {} };
  }
}
