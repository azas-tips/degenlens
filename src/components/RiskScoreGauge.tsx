// Risk Score Gauge Component
// Visual gauge showing overall risk score

import { getRiskLevelInfo } from '@/utils/risk-assessment';
import type { RiskLevel } from '@/types/analysis';

interface RiskScoreGaugeProps {
  score: number; // 0-135 (sum of all risk factors)
  level: RiskLevel;
}

export function RiskScoreGauge({ score, level }: RiskScoreGaugeProps) {
  const riskInfo = getRiskLevelInfo(level);

  // Calculate percentage (135 is max possible score)
  const maxScore = 135;
  const percentage = Math.min(100, (score / maxScore) * 100);

  // Calculate gauge rotation (-90deg to 90deg, total 180deg)
  const rotation = -90 + (percentage / 100) * 180;

  /**
   * Get gradient colors based on risk level
   */
  const getGradientColors = (): string => {
    switch (level) {
      case 'safe':
        return 'from-green-500 to-green-400';
      case 'caution':
        return 'from-yellow-500 to-yellow-400';
      case 'warning':
        return 'from-orange-500 to-orange-400';
      case 'danger':
        return 'from-red-500 to-red-400';
      case 'critical':
        return 'from-red-700 to-red-600';
      default:
        return 'from-gray-500 to-gray-400';
    }
  };

  /**
   * Get text color based on risk level
   */
  const getTextColor = (): string => {
    switch (level) {
      case 'safe':
        return 'text-green-400';
      case 'caution':
        return 'text-yellow-400';
      case 'warning':
        return 'text-orange-400';
      case 'danger':
        return 'text-red-400';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto p-6">
      {/* Gauge Background */}
      <div className="relative w-full aspect-[2/1]">
        {/* Semi-circle track */}
        <svg className="w-full h-full" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
          {/* Background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-cyber-darker"
          />

          {/* Risk zones (colored segments) */}
          <defs>
            <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" /> {/* green - safe */}
              <stop offset="25%" stopColor="#eab308" /> {/* yellow - caution */}
              <stop offset="50%" stopColor="#f97316" /> {/* orange - warning */}
              <stop offset="75%" stopColor="#ef4444" /> {/* red - danger */}
              <stop offset="100%" stopColor="#991b1b" /> {/* dark red - critical */}
            </linearGradient>
          </defs>

          {/* Colored arc showing risk level */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#riskGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.3"
          />

          {/* Active arc (shows current score) */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#riskGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(percentage / 100) * 251} 251`}
            className="transition-all duration-1000 ease-out"
          />

          {/* Center labels */}
          <text
            x="100"
            y="70"
            textAnchor="middle"
            className={`text-2xl font-bold ${getTextColor()} fill-current`}
          >
            {score}
          </text>
          <text x="100" y="85" textAnchor="middle" className="text-xs text-gray-400 fill-current">
            / {maxScore}
          </text>

          {/* Tick marks */}
          <g className="text-gray-600">
            <line x1="20" y1="100" x2="20" y2="90" stroke="currentColor" strokeWidth="1" />
            <line x1="60" y1="47" x2="65" y2="52" stroke="currentColor" strokeWidth="1" />
            <line x1="100" y1="20" x2="100" y2="30" stroke="currentColor" strokeWidth="1" />
            <line x1="140" y1="47" x2="135" y2="52" stroke="currentColor" strokeWidth="1" />
            <line x1="180" y1="100" x2="180" y2="90" stroke="currentColor" strokeWidth="1" />
          </g>
        </svg>

        {/* Needle indicator */}
        <div
          className="absolute bottom-0 left-1/2 w-1 h-20 origin-bottom transition-transform duration-1000 ease-out"
          style={{
            transform: `translateX(-50%) rotate(${rotation}deg)`,
          }}
        >
          <div
            className={`w-full h-full bg-gradient-to-t ${getGradientColors()} rounded-full shadow-lg`}
          />
          <div className="absolute bottom-0 left-1/2 w-4 h-4 rounded-full bg-gray-800 border-2 border-gray-600 transform -translate-x-1/2 translate-y-1/2" />
        </div>
      </div>

      {/* Risk Level Label */}
      <div className="text-center mt-4">
        <div
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-full ${getTextColor()} bg-cyber-darker/80 border-2`}
          style={{
            borderColor: `${riskInfo.color.replace('text-', '')}`,
          }}
        >
          <span className="text-3xl">{riskInfo.emoji}</span>
          <div className="text-left">
            <div className="text-lg font-bold uppercase tracking-wider">{riskInfo.label}</div>
            <div className="text-xs text-gray-400">{riskInfo.description}</div>
          </div>
        </div>
      </div>

      {/* Score interpretation */}
      <div className="mt-4 p-3 bg-cyber-darker/50 rounded-lg border border-purple-500/20">
        <div className="text-xs text-gray-400 font-mono text-center">
          {percentage < 20 && '✓ Excellent - Minimal risk factors detected'}
          {percentage >= 20 && percentage < 40 && '⚠️ Moderate - Some risk factors present'}
          {percentage >= 40 && percentage < 60 && '⚠️ Elevated - Multiple risk factors detected'}
          {percentage >= 60 && percentage < 80 && '🚨 High - Significant risks identified'}
          {percentage >= 80 && '⛔ Critical - Extreme caution advised'}
        </div>
      </div>
    </div>
  );
}
