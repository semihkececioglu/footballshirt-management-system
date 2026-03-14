import { useTranslation } from 'react-i18next';

/**
 * @param {'condition' | 'jerseyType' | 'patchType' | 'payment' | 'platform' | 'payment_method' | 'jerseyQuality' | 'jerseySize'} key
 */
export function useTranslateConstant(key) {
  const { t } = useTranslation();

  function translate(value) {
    if (!value) return '';
    return t(`const.${key}.${value}`, { defaultValue: value });
  }

  return translate;
}
