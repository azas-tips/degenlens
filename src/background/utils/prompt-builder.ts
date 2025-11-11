// LLM Prompt Builder
// Constructs prompts for analyzing DEX token pairs

import type { DexPair } from '@/types/dexscreener';

/**
 * Format pair data for prompt
 */
function formatPairData(pair: DexPair): string {
  const baseToken = pair.baseToken?.symbol || 'Unknown';
  const quoteToken = pair.quoteToken?.symbol || 'Unknown';
  const priceUsd = pair.priceUsd || 'N/A';
  const volume24h = pair.volume?.h24 || 0;
  const liquidity = pair.liquidity?.usd || 0;
  const priceChange24h = pair.priceChange?.h24 || 0;
  const txns24h = pair.txns?.h24 || { buys: 0, sells: 0 };
  const fdv = pair.fdv || 0;
  const marketCap = pair.marketCap || 0;

  return `
${baseToken}/${quoteToken}
- Price: $${priceUsd}
- 24h Volume: $${volume24h.toLocaleString()}
- Liquidity: $${liquidity.toLocaleString()}
- 24h Change: ${priceChange24h > 0 ? '+' : ''}${priceChange24h.toFixed(2)}%
- 24h Transactions: ${txns24h.buys} buys / ${txns24h.sells} sells
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
 * @returns Formatted prompt string
 */
export function buildAnalysisPrompt(pairs: DexPair[], chain: string): string {
  const pairsData = pairs
    .map((pair, index) => {
      return `\n${index + 1}. ${formatPairData(pair)}`;
    })
    .join('\n');

  return `You are a cryptocurrency market analyst specializing in DEX (Decentralized Exchange) token analysis.

Analyze the following ${pairs.length} token pairs from the ${chain} blockchain and provide insights:

${pairsData}

For each token pair, provide:
1. **Risk Assessment** (Low/Medium/High): Based on liquidity, volume, and transaction patterns
2. **Notable Observations**: Key metrics that stand out (positive or negative)
3. **Score** (1-10): Overall assessment of the pair's trading viability

Then provide:
- **Summary**: Overall market sentiment for ${chain}
- **Top 3 Opportunities**: Pairs worth monitoring (with brief reasoning)
- **Red Flags**: Any concerning patterns across the pairs

Format your response as JSON:
{
  "pairs": [
    {
      "symbol": "TOKEN/QUOTE",
      "risk": "Low|Medium|High",
      "observations": "string",
      "score": number
    }
  ],
  "summary": "string",
  "opportunities": ["string", "string", "string"],
  "redFlags": ["string"]
}

Important:
- Focus on data-driven analysis
- Be objective and highlight both positives and negatives
- Consider volume, liquidity, and transaction patterns as primary indicators
- This is NOT financial advice - users will do their own research (DYOR)`;
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
2. **Volume Analysis**: Is the 24h volume healthy relative to liquidity?
3. **Price Action**: What does the 24h price change indicate?
4. **Transaction Pattern**: What do the buy/sell ratios suggest?
5. **Risk Factors**: What are the main risks?
6. **Overall Score** (1-10): Trading viability score

Be objective and highlight both opportunities and risks. This is NOT financial advice.`;
}
