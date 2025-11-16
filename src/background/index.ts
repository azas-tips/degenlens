// Background Service Worker
// Handles all external API communication

import { migrateStorage } from '@/shared/storage-migration';
import { MessageSchema } from '@/shared/schema';
import { handleApiError } from '@/shared/errors';
import { handleAnalyzeRequest } from './handlers/analyze';
import { fetchAvailableModels } from '@/api/models';

console.log('DegenLens background service worker loaded');

// Service Worker installation
chrome.runtime.onInstalled.addListener(async details => {
  console.log('Extension installed:', details.reason);

  // Run storage migration
  await migrateStorage();

  // Open dashboard on first install
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'src/app/index.html' });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener(() => {
  console.log('Extension icon clicked - opening dashboard');
  chrome.tabs.create({ url: 'src/app/index.html' });
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
      const unknownMsg = message as { id?: string };
      safePost({
        type: 'result',
        id: unknownMsg?.id,
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
 * Handle fetch-models request
 */
async function handleFetchModelsRequest(
  msg: { id: string; type: string },
  safePost: (msg: unknown) => void
) {
  const { id } = msg;

  try {
    const models = await fetchAvailableModels();

    safePost({
      type: 'models-result',
      id,
      data: models,
    });

    console.log(`[Background] Fetched ${models.length} models`);
  } catch (error) {
    // Silent error - only send to UI, don't log to console
    const errorInfo = await handleApiError(error);
    safePost({
      type: 'models-result',
      id,
      error: errorInfo.userMessage,
      code: errorInfo.code,
      suggestions: errorInfo.suggestions,
    });
  }
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
