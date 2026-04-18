import { useState, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTranslateConstant } from '@/hooks/useTranslateConstant';
import { useCurrencyStore, CURRENCIES } from '@/store/currencyStore';

import { useJerseyForm } from './useJerseyForm';
import { FormField } from './FormField';
import { ImageUploader } from '@/components/common/ImageUploader/ImageUploader';
import { TeamSelector } from '@/components/common/TeamSelector/TeamSelector';
import { ColorPicker } from '@/components/common/ColorPicker/ColorPicker';
import { PatchesInput } from '@/components/common/PatchesInput/PatchesInput';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { SelectSheet } from '@/components/ui/select-sheet';

import {
  JERSEY_TYPES, JERSEY_QUALITIES, JERSEY_SIZES, CONDITIONS,
  PLATFORMS, SEASONS,
} from '@/lib/constants';
import { jerseyService } from '@/services/api';

const EMPTY_PLATFORM = { name: '', listingUrl: '', isActive: true };
const EMPTY_VARIANT = { size: '', stockCount: 1 };

function buildFormData(data, images, platforms, sizeVariants, patches) {
  const fd = new FormData();

  const validVariants = sizeVariants.filter((v) => v.size);

  const payload = {
    teamName: data.teamName,
    country: data.country || '',
    league: data.league || '',
    season: data.season || '',
    type: data.type || '',
    quality: data.quality || '',
    brand: data.brand || '',
    technology: data.technology || '',
    // Keep legacy size/stockCount for backward compat with filters
    size: validVariants[0]?.size || '',
    stockCount: validVariants.reduce((acc, v) => acc + (Number(v.stockCount) || 0), 0) || 1,
    sizeVariants: validVariants.map((v) => ({ size: v.size, stockCount: Number(v.stockCount) || 0 })),
    sponsor: data.sponsor || '',
    condition: data.condition || '',
    buyPrice: Number(data.buyPrice) || 0,
    sellPrice: Number(data.sellPrice) || 0,
    status: data.status || 'for_sale',
    productCode: data.productCode || '',
    notes: data.notes || '',
    purchaseDate: data.purchaseDate || null,
    measurements: {
      armpit: data.measurements?.armpit ? Number(data.measurements.armpit) : null,
      length: data.measurements?.length ? Number(data.measurements.length) : null,
    },
    printing: {
      hasNumber: data.printing?.hasNumber || false,
      number: data.printing?.number || '',
      playerName: data.printing?.playerName || '',
    },
    patches,
    primaryColor: data.primaryColor || '',
    detailColor: data.detailColor || '',
    platforms: platforms.filter((p) => p.name),
    images: images.filter((i) => i.url).map((i) => ({
      url: i.url,
      publicId: i.publicId,
      isMain: i.isMain,
    })),
  };

  fd.append('data', JSON.stringify(payload));
  images.filter((i) => i.file).forEach((i) => fd.append('images', i.file));

  return fd;
}

/**
 * Props:
 *  jersey?: existing jersey (edit mode)
 *  onSuccess: (jersey) => void
 *  onCancel: () => void
 */
