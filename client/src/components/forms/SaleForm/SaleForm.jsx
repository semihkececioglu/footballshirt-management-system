import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FormField } from '@/components/forms/JerseyForm/FormField';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Combobox } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { SelectSheet } from '@/components/ui/select-sheet';
import { DatePicker } from '@/components/ui/date-picker';
import { PLATFORMS, PAYMENT_METHODS } from '@/lib/constants';
import { jerseyService, saleService } from '@/services/api';
import { useTranslateConstant } from '@/hooks/useTranslateConstant';
import { useCurrencyStore, CURRENCIES } from '@/store/currencyStore';

export function SaleForm({ jersey, onSuccess, onCancel }) {
  const { t } = useTranslation();
  const { currency } = useCurrencyStore();
  const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol || '₺';
  const translateJerseyType = useTranslateConstant('jerseyType');
  const [buyerSuggestions, setBuyerSuggestions] = useState({ buyerNames: [], buyerUsernames: [] });
  const hasVariants = jersey?.sizeVariants?.length > 0;

  useEffect(() => {
    saleService.getFilterOptions()
      .then((res) => setBuyerSuggestions({
        buyerNames: res.data.data?.buyerNames || [],
        buyerUsernames: res.data.data?.buyerUsernames || [],
      }))
      .catch(() => {});
  }, []);

  const availableVariants = hasVariants
    ? jersey.sizeVariants.filter((v) => v.stockCount > 0)
    : [];

  const { register, control, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      salePrice: jersey?.sellPrice || 0,
      soldAt: new Date().toISOString().split('T')[0],
      soldSize: availableVariants.length === 1 ? availableVariants[0].size : '',
    },
  });

  async function onSubmit(data) {
    try {
      const res = await jerseyService.markSold(jersey._id, {
        ...data,
        salePrice: Number(data.salePrice),
      });
      toast.success(t('form.saleSuccess'));
      onSuccess(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || t('form.saleError'));
    }
  }

  const platformOptions = PLATFORMS.map((p) => ({
    value: p,
    label: t(`const.platform.${p}`, { defaultValue: p }),
  }));

  const paymentOptions = PAYMENT_METHODS.map((m) => ({
    value: m,
    label: t(`const.payment_method.${m}`, { defaultValue: m }),
  }));

  const sizeOptions = availableVariants.map((v) => ({
    value: v.size,
    label: `${v.size} (${v.stockCount} ${t('form.stockUnit')})`,
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="p-3 rounded-lg bg-[var(--bg-secondary)] text-sm text-[var(--text-secondary)]">
        <span className="font-medium text-[var(--text-primary)]">{jersey?.teamName}</span>
        {jersey?.season && ` · ${jersey.season}`}
        {jersey?.type && ` · ${translateJerseyType(jersey.type)}`}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {hasVariants && (
          <FormField label={t('form.size')} required>
            <Controller
              name="soldSize"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <SelectSheet
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={t('form.sizePlaceholder')}
                  options={sizeOptions}
                  label={t('form.size')}
                />
              )}
            />
          </FormField>
        )}

        <FormField label={t('form.buyerName')}>
          <Controller
            name="buyerName"
            control={control}
            render={({ field }) => (
              <Combobox
                options={buyerSuggestions.buyerNames}
                value={field.value || ''}
                onChange={field.onChange}
                placeholder={t('form.buyerNamePlaceholder')}
                allowCustom
                clearable
              />
            )}
          />
        </FormField>

        <FormField label={t('form.buyerUsernameLabel')}>
          <Controller
            name="buyerUsername"
            control={control}
            render={({ field }) => (
              <Combobox
                options={buyerSuggestions.buyerUsernames}
                value={field.value || ''}
                onChange={field.onChange}
                placeholder={t('form.buyerUsernamePlaceholder')}
                allowCustom
                clearable
              />
            )}
          />
        </FormField>

        <div className="col-span-2">
          <FormField label={t('form.buyerPhone')}>
            <Controller
              name="buyerPhone"
              control={control}
              render={({ field }) => (
                <PhoneInput value={field.value || ''} onChange={field.onChange} />
              )}
            />
          </FormField>
        </div>

        <FormField label={t('form.saleDate')}>
          <Controller
            name="soldAt"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                placeholder={t('form.saleDate')}
              />
            )}
          />
        </FormField>

        <FormField label={t('form.platform')}>
          <Controller
            name="platform"
            control={control}
            render={({ field }) => (
              <SelectSheet
                value={field.value}
                onValueChange={field.onChange}
                placeholder={t('form.platform')}
                options={platformOptions}
                label={t('form.platform')}
              />
            )}
          />
        </FormField>

        <FormField label={t('form.paymentMethod')}>
          <Controller
            name="paymentMethod"
            control={control}
            render={({ field }) => (
              <SelectSheet
                value={field.value}
                onValueChange={field.onChange}
                placeholder={t('form.paymentPlaceholder')}
                options={paymentOptions}
                label={t('form.paymentMethod')}
              />
            )}
          />
        </FormField>
      </div>

      <FormField label={t('form.listingUrl')}>
        <Input {...register('listingUrl')} placeholder={t('form.listingUrlPlaceholder')} />
      </FormField>

      <FormField label={t('form.salePrice', { symbol })} required>
        <Input type="number" {...register('salePrice', { required: true, min: 0 })} />
      </FormField>

      <FormField label={t('form.note')}>
        <Input {...register('notes')} placeholder={t('common.optional')} />
      </FormField>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          {t('form.saveSale')}
        </Button>
      </div>
    </form>
  );
}
