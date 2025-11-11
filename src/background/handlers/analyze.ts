// Analyze Handler
// Main handler for token pair analysis requests

import type { AnalyzeReq } from '@/shared/schema';
import { handleApiError } from '@/shared/errors';
import { fetchPairsByChain } from '@/api/dexscreener';
import { chatCompletion } from '@/api/openrouter';
import { buildAnalysisPrompt } from '../utils/prompt-builder';

/**
 * Safe post function type
 */
type SafePost = (msg: unknown) => void;

/**
 * Analysis result interface
 */
interface AnalysisResult {
  pairs: Array<{
    symbol: string;
    priceUsd: string;
    volume24h: number;
    liquidity: number;
    priceChange24h: number;
    risk?: string;
    observations?: string;
    score?: number;
    analysis?: string;
  }>;
  analysis: string;
  metadata?: {
    tokensUsed?: number;
    estimatedCost?: number;
  };
}

/**
 * Handle analyze request
 * Fetches DEX pairs, analyzes with LLM, and returns results
 */
export async function handleAnalyzeRequest(
  msg: AnalyzeReq,
  safePost: SafePost,
  aborted: boolean
): Promise<void> {
  const { id, chain, model, maxPairs } = msg;

  try {
    console.log(`[Analyze] Starting analysis for ${chain} with ${model}`);

    // Step 1: Fetch pairs from DEXscreener (10-40%)
    safePost({
      type: 'progress',
      id,
      step: 'fetching_pairs',
      progress: 10,
    });

    if (aborted) return;

    const pairs = await fetchPairsByChain(chain, maxPairs);

    if (pairs.length === 0) {
      safePost({
        type: 'result',
        id,
        error: `No trading pairs found for ${chain}`,
        code: 'E_NO_DATA',
      });
      return;
    }

    console.log(`[Analyze] Fetched ${pairs.length} pairs`);

    safePost({
      type: 'progress',
      id,
      step: 'fetching_pairs',
      progress: 40,
    });

    if (aborted) return;

    // Step 2: Analyze with LLM (40-80%)
    safePost({
      type: 'progress',
      id,
      step: 'analyzing_llm',
      progress: 50,
    });

    const prompt = buildAnalysisPrompt(pairs, chain);

    console.log(`[Analyze] Sending to LLM (${model})`);

    const llmResponse = await chatCompletion({
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
    });

    if (aborted) return;

    safePost({
      type: 'progress',
      id,
      step: 'analyzing_llm',
      progress: 80,
    });

    // Step 3: Format results (80-100%)
    safePost({
      type: 'progress',
      id,
      step: 'formatting_results',
      progress: 90,
    });

    if (aborted) return;

    // Extract LLM response
    const llmContent = llmResponse.choices?.[0]?.message?.content || '';

    console.log(`[Analyze] LLM response received (${llmContent.length} chars)`);

    // Try to parse JSON response
    let llmAnalysis: any = null;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch =
        llmContent.match(/```json\s*([\s\S]*?)\s*```/) ||
        llmContent.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : llmContent;
      llmAnalysis = JSON.parse(jsonString);
    } catch (parseError) {
      console.warn('[Analyze] Failed to parse LLM JSON, using raw response');
    }

    // Build result
    const result: AnalysisResult = {
      pairs: pairs.map((pair, index) => {
        const llmPair = llmAnalysis?.pairs?.[index];

        return {
          symbol: `${pair.baseToken?.symbol || 'Unknown'}/${pair.quoteToken?.symbol || 'Unknown'}`,
          priceUsd: pair.priceUsd || '0',
          volume24h: pair.volume?.h24 || 0,
          liquidity: pair.liquidity?.usd || 0,
          priceChange24h: pair.priceChange?.h24 || 0,
          risk: llmPair?.risk,
          observations: llmPair?.observations,
          score: llmPair?.score,
          analysis: llmPair?.observations,
        };
      }),
      analysis: llmAnalysis?.summary || llmContent.substring(0, 500), // Fallback to first 500 chars
      metadata: {
        tokensUsed: llmResponse.usage?.total_tokens,
        estimatedCost: calculateCost(llmResponse.usage?.total_tokens || 0, model),
      },
    };

    // Send result
    safePost({
      type: 'result',
      id,
      data: result,
    });

    console.log('[Analyze] Analysis completed successfully');
  } catch (error) {
    console.error('[Analyze] Analysis failed:', error);
    const errorInfo = handleApiError(error);
    safePost({
      type: 'result',
      id,
      error: errorInfo.userMessage,
      code: errorInfo.code,
    });
  }
}

/**
 * Calculate estimated cost
 * Rough estimate based on token count and model
 */
function calculateCost(tokens: number, model: string): number {
  // Rough pricing (per 1M tokens)
  const pricing: Record<string, number> = {
    'claude-3.5-sonnet': 3.0, // $3 per 1M input tokens
    'claude-3-haiku': 0.25,
    'gpt-4-turbo': 10.0,
    'gpt-3.5-turbo': 0.5,
  };

  // Find matching model
  const modelKey = Object.keys(pricing).find(key => model.includes(key));
  const pricePerMillion = modelKey ? pricing[modelKey] : 3.0; // Default to $3

  return (tokens / 1_000_000) * pricePerMillion;
}
