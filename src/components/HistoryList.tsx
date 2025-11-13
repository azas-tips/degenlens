// History List Component
// Displays analysis history with filtering and search

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/i18n';
import type { HistoryEntry } from '@/types/analysis';
import { getHistory, deleteHistoryEntry, clearHistory, getHistoryStats } from '@/utils/history';
import { TopPickDisplay } from './TopPickDisplay';

export function HistoryList() {
  const { t } = useTranslation();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [filterChain, setFilterChain] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<{
    totalEntries: number;
    totalCost: number;
    chainBreakdown: Record<string, number>;
  } | null>(null);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const [historyData, statsData] = await Promise.all([getHistory(), getHistoryStats()]);
      setHistory(historyData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...history];

    // Filter by chain
    if (filterChain) {
      filtered = filtered.filter(entry => entry.chain === filterChain);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        entry =>
          entry.topPickSymbol?.toLowerCase().includes(query) ||
          entry.chain.toLowerCase().includes(query) ||
          entry.model.toLowerCase().includes(query)
      );
    }

    setFilteredHistory(filtered);
  }, [history, filterChain, searchQuery]);

  // Apply filters when history or filter criteria change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleDelete = async (id: string) => {
    if (confirm(t('history.confirmDelete'))) {
      await deleteHistoryEntry(id);
      await loadHistory();
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
      }
    }
  };

  const handleClearAll = async () => {
    if (confirm(t('history.confirmClearAll'))) {
      await clearHistory();
      await loadHistory();
      setSelectedEntry(null);
    }
  };

  const handleEntryClick = (entry: HistoryEntry) => {
    setSelectedEntry(entry);
  };

  const handleBackToList = () => {
    setSelectedEntry(null);
  };

  // Get unique chains for filter
  const uniqueChains = Array.from(new Set(history.map(entry => entry.chain)));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-neon-cyan font-mono">Loading history...</div>
      </div>
    );
  }

  // Show selected entry detail
  if (selectedEntry) {
    return (
      <div className="space-y-4 animate-fade-in">
        {/* Back button */}
        <button
          onClick={handleBackToList}
          className="neon-button px-4 py-2 bg-cyber-card hover:bg-cyber-darker border border-purple-500/30 hover:border-neon-cyan/50 rounded-lg transition-all text-neon-cyan font-mono text-sm"
        >
          ← {t('history.backToList')}
        </button>

        {/* Entry metadata */}
        <div className="cyber-card p-4 space-y-2 text-sm font-mono">
          <div className="flex justify-between">
            <span className="text-gray-400">Chain:</span>
            <span className="text-neon-cyan uppercase">{selectedEntry.chain}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Model:</span>
            <span className="text-gray-300 truncate ml-2">{selectedEntry.model}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Timeframe:</span>
            <span className="text-neon-cyan uppercase">{selectedEntry.timeframe}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Analyzed:</span>
            <span className="text-gray-300">
              {new Date(selectedEntry.timestamp).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Analysis result */}
        <TopPickDisplay data={selectedEntry.result} />
      </div>
    );
  }

  // Show history list
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Stats summary */}
      {stats && (
        <div className="cyber-card p-4 space-y-2">
          <div className="flex justify-between items-center text-sm font-mono">
            <span className="text-gray-400">Total Analyses:</span>
            <span className="text-neon-cyan font-bold">{stats.totalEntries}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-mono">
            <span className="text-gray-400">Total Cost:</span>
            <span className="text-neon-green font-bold">${stats.totalCost.toFixed(4)}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="cyber-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Chain filter */}
          <select
            value={filterChain}
            onChange={e => setFilterChain(e.target.value)}
            className="flex-1 bg-cyber-darker border border-purple-500/30 rounded-lg px-3 py-2 text-gray-200 font-mono text-sm focus:outline-none focus:border-neon-cyan/50"
          >
            <option value="">All Chains</option>
            {uniqueChains.map(chain => (
              <option key={chain} value={chain}>
                {chain.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-cyber-darker border border-purple-500/30 rounded-lg px-3 py-2 text-gray-200 font-mono text-sm focus:outline-none focus:border-neon-cyan/50 placeholder-gray-500"
          />
        </div>

        {/* Clear all button */}
        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="w-full neon-button px-4 py-2 bg-gradient-to-r from-red-900/20 to-red-800/20 hover:from-red-900/30 hover:to-red-800/30 border border-red-500/30 hover:border-red-500/50 text-red-400 rounded-lg font-mono text-sm transition-all"
          >
            {t('history.clearAll')}
          </button>
        )}
      </div>

      {/* History list */}
      {filteredHistory.length === 0 ? (
        <div className="cyber-card p-12 text-center">
          <p className="text-gray-400 font-mono">
            {history.length === 0 ? t('history.noHistory') : t('history.noResults')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map(entry => (
            <div
              key={entry.id}
              onClick={() => handleEntryClick(entry)}
              className="cyber-card p-4 cursor-pointer hover:border-neon-cyan/50 transition-all group"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  {entry.topPickSymbol && (
                    <div className="text-neon-cyan font-bold text-lg mb-1">
                      {entry.topPickSymbol}
                    </div>
                  )}
                  <div className="text-xs font-mono text-gray-400 space-y-1">
                    <div>
                      {entry.chain.toUpperCase()} • {entry.timeframe.toUpperCase()} •{' '}
                      {entry.maxPairs} pairs
                    </div>
                    <div className="truncate max-w-md" title={entry.model}>
                      {entry.model}
                    </div>
                    <div>{new Date(entry.timestamp).toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {entry.result.metadata?.estimatedCost && (
                    <div className="text-xs font-mono text-neon-green">
                      ${entry.result.metadata.estimatedCost.toFixed(4)}
                    </div>
                  )}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDelete(entry.id);
                    }}
                    className="text-red-400 hover:text-red-300 transition-colors text-sm"
                    title={t('history.delete')}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {entry.result.topPick?.reason && (
                <div className="text-sm text-gray-300 line-clamp-2 mt-2">
                  {entry.result.topPick.reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
