import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import tr from './locales/tr/translation.json';
import en from './locales/en/translation.json';

// Zustand persist middleware stores: {"state":{"language":"en"},"version":0}
// Read it synchronously so i18n initializes with the correct language immediately
const storedLang = (() => {
  try {
    const raw = localStorage.getItem('i18n-language');
    const parsed = JSON.parse(raw);
    const lang = parsed?.state?.language;
    return lang === 'en' || lang === 'tr' ? lang : null;
  } catch {
    return null;
  }
})();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      tr: { translation: tr },
      en: { translation: en },
    },
    lng: storedLang || 'tr',
    fallbackLng: 'tr',
    supportedLngs: ['tr', 'en'],
    interpolation: { escapeValue: false },
  });

export default i18n;
