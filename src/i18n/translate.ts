// Standalone translation function
// Can be used in background scripts without React

import { STORAGE_KEYS } from '@/types/storage';
import enTranslations from './translations/en.json';
import jaTranslations from './translations/ja.json';

export type Language = 'en' | 'ja';

const translations: Record<Language, typeof enTranslations> = {
  en: enTranslations,
  ja: jaTranslations,
};

/**
 * Get nested translation value
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

/**
 * Replace placeholders in translation strings
 */
function replacePlaceholders(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;

  let result = text;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }
  return result;
}

/**
 * Get current language from storage
 */
export async function getCurrentLanguage(): Promise<Language> {
  try {
    const data = await chrome.storage.local.get(STORAGE_KEYS.LANGUAGE);
    const lang = data[STORAGE_KEYS.LANGUAGE] as Language | undefined;
    return lang && (lang === 'en' || lang === 'ja') ? lang : 'en';
  } catch (error) {
    console.error('[translate] Failed to get language:', error);
    return 'en';
  }
}

/**
 * Translate a key (async version for background scripts)
 */
export async function translate(
  key: string,
  params?: Record<string, string | number>
): Promise<string> {
  const lang = await getCurrentLanguage();
  const translation = getNestedValue(translations[lang] as unknown as Record<string, unknown>, key);

  if (!translation) {
    console.warn(`[translate] Missing translation: ${key} (${lang})`);
    return key;
  }

  return replacePlaceholders(translation, params);
}

/**
 * Synchronous translate (when language is already known)
 */
export function translateSync(
  lang: Language,
  key: string,
  params?: Record<string, string | number>
): string {
  const translation = getNestedValue(translations[lang] as unknown as Record<string, unknown>, key);

  if (!translation) {
    console.warn(`[translate] Missing translation: ${key} (${lang})`);
    return key;
  }

  return replacePlaceholders(translation, params);
}