export function JerseyForm({ jersey, onSuccess, onCancel }) {
  const isEdit = !!jersey;
  const { t } = useTranslation();
  const { currency } = useCurrencyStore();
  const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol || '₺';
  const translateCondition = useTranslateConstant('condition');
  const translateJerseyType = useTranslateConstant('jerseyType');
  const translateJerseyQuality = useTranslateConstant('jerseyQuality');
  const translateJerseySize = useTranslateConstant('jerseySize');
  const {
    register, control, watch, setValue, handleSubmit,
    formState: { errors, isSubmitting },
  } = useJerseyForm(jersey ? flattenJersey(jersey) : {});

  const [images, setImages] = useState(
    jersey?.images?.map((img) => ({ ...img, id: img.publicId || img.url, preview: img.url })) || []
  );
  const [platforms, setPlatforms] = useState(jersey?.platforms?.length ? jersey.platforms : []);
  const [patches, setPatches] = useState(jersey?.patches || []);
  const [sizeVariants, setSizeVariants] = useState(() => {
    if (jersey?.sizeVariants?.length) return jersey.sizeVariants.map((v) => ({ ...v }));
    if (jersey?.size) return [{ size: jersey.size, stockCount: jersey.stockCount ?? 1 }];
    return [{ ...EMPTY_VARIANT }];
  });
  const [brands, setBrands] = useState([]);
  const [technologies, setTechnologies] = useState({});

  const selectedBrand = watch('brand');
  const hasPrinting = watch('printing.hasNumber');
  const teamData = {
    teamName: watch('teamName'),
    country: watch('country'),
    league: watch('league'),
  };

  useEffect(() => {
    fetch('/data/brands.json').then((r) => r.json()).then(setBrands);
    fetch('/data/technologies.json').then((r) => r.json()).then(setTechnologies);
  }, []);

  const techOptions = selectedBrand
    ? (technologies[selectedBrand] || technologies.generic || [])
    : [];

  function handleTeamChange(val) {
    setValue('teamName', val.teamName || '');
    setValue('country', val.country || '');
    setValue('league', val.league || '');
  }

  function addPlatform() {
    setPlatforms((p) => [...p, { ...EMPTY_PLATFORM }]);
  }

  function removePlatform(i) {
    setPlatforms((p) => p.filter((_, idx) => idx !== i));
  }

  function updatePlatform(i, key, val) {
    setPlatforms((p) => p.map((item, idx) => (idx === i ? { ...item, [key]: val } : item)));
  }

  function addVariant() {
    setSizeVariants((v) => [...v, { ...EMPTY_VARIANT }]);
  }

  function removeVariant(i) {
    setSizeVariants((v) => v.filter((_, idx) => idx !== i));
  }

  function updateVariant(i, key, val) {
    setSizeVariants((v) => v.map((item, idx) => (idx === i ? { ...item, [key]: val } : item)));
  }

  async function onSubmit(data) {
    try {
      const fd = buildFormData(data, images, platforms, sizeVariants, patches);
      const res = isEdit
        ? await jerseyService.update(jersey._id, fd)
        : await jerseyService.create(fd);
      toast.success(isEdit ? t('jersey.editSuccess') : t('jersey.addSuccess'));
      onSuccess(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || t('jersey.formError'));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Images */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{t('form.images')}</h3>
        <ImageUploader images={images} onChange={setImages} maxFiles={10} />
      </section>

      <Separator />

      {/* Team */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{t('form.teamInfo')}</h3>
        <TeamSelector value={teamData} onChange={handleTeamChange} />
        {errors.teamName && (
          <p className="text-xs text-red-500 mt-1">{errors.teamName.message}</p>
        )}
      </section>

      <Separator />

      {/* Jersey Details */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{t('form.jerseyDetails')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FormField label={t('form.season')}>
            <Controller
              name="season"
              control={control}
              render={({ field }) => (
                <SelectSheet
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={t('form.season')}
                  options={SEASONS.map((s) => ({ value: s, label: s }))}
                />
              )}
            />
          </FormField>

          <FormField label={t('jersey.type')}>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <SelectSheet
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={t('jersey.type')}
                  options={JERSEY_TYPES.map((jt) => ({ value: jt, label: translateJerseyType(jt) }))}
                />
              )}
            />
          </FormField>

          <FormField label={t('jersey.quality')}>
            <Controller
              name="quality"
              control={control}
              render={({ field }) => (
                <SelectSheet
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={t('jersey.quality')}
                  options={JERSEY_QUALITIES.map((q) => ({ value: q, label: translateJerseyQuality(q) }))}
                />
              )}
            />
          </FormField>

          <FormField label={t('jersey.condition')}>
            <Controller
              name="condition"
              control={control}
              render={({ field }) => (
                <SelectSheet
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={t('jersey.condition')}
                  options={CONDITIONS.map((c) => ({ value: c, label: translateCondition(c) }))}
                />
              )}
            />
          </FormField>

          <FormField label={t('jersey.brand')}>
            <Controller
              name="brand"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={brands}
                  value={field.value}
                  onChange={(v) => { field.onChange(v); setValue('technology', ''); }}
                  placeholder={t('form.brandPlaceholder')}
                  allowCustom
                  clearable
                />
              )}
            />
          </FormField>

          <FormField label={t('jersey.technology')}>
            <Controller
              name="technology"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={techOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={selectedBrand ? t('form.techPlaceholder') : t('form.techDisabled')}
                  allowCustom
                  clearable
                  disabled={!selectedBrand}
                />
              )}
            />
          </FormField>

          <FormField label={t('jersey.sponsor')}>
            <Input {...register('sponsor')} placeholder={t('form.sponsorPlaceholder')} />
          </FormField>

          <FormField label={t('form.productCode')}>
            <Input {...register('productCode')} placeholder={t('form.productCodePlaceholder')} />
          </FormField>

          <FormField label={t('jersey.purchaseDate')}>
            <Controller
              name="purchaseDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                />
              )}
            />
          </FormField>
        </div>
      </section>

      <Separator />

      {/* Colors */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{t('form.colors')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Controller
            name="primaryColor"
            control={control}
            render={({ field }) => (
              <ColorPicker
                label={t('form.primary')}
                value={field.value || ''}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            name="detailColor"
            control={control}
            render={({ field }) => (
              <ColorPicker
                label={t('form.detail')}
                value={field.value || ''}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </section>

      <Separator />

      {/* Measurements */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{t('form.measurements')}</h3>
        <div className="grid grid-cols-2 gap-3">
          <FormField label={t('form.measurementsArmpit')}>
            <Input type="number" {...register('measurements.armpit')} placeholder="cm" />
          </FormField>
          <FormField label={t('form.measurementsLength')}>
            <Input type="number" {...register('measurements.length')} placeholder="cm" />
          </FormField>
        </div>
      </section>

      <Separator />

      {/* Printing */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{t('form.printing')}</h3>
        <div className="flex items-center gap-2 mb-3">
          <Controller
            name="printing.hasNumber"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          <Label>{t('form.hasPrinting')}</Label>
        </div>
        {hasPrinting && (
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('form.number')}>
              <Input {...register('printing.number')} placeholder="7" />
            </FormField>
            <FormField label={t('form.playerName')}>
              <Input {...register('printing.playerName')} placeholder="RONALDO" />
            </FormField>
          </div>
        )}
      </section>

      <Separator />

      {/* Patch */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{t('form.patch')}</h3>
        <PatchesInput value={patches} onChange={setPatches} />
      </section>

      <Separator />

      {/* Price */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{t('form.price')}</h3>
        <div className="grid grid-cols-2 gap-3">
          <FormField label={t('form.buyPrice', { symbol })}>
            <Input type="number" {...register('buyPrice')} placeholder="0" />
          </FormField>
          <FormField label={t('form.sellPrice', { symbol })}>
            <Input type="number" {...register('sellPrice')} placeholder="0" />
          </FormField>
        </div>
      </section>

      <Separator />

      {/* Size & Stock */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('form.sizeStock')}</h3>
          <Button type="button" variant="ghost" size="sm" onClick={addVariant}>
            <Plus size={14} /> {t('form.addSize')}
          </Button>
        </div>
        <div className="space-y-2">
          {sizeVariants.map((v, i) => (
            <div key={i} className="flex gap-2 items-center">
              <SelectSheet
                value={v.size}
                onValueChange={(val) => updateVariant(i, 'size', val)}
                placeholder={t('form.size')}
                options={JERSEY_SIZES.map((s) => ({ value: s, label: translateJerseySize(s) }))}
                className="w-28"
              />
              <Input
                type="number"
                min="0"
                value={v.stockCount}
                onChange={(e) => updateVariant(i, 'stockCount', e.target.value)}
                placeholder={t('form.quantity')}
                className="w-24"
              />
              {sizeVariants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  className="text-[var(--text-muted)] hover:text-red-500 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Sales Platforms */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('form.salesPlatforms')}</h3>
          <Button type="button" variant="ghost" size="sm" onClick={addPlatform}>
            <Plus size={14} /> {t('form.addPlatform')}
          </Button>
        </div>
        <div className="space-y-2">
          {platforms.map((p, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Combobox
                options={PLATFORMS}
                value={p.name}
                onChange={(v) => updatePlatform(i, 'name', v)}
                placeholder={t('form.platform')}
                className="w-36"
              />
              <Input
                value={p.listingUrl}
                onChange={(e) => updatePlatform(i, 'listingUrl', e.target.value)}
                placeholder={t('form.listingUrl')}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => removePlatform(i)}
                className="text-[var(--text-muted)] hover:text-red-500 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Notes */}
      <section>
        <FormField label={t('common.notes')}>
          <Textarea {...register('notes')} placeholder={t('form.additionalNotes')} rows={3} />
        </FormField>
      </section>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          {isEdit ? t('form.updateButton') : t('form.saveButton')}
        </Button>
      </div>
    </form>
  );
}

// Prepare jersey for form defaultValues
function flattenJersey(jersey) {
  return {
    ...jersey,
    productCode: jersey.productCode || '',
    primaryColor: jersey.primaryColor || '',
    detailColor: jersey.detailColor || '',
    measurements: {
      armpit: jersey.measurements?.armpit || '',
      length: jersey.measurements?.length || '',
    },
    printing: {
      hasNumber: jersey.printing?.hasNumber || false,
      number: jersey.printing?.number || '',
      playerName: jersey.printing?.playerName || '',
    },
    purchaseDate: jersey.purchaseDate
      ? new Date(jersey.purchaseDate).toISOString().split('T')[0]
      : '',
  };
}
