// Analysis Types
// Consolidated type definitions for token analysis results

/**
 * Progress information during analysis
 */
export interface AnalysisProgress {
  step: 'fetching_pairs' | 'analyzing_llm' | 'formatting_results' | '';
  progress: number; // 0-100
}

/**
 * Analyzed token pair data
 */
export interface AnalyzedPair {
  symbol?: string;
  priceUsd?: string;
  volume6h?: number;
  liquidity?: number;
  priceChange6h?: number;
  risk?: string;
  observations?: string;
  score?: number;
  analysis?: string;
  momentum?: number;
  catalyst?: string;
  moonshotPotential?: string;
}

/**
 * Top pick token information
 */
export interface TopPick {
  symbol?: string;
  reason?: string;
  momentum?: number;
  catalyst?: string;
  moonshotPotential?: string;
  momentumPhase?: string;
  contractAddress?: string;
  chainId?: string;
  pairAddress?: string;
}

/**
 * Runner-up token information
 */
export interface RunnerUp {
  symbol?: string;
  reason?: string;
}

/**
 * Analysis metadata (tokens used, cost, timestamp)
 */
export interface AnalysisMetadata {
  tokensUsed?: number;
  estimatedCost?: number;
  analyzedAt?: string; // ISO 8601 timestamp
}

/**
 * Complete analysis result
 */
export interface AnalysisResult {
  pairs: AnalyzedPair[];
  analysis: string;
  topPick?: TopPick;
  runnerUps?: RunnerUp[];
  metadata?: AnalysisMetadata;
}
