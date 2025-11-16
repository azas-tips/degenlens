// Risk Assessment Utility
// Calculates risk levels and factors for token pairs

import type { DexPair } from '@/types/dexscreener';
import type { RiskLevel, RiskFactor } from '@/types/analysis';

/**
 * Scoring breakdown for transparency
 */
export interface ScoringBreakdown {
  ageScore: number;
  ageMax: number;
  ageReason: string;
  ageReasonKey: string;
  ageReasonParams: Record<string, string | number>;
  liquidityScore: number;
  liquidityMax: number;
  liquidityReason: string;
  liquidityReasonKey: string;
  liquidityReasonParams: Record<string, string | number>;
  labelScore: number;
  labelMax: number;
  labelReason: string;
  labelReasonKey: string;
  labelReasonParams: Record<string, string | number>;
  volumeScore: number;
  volumeMax: number;
  volumeReason: string;
  volumeReasonKey: string;
  volumeReasonParams: Record<string, string | number>;
  volatilityScore: number;
  volatilityMax: number;
  volatilityReason: string;
  volatilityReasonKey: string;
  volatilityReasonParams: Record<string, string | number>;
  activityScore: number;
  activityMax: number;
  activityReason: string;
  activityReasonKey: string;
  activityReasonParams: Record<string, string | number>;
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
  factors: RiskFactor[];
  score: number; // 0-100 (0 = safest, 100 = most risky)
  breakdown: ScoringBreakdown;
} {
  const factors: RiskFactor[] = [];
  let riskScore = 0;

  // Initialize breakdown
  const breakdown: ScoringBreakdown = {
    ageScore: 0,
    ageMax: 30,
    ageReason: '',
    ageReasonKey: '',
    ageReasonParams: {},
    liquidityScore: 0,
    liquidityMax: 30,
    liquidityReason: '',
    liquidityReasonKey: '',
    liquidityReasonParams: {},
    labelScore: 0,
    labelMax: 40,
    labelReason: '',
    labelReasonKey: '',
    labelReasonParams: {},
    volumeScore: 0,
    volumeMax: 20,
    volumeReason: '',
    volumeReasonKey: '',
    volumeReasonParams: {},
    volatilityScore: 0,
    volatilityMax: 15,
    volatilityReason: '',
    volatilityReasonKey: '',
    volatilityReasonParams: {},
    activityScore: 0,
    activityMax: 20,
    activityReason: '',
    activityReasonKey: '',
    activityReasonParams: {},
  };

  // Factor 1: Contract Age (0-30 points)
  let ageHours = 0;
  let ageDays = 0;

  if (pair.pairCreatedAt) {
    const ageMs = Date.now() - pair.pairCreatedAt;
    ageHours = ageMs / (1000 * 60 * 60);
    ageDays = ageHours / 24;

    if (ageHours < 1) {
      // < 1 hour: maximum penalty (unchanged)
      breakdown.ageScore = 30;
      breakdown.ageReason = `Very new (${ageHours.toFixed(1)}h old)`;
      breakdown.ageReasonKey = 'risk.age.veryNew';
      breakdown.ageReasonParams = { hours: ageHours.toFixed(1) };
      riskScore += 30;
      factors.push({
        key: 'results.risk.veryNewContract',
        params: {},
        fallback: 'Very new contract (< 1 hour)',
      });
    } else if (ageDays < 1) {
      // < 24 hours: reduced penalty (30 -> 20)
      breakdown.ageScore = 20;
      breakdown.ageReason = `Very new (${ageHours.toFixed(1)}h old)`;
      breakdown.ageReasonKey = 'risk.age.veryNew';
      breakdown.ageReasonParams = { hours: ageHours.toFixed(1) };
      riskScore += 20;
      factors.push({
        key: 'results.risk.veryNewContract',
        params: {},
        fallback: 'Very new contract (< 1 day)',
      });
    } else if (ageDays < 7) {
      breakdown.ageScore = 20;
      breakdown.ageReason = `New (${ageDays.toFixed(1)} days old)`;
      breakdown.ageReasonKey = 'risk.age.new';
      breakdown.ageReasonParams = { days: ageDays.toFixed(1) };
      riskScore += 20;
      factors.push({
        key: 'results.risk.newContract',
        params: {},
        fallback: 'New contract (< 1 week)',
      });
    } else if (ageDays < 30) {
      breakdown.ageScore = 10;
      breakdown.ageReason = `Relatively new (${ageDays.toFixed(0)} days old)`;
      breakdown.ageReasonKey = 'risk.age.relativelyNew';
      breakdown.ageReasonParams = { days: ageDays.toFixed(0) };
      riskScore += 10;
      factors.push({
        key: 'results.risk.relativelyNewContract',
        params: {},
        fallback: 'Relatively new contract (< 1 month)',
      });
    } else {
      breakdown.ageReason = `Established (${ageDays.toFixed(0)} days old)`;
      breakdown.ageReasonKey = 'risk.age.established';
      breakdown.ageReasonParams = { days: ageDays.toFixed(0) };
    }
  } else {
    breakdown.ageScore = 15;
    breakdown.ageReason = 'Age unknown';
    breakdown.ageReasonKey = 'risk.age.unknown';
    breakdown.ageReasonParams = {};
    riskScore += 15;
    factors.push({
      key: 'results.risk.ageUnknown',
      params: {},
      fallback: 'Contract age unknown',
    });
  }

  // Factor 2: Liquidity (0-30 points)
  const liquidity = pair.liquidity?.usd || 0;
  const marketCap = pair.marketCap || 0;

  if (liquidity < 10000) {
    breakdown.liquidityScore += 30;
    breakdown.liquidityReason = `Very low liquidity ($${(liquidity / 1000).toFixed(1)}k)`;
    breakdown.liquidityReasonKey = 'risk.liquidity.veryLow';
    breakdown.liquidityReasonParams = { amount: (liquidity / 1000).toFixed(1) };
    riskScore += 30;
    factors.push({
      key: 'results.risk.veryLowLiquidity',
      params: {},
      fallback: 'Very low liquidity (< $10k)',
    });
  } else if (liquidity < 50000) {
    breakdown.liquidityScore += 20;
    breakdown.liquidityReason = `Low liquidity ($${(liquidity / 1000).toFixed(1)}k)`;
    breakdown.liquidityReasonKey = 'risk.liquidity.low';
    breakdown.liquidityReasonParams = { amount: (liquidity / 1000).toFixed(1) };
    riskScore += 20;
    factors.push({
      key: 'results.risk.lowLiquidity',
      params: {},
      fallback: 'Low liquidity (< $50k)',
    });
  } else if (liquidity < 100000) {
    breakdown.liquidityScore += 10;
    breakdown.liquidityReason = `Moderate liquidity ($${(liquidity / 1000).toFixed(1)}k)`;
    breakdown.liquidityReasonKey = 'risk.liquidity.moderate';
    breakdown.liquidityReasonParams = { amount: (liquidity / 1000).toFixed(1) };
    riskScore += 10;
    factors.push({
      key: 'results.risk.moderateLiquidity',
      params: {},
      fallback: 'Moderate liquidity (< $100k)',
    });
  } else {
    breakdown.liquidityReason = `Good liquidity ($${(liquidity / 1000).toFixed(0)}k)`;
    breakdown.liquidityReasonKey = 'risk.liquidity.good';
    breakdown.liquidityReasonParams = { amount: (liquidity / 1000).toFixed(0) };
  }

  // Liquidity to market cap ratio
  if (marketCap > 0) {
    const ratio = liquidity / marketCap;
    if (ratio < 0.02) {
      breakdown.liquidityScore += 15;
      breakdown.liquidityReason += ` | Low L/MC ratio (${(ratio * 100).toFixed(1)}%)`;
      breakdown.liquidityReasonKey = 'risk.liquidity.withLowRatio';
      breakdown.liquidityReasonParams = {
        amount: breakdown.liquidityReasonParams.amount,
        ratio: (ratio * 100).toFixed(1),
      };
      riskScore += 15;
      factors.push({
        key: 'results.risk.lowLiquidityRatio',
        params: {},
        fallback: 'Low liquidity/mcap ratio (< 2%)',
      });
    } else if (ratio > 0.5) {
      breakdown.liquidityScore += 10;
      breakdown.liquidityReason += ` | High L/MC ratio (${(ratio * 100).toFixed(0)}%)`;
      breakdown.liquidityReasonKey = 'risk.liquidity.withHighRatio';
      breakdown.liquidityReasonParams = {
        amount: breakdown.liquidityReasonParams.amount,
        ratio: (ratio * 100).toFixed(0),
      };
      riskScore += 10;
      factors.push({
        key: 'results.risk.highLiquidityRatio',
        params: {},
        fallback: 'Unusually high liquidity/mcap ratio (> 50%)',
      });
    }
  }

  // Factor 3: Labels (0-100 points - most critical)
  const labels = (pair.labels || []).map(l => l.toLowerCase());

  // CRITICAL labels - instant 100 score (scam, honeypot, rugpull, exploit)
  const criticalLabels = ['scam', 'honeypot', 'rugpull', 'exploit'];
  if (labels.some(l => criticalLabels.some(bad => l.includes(bad)))) {
    breakdown.labelScore = 100; // Override everything
    breakdown.labelReason = '⛔ SCAM/HONEYPOT/RUGPULL detected';
    breakdown.labelReasonKey = 'risk.labels.scam';
    breakdown.labelReasonParams = {};
    riskScore = 100; // Instant critical
    factors.push({
      key: 'results.risk.scamDetected',
      params: {},
      fallback: '⛔ SCAM/HONEYPOT LABEL DETECTED',
    });
  } else {
    // WARNING labels - high risk (frozen, blacklist, paused)
    const warningLabels = ['frozen', 'blacklist', 'paused'];
    if (labels.some(l => warningLabels.some(warn => l.includes(warn)))) {
      breakdown.labelScore = 30;
      breakdown.labelReason = '⚠️ Warning label detected (frozen/blacklist/paused)';
      breakdown.labelReasonKey = 'risk.labels.warning';
      breakdown.labelReasonParams = {};
      riskScore += 30;
      factors.push({
        key: 'results.risk.warningLabel',
        params: {},
        fallback: '⚠️ Warning label detected',
      });
    }

    // SUSPICIOUS labels - moderate risk (abandoned)
    const suspiciousLabels = ['abandoned'];
    if (labels.some(l => suspiciousLabels.some(sus => l.includes(sus)))) {
      breakdown.labelScore += 20;
      breakdown.labelReason = '⚠️ Suspicious label detected (abandoned)';
      breakdown.labelReasonKey = 'risk.labels.suspicious';
      breakdown.labelReasonParams = {};
      riskScore += 20;
      factors.push({
        key: 'results.risk.suspiciousLabel',
        params: {},
        fallback: '⚠️ Suspicious label detected',
      });
    }

    // Positive labels reduce risk
    if (labels.some(l => l.includes('top') || l.includes('verified'))) {
      breakdown.labelScore = Math.max(-15, breakdown.labelScore - 15);
      breakdown.labelReason = breakdown.labelReason || '✓ Verified or top token';
      breakdown.labelReasonKey = 'risk.labels.verified';
      breakdown.labelReasonParams = {};
      riskScore = Math.max(0, riskScore - 15);
      factors.push({
        key: 'results.risk.verified',
        params: {},
        fallback: '✓ Verified or top token',
      });
    }

    if (breakdown.labelReason === '') {
      breakdown.labelReason = 'No special labels';
      breakdown.labelReasonKey = 'risk.labels.none';
      breakdown.labelReasonParams = {};
    }
  }

  // Factor 4: Volume and Activity (0-20 points)
  const volume24h = pair.volume?.h24 || 0;

  if (volume24h < 1000) {
    breakdown.volumeScore = 20;
    breakdown.volumeReason = `Very low volume ($${volume24h.toFixed(0)}/24h)`;
    breakdown.volumeReasonKey = 'risk.volume.veryLow';
    breakdown.volumeReasonParams = { amount: volume24h.toFixed(0) };
    riskScore += 20;
    factors.push({
      key: 'results.risk.veryLowVolume',
      params: {},
      fallback: 'Very low 24h volume (< $1k)',
    });
  } else if (volume24h < 10000) {
    breakdown.volumeScore = 10;
    breakdown.volumeReason = `Low volume ($${(volume24h / 1000).toFixed(1)}k/24h)`;
    breakdown.volumeReasonKey = 'risk.volume.low';
    breakdown.volumeReasonParams = { amount: (volume24h / 1000).toFixed(1) };
    riskScore += 10;
    factors.push({
      key: 'results.risk.lowVolume',
      params: {},
      fallback: 'Low 24h volume (< $10k)',
    });
  } else {
    breakdown.volumeReason = `Good volume ($${(volume24h / 1000).toFixed(0)}k/24h)`;
    breakdown.volumeReasonKey = 'risk.volume.good';
    breakdown.volumeReasonParams = { amount: (volume24h / 1000).toFixed(0) };
  }

  // Factor 5: Buy/Sell Imbalance Detection (0-25 points - honeypot indicator)
  const txns = pair.txns?.m5;
  if (txns && txns.buys > 0) {
    if (txns.sells === 0) {
      // Can buy but no one selling = possible honeypot
      riskScore += 25;
      factors.push({
        key: 'results.risk.noSellActivity',
        params: {},
        fallback: 'No sell activity detected (possible honeypot)',
      });
    } else {
      const totalTxns = txns.buys + txns.sells;
      const sellRatio = txns.sells / totalTxns;
      if (sellRatio < 0.05 && txns.buys > 20) {
        // >95% buys with significant volume = pump indicator
        riskScore += 20;
        factors.push({
          key: 'results.risk.suspiciousBuyPressure',
          params: {},
          fallback: 'Suspicious buy pressure (>95% buys)',
        });
      }
    }
  }

  // Factor 6: Volume/Liquidity Ratio (0-20 points - wash trading indicator)
  if (liquidity > 0 && volume24h > 0) {
    const volumeToLiquidityRatio = volume24h / liquidity;
    if (volumeToLiquidityRatio > 10) {
      // Example: $100k volume on $10k liquidity = wash trading risk
      riskScore += 20;
      factors.push({
        key: 'results.risk.suspiciousVolumeRatio',
        params: {},
        fallback: 'Suspicious volume/liquidity ratio (wash trading)',
      });
    }
  }

  // Factor 7: Social Presence Validation (-10 to +15 points)
  const hasNoSocials = !pair.info?.socials || pair.info.socials.length === 0;
  const hasNoWebsite = !pair.info?.websites || pair.info.websites.length === 0;
  const hasSocialPresence = !hasNoSocials || !hasNoWebsite;

  if (hasNoSocials && hasNoWebsite && ageHours < 168) {
    // New token (< 7 days) with no social presence = high risk
    riskScore += 15;
    factors.push({
      key: 'results.risk.noSocialPresence',
      params: {},
      fallback: 'No social presence (new token)',
    });
  } else if (hasSocialPresence && ageHours < 168) {
    // New token (< 7 days) with social presence = risk reduction
    riskScore = Math.max(0, riskScore - 10);
    factors.push({
      key: 'results.risk.hasSocialPresence',
      params: {},
      fallback: '✓ Has social presence (verified project)',
    });
  }

  // Factor 8: Price Volatility (0-15 points)
  const priceChange5m = Math.abs(pair.priceChange?.m5 || 0);
  const priceChange1h = Math.abs(pair.priceChange?.h1 || 0);

  if (priceChange5m > 50 || priceChange1h > 100) {
    breakdown.volatilityScore = 15;
    breakdown.volatilityReason = `Extreme volatility (5m: ${priceChange5m.toFixed(1)}%, 1h: ${priceChange1h.toFixed(1)}%)`;
    breakdown.volatilityReasonKey = 'risk.volatility.extreme';
    breakdown.volatilityReasonParams = {
      change5m: priceChange5m.toFixed(1),
      change1h: priceChange1h.toFixed(1),
    };
    riskScore += 15;
    factors.push({
      key: 'results.risk.extremeVolatility',
      params: {},
      fallback: 'Extreme price volatility',
    });
  } else if (priceChange5m > 20 || priceChange1h > 50) {
    breakdown.volatilityScore = 10;
    breakdown.volatilityReason = `High volatility (5m: ${priceChange5m.toFixed(1)}%, 1h: ${priceChange1h.toFixed(1)}%)`;
    breakdown.volatilityReasonKey = 'risk.volatility.high';
    breakdown.volatilityReasonParams = {
      change5m: priceChange5m.toFixed(1),
      change1h: priceChange1h.toFixed(1),
    };
    riskScore += 10;
    factors.push({
      key: 'results.risk.highVolatility',
      params: {},
      fallback: 'High price volatility',
    });
  } else {
    breakdown.volatilityReason = `Normal volatility (5m: ${priceChange5m.toFixed(1)}%, 1h: ${priceChange1h.toFixed(1)}%)`;
    breakdown.volatilityReasonKey = 'risk.volatility.normal';
    breakdown.volatilityReasonParams = {
      change5m: priceChange5m.toFixed(1),
      change1h: priceChange1h.toFixed(1),
    };
  }

  // Factor 9: Pump-and-Dump Pattern Detection (0-15 points)
  if (priceChange5m > 100 && priceChange1h < 10) {
    // Massive 5m spike but low 1h change = possible dump incoming
    riskScore += 15;
    factors.push({
      key: 'results.risk.pumpPattern',
      params: {},
      fallback: 'Pump-and-dump pattern detected',
    });
  }

  // Factor 10: Trading Activity (0-20 points)
  const txns5m = pair.txns?.m5;
  const txns24h = pair.txns?.h24;

  // Calculate total transaction counts
  const totalTxns5m = txns5m ? (txns5m.buys || 0) + (txns5m.sells || 0) : 0;
  const totalTxns24h = txns24h ? (txns24h.buys || 0) + (txns24h.sells || 0) : 0;

  // Check 5-minute activity (5 transactions or less = warning)
  if (totalTxns5m <= 5 && totalTxns5m >= 0) {
    breakdown.activityScore += 10;
    breakdown.activityReason = `Low 5min activity (${totalTxns5m} txns)`;
    breakdown.activityReasonKey = 'risk.activity.low5m';
    breakdown.activityReasonParams = { count: totalTxns5m };
    riskScore += 10;
    factors.push({
      key: 'results.risk.lowActivity5m',
      params: {},
      fallback: '⚠️ Very low recent activity (< 5 txns/5min)',
    });
  }

  // Check 24-hour activity (10 transactions or less = warning)
  if (totalTxns24h <= 10 && totalTxns24h >= 0) {
    breakdown.activityScore += 10;
    if (breakdown.activityReason) {
      breakdown.activityReason += ` | Low 24h activity (${totalTxns24h} txns)`;
    } else {
      breakdown.activityReason = `Low 24h activity (${totalTxns24h} txns)`;
    }
    breakdown.activityReasonKey = 'risk.activity.low24h';
    breakdown.activityReasonParams = {
      ...breakdown.activityReasonParams,
      count24h: totalTxns24h,
    };
    riskScore += 10;
    factors.push({
      key: 'results.risk.lowActivity24h',
      params: {},
      fallback: '⚠️ Very low 24h activity (< 10 txns/day)',
    });
  }

  // Set default reason if no issues detected
  if (breakdown.activityReason === '') {
    breakdown.activityReason = `Active trading (5m: ${totalTxns5m} txns, 24h: ${totalTxns24h} txns)`;
    breakdown.activityReasonKey = 'risk.activity.good';
    breakdown.activityReasonParams = { count5m: totalTxns5m, count24h: totalTxns24h };
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
