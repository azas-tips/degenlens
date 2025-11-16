// LLM Prompt Builder
// Constructs prompts for analyzing DEX token pairs

import type { DexPair } from '@/types/dexscreener';
import type { Timeframe } from '@/types/dexscreener';

/**
 * Get human-readable label for timeframe
 */
function getTimeframeLabel(timeframe: Timeframe): string {
  const labels: Record<Timeframe, string> = {
    m5: '5-minute',
    h1: '1-hour',
    h6: '6-hour',
    h24: '24-hour',
  };
  return labels[timeframe];
}

/**
 * Default analysis prompt template
 * Variables: {pairsData}, {pairsCount}, {chain}
 */
export const DEFAULT_ANALYSIS_PROMPT = `You are a cryptocurrency market analyst specializing in high-volatility tokens.

Analyze {pairsCount} tokens from {chain} showing significant market activity.

{pairsData}

**ANALYSIS OBJECTIVES:**

1. **Identify the most notable token** based on current market dynamics
2. Analyze each token for:
   - **Momentum Score** (1-10): Rate of price and volume change velocity
   - **Catalyst**: Identifiable factors driving current activity (narrative, trend, whale activity)
   - **Volatility Assessment**: Measure of price fluctuation and market depth
   - **Potential Upside**: Estimated growth potential based on current metrics
   - **Activity Phase**: Current momentum phase analysis

3. Provide structured insights:
   - **PRIMARY ANALYSIS**: Most significant token with detailed rationale (≤3 sentences)
   - **SECONDARY OBSERVATIONS**: 2-3 other notable tokens worth monitoring
   - **MARKET CONTEXT**: Overall market sentiment and trends on {chain}

**ANALYTICAL FRAMEWORK:**
- Focus on **momentum metrics** and **volume acceleration patterns**
- Identify **catalysts** driving price action (market narratives, liquidity events)
- Assess **volatility characteristics** and their implications
- Evaluate tokens showing **active market participation**
- **Pair Age Analysis**: Consider token maturity (newer = higher risk, older = more established)
- **Labels Interpretation**: Pay attention to DEXscreener labels (e.g., "scam", "top", "v2", "v3")
  - **CRITICAL WARNING**: Tokens with scam, honeypot, rugpull, or exploit labels = NEVER select as Top Pick
  - WARNING labels (frozen, blacklist, paused) = High risk, approach with extreme caution
  - POSITIVE labels (top, verified) = potentially more reliable
  - Version labels (v2, v3) = protocol version information
- **Honeypot Detection**: Watch for these RED FLAGS indicating possible honeypot/scam:
  - **No sell activity** (0 sells with many buys) = Cannot sell, likely honeypot
  - **Extreme buy pressure** (>95% buys with 20+ transactions) = Pump scheme indicator
  - **Suspicious volume/liquidity ratio** (Volume >> Liquidity) = Possible wash trading
  - **Pump-and-dump pattern** (5m massive spike >100%, but 1h change <10%) = Dump incoming
  - **No social presence** (New token with no website/socials) = Unverified/suspicious project
- **Multi-Timeframe Trend Analysis**: Analyze Trend Strength, Momentum, Volatility, and Buy Pressure
  - **Trend Strength (0-100)**: Higher score = more consistent trend across all timeframes
    - 70+ = Strong trend (high confidence)
    - 40-70 = Moderate trend
    - <40 = Weak trend (mixed signals)
  - **Momentum Pattern**: Accelerating (gaining strength), Decelerating (losing strength), Reversing (trend change), or Stable
    - Accelerating momentum with high trend strength = strongest signal
    - Reversing momentum = potential trend change opportunity/risk
  - **Volatility Pattern**: Understand price fluctuation consistency
    - Low Volatility = stable, predictable movement
    - Consistent High Volatility = sustained high activity
    - Extreme Volatility Spike = short-term anomaly, higher risk
  - **Buy Pressure (0-100%)**: Buy vs Sell transaction ratio
    - >60% = Bullish pressure (strong buying interest)
    - <40% = Bearish pressure (selling dominance)
    - 40-60% = Neutral (balanced market)
    - **WARNING**: >95% buys or 0 sells = Possible honeypot
- **Integrated Analysis**: Prioritize tokens with:
  - High Trend Strength + Accelerating Momentum + Bullish Buy Pressure = Strongest picks
  - Consistent trends across timeframes = more reliable signals
  - Strong buy pressure with volume acceleration = sustainable momentum
  - **EXCLUDE from Top Pick**: Tokens with scam/honeypot labels, 0 sells, or pump-dump patterns
  - Avoid: Divergent trends + Extreme volatility spikes = pump/dump risk
- Maintain objective, data-driven analysis

Format your response as JSON:
{
  "topPick": {
    "symbol": "TOKEN/QUOTE",
    "reason": "string (≤3 sentences: analytical rationale for selection)",
    "momentum": number (1-10),
    "catalyst": "string (identified driving factors)",
    "moonshotPotential": "3x|5x|10x+ potential",
    "momentumPhase": "Strong|Moderate|Weak|Consolidating"
  },
  "pairs": [
    {
      "symbol": "TOKEN/QUOTE",
      "momentum": number (1-10),
      "catalyst": "string",
      "observations": "string",
      "moonshotPotential": "3x|5x|10x+ potential",
      "risk": "Low|Medium|High|EXTREME"
    }
  ],
  "runnerUps": [
    {
      "symbol": "TOKEN/QUOTE",
      "reason": "string (notable characteristics)"
    }
  ],
  "marketPulse": "string (market context and sentiment on {chain})"
}

Note: This analysis is for informational purposes only and does not constitute financial advice.`;

