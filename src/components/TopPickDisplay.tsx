// Top Pick Display Component
// Displays THE TOP PICK prominently for degen trading

import { useState, type ReactElement } from 'react';
import { useTranslation } from '@/i18n';
import type { AnalysisResult } from '@/types/analysis';
import { getRiskLevelInfo } from '@/utils/risk-assessment';
import { RiskBreakdown } from './RiskBreakdown';
import { RiskScoreGauge } from './RiskScoreGauge';
import { addExcludedToken } from '@/utils/exclusion';
import type { ExcludedToken } from '@/types/storage';
import { FaXTwitter } from 'react-icons/fa6';
import { FaTelegramPlane, FaDiscord, FaGlobe } from 'react-icons/fa';

interface TopPickDisplayProps {
  data: AnalysisResult;
}

export function TopPickDisplay({ data }: TopPickDisplayProps) {
  const { topPick, pairs = [] } = data;
  const [copied, setCopied] = useState(false);
  const [excluding, setExcluding] = useState(false);
  const { t } = useTranslation();

  /**
   * Copy contract address to clipboard
   */
  const copyContractAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  /**
   * Exclude this token from future analysis (excludes all pairs containing this token)
   */
  const handleExclude = async () => {
    if (!topPick?.contractAddress || !topPick?.chainId) {
      console.error('[TopPickDisplay] Missing required data for exclusion');
      return;
    }

    // Extract token symbol (base token only, not the pair)
    const tokenSymbol = topPick.symbol?.split('/')[0] || 'this token';

    if (!window.confirm(t('exclusion.confirmExclude', { symbol: tokenSymbol }))) {
      return;
    }

    try {
      setExcluding(true);

      const exclusionData: ExcludedToken = {
        tokenAddress: topPick.contractAddress, // Base token address
        symbol: tokenSymbol, // Token symbol only (e.g., "BONK", not "BONK/SOL")
        chainId: topPick.chainId,
        excludedAt: new Date().toISOString(),
      };

      await addExcludedToken(exclusionData);

      // Show success message (no need to notify parent - results stay visible)
      alert(t('exclusion.excludeSuccess', { symbol: tokenSymbol }));
    } catch (error) {
      console.error('[TopPickDisplay] Failed to exclude token:', error);
      alert(t('exclusion.excludeFailed'));
    } finally {
      setExcluding(false);
    }
  };

  if (!topPick && pairs.length === 0) {
    return (
      <div className="gradient-border rounded-2xl p-12 text-center scanline">
        <div className="mb-8 flex items-center justify-center">
          <div className="relative w-20 h-20">
            {/* Cross lines */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-gray-500 to-transparent"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-full w-0.5 bg-gradient-to-b from-transparent via-gray-500 to-transparent"></div>
            </div>
            {/* Center square */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gray-600/50 rotate-45"></div>
            </div>
          </div>
        </div>
        <p className="text-lg font-mono text-gray-400">No results found</p>
      </div>
    );
  }

  /**
   * Get momentum phase styling
   */
  const getMomentumPhaseStyle = (phase?: string) => {
    if (phase === 'Strong') {
      return 'bg-gradient-to-r from-neon-green to-profit text-white shadow-neon-green animate-glow-pulse';
    }
    if (phase === 'Moderate') {
      return 'bg-gradient-to-r from-yellow-500 to-neon-cyan text-white shadow-neon-cyan';
    }
    if (phase === 'Weak' || phase === 'Consolidating') {
      return 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 border border-purple-500/30';
    }
    return 'bg-cyber-darker border border-purple-500/30 text-gray-400';
  };

  /**
   * Get moonshot potential styling
   */
  const getMoonshotStyle = (potential?: string) => {
    if (potential?.includes('10x')) {
      return 'text-neon-green font-bold text-3xl neon-text animate-glow-pulse';
    }
    if (potential?.includes('5x')) {
      return 'text-neon-green font-bold text-2xl neon-text';
    }
    if (potential?.includes('3x')) {
      return 'text-neon-cyan font-bold text-xl';
    }
    return 'text-gray-400 text-lg';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metadata */}
      {data.metadata && (
        <div className="space-y-2 text-xs font-mono pb-3 border-b border-purple-500/30">
          <div className="flex justify-between items-center">
            {data.metadata.tokensUsed && (
              <span className="text-neon-cyan">
                {t('results.tokensUsed', { count: data.metadata.tokensUsed.toLocaleString() })}
              </span>
            )}
            {data.metadata.estimatedCost && (
              <span className="text-neon-green font-bold">
                {t('results.cost', { amount: data.metadata.estimatedCost.toFixed(4) })}
              </span>
            )}
          </div>
          {data.metadata.model && (
            <div className="text-gray-400 text-center truncate" title={data.metadata.model}>
              Model: {data.metadata.model}
            </div>
          )}
          {(data.metadata.chain || data.metadata.timeframe) && (
            <div className="text-gray-400 text-center">
              {data.metadata.chain && <span className="uppercase">{data.metadata.chain}</span>}
              {data.metadata.chain && data.metadata.timeframe && <span> • </span>}
              {data.metadata.timeframe && (
                <span className="uppercase">{data.metadata.timeframe}</span>
              )}
            </div>
          )}
          {data.metadata.analyzedAt && (
            <div className="text-gray-400 text-center">
              {t('results.analyzedAt', {
                date: new Date(data.metadata.analyzedAt).toLocaleString(),
              })}
            </div>
          )}
        </div>
      )}

      {/* TOP PICK - THE ONE */}
      {topPick && (
        <div className="relative cyber-card p-8 bg-gradient-to-br from-primary/20 via-cyber-card to-neon-purple/10 border-2 border-primary rounded-2xl shadow-neon-purple animate-slide-in">
          <div className="absolute top-4 right-4 text-sm font-bold text-neon-green uppercase tracking-widest animate-glow-pulse">
            Top Pick
          </div>

          {/* Symbol */}
          <div className="mb-6">
            <h2 className="text-4xl font-bold neon-text mb-3 tracking-wide">{topPick.symbol}</h2>

            {/* Social Links */}
            {(topPick.socials && topPick.socials.length > 0) ||
            (topPick.websites && topPick.websites.length > 0) ? (
              <div className="flex items-center gap-3 mb-3">
                {topPick.socials?.map((social, idx) => {
                  let icon: ReactElement | null = null;
                  let url = '';

                  if (social.platform === 'twitter') {
                    icon = <FaXTwitter className="w-5 h-5" />;
                    url = `https://twitter.com/${social.handle.replace(/^@/, '')}`;
                  } else if (social.platform === 'telegram') {
                    icon = <FaTelegramPlane className="w-5 h-5" />;
                    url = `https://t.me/${social.handle.replace(/^@/, '')}`;
                  } else if (social.platform === 'discord') {
                    icon = <FaDiscord className="w-5 h-5" />;
                    url = social.handle.startsWith('http')
                      ? social.handle
                      : `https://discord.gg/${social.handle}`;
                  }

                  if (!icon) return null;

                  return (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-neon-cyan transition-colors duration-200"
                      title={`${social.platform.charAt(0).toUpperCase() + social.platform.slice(1)}`}
                    >
                      {icon}
                    </a>
                  );
                })}

                {topPick.websites?.map((website, idx) => (
                  <a
                    key={`web-${idx}`}
                    href={website.url.startsWith('http') ? website.url : `https://${website.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-neon-cyan transition-colors duration-200"
                    title="Website"
                  >
                    <FaGlobe className="w-5 h-5" />
                  </a>
                ))}
              </div>
            ) : null}

            <div className="flex items-center gap-3 mb-2">
              <div className={getMoonshotStyle(topPick.moonshotPotential)}>
                {topPick.moonshotPotential || 'High Potential'}
              </div>
              {topPick.riskLevel &&
                (() => {
                  const riskInfo = getRiskLevelInfo(topPick.riskLevel);
                  return (
                    <div
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${riskInfo.color} bg-cyber-darker/80 border-2 ${riskInfo.color.replace('text-', 'border-')}/50`}
                      title={riskInfo.description}
                    >
                      <span className="text-2xl">{riskInfo.emoji}</span>
                      <span>{riskInfo.label}</span>
                    </div>
                  );
                })()}
            </div>
            {topPick.riskFactors && topPick.riskFactors.length > 0 && (
              <div className="mt-3 p-3 bg-cyber-darker/50 border border-yellow-500/30 rounded-lg">
                <div className="text-xs text-yellow-500 uppercase tracking-wide mb-2 font-bold">
                  ⚠️ {t('results.riskFactors')}
                </div>
                <ul className="text-xs text-gray-300 space-y-1">
                  {topPick.riskFactors.map((factor, idx) => (
                    <li key={idx} className="font-mono">
                      • {factor.key ? t(factor.key, factor.params) : factor.fallback}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Momentum Phase */}
          {topPick.momentumPhase && (
            <div className="mb-6">
              <span
                className={`inline-block px-6 py-3 rounded-full text-sm font-bold tracking-wider ${getMomentumPhaseStyle(topPick.momentumPhase)}`}
              >
                {topPick.momentumPhase}
              </span>
            </div>
          )}

          {/* Reason */}
          {topPick.reason && (
            <div className="mb-6 p-5 bg-cyber-darker/80 border border-purple-500/30 rounded-xl backdrop-blur-sm">
              <p className="text-sm text-gray-200 leading-relaxed font-mono">{topPick.reason}</p>
            </div>
          )}

          {/* Catalyst & Momentum */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {topPick.catalyst && (
              <div className="p-4 bg-cyber-darker/50 border border-purple-500/20 rounded-lg">
                <div className="text-xs text-neon-cyan uppercase tracking-wide mb-2 font-bold">
                  Catalyst
                </div>
                <div className="text-sm text-gray-200 font-mono">{topPick.catalyst}</div>
              </div>
            )}
            {topPick.momentum !== undefined && (
              <div className="p-4 bg-cyber-darker/50 border border-purple-500/20 rounded-lg">
                <div className="text-xs text-neon-cyan uppercase tracking-wide mb-2 font-bold">
                  Momentum
                </div>
                <div className="text-2xl font-bold text-neon-green neon-text">
                  {topPick.momentum}/10
                </div>
              </div>
            )}
          </div>

          {/* Risk Assessment Visualization */}
          {topPick.riskBreakdown && topPick.riskLevel && (
            <div className="mb-6 space-y-6">
              {/* Visual Gauge */}
              <RiskScoreGauge
                score={
                  topPick.riskBreakdown.ageScore +
                  topPick.riskBreakdown.liquidityScore +
                  topPick.riskBreakdown.labelScore +
                  topPick.riskBreakdown.volumeScore +
                  topPick.riskBreakdown.volatilityScore
                }
                level={topPick.riskLevel}
              />

              {/* Detailed Breakdown */}
              <RiskBreakdown
                breakdown={topPick.riskBreakdown}
                totalScore={
                  topPick.riskBreakdown.ageScore +
                  topPick.riskBreakdown.liquidityScore +
                  topPick.riskBreakdown.labelScore +
                  topPick.riskBreakdown.volumeScore +
                  topPick.riskBreakdown.volatilityScore
                }
              />
            </div>
          )}

          {/* Contract Address */}
          {topPick.contractAddress && (
            <div className="p-5 bg-cyber-darker/80 rounded-xl border-2 border-neon-cyan/30 mb-6 hover:border-neon-cyan/50 transition-all">
              <div className="text-xs text-neon-cyan uppercase tracking-wide mb-2 font-bold">
                Contract Address
              </div>
              <div className="flex items-center gap-3">
                <code className="text-xs text-gray-300 font-mono flex-1 overflow-x-auto bg-cyber-darker p-2 rounded border border-purple-500/20">
                  {topPick.contractAddress}
                </code>
                <button
                  onClick={() => copyContractAddress(topPick.contractAddress!)}
                  className="neon-button px-4 py-2 bg-gradient-to-r from-neon-cyan/20 to-neon-blue/20 hover:from-neon-cyan/30 hover:to-neon-blue/30 border-2 border-neon-cyan/30 hover:border-neon-cyan/50 text-neon-cyan rounded-lg font-bold text-xs transition-all flex-shrink-0"
                  title={t('topPick.copyToClipboard')}
                >
                  {copied ? t('topPick.copied') : t('topPick.copy')}
                </button>
                <button
                  onClick={handleExclude}
                  disabled={excluding}
                  className="neon-button px-4 py-2 bg-gradient-to-r from-neon-pink/20 to-red-500/20 hover:from-neon-pink/30 hover:to-red-500/30 border-2 border-neon-pink/30 hover:border-neon-pink/50 text-neon-pink rounded-lg font-bold text-xs transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('exclusion.excludeButton')}
                >
                  {excluding ? t('exclusion.excluding') : '🚫 ' + t('exclusion.exclude')}
                </button>
              </div>
            </div>
          )}

          {/* Chart Embed */}
          {topPick.chainId && topPick.pairAddress && (
            <div className="rounded-xl border-2 border-purple-500/30 overflow-hidden shadow-neon-purple">
              <iframe
                src={`https://dexscreener.com/${topPick.chainId}/${topPick.pairAddress}?embed=1&theme=dark&info=0&interval=5`}
                className="w-full h-[768px]"
                title="Token Chart"
                frameBorder="0"
                allow="clipboard-write"
              />
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-6 text-xs font-mono text-center border-t border-purple-500/30">
        <p className="text-neon-pink font-bold mb-2">High Volatility Analysis Tool</p>
        <p className="text-gray-500">
          This is NOT financial advice. Always conduct your own research before trading.
        </p>
      </div>
    </div>
  );
}
