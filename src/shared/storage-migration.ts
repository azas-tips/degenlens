// Storage Migration System
// Version management and backward compatibility for storage schema

import { AppStorageV1, DEFAULT_STORAGE } from '@/types/storage';

const CURRENT_VERSION = 1;

/**
 * Storage migration
 * Call on app startup to upgrade schema if needed
 */
export async function migrateStorage(): Promise<void> {
  try {
    const raw = await chrome.storage.local.get(null);

    // First run: Initialize
    if (!raw.version) {
      console.log('[Storage Migration] First run, initializing storage...');
      await chrome.storage.local.set(DEFAULT_STORAGE);
      // Clear any old cache
      await chrome.storage.session.clear();
      return;
    }

    // Version check
    if (typeof raw.version !== 'number') {
      throw new Error('Invalid storage version type');
    }

    console.log(`[Storage Migration] Current version: ${raw.version}`);

    // Future migration logic goes here
    if (raw.version < CURRENT_VERSION) {
      console.log(`[Storage Migration] Migrating from v${raw.version} to v${CURRENT_VERSION}`);

      // V1 → V2 migration example (for future use)
      // if (raw.version === 1) {
      //   const migratedData: AppStorageV2 = {
      //     ...raw,
      //     version: 2,
      //     newField: 'defaultValue',
      //   };
      //   await chrome.storage.local.set(migratedData);
      //   console.log('[Storage Migration] Migrated to v2');
      // }

      // Clear cache on migration
      await chrome.storage.session.clear();
      console.log('[Storage Migration] Cache cleared');
    }

    console.log('[Storage Migration] Migration complete');
  } catch (error) {
    console.error('[Storage Migration] Migration failed, performing safe reset:', error);

    // Fallback to safe reset if data is corrupted
    await safeReset();
  }
}

/**
 * Safe storage reset
 * Called when data is corrupted
 */
export async function safeReset(): Promise<void> {
  console.log('[Storage Migration] Performing safe reset...');

  // Clear existing data then initialize
  await chrome.storage.local.clear();
  await chrome.storage.local.set(DEFAULT_STORAGE);

  // Notify user (optional)
  if (chrome.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/48.png',
      title: 'DegenLens',
      message: 'Storage has been reset. Please re-enter your API keys.',
    });
  }

  console.log('[Storage Migration] Safe reset complete');
}

/**
 * Validate storage
 * Check if current storage has correct structure
 */
export async function validateStorage(): Promise<boolean> {
  try {
    const data = (await chrome.storage.local.get(null)) as Partial<AppStorageV1>;

    // Check required fields
    if (typeof data.version !== 'number') {
      return false;
    }

    if (!data.prefs || typeof data.prefs !== 'object') {
      return false;
    }

    if (typeof data.prefs.chain !== 'string') {
      return false;
    }

    if (typeof data.prefs.model !== 'string') {
      return false;
    }

    if (typeof data.prefs.maxPairs !== 'number') {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
