// i18n System
// Lightweight internationalization without external dependencies

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import enTranslations from './translations/en.json';
import jaTranslations from './translations/ja.json';
import { STORAGE_KEYS } from '@/types/storage';

// Supported languages
export type Language = 'en' | 'ja';

// Translation type
type Translations = typeof enTranslations;

// Available translations
const translations: Record<Language, Translations> = {
  en: enTranslations,
  ja: jaTranslations,
};

// i18n Context
interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

/**
 * Detect browser language
 * Falls back to 'en' if unsupported
 */
function detectBrowserLanguage(): Language {
  const browserLang = navigator.language.toLowerCase();

  // Check for Japanese
  if (browserLang.startsWith('ja')) {
    return 'ja';
  }

  // Default to English
  return 'en';
}

/**
 * Get nested translation value
 * Supports dot notation like "app.title"
 */
function getNestedValue(obj: Record<string, any>, path: string): string | undefined {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

/**
 * Replace placeholders in translation strings
 * Example: "Count: {{count}}" with { count: 5 } → "Count: 5"
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
 * i18n Provider Component
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Load saved language on mount
  useEffect(() => {
    async function loadLanguage() {
      try {
        const data = await chrome.storage.local.get(STORAGE_KEYS.LANGUAGE);
        const savedLang = data[STORAGE_KEYS.LANGUAGE] as Language | undefined;

        if (savedLang && (savedLang === 'en' || savedLang === 'ja')) {
          setLanguageState(savedLang);
        } else {
          // No saved language, detect browser language
          const detected = detectBrowserLanguage();
          setLanguageState(detected);
        }
      } catch (error) {
        console.error('[i18n] Failed to load language:', error);
      }
    }

    loadLanguage();
  }, []);

  // Set language and save to storage
  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.LANGUAGE]: lang });
    } catch (error) {
      console.error('[i18n] Failed to save language:', error);
    }
  };

  // Translation function
  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = getNestedValue(translations[language], key);

    if (!translation) {
      console.warn(`[i18n] Missing translation: ${key} (${language})`);
      return key;
    }

    return replacePlaceholders(translation, params);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>{children}</I18nContext.Provider>
  );
}

/**
 * useTranslation Hook
 * Access translation function and language state
 */
export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
}
