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
  - WARNING labels (scam, honeypot) = EXTREME risk, recommend avoiding
  - POSITIVE labels (top, verified) = potentially more reliable
  - Version labels (v2, v3) = protocol version information
- **Multi-Timeframe Trend Analysis**: Compare short-term vs long-term momentum
  - Consistent trends across timeframes = stronger signal
  - Divergent trends (e.g., +50% in 5m but -20% in 24h) = possible pump/dump, higher risk
  - Look for sustained momentum vs short-term spikes
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
