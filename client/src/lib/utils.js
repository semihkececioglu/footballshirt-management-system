import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const CURRENCY_LOCALE = { TRY: 'tr-TR', EUR: 'de-DE', USD: 'en-US', GBP: 'en-GB' };

export function formatCurrency(amount, currency = 'TRY') {
  const locale = CURRENCY_LOCALE[currency] ?? 'tr-TR';
  const value = amount ?? 0;
  const hasDecimals = value % 1 !== 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(value);
}

export function formatDate(date) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('tr-TR').format(new Date(date));
}

export function formatDateLong(date) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date));
}

export function getWhatsAppUrl(phone) {
  if (!phone) return null;
  // E.164 format (+90...) — strip + and non-digits
  if (phone.startsWith('+')) return `https://wa.me/${phone.replace(/\D/g, '')}`;
  // Legacy Turkish format (digits only)
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  const withCountry = digits.startsWith('90') ? digits : `90${digits}`;
  return `https://wa.me/${withCountry}`;
}

export const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];