/**
 * Format pair age from creation timestamp
 */
function formatPairAge(pairCreatedAt?: number): string {
  if (!pairCreatedAt) return 'Unknown';

  const now = Date.now();
  const ageMs = now - pairCreatedAt;
  const ageMinutes = Math.floor(ageMs / (1000 * 60));
  const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

  if (ageMinutes < 60) return `${ageMinutes} minutes`;
  if (ageHours < 24) return `${ageHours} hours`;
  return `${ageDays} days`;
}

/**
 * Format multi-timeframe trend comparison
 */
function formatTrendComparison(pair: DexPair): string {
  const m5Change = pair.priceChange?.m5;
  const h1Change = pair.priceChange?.h1;
  const h6Change = pair.priceChange?.h6;
  const h24Change = pair.priceChange?.h24;

  const trends: string[] = [];
  if (m5Change !== undefined) trends.push(`5m: ${m5Change > 0 ? '+' : ''}${m5Change.toFixed(2)}%`);
  if (h1Change !== undefined) trends.push(`1h: ${h1Change > 0 ? '+' : ''}${h1Change.toFixed(2)}%`);
  if (h6Change !== undefined) trends.push(`6h: ${h6Change > 0 ? '+' : ''}${h6Change.toFixed(2)}%`);
  if (h24Change !== undefined)
    trends.push(`24h: ${h24Change > 0 ? '+' : ''}${h24Change.toFixed(2)}%`);

  return trends.length > 0 ? trends.join(' | ') : 'No trend data';
}

/**
 * Analyze trend strength across all timeframes
 * Returns a score from 0-100 indicating trend consistency
 */
function analyzeTrendStrength(pair: DexPair): number {
  const m5 = pair.priceChange?.m5 || 0;
  const h1 = pair.priceChange?.h1 || 0;
  const h6 = pair.priceChange?.h6 || 0;
  const h24 = pair.priceChange?.h24 || 0;

  // Check if all timeframes have same direction
  const signs = [Math.sign(m5), Math.sign(h1), Math.sign(h6), Math.sign(h24)];
  const positiveCount = signs.filter(s => s > 0).length;
  const negativeCount = signs.filter(s => s < 0).length;

  // Direction consistency: all same direction = 100, mixed = 0
  const directionConsistency = (Math.max(positiveCount, negativeCount) / 4) * 100;

  // Magnitude consistency: lower variance = stronger trend
  const changes = [Math.abs(m5), Math.abs(h1), Math.abs(h6), Math.abs(h24)].filter(c => c > 0);
  if (changes.length === 0) return 0;

  const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
  const variance = changes.reduce((acc, c) => acc + Math.pow(c - mean, 2), 0) / changes.length;
  const magnitudeConsistency = 100 / (1 + variance / 10);

  // Combined score (70% direction, 30% magnitude)
  return directionConsistency * 0.7 + magnitudeConsistency * 0.3;
}

