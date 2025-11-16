// Risk Breakdown Component
// Displays detailed scoring breakdown for transparency

import { useTranslation } from '@/i18n';
import type { ScoringBreakdown } from '@/utils/risk-assessment';

interface RiskBreakdownProps {
  breakdown: ScoringBreakdown;
  totalScore: number;
}

export function RiskBreakdown({ breakdown, totalScore }: RiskBreakdownProps) {
  const { t } = useTranslation();

  /**
   * Calculate percentage of max score
   */
  const getPercentage = (score: number, max: number): number => {
    if (max === 0) return 0;
    return Math.min(100, (Math.abs(score) / max) * 100);
  };

  /**
   * Get color based on score severity
   */
  const getScoreColor = (score: number, max: number): string => {
    const percentage = getPercentage(score, max);
    if (score < 0) return 'text-green-400'; // Positive factors (risk reduction)
    if (percentage >= 80) return 'text-red-500';
    if (percentage >= 60) return 'text-orange-500';
    if (percentage >= 40) return 'text-yellow-500';
    if (percentage >= 20) return 'text-yellow-300';
    return 'text-green-400';
  };

  /**
   * Get bar color for visualization
   */
  const getBarColor = (score: number, max: number): string => {
    const percentage = getPercentage(score, max);
    if (score < 0) return 'bg-green-500'; // Positive factors
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 60) return 'bg-orange-500';
    if (percentage >= 40) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-yellow-300';
    return 'bg-green-400';
  };

  const factors = [
    {
      name: t('results.riskBreakdown.factors.age'),
      score: breakdown.ageScore,
      max: breakdown.ageMax,
      reason: breakdown.ageReasonKey
        ? t(breakdown.ageReasonKey, breakdown.ageReasonParams)
        : breakdown.ageReason,
    },
    {
      name: t('results.riskBreakdown.factors.liquidity'),
      score: breakdown.liquidityScore,
      max: breakdown.liquidityMax,
      reason: breakdown.liquidityReasonKey
        ? t(breakdown.liquidityReasonKey, breakdown.liquidityReasonParams)
        : breakdown.liquidityReason,
    },
    {
      name: t('results.riskBreakdown.factors.labels'),
      score: breakdown.labelScore,
      max: breakdown.labelMax,
      reason: breakdown.labelReasonKey
        ? t(breakdown.labelReasonKey, breakdown.labelReasonParams)
        : breakdown.labelReason,
    },
    {
      name: t('results.riskBreakdown.factors.volume'),
      score: breakdown.volumeScore,
      max: breakdown.volumeMax,
      reason: breakdown.volumeReasonKey
        ? t(breakdown.volumeReasonKey, breakdown.volumeReasonParams)
        : breakdown.volumeReason,
    },
    {
      name: t('results.riskBreakdown.factors.volatility'),
      score: breakdown.volatilityScore,
      max: breakdown.volatilityMax,
      reason: breakdown.volatilityReasonKey
        ? t(breakdown.volatilityReasonKey, breakdown.volatilityReasonParams)
        : breakdown.volatilityReason,
    },
    {
      name: t('results.riskBreakdown.factors.activity'),
      score: breakdown.activityScore,
      max: breakdown.activityMax,
      reason: breakdown.activityReasonKey
        ? t(breakdown.activityReasonKey, breakdown.activityReasonParams)
        : breakdown.activityReason,
    },
  ];

  return (
    <div className="p-4 bg-cyber-darker/80 rounded-xl border-2 border-purple-500/30 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-neon-cyan uppercase tracking-wider">
          🔍 {t('results.riskBreakdown.title')}
        </h3>
        <div className="text-right">
          <div className="text-xs text-gray-400">{t('results.riskBreakdown.totalScore')}</div>
          <div className="text-2xl font-bold text-neon-pink">{totalScore}/155</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {factors.map((factor, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-300 font-mono">{factor.name}</span>
              <span className={`font-bold font-mono ${getScoreColor(factor.score, factor.max)}`}>
                {factor.score > 0 ? '+' : ''}
                {factor.score}/{factor.max}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-cyber-darker rounded-full overflow-hidden border border-purple-500/20">
              <div
                className={`h-full ${getBarColor(factor.score, factor.max)} transition-all duration-500`}
                style={{
                  width: `${getPercentage(factor.score, factor.max)}%`,
                }}
              />
            </div>

            {/* Reason */}
            {factor.reason && (
              <div className="text-[11px] text-gray-400 font-mono pl-2">{factor.reason}</div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-purple-500/20">
        <div className="text-xs text-gray-500 font-mono">
          💡 {t('results.riskBreakdown.helpText')}
        </div>
      </div>
    </div>
  );
}
