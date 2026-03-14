import { useCurrencyStore } from '@/store/currencyStore';
import { formatCurrency } from '@/lib/utils';

export function useFormatCurrency() {
  const currency = useCurrencyStore((s) => s.currency);
  return (amount) => formatCurrency(amount, currency);
}
