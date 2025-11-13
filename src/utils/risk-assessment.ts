// Risk Assessment Utility
// Calculates risk levels and factors for token pairs

import type { DexPair } from '@/types/dexscreener';
import type { RiskLevel } from '@/types/analysis';

/**
 * Scoring breakdown for transparency
 */
export interface ScoringBreakdown {
  ageScore: number;
  ageMax: number;
  ageReason: string;
  liquidityScore: number;
  liquidityMax: number;
  liquidityReason: string;
  labelScore: number;
  labelMax: number;
  labelReason: string;
  volumeScore: number;
  volumeMax: number;
  volumeReason: string;
  volatilityScore: number;
  volatilityMax: number;
  volatilityReason: string;
}

/**
 * Calculate risk level for a token pair
 * Considers multiple factors: age, liquidity, labels, concentration
 *
 * @param pair - DEX pair data
 * @returns Risk level and contributing factors with detailed breakdown
 */
export function calculateRiskLevel(pair: DexPair): {
  level: RiskLevel;
  factors: string[];
  score: number; // 0-100 (0 = safest, 100 = most risky)
  breakdown: ScoringBreakdown;
} {
  const factors: string[] = [];
  let riskScore = 0;

  // Initialize breakdown
  const breakdown: ScoringBreakdown = {
    ageScore: 0,
    ageMax: 30,
    ageReason: '',
    liquidityScore: 0,
    liquidityMax: 30,
    liquidityReason: '',
    labelScore: 0,
    labelMax: 40,
    labelReason: '',
    volumeScore: 0,
    volumeMax: 20,
    volumeReason: '',
    volatilityScore: 0,
    volatilityMax: 15,
    volatilityReason: '',
  };

  // Factor 1: Contract Age (0-30 points)
  if (pair.pairCreatedAt) {
    const ageMs = Date.now() - pair.pairCreatedAt;
    const ageHours = ageMs / (1000 * 60 * 60);
    const ageDays = ageHours / 24;

    if (ageDays < 1) {
      breakdown.ageScore = 30;
      breakdown.ageReason = `Very new (${ageHours.toFixed(1)}h old)`;
      riskScore += 30;
      factors.push('Very new contract (< 1 day)');
    } else if (ageDays < 7) {
      breakdown.ageScore = 20;
      breakdown.ageReason = `New (${ageDays.toFixed(1)} days old)`;
      riskScore += 20;
      factors.push('New contract (< 1 week)');
    } else if (ageDays < 30) {
      breakdown.ageScore = 10;
      breakdown.ageReason = `Relatively new (${ageDays.toFixed(0)} days old)`;
      riskScore += 10;
      factors.push('Relatively new contract (< 1 month)');
    } else {
      breakdown.ageReason = `Established (${ageDays.toFixed(0)} days old)`;
    }
  } else {
    breakdown.ageScore = 15;
    breakdown.ageReason = 'Age unknown';
    riskScore += 15;
    factors.push('Contract age unknown');
  }

  // Factor 2: Liquidity (0-30 points)
  const liquidity = pair.liquidity?.usd || 0;
  const marketCap = pair.marketCap || 0;

  if (liquidity < 10000) {
    breakdown.liquidityScore += 30;
    breakdown.liquidityReason = `Very low liquidity ($${(liquidity / 1000).toFixed(1)}k)`;
    riskScore += 30;
    factors.push('Very low liquidity (< $10k)');
  } else if (liquidity < 50000) {
    breakdown.liquidityScore += 20;
    breakdown.liquidityReason = `Low liquidity ($${(liquidity / 1000).toFixed(1)}k)`;
    riskScore += 20;
    factors.push('Low liquidity (< $50k)');
  } else if (liquidity < 100000) {
    breakdown.liquidityScore += 10;
    breakdown.liquidityReason = `Moderate liquidity ($${(liquidity / 1000).toFixed(1)}k)`;
    riskScore += 10;
    factors.push('Moderate liquidity (< $100k)');
  } else {
    breakdown.liquidityReason = `Good liquidity ($${(liquidity / 1000).toFixed(0)}k)`;
  }

  // Liquidity to market cap ratio
  if (marketCap > 0) {
    const ratio = liquidity / marketCap;
    if (ratio < 0.02) {
      breakdown.liquidityScore += 15;
      breakdown.liquidityReason += ` | Low L/MC ratio (${(ratio * 100).toFixed(1)}%)`;
      riskScore += 15;
      factors.push('Low liquidity/mcap ratio (< 2%)');
    } else if (ratio > 0.5) {
      breakdown.liquidityScore += 10;
      breakdown.liquidityReason += ` | High L/MC ratio (${(ratio * 100).toFixed(0)}%)`;
      riskScore += 10;
      factors.push('Unusually high liquidity/mcap ratio (> 50%)');
    }
  }

  // Factor 3: Labels (0-40 points - most critical)
  const labels = (pair.labels || []).map(l => l.toLowerCase());

  if (labels.some(l => l.includes('scam') || l.includes('honeypot'))) {
    breakdown.labelScore = 100; // Override everything
    breakdown.labelReason = '⛔ SCAM/HONEYPOT detected';
    riskScore = 100; // Instant critical
    factors.push('⛔ SCAM/HONEYPOT LABEL DETECTED');
  } else {
    // Positive labels reduce risk
    if (labels.some(l => l.includes('top') || l.includes('verified'))) {
      breakdown.labelScore = -15; // Negative score = risk reduction
      breakdown.labelReason = '✓ Verified or top token';
      riskScore = Math.max(0, riskScore - 15);
      factors.push('✓ Verified or top token');
    } else {
      breakdown.labelReason = 'No special labels';
    }
  }

  // Factor 4: Volume and Activity (0-20 points)
  const volume24h = pair.volume?.h24 || 0;

  if (volume24h < 1000) {
    breakdown.volumeScore = 20;
    breakdown.volumeReason = `Very low volume ($${volume24h.toFixed(0)}/24h)`;
    riskScore += 20;
    factors.push('Very low 24h volume (< $1k)');
  } else if (volume24h < 10000) {
    breakdown.volumeScore = 10;
    breakdown.volumeReason = `Low volume ($${(volume24h / 1000).toFixed(1)}k/24h)`;
    riskScore += 10;
    factors.push('Low 24h volume (< $10k)');
  } else {
    breakdown.volumeReason = `Good volume ($${(volume24h / 1000).toFixed(0)}k/24h)`;
  }

  // Factor 5: Price Volatility (0-15 points)
  const priceChange5m = Math.abs(pair.priceChange?.m5 || 0);
  const priceChange1h = Math.abs(pair.priceChange?.h1 || 0);

  if (priceChange5m > 50 || priceChange1h > 100) {
    breakdown.volatilityScore = 15;
    breakdown.volatilityReason = `Extreme volatility (5m: ${priceChange5m.toFixed(1)}%, 1h: ${priceChange1h.toFixed(1)}%)`;
    riskScore += 15;
    factors.push('Extreme price volatility');
  } else if (priceChange5m > 20 || priceChange1h > 50) {
    breakdown.volatilityScore = 10;
    breakdown.volatilityReason = `High volatility (5m: ${priceChange5m.toFixed(1)}%, 1h: ${priceChange1h.toFixed(1)}%)`;
    riskScore += 10;
    factors.push('High price volatility');
  } else {
    breakdown.volatilityReason = `Normal volatility (5m: ${priceChange5m.toFixed(1)}%, 1h: ${priceChange1h.toFixed(1)}%)`;
  }

  // Determine risk level based on total score
  let level: RiskLevel;

  if (riskScore >= 80) {
    level = 'critical';
  } else if (riskScore >= 60) {
    level = 'danger';
  } else if (riskScore >= 40) {
    level = 'warning';
  } else if (riskScore >= 20) {
    level = 'caution';
  } else {
    level = 'safe';
  }

  return {
    level,
    factors,
    score: riskScore,
    breakdown,
  };
}

/**
 * Get risk level display information
 * @param level - Risk level
 * @returns Display info (emoji, color, label)
 */
export function getRiskLevelInfo(level: RiskLevel): {
  emoji: string;
  color: string;
  label: string;
  description: string;
} {
  switch (level) {
    case 'safe':
      return {
        emoji: '🟢',
        color: 'text-green-500',
        label: 'Safe',
        description: 'Low risk - established token with good fundamentals',
      };
    case 'caution':
      return {
        emoji: '🟡',
        color: 'text-yellow-500',
        label: 'Caution',
        description: 'Moderate risk - proceed with research',
      };
    case 'warning':
      return {
        emoji: '🟠',
        color: 'text-orange-500',
        label: 'Warning',
        description: 'High risk - exercise caution',
      };
    case 'danger':
      return {
        emoji: '🔴',
        color: 'text-red-500',
        label: 'Danger',
        description: 'Very high risk - not recommended',
      };
    case 'critical':
      return {
        emoji: '⛔',
        color: 'text-red-700',
        label: 'CRITICAL',
        description: 'Extreme risk - AVOID',
      };
  }
}
