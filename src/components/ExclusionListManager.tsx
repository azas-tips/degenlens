// Exclusion List Manager Component
// Displays and manages excluded tokens

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/i18n';
import type { ExcludedToken } from '@/types/storage';
import { getExcludedTokens, removeExcludedToken, clearExcludedTokens } from '@/utils/exclusion';

interface ExclusionListManagerProps {
  chainId?: string; // Optional: filter by specific chain
}

export function ExclusionListManager({ chainId }: ExclusionListManagerProps) {
  const { t } = useTranslation();
  const [excludedTokens, setExcludedTokens] = useState<ExcludedToken[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  /**
   * Load exclusion list from storage
   */
  const loadExclusions = useCallback(async () => {
    try {
      setLoading(true);
      const list = await getExcludedTokens(chainId);
      setExcludedTokens(list);
    } catch (error) {
      console.error('[ExclusionListManager] Failed to load exclusions:', error);
    } finally {
      setLoading(false);
    }
  }, [chainId]);

  /**
   * Remove a token from exclusion list
   */
  const handleRemove = async (tokenAddress: string, tokenChainId: string) => {
    try {
      await removeExcludedToken(tokenAddress, tokenChainId);
      await loadExclusions();
      // No need to clear results - just update the exclusion list
    } catch (error) {
      console.error('[ExclusionListManager] Failed to remove exclusion:', error);
    }
  };

  /**
   * Clear all exclusions
   */
  const handleClearAll = async () => {
    if (!window.confirm(t('exclusion.confirmClearAll'))) {
      return;
    }

    try {
      await clearExcludedTokens(chainId);
      await loadExclusions();
      // No need to clear results - just update the exclusion list
    } catch (error) {
      console.error('[ExclusionListManager] Failed to clear exclusions:', error);
    }
  };

  /**
   * Load exclusions on mount and when chainId changes
   */
  useEffect(() => {
    loadExclusions();
  }, [loadExclusions]);

  // Don't render if no exclusions
  if (!loading && excludedTokens.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="bg-cyber-darker/50 border-2 border-neon-pink/30 rounded-lg overflow-hidden shadow-neon-pink/20">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-neon-pink/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🚫</span>
            <div className="text-left">
              <h3 className="text-sm font-bold text-neon-pink">
                {t('exclusion.title')}
                <span className="ml-2 px-2 py-0.5 bg-neon-pink/20 border border-neon-pink/50 rounded-full text-xs font-mono">
                  {excludedTokens.length}
                </span>
              </h3>
              {!isExpanded && (
                <p className="text-xs text-gray-400 font-mono">{t('exclusion.subtitle')}</p>
              )}
            </div>
          </div>
          <span className={`text-neon-cyan transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-3">
            {loading ? (
              <div className="text-center py-4 text-gray-400 text-sm font-mono">
                {t('exclusion.loading')}
              </div>
            ) : (
              <>
                {/* Help Text */}
                <p className="text-xs text-gray-400 font-mono">{t('exclusion.description')}</p>

                {/* Excluded Tokens List */}
                <div className="flex flex-wrap gap-2">
                  {excludedTokens.map(token => (
                    <div
                      key={`${token.chainId}-${token.tokenAddress}`}
                      className="group inline-flex items-center gap-2 px-3 py-1.5 bg-cyber-darker border-2 border-neon-pink/30 rounded-full text-xs font-mono hover:border-neon-pink/50 transition-colors"
                    >
                      <span className="text-neon-pink font-bold">{token.symbol}</span>
                      <span className="text-gray-500">|</span>
                      <span className="text-gray-400">{token.chainId}</span>
                      <button
                        onClick={() => handleRemove(token.tokenAddress, token.chainId)}
                        className="ml-1 text-gray-500 hover:text-neon-pink transition-colors"
                        title={t('exclusion.remove')}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Clear All Button */}
                {excludedTokens.length > 0 && (
                  <div className="pt-2 border-t border-purple-500/20">
                    <button
                      onClick={handleClearAll}
                      className="w-full px-4 py-2 bg-neon-pink/10 border border-neon-pink/30 hover:bg-neon-pink/20 hover:border-neon-pink/50 rounded-lg text-neon-pink text-sm font-bold transition-all"
                    >
                      {t('exclusion.clearAll')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
