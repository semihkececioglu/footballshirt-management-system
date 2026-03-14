import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const CURRENCIES = [
  { code: 'TRY', locale: 'tr-TR', label: 'Türk Lirası', symbol: '₺' },
  { code: 'EUR', locale: 'de-DE', label: 'Euro', symbol: '€' },
  { code: 'USD', locale: 'en-US', label: 'Dolar', symbol: '$' },
  { code: 'GBP', locale: 'en-GB', label: 'Sterlin', symbol: '£' },
];

export const useCurrencyStore = create(
  persist(
    (set) => ({
      currency: 'TRY',
      setCurrency: (currency) => set({ currency }),
    }),
    { name: 'currency-storage' }
  )
);