/**
 * Detect momentum shift patterns
 * Identifies if momentum is accelerating, decelerating, or reversing
 */
function detectMomentumShift(pair: DexPair): string {
  const m5 = pair.priceChange?.m5 || 0;
  const h1 = pair.priceChange?.h1 || 0;
  const h6 = pair.priceChange?.h6 || 0;
  const h24 = pair.priceChange?.h24 || 0;

  // Calculate momentum velocity (rate of change between timeframes)
  const shortTermVelocity = Math.abs(m5) - Math.abs(h1); // m5 to h1
  const midTermVelocity = Math.abs(h1) - Math.abs(h6); // h1 to h6
  const longTermVelocity = Math.abs(h6) - Math.abs(h24); // h6 to h24

  const avgVelocity = (shortTermVelocity + midTermVelocity + longTermVelocity) / 3;

  // Check for trend reversal
  const recentDirection = Math.sign(m5);
  const historicalDirection = Math.sign(h24);
  if (
    recentDirection !== 0 &&
    historicalDirection !== 0 &&
    recentDirection !== historicalDirection
  ) {
    return 'Reversing';
  }

  // Accelerating vs Decelerating
  if (avgVelocity > 2) return 'Accelerating';
  if (avgVelocity < -2) return 'Decelerating';
  return 'Stable';
}

/**
 * Calculate volatility pattern
 * Measures price fluctuation consistency
 */
function calculateVolatilityPattern(pair: DexPair): string {
  const changes = [
    Math.abs(pair.priceChange?.m5 || 0),
    Math.abs(pair.priceChange?.h1 || 0),
    Math.abs(pair.priceChange?.h6 || 0),
    Math.abs(pair.priceChange?.h24 || 0),
  ].filter(c => c > 0);

  if (changes.length === 0) return 'No Data';

  const maxChange = Math.max(...changes);
  const minChange = Math.min(...changes);
  const range = maxChange - minChange;

  if (maxChange < 5) return 'Low Volatility';
  if (range < 5) return 'Consistent High Volatility';
  if (maxChange > 20 && range > 15) return 'Extreme Volatility Spike';
  return 'Moderate Volatility';
}

/**
 * Format multi-timeframe analysis
 * Provides comprehensive trend analysis across all timeframes
 */
function formatMultiTimeframeAnalysis(pair: DexPair): string {
  const trendStrength = analyzeTrendStrength(pair);
  const momentumShift = detectMomentumShift(pair);
  const volatilityPattern = calculateVolatilityPattern(pair);

  // Calculate buy/sell pressure
  const m5Txns = pair.txns?.m5;
  const buySellRatio =
    m5Txns && m5Txns.buys + m5Txns.sells > 0
      ? (m5Txns.buys / (m5Txns.buys + m5Txns.sells)) * 100
      : 50;

  return `
- Trend Strength: ${trendStrength.toFixed(0)}/100 (${trendStrength > 70 ? 'Strong' : trendStrength > 40 ? 'Moderate' : 'Weak'})
- Momentum: ${momentumShift}
- Volatility: ${volatilityPattern}
- Buy Pressure: ${buySellRatio.toFixed(0)}% (${buySellRatio > 60 ? 'Bullish' : buySellRatio < 40 ? 'Bearish' : 'Neutral'})`.trim();
}

/**
 * Format pair data for prompt
 */
