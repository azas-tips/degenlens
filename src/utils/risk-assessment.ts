// Risk Assessment Utility
// Calculates risk levels and factors for token pairs

import type { DexPair } from '@/types/dexscreener';
import type { RiskLevel } from '@/types/analysis';

/**
 * Calculate risk level for a token pair
 * Considers multiple factors: age, liquidity, labels, concentration
 *
 * @param pair - DEX pair data
 * @returns Risk level and contributing factors
 */
export function calculateRiskLevel(pair: DexPair): {
  level: RiskLevel;
  factors: string[];
  score: number; // 0-100 (0 = safest, 100 = most risky)
} {
  const factors: string[] = [];
  let riskScore = 0;

  // Factor 1: Contract Age (0-30 points)
  if (pair.pairCreatedAt) {
    const ageMs = Date.now() - pair.pairCreatedAt;
    const ageHours = ageMs / (1000 * 60 * 60);
    const ageDays = ageHours / 24;

    if (ageDays < 1) {
      riskScore += 30;
      factors.push('Very new contract (< 1 day)');
    } else if (ageDays < 7) {
      riskScore += 20;
      factors.push('New contract (< 1 week)');
    } else if (ageDays < 30) {
      riskScore += 10;
      factors.push('Relatively new contract (< 1 month)');
    }
  } else {
    riskScore += 15;
    factors.push('Contract age unknown');
  }

  // Factor 2: Liquidity (0-30 points)
  const liquidity = pair.liquidity?.usd || 0;
  const marketCap = pair.marketCap || 0;

  if (liquidity < 10000) {
    riskScore += 30;
    factors.push('Very low liquidity (< $10k)');
  } else if (liquidity < 50000) {
    riskScore += 20;
    factors.push('Low liquidity (< $50k)');
  } else if (liquidity < 100000) {
    riskScore += 10;
    factors.push('Moderate liquidity (< $100k)');
  }

  // Liquidity to market cap ratio
  if (marketCap > 0) {
    const ratio = liquidity / marketCap;
    if (ratio < 0.02) {
      riskScore += 15;
      factors.push('Low liquidity/mcap ratio (< 2%)');
    } else if (ratio > 0.5) {
      riskScore += 10;
      factors.push('Unusually high liquidity/mcap ratio (> 50%)');
    }
  }

  // Factor 3: Labels (0-40 points - most critical)
  const labels = (pair.labels || []).map(l => l.toLowerCase());

  if (labels.some(l => l.includes('scam') || l.includes('honeypot'))) {
    riskScore = 100; // Instant critical
    factors.push('⛔ SCAM/HONEYPOT LABEL DETECTED');
  } else {
    // Positive labels reduce risk
    if (labels.some(l => l.includes('top') || l.includes('verified'))) {
      riskScore = Math.max(0, riskScore - 15);
      factors.push('✓ Verified or top token');
    }
  }

  // Factor 4: Volume and Activity (0-20 points)
  const volume24h = pair.volume?.h24 || 0;

  if (volume24h < 1000) {
    riskScore += 20;
    factors.push('Very low 24h volume (< $1k)');
  } else if (volume24h < 10000) {
    riskScore += 10;
    factors.push('Low 24h volume (< $10k)');
  }

  // Factor 5: Price Volatility (0-15 points)
  const priceChange5m = Math.abs(pair.priceChange?.m5 || 0);
  const priceChange1h = Math.abs(pair.priceChange?.h1 || 0);

  if (priceChange5m > 50 || priceChange1h > 100) {
    riskScore += 15;
    factors.push('Extreme price volatility');
  } else if (priceChange5m > 20 || priceChange1h > 50) {
    riskScore += 10;
    factors.push('High price volatility');
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
