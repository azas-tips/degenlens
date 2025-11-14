// Common Quote Tokens by Chain
// Defines popular quote tokens for each supported chain

export interface QuoteTokenOption {
  symbol: string;
  name: string;
}

/**
 * Common quote tokens for each chain
 * These are the most popular trading pairs on each chain
 */
export const CHAIN_QUOTE_TOKENS: Record<string, QuoteTokenOption[]> = {
  solana: [
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'USDC', name: 'USD Coin' },
    { symbol: 'USDT', name: 'Tether' },
    { symbol: 'RAY', name: 'Raydium' },
    { symbol: 'BONK', name: 'Bonk' },
  ],
  ethereum: [
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'WETH', name: 'Wrapped Ethereum' },
    { symbol: 'USDT', name: 'Tether' },
    { symbol: 'USDC', name: 'USD Coin' },
    { symbol: 'DAI', name: 'Dai' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin' },
  ],
  bsc: [
    { symbol: 'BNB', name: 'BNB' },
    { symbol: 'WBNB', name: 'Wrapped BNB' },
    { symbol: 'BUSD', name: 'Binance USD' },
    { symbol: 'USDT', name: 'Tether' },
    { symbol: 'USDC', name: 'USD Coin' },
  ],
  polygonzkevm: [
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'WETH', name: 'Wrapped Ethereum' },
    { symbol: 'USDC', name: 'USD Coin' },
    { symbol: 'USDT', name: 'Tether' },
    { symbol: 'MATIC', name: 'Polygon' },
  ],
  arbitrum: [
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'WETH', name: 'Wrapped Ethereum' },
    { symbol: 'ARB', name: 'Arbitrum' },
    { symbol: 'USDC', name: 'USD Coin' },
    { symbol: 'USDT', name: 'Tether' },
  ],
  optimism: [
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'WETH', name: 'Wrapped Ethereum' },
    { symbol: 'OP', name: 'Optimism' },
    { symbol: 'USDC', name: 'USD Coin' },
    { symbol: 'USDT', name: 'Tether' },
  ],
  base: [
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'WETH', name: 'Wrapped Ethereum' },
    { symbol: 'USDC', name: 'USD Coin' },
    { symbol: 'DAI', name: 'Dai' },
  ],
};

/**
 * Get available quote tokens for a chain
 * @param chain - Chain name
 * @returns Array of quote token options
 */
export function getQuoteTokensForChain(chain: string): QuoteTokenOption[] {
  return CHAIN_QUOTE_TOKENS[chain.toLowerCase()] || [];
}

/**
 * Get default quote tokens for a chain (first 2 tokens)
 * @param chain - Chain name
 * @returns Array of default quote token symbols
 */
export function getDefaultQuoteTokens(chain: string): string[] {
  const tokens = getQuoteTokensForChain(chain);
  return tokens.slice(0, 2).map(t => t.symbol);
}
