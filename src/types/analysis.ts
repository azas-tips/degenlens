// Analysis Types
// Consolidated type definitions for token analysis results

import type { Timeframe } from './dexscreener';

/**
 * Risk level classification
 */
export type RiskLevel = 'safe' | 'caution' | 'warning' | 'danger' | 'critical';

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
  riskLevel?: RiskLevel;
  riskFactors?: string[];
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
  riskLevel?: RiskLevel;
  riskFactors?: string[];
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
  model?: string; // Model used for analysis
  chain?: string; // Chain analyzed
  timeframe?: Timeframe; // Timeframe used
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

/**
 * Analysis history entry
 */
export interface HistoryEntry {
  id: string; // UUID
  timestamp: string; // ISO 8601
  chain: string; // 'solana', 'ethereum', etc.
  model: string; // 'anthropic/claude-3.5-sonnet'
  timeframe: Timeframe; // 'h6', 'm5', etc.
  maxPairs: number; // Number of pairs analyzed
  result: AnalysisResult; // Full analysis result
  topPickSymbol?: string; // For quick search/display
}
