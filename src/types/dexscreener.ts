// DEXscreener API Type Definitions
// Based on official API documentation and community implementations

export interface DexScreenerTokenInfo {
  address: string;
  name: string;
  symbol: string;
}

export interface DexScreenerLiquidity {
  usd: number;
  base: number;
  quote: number;
}

export interface DexScreenerTxns {
  buys: number;
  sells: number;
}

export interface DexScreenerWebsite {
  url: string;
}

export interface DexScreenerSocial {
  platform: string;
  handle: string;
}

export interface DexScreenerInfo {
  imageUrl?: string;
  websites?: DexScreenerWebsite[];
  socials?: DexScreenerSocial[];
}

export interface DexScreenerBoosts {
  active: number;
}

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  labels?: string[];
  baseToken: DexScreenerTokenInfo;
  quoteToken: DexScreenerTokenInfo;
  priceNative: string;
  priceUsd: string;
  txns: {
    m5?: DexScreenerTxns;
    h1?: DexScreenerTxns;
    h6?: DexScreenerTxns;
    h24?: DexScreenerTxns;
  };
  volume: {
    m5?: number;
    h1?: number;
    h6?: number;
    h24?: number;
  };
  priceChange: {
    m5?: number;
    h1?: number;
    h6?: number;
    h24?: number;
  };
  liquidity?: DexScreenerLiquidity;
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: DexScreenerInfo;
  boosts?: DexScreenerBoosts;
}

export interface DexScreenerPairsResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[] | null;
}

// Type aliases for convenience
export type DexPair = DexScreenerPair;
export type DexPairsResponse = DexScreenerPairsResponse;

// Search Response
export interface DexScreenerSearchResponse {
  pairs: DexScreenerPair[];
}

// Token Pairs Response
export interface DexScreenerTokenPairsResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[] | null;
}

// Error Response (推測 - ドキュメントに明記なし)
export interface DexScreenerErrorResponse {
  error?: string;
  message?: string;
  statusCode?: number;
}

// API仕様メモ:
// - 認証: 不明（ドキュメントに記載なし、公開APIの可能性）
// - レート制限: 300リクエスト/分
// - limit/offsetパラメータ: サポートなし
// - エンドポイント:
//   GET /latest/dex/pairs/{chainId}/{pairId}
//   GET /latest/dex/search?q={query}
//   GET /token-pairs/v1/{chainId}/{tokenAddress}
//   GET /tokens/v1/{chainId}/{tokenAddresses}
