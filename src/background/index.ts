// Background Service Worker
// Handles all external API communication

import { migrateStorage } from '@/shared/storage-migration';

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

    console.log('Received message:', message);

    // TODO: Message validation (zod)
    // TODO: Implement handlers (analyze, fetch-models, etc.)

    // Temporary echo response
    safePost({
      type: 'result',
      data: { echo: message },
    });
  });
});

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
