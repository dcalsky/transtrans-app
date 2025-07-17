import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { settingsStore, updateLanguage } from '@/store/settings';

import EN from '@/locales/en.json';
import ZH from '@/locales/zh.json';
import JA from '@/locales/ja.json';

const locales = getLocales();
const deviceLanguage = locales[0]?.languageCode || 'en';
console.log(deviceLanguage)

i18next.use(initReactI18next).init({
  lng: deviceLanguage,
  fallbackLng: 'en',
  resources: {
    zh: {
      translation: ZH,
    },
    en: {
      translation: EN,
    },
    ja: {
      translation: JA
    }
  },
  interpolation: {
    escapeValue: false // React already escapes values
  }
});

// Export the i18next instance for direct use
export default i18next;

// Helper function to change the language
export const changeLanguage = (lng: string) => {
  // Update the settings store
  updateLanguage(lng);
  // Change the language in i18next
  return i18next.changeLanguage(lng);
};

// Helper function to get available languages
export const getAvailableLanguages = () => {
  return Object.keys(i18next.options.resources || {});
};

// Function to initialize language from settings
export const initLanguageFromSettings = () => {
  if (settingsStore.language) {
    // Always use the user's language setting when available
    i18next.changeLanguage(settingsStore.language);
  }
};