// Background Service Worker
// Handles all external API communication

import { migrateStorage } from '@/shared/storage-migration';
import { MessageSchema } from '@/shared/schema';
import { handleApiError } from '@/shared/errors';

console.log('DegenLens background service worker loaded');

// Service Worker installation
chrome.runtime.onInstalled.addListener(async details => {
  console.log('Extension installed:', details.reason);

  // Run storage migration
  await migrateStorage();

  // Open options page on first install
  if (details.reason === 'install') {
    chrome.runtime.openOptionsPage();
  }
});

// Run migration on startup (when Service Worker restarts)
migrateStorage().catch(error => {
  console.error('Failed to migrate storage on startup:', error);
});

// Port communication listener (for LLM long-running processes)
chrome.runtime.onConnect.addListener(port => {
  console.log('Port connected:', port.name);

  let aborted = false;

  // Monitor port disconnect
  port.onDisconnect.addListener(() => {
    aborted = true;
    console.log('Port disconnected');
  });

  // Safe message sending (prevents duplicate sends)
  const safePost = (msg: unknown) => {
    if (!aborted) {
      port.postMessage(msg);
    }
  };

  // Message handler
  port.onMessage.addListener(async (message: unknown) => {
    if (aborted) return;

    console.log('[Background] Received message:', message);

    // Validate message with Zod
    const parsed = MessageSchema.safeParse(message);

    if (!parsed.success) {
      console.error('[Background] Invalid message format:', parsed.error);
      safePost({
        type: 'result',
        id: (message as any)?.id,
        error: 'Invalid request format',
        code: 'E_INVALID_REQUEST',
      });
      return;
    }

    const msg = parsed.data;

    // Route to appropriate handler based on message type
    if (msg.type === 'analyze') {
      await handleAnalyzeRequest(msg, safePost, aborted);
    } else if (msg.type === 'fetch-models') {
      await handleFetchModelsRequest(msg, safePost);
    } else {
      console.warn('[Background] Unknown message type:', msg.type);
      safePost({
        type: 'result',
        id: msg.id,
        error: 'Unknown request type',
        code: 'E_INVALID_REQUEST',
      });
    }
  });
});

/**
 * Handle analyze request
 * TODO: Implement full analysis logic with DEXscreener and OpenRouter APIs
 */
async function handleAnalyzeRequest(
  msg: any,
  safePost: (msg: unknown) => void,
  aborted: boolean
) {
  const { id, chain, model, maxPairs } = msg;

  try {
    console.log(`[Background] Starting analysis for ${chain} with ${model}`);

    // TODO: Implement API calls
    // For now, send mock progress updates and result

    // Progress: Fetching pairs
    safePost({
      type: 'progress',
      id,
      step: 'fetching_pairs',
      progress: 10,
    });

    await delay(1000);
    if (aborted) return;

    safePost({
      type: 'progress',
      id,
      step: 'fetching_pairs',
      progress: 30,
    });

    // Progress: Analyzing with LLM
    await delay(1000);
    if (aborted) return;

    safePost({
      type: 'progress',
      id,
      step: 'analyzing_llm',
      progress: 50,
    });

    await delay(1500);
    if (aborted) return;

    safePost({
      type: 'progress',
      id,
      step: 'analyzing_llm',
      progress: 80,
    });

    // Progress: Formatting results
    await delay(500);
    if (aborted) return;

    safePost({
      type: 'progress',
      id,
      step: 'formatting_results',
      progress: 90,
    });

    await delay(500);
    if (aborted) return;

    // Send mock result
    safePost({
      type: 'result',
      id,
      data: {
        pairs: [
          {
            symbol: 'SOL/USDC',
            priceUsd: '123.45',
            volume24h: 1500000,
            liquidity: 5000000,
            priceChange24h: 5.2,
            score: 8,
            analysis: 'Strong volume and liquidity. Positive trend.',
          },
          {
            symbol: 'BONK/SOL',
            priceUsd: '0.000012',
            volume24h: 800000,
            liquidity: 2000000,
            priceChange24h: -2.1,
            score: 6,
            analysis: 'Moderate activity. Watch for consolidation.',
          },
        ],
        analysis:
          'Market shows healthy activity on Solana. Top pairs have strong fundamentals.',
        metadata: {
          tokensUsed: 1500,
          estimatedCost: 0.045,
        },
      },
    });

    console.log('[Background] Analysis completed');
  } catch (error) {
    console.error('[Background] Analysis failed:', error);
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
 * Handle fetch-models request
 * TODO: Implement OpenRouter models API call
 */
async function handleFetchModelsRequest(msg: any, safePost: (msg: unknown) => void) {
  const { id } = msg;

  try {
    console.log('[Background] Fetching models list');

    // TODO: Implement OpenRouter /models API call
    // For now, return empty result
    safePost({
      type: 'models-result',
      id,
      data: [],
    });
  } catch (error) {
    console.error('[Background] Failed to fetch models:', error);
    const errorInfo = handleApiError(error);
    safePost({
      type: 'models-result',
      id,
      error: errorInfo.userMessage,
      code: errorInfo.code,
    });
  }
}

/**
 * Helper: Delay promise
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Service Worker health check (every 5 minutes)
chrome.alarms.create('health-check', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'health-check') {
    console.log('[Health Check] Service Worker is alive');
    cleanupOldCache();
  }
});

/**
 * Cleanup old cache entries
 * Removes cache entries older than 5 minutes
 */
async function cleanupOldCache() {
  try {
    const allKeys = await chrome.storage.session.get(null);
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [key, value] of Object.entries(allKeys)) {
      // Check cache keys starting with dex_ or models_
      if ((key.startsWith('dex_') || key.startsWith('models_')) && value) {
        const entry = value as { timestamp?: number };
        if (entry.timestamp && now - entry.timestamp > 5 * 60 * 1000) {
          toRemove.push(key);
        }
      }
    }

    if (toRemove.length > 0) {
      await chrome.storage.session.remove(toRemove);
      console.log(`[Cache Cleanup] Removed ${toRemove.length} old cache entries`);
    }
  } catch (error) {
    console.error('[Cache Cleanup] Failed:', error);
  }
}
