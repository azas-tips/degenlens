// LLM Prompt Builder
// Constructs prompts for analyzing DEX token pairs

import type { DexPair } from '@/types/dexscreener';

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
 * Format pair data for prompt
 */
function formatPairData(pair: DexPair): string {
  const baseToken = pair.baseToken?.symbol || 'Unknown';
  const quoteToken = pair.quoteToken?.symbol || 'Unknown';
  const priceUsd = pair.priceUsd || 'N/A';
  const volume6h = pair.volume?.h6 || 0;
  const liquidity = pair.liquidity?.usd || 0;
  const priceChange6h = pair.priceChange?.h6 || 0;
  const txns6h = pair.txns?.h6 || { buys: 0, sells: 0 };
  const fdv = pair.fdv || 0;
  const marketCap = pair.marketCap || 0;

  return `
${baseToken}/${quoteToken}
- Price: $${priceUsd}
- 6h Volume: $${volume6h.toLocaleString()}
- Liquidity: $${liquidity.toLocaleString()}
- 6h Change: ${priceChange6h > 0 ? '+' : ''}${priceChange6h.toFixed(2)}%
- 6h Transactions: ${txns6h.buys} buys / ${txns6h.sells} sells
- Market Cap: $${marketCap.toLocaleString()}
- FDV: $${fdv.toLocaleString()}
- Chain: ${pair.chainId || 'Unknown'}
- DEX: ${pair.dexId || 'Unknown'}
`.trim();
}

/**
 * Build analysis prompt for token pairs
 *
 * @param pairs - Array of token pairs to analyze
 * @param chain - Chain name
 * @param customPrompt - Optional custom prompt template (uses default if not provided)
 * @param language - Language for LLM response ('en' or 'ja')
 * @returns Formatted prompt string
 */
export function buildAnalysisPrompt(
  pairs: DexPair[],
  chain: string,
  customPrompt?: string,
  language: 'en' | 'ja' = 'en'
): string {
  const pairsData = pairs
    .map((pair, index) => {
      return `\n${index + 1}. ${formatPairData(pair)}`;
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
 * @returns Formatted prompt string
 */
export function buildTokenPrompt(pair: DexPair): string {
  const pairData = formatPairData(pair);

  return `You are a cryptocurrency market analyst. Analyze this specific token pair:

${pairData}

Provide a detailed analysis including:
1. **Liquidity Assessment**: Is the liquidity sufficient for safe trading?
2. **Volume Analysis**: Is the 6h volume healthy relative to liquidity?
3. **Price Action**: What does the 6h price change indicate?
4. **Transaction Pattern**: What do the buy/sell ratios suggest?
5. **Risk Factors**: What are the main risks?
6. **Overall Score** (1-10): Trading viability score

Be objective and highlight both opportunities and risks. This is NOT financial advice.`;
}
