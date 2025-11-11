// Results Table Component
// Displays analysis results in a formatted table

import type { AnalysisResult } from '../stores/app.store';

interface ResultsTableProps {
  data: AnalysisResult;
}

interface PairData {
  symbol?: string;
  priceUsd?: string;
  volume24h?: number;
  liquidity?: number;
  priceChange24h?: number;
  analysis?: string;
  score?: number;
}

export function ResultsTable({ data }: ResultsTableProps) {
  // TODO: Define proper type structure for analysis results
  // For now, assume data.pairs is an array of pair objects
  const pairs = (data.pairs || []) as PairData[];

  if (pairs.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="text-4xl mb-2">📭</div>
        <p className="text-sm">No results found</p>
      </div>
    );
  }

  /**
   * Format large numbers with K/M/B suffixes
   */
  const formatNumber = (num: number): string => {
    if (num >= 1_000_000_000) {
      return `$${(num / 1_000_000_000).toFixed(2)}B`;
    }
    if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(2)}M`;
    }
    if (num >= 1_000) {
      return `$${(num / 1_000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  /**
   * Format price change with color
   */
  const formatPriceChange = (change: number) => {
    const isPositive = change >= 0;
    const colorClass = isPositive ? 'text-profit' : 'text-loss';
    const sign = isPositive ? '+' : '';
    return (
      <span className={colorClass}>
        {sign}
        {change.toFixed(2)}%
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Metadata */}
      {data.metadata && (
        <div className="flex justify-between text-xs text-gray-400 pb-2 border-b border-gray-800">
          {data.metadata.tokensUsed && (
            <span>Tokens Used: {data.metadata.tokensUsed.toLocaleString()}</span>
          )}
          {data.metadata.estimatedCost && (
            <span className="text-primary">Cost: ${data.metadata.estimatedCost.toFixed(4)}</span>
          )}
        </div>
      )}

      {/* Analysis Summary */}
      {data.analysis && (
        <div className="p-3 bg-dark-lighter border border-gray-700 rounded">
          <h3 className="text-sm font-medium mb-2">AI Analysis Summary</h3>
          <p className="text-xs text-gray-300 whitespace-pre-wrap">{data.analysis}</p>
        </div>
      )}

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-400 border-b border-gray-800">
            <tr>
              <th className="text-left p-2">Token</th>
              <th className="text-right p-2">Price</th>
              <th className="text-right p-2">24h %</th>
              <th className="text-right p-2">Volume</th>
              <th className="text-right p-2">Liquidity</th>
              <th className="text-right p-2">Score</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {pairs.map((pair, index) => (
              <tr
                key={index}
                className="border-b border-gray-800 hover:bg-dark-lighter transition-colors"
              >
                <td className="p-2 font-medium">{pair.symbol || 'Unknown'}</td>
                <td className="text-right p-2 text-gray-300">
                  {pair.priceUsd
                    ? parseFloat(pair.priceUsd) < 0.01
                      ? `$${parseFloat(pair.priceUsd).toExponential(2)}`
                      : `$${parseFloat(pair.priceUsd).toFixed(4)}`
                    : 'N/A'}
                </td>
                <td className="text-right p-2">
                  {pair.priceChange24h !== undefined
                    ? formatPriceChange(pair.priceChange24h)
                    : 'N/A'}
                </td>
                <td className="text-right p-2 text-gray-300">
                  {pair.volume24h ? formatNumber(pair.volume24h) : 'N/A'}
                </td>
                <td className="text-right p-2 text-gray-300">
                  {pair.liquidity ? formatNumber(pair.liquidity) : 'N/A'}
                </td>
                <td className="text-right p-2">
                  {pair.score !== undefined ? (
                    <span
                      className={
                        pair.score >= 7
                          ? 'text-profit font-medium'
                          : pair.score >= 4
                            ? 'text-yellow-400'
                            : 'text-gray-400'
                      }
                    >
                      {pair.score}/10
                    </span>
                  ) : (
                    'N/A'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Individual Analysis */}
      {pairs.some(p => p.analysis) && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Detailed Analysis</h3>
          {pairs.map((pair, index) =>
            pair.analysis ? (
              <div key={index} className="p-3 bg-dark-lighter border border-gray-700 rounded">
                <p className="text-xs font-medium text-gray-300 mb-1">{pair.symbol}</p>
                <p className="text-xs text-gray-400">{pair.analysis}</p>
              </div>
            ) : null
          )}
        </div>
      )}

      {/* Footer Note */}
      <div className="pt-2 text-xs text-gray-500 text-center">
        <p>Data is provided for informational purposes only.</p>
        <p>Always DYOR before making any investment decisions.</p>
      </div>
    </div>
  );
}
