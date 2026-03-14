import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FormField } from '@/components/forms/JerseyForm/FormField';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PLATFORMS, PAYMENT_METHODS } from '@/lib/constants';
import { jerseyService } from '@/services/api';
import { useTranslateConstant } from '@/hooks/useTranslateConstant';
import { useCurrencyStore, CURRENCIES } from '@/store/currencyStore';

export function SaleForm({ jersey, onSuccess, onCancel }) {
  const { t } = useTranslation();
  const { currency } = useCurrencyStore();
  const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol || '₺';
  const translateJerseyType = useTranslateConstant('jerseyType');
  const hasVariants = jersey?.sizeVariants?.length > 0;
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
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder={t('form.sizePlaceholder')} /></SelectTrigger>
                  <SelectContent>
                    {availableVariants.map((v) => (
                      <SelectItem key={v.size} value={v.size}>
                        {v.size} ({v.stockCount} {t('form.stockUnit')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        )}

        <FormField label={t('form.buyerName')}>
          <Input {...register('buyerName')} placeholder={t('form.buyerNamePlaceholder')} />
        </FormField>
        <FormField label={t('form.buyerUsernameLabel')}>
          <Input {...register('buyerUsername')} placeholder={t('form.buyerUsernamePlaceholder')} />
        </FormField>
        <FormField label={t('form.buyerPhone')}>
          <Controller
            name="buyerPhone"
            control={control}
            render={({ field }) => (
              <PhoneInput value={field.value || ''} onChange={field.onChange} />
            )}
          />
        </FormField>
        <FormField label={t('form.saleDate')}>
          <Input type="date" {...register('soldAt')} />
        </FormField>
        <FormField label={t('form.platform')}>
          <Controller
            name="platform"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder={t('form.platform')} /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{t(`const.platform.${p}`, { defaultValue: p })}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormField label={t('form.paymentMethod')}>
          <Controller
            name="paymentMethod"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder={t('form.paymentPlaceholder')} /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{t(`const.payment_method.${m}`, { defaultValue: m })}</SelectItem>)}
                </SelectContent>
              </Select>
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
