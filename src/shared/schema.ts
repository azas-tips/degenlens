// Zod Schema Definitions
// Validation for Popup ⇄ Background messages

import { z } from 'zod';
import { DEFAULT_TIMEFRAME } from '@/types/dexscreener';

// ============================================
// Analyze Request/Response
// ============================================

/**
 * Analysis request
 */
export const AnalyzeReqSchema = z.object({
  type: z.literal('analyze'),
  id: z.string().uuid(), // Correlation ID required
  chain: z.string().min(1),
  model: z.string().min(1),
  maxPairs: z.number().min(1).max(100).optional().default(10), // Cost control: fixed to 10 pairs
  timeframe: z.enum(['m5', 'h1', 'h6', 'h24']).optional().default(DEFAULT_TIMEFRAME),
});

export type AnalyzeReq = z.infer<typeof AnalyzeReqSchema>;

/**
 * Analysis progress notification
 */
export const AnalyzeProgressSchema = z.object({
  type: z.literal('progress'),
  id: z.string().uuid(),
  step: z.enum(['fetching_pairs', 'analyzing_llm', 'formatting_results']),
  progress: z.number().min(0).max(100),
});

export type AnalyzeProgress = z.infer<typeof AnalyzeProgressSchema>;

/**
 * Analysis result
 */
export const AnalyzeResultSchema = z.object({
  type: z.literal('result'),
  id: z.string().uuid(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  code: z.string().optional(), // Error code
  suggestions: z.array(z.string()).optional(), // Error suggestions
  retryAfterMs: z.number().optional(), // Retry wait time (for rate limits)
});

export type AnalyzeResult = z.infer<typeof AnalyzeResultSchema>;

// ============================================
// Fetch Models Request/Response
// ============================================

/**
 * Fetch models request
 */
export const FetchModelsReqSchema = z.object({
  type: z.literal('fetch-models'),
  id: z.string().uuid(),
});

export type FetchModelsReq = z.infer<typeof FetchModelsReqSchema>;

/**
 * Fetch models result
 */
export const FetchModelsResultSchema = z.object({
  type: z.literal('models-result'),
  id: z.string().uuid(),
  data: z.array(z.unknown()).optional(),
  error: z.string().optional(),
  code: z.string().optional(),
  suggestions: z.array(z.string()).optional(), // Error suggestions
});

export type FetchModelsResult = z.infer<typeof FetchModelsResultSchema>;

// ============================================
// Generic message types
// ============================================

export const MessageSchema = z.union([
  AnalyzeReqSchema,
  AnalyzeProgressSchema,
  AnalyzeResultSchema,
  FetchModelsReqSchema,
  FetchModelsResultSchema,
]);

export type Message = z.infer<typeof MessageSchema>;