function formatPairData(pair: DexPair, timeframe: Timeframe): string {
  const baseToken = pair.baseToken?.symbol || 'Unknown';
  const quoteToken = pair.quoteToken?.symbol || 'Unknown';
  const priceUsd = pair.priceUsd || 'N/A';
  const volume = pair.volume?.[timeframe] || 0;
  const liquidity = pair.liquidity?.usd || 0;
  const priceChange = pair.priceChange?.[timeframe] || 0;
  const txns = pair.txns?.[timeframe] || { buys: 0, sells: 0 };
  const fdv = pair.fdv || 0;
  const marketCap = pair.marketCap || 0;
  const timeframeLabel = getTimeframeLabel(timeframe);

  // Format labels (if any)
  const labels = pair.labels && pair.labels.length > 0 ? pair.labels.join(', ') : 'None';

  // Format pair age
  const pairAge = formatPairAge(pair.pairCreatedAt);

  // Format multi-timeframe trend
  const trendComparison = formatTrendComparison(pair);

  // Format multi-timeframe analysis
  const multiTimeframeAnalysis = formatMultiTimeframeAnalysis(pair);

  return `
${baseToken}/${quoteToken}
- Price: $${priceUsd}
- ${timeframeLabel} Volume: $${volume.toLocaleString()}
- Liquidity: $${liquidity.toLocaleString()}
- ${timeframeLabel} Change: ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%
- ${timeframeLabel} Transactions: ${txns.buys} buys / ${txns.sells} sells
- Market Cap: $${marketCap.toLocaleString()}
- FDV: $${fdv.toLocaleString()}
- Chain: ${pair.chainId || 'Unknown'}
- DEX: ${pair.dexId || 'Unknown'}
- Pair Age: ${pairAge}
- Labels: ${labels}
- Trend Comparison: ${trendComparison}
- Multi-Timeframe Analysis:
${multiTimeframeAnalysis}
`.trim();
}

/**
 * Build analysis prompt for token pairs
 *
 * @param pairs - Array of token pairs to analyze
 * @param chain - Chain name
 * @param timeframe - Timeframe for analysis (m5, h1, h6, h24)
 * @param customPrompt - Optional custom prompt template (uses default if not provided)
 * @param language - Language for LLM response ('en' or 'ja')
 * @returns Formatted prompt string
 */
export function buildAnalysisPrompt(
  pairs: DexPair[],
  chain: string,
  timeframe: Timeframe,
  customPrompt?: string,
  language: 'en' | 'ja' = 'en'
): string {
  const pairsData = pairs
    .map((pair, index) => {
      return `\n${index + 1}. ${formatPairData(pair, timeframe)}`;
    })
    .join('\n');

  // Use custom prompt if provided, otherwise use default
  const template = customPrompt || DEFAULT_ANALYSIS_PROMPT;

  // Replace template variables
  let prompt = template
    .replace(/{pairsData}/g, pairsData)
    .replace(/{pairsCount}/g, String(pairs.length))
    .replace(/{chain}/g, chain);

  // Add language instruction
  const languageInstruction =
    language === 'ja'
      ? '\n\n**IMPORTANT: Respond in Japanese (日本語で回答してください)**'
      : '\n\n**IMPORTANT: Respond in English**';

  return prompt + languageInstruction;
}

/**
 * Build prompt for specific token analysis
 *
 * @param pair - Single token pair to analyze
 * @param timeframe - Timeframe for analysis
 * @returns Formatted prompt string
 */
export function buildTokenPrompt(pair: DexPair, timeframe: Timeframe = 'h6'): string {
  const pairData = formatPairData(pair, timeframe);
  const timeframeLabel = getTimeframeLabel(timeframe);

  return `You are a cryptocurrency market analyst. Analyze this specific token pair:

${pairData}

Provide a detailed analysis including:
1. **Liquidity Assessment**: Is the liquidity sufficient for safe trading?
2. **Volume Analysis**: Is the ${timeframeLabel} volume healthy relative to liquidity?
3. **Price Action**: What does the ${timeframeLabel} price change indicate?
4. **Transaction Pattern**: What do the buy/sell ratios suggest?
5. **Risk Factors**: What are the main risks?
6. **Overall Score** (1-10): Trading viability score

Be objective and highlight both opportunities and risks. This is NOT financial advice.`;
}
