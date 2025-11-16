// Analyze Handler
// Main handler for token pair analysis requests

import type { AnalyzeReq } from '@/shared/schema';
import { handleApiError } from '@/shared/errors';
import { fetchPairsByChain } from '@/api/dexscreener';
import { callLLM } from '@/api/llm-client';
import { fetchAvailableModels, type AvailableModel } from '@/api/models';
import { buildAnalysisPrompt } from '../utils/prompt-builder';
import { STORAGE_KEYS } from '@/types/storage';
import type { AnalysisResult } from '@/types/analysis';
import { calculateRiskLevel } from '@/utils/risk-assessment';

/**
 * Safe post function type
 */
type SafePost = (msg: unknown) => void;

/**
 * Handle analyze request
 * Fetches DEX pairs, analyzes with LLM, and returns results
 */
export async function handleAnalyzeRequest(
  msg: AnalyzeReq,
  safePost: SafePost,
  aborted: boolean
): Promise<void> {
  const { id, chain, model, maxPairs, timeframe, pairMaxAge, quoteTokens } = msg;

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

    const pairs = await fetchPairsByChain(chain, maxPairs, timeframe, pairMaxAge, quoteTokens);

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

    // Fetch model information for accurate cost calculation
    let modelInfo: AvailableModel | undefined;
    try {
      const models = await fetchAvailableModels();
      modelInfo = models.find(m => m.id === model);
    } catch (error) {
      console.warn('[Analyze] Failed to fetch model info for cost calculation:', error);
      // Continue without model info - will use fallback pricing
    }

    // Step 2: Analyze with LLM (40-80%)
    safePost({
      type: 'progress',
      id,
      step: 'analyzing_llm',
      progress: 50,
    });

    // Get custom prompt and language from storage
    const storage = await chrome.storage.local.get([
      STORAGE_KEYS.CUSTOM_PROMPT,
      STORAGE_KEYS.LANGUAGE,
    ]);
    const customPrompt = storage[STORAGE_KEYS.CUSTOM_PROMPT] as string | undefined;
    const language = (storage[STORAGE_KEYS.LANGUAGE] as 'en' | 'ja' | undefined) || 'en';

    const prompt = buildAnalysisPrompt(pairs, chain, timeframe, customPrompt, language);

    console.log(`[Analyze] Sending to LLM (${model}) in ${language}`);

    // Keep-alive mechanism: Send progress updates every 20 seconds during LLM call
    // This prevents Service Worker from being terminated during long LLM requests
    const keepAliveInterval = setInterval(() => {
      if (!aborted) {
        safePost({
          type: 'progress',
          id,
          step: 'analyzing_llm',
          progress: 60, // Keep at 60% during LLM analysis
        });
        console.log('[Analyze] Keep-alive ping sent');
      }
    }, 20000); // Every 20 seconds

    try {
      const llmResponse = await callLLM(model, prompt, 0.3);

      clearInterval(keepAliveInterval);

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
      const llmContent = llmResponse.content || '';

      console.log(`[Analyze] LLM response received (${llmContent.length} chars)`);

      // Try to parse JSON response
      interface LLMAnalysis {
        topPick?: {
          symbol?: string;
          reason?: string;
          momentum?: number;
          catalyst?: string;
          moonshotPotential?: string;
          momentumPhase?: string;
        };
        pairs?: Array<{
          symbol?: string;
          momentum?: number;
          catalyst?: string;
          observations?: string;
          moonshotPotential?: string;
          risk?: string;
          score?: number; // Backward compatibility
        }>;
        runnerUps?: Array<{
          symbol?: string;
          reason?: string;
        }>;
        marketPulse?: string;
        summary?: string; // Backward compatibility
      }
      let llmAnalysis: LLMAnalysis | null = null;
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch =
          llmContent.match(/```json\s*([\s\S]*?)\s*```/) ||
          llmContent.match(/```\s*([\s\S]*?)\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : llmContent;
        llmAnalysis = JSON.parse(jsonString);
      } catch {
        console.warn('[Analyze] Failed to parse LLM JSON, using raw response');
      }

      // Build result
      const result: AnalysisResult = {
        pairs: pairs.map((pair, index) => {
          const llmPair = llmAnalysis?.pairs?.[index];
          const riskAssessment = calculateRiskLevel(pair);

          return {
            symbol: `${pair.baseToken?.symbol || 'Unknown'}/${pair.quoteToken?.symbol || 'Unknown'}`,
            priceUsd: pair.priceUsd || '0',
            volume6h: pair.volume?.[timeframe] || 0,
            liquidity: pair.liquidity?.usd || 0,
            priceChange6h: pair.priceChange?.[timeframe] || 0,
            risk: llmPair?.risk,
            observations: llmPair?.observations,
            score: llmPair?.score || llmPair?.momentum,
            analysis: llmPair?.observations,
            momentum: llmPair?.momentum,
            catalyst: llmPair?.catalyst,
            moonshotPotential: llmPair?.moonshotPotential,
            riskLevel: riskAssessment.level,
            riskFactors: riskAssessment.factors,
          };
        }),
        analysis: llmAnalysis?.marketPulse || llmAnalysis?.summary || llmContent.substring(0, 500), // Fallback
        topPick: llmAnalysis?.topPick
          ? (() => {
              const topPickSymbol = llmAnalysis.topPick.symbol?.split('/')[0]; // Get base token symbol
              const matchedPair = pairs.find(pair => pair.baseToken?.symbol === topPickSymbol);
              const riskAssessment = matchedPair ? calculateRiskLevel(matchedPair) : null;

              return {
                ...llmAnalysis.topPick,
                contractAddress: matchedPair?.baseToken?.address,
                chainId: matchedPair?.chainId,
                pairAddress: matchedPair?.pairAddress,
                riskLevel: riskAssessment?.level,
                riskFactors: riskAssessment?.factors,
                riskBreakdown: riskAssessment?.breakdown,
                socials: matchedPair?.info?.socials,
                websites: matchedPair?.info?.websites,
              };
            })()
          : undefined,
        runnerUps: llmAnalysis?.runnerUps,
        metadata: {
          tokensUsed: llmResponse.usage?.total_tokens,
          estimatedCost: calculateActualCost(
            llmResponse.usage?.prompt_tokens || 0,
            llmResponse.usage?.completion_tokens || 0,
            modelInfo
          ),
          analyzedAt: new Date().toISOString(),
          model,
          chain,
          timeframe,
        },
      };

      // Send result
      safePost({
        type: 'result',
        id,
        data: result,
      });

      console.log('[Analyze] Analysis completed successfully');
    } catch (llmError) {
      clearInterval(keepAliveInterval);
      throw llmError;
    }
  } catch (error) {
    console.error('[Analyze] Analysis failed:', error);
    const errorInfo = await handleApiError(error);
    safePost({
      type: 'result',
      id,
      error: errorInfo.userMessage,
      code: errorInfo.code,
      suggestions: errorInfo.suggestions,
      retryAfterMs: errorInfo.retryAfterMs,
    });
  }
}

/**
 * Calculate actual cost based on token usage and model pricing
 * @param promptTokens - Number of prompt tokens used
 * @param completionTokens - Number of completion tokens used
 * @param modelInfo - Model pricing information
 * @returns Actual cost in USD
 */
function calculateActualCost(
  promptTokens: number,
  completionTokens: number,
  modelInfo: AvailableModel | undefined
): number {
  if (!modelInfo || !modelInfo.pricing) {
    // Fallback to rough estimate if model info not available
    const totalTokens = promptTokens + completionTokens;
    return (totalTokens / 1_000_000) * 3.0; // Default $3 per 1M tokens
  }

  // Built-in models (Gemini Nano) are free
  if (modelInfo.isBuiltIn) {
    return 0;
  }

  // OpenRouter pricing is per token (not per 1M)
  const promptCost = promptTokens * parseFloat(modelInfo.pricing.prompt);
  const completionCost = completionTokens * parseFloat(modelInfo.pricing.completion);

  return promptCost + completionCost;
}
