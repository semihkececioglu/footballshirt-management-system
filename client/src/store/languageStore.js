import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n/index';

export const LANGUAGES = [
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export const useLanguageStore = create(
  persist(
    (set, get) => ({
      language: 'tr',
      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ language: lang });
      },
      initLanguage: () => {
        i18n.changeLanguage(get().language);
      },
    }),
    { name: 'i18n-language' }
  )
);
