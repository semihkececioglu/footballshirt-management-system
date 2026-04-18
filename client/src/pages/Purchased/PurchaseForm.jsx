import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTranslateConstant } from '@/hooks/useTranslateConstant';
import { useCurrencyStore, CURRENCIES } from '@/store/currencyStore';
import { uploadService, sellerService, purchaseService } from '@/services/api';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { TeamSelector } from '@/components/common/TeamSelector/TeamSelector';
import { ColorPicker } from '@/components/common/ColorPicker/ColorPicker';
import { Combobox } from '@/components/ui/combobox';
import { FormField } from '@/components/forms/JerseyForm/FormField';
import { ImageUploader } from '@/components/common/ImageUploader/ImageUploader';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from '@/components/ui/date-picker';
import { SelectSheet } from '@/components/ui/select-sheet';
import { DialogFooter } from '@/components/ui/dialog';
import {
  JERSEY_TYPES, JERSEY_QUALITIES, JERSEY_SIZES, CONDITIONS, SEASONS, PLATFORMS,
} from '@/lib/constants';
import { PatchesInput } from '@/components/common/PatchesInput/PatchesInput';

const EMPTY_VARIANT = { size: '', stockCount: 1 };

export const EMPTY_PURCHASE_FORM = {
  country: '', league: '', teamName: '',
  season: '', type: '', quality: '',
  brand: '', technology: '', sponsor: '', productCode: '',
  purchaseDate: '',
  size: '',
  sizeVariants: [{ ...EMPTY_VARIANT }],
  measurements: { armpit: '', length: '' },
  condition: '',
  printing: { hasNumber: false, number: '', playerName: '' },
  patches: [],
  primaryColor: '', detailColor: '',
  images: [],
  buyPrice: '', platform: '',
  isForResale: false,
  seller: '',
  sellerName: '',
  sellerPhone: '',
  notes: '',
};

/**
 * Props:
 *   initialValues: object (EMPTY_PURCHASE_FORM shape)
 *   onSubmit: (payload) => void
 *   onCancel: () => void
 *   saving: boolean
 *   submitLabel: string (optional)
 */
export function PurchaseForm({ initialValues = {}, onSubmit, onCancel, saving, submitLabel }) {
  const { t } = useTranslation();
  const { currency } = useCurrencyStore();
  const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol || '₺';
  const translateCondition = useTranslateConstant('condition');
  const translateJerseyType = useTranslateConstant('jerseyType');
  const translateJerseyQuality = useTranslateConstant('jerseyQuality');
  const translateJerseySize = useTranslateConstant('jerseySize');
  const translatePlatform = useTranslateConstant('platform');

  const [form, setForm] = useState({ ...EMPTY_PURCHASE_FORM, ...initialValues });
  const [errors, setErrors] = useState({});
  const [brands, setBrands] = useState([]);
  const [technologies, setTechnologies] = useState({});
  const [sellers, setSellers] = useState([]);
  const [pastSellerNames, setPastSellerNames] = useState([]);
  const [sizeVariants, setSizeVariants] = useState(() => {
    if (initialValues.sizeVariants?.length) return initialValues.sizeVariants.map((v) => ({ ...v }));
    if (initialValues.size) return [{ size: initialValues.size, stockCount: 1 }];
    return [{ ...EMPTY_VARIANT }];
  });

  // Images: [{ id, preview, file?, url?, publicId?, isMain? }]
  const [images, setImages] = useState(() =>
    (initialValues.images || []).map((img) => ({
      id: img.publicId || img.url,
      preview: img.url,
      url: img.url,
      publicId: img.publicId,
      isMain: img.isMain,
    }))
  );
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch('/data/brands.json').then((r) => r.json()).then(setBrands).catch(() => {});
    fetch('/data/technologies.json').then((r) => r.json()).then(setTechnologies).catch(() => {});
    sellerService.getAll().then((res) => setSellers(res.data.data || [])).catch(() => {});
    purchaseService.getFilterOptions().then((res) => {
      setPastSellerNames(res.data.data?.sellerNames || []);
    }).catch(() => {});
  }, []);

  // Re-sync when initialValues change (e.g. opening edit for different item)
  useEffect(() => {
    setForm({ ...EMPTY_PURCHASE_FORM, ...initialValues });
    setSizeVariants(
      initialValues.sizeVariants?.length
        ? initialValues.sizeVariants.map((v) => ({ ...v }))
        : initialValues.size ? [{ size: initialValues.size, stockCount: 1 }] : [{ ...EMPTY_VARIANT }]
    );
    setImages(
      (initialValues.images || []).map((img) => ({
        id: img.publicId || img.url,
        preview: img.url,
        url: img.url,
        publicId: img.publicId,
        isMain: img.isMain,
      }))
    );
  }, [JSON.stringify(initialValues)]); // eslint-disable-line react-hooks/exhaustive-deps

  const techOptions = form.brand ? (technologies[form.brand] || technologies.generic || []) : [];

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function setNested(parent, field, value) {
    setForm((prev) => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.teamName.trim()) {
      setErrors({ teamName: t('form.teamRequired') });
      return;
    }
    setErrors({});

    // Upload any new files (images with .file property)
    const newFiles = images.filter((i) => i.file).map((i) => i.file);
    let uploadedImages = [];
    if (newFiles.length > 0) {
      setUploading(true);
      try {
        const res = await uploadService.images(newFiles);
        uploadedImages = res.data.data || [];
      } finally {
        setUploading(false);
      }
    }

    // Combine existing images (those with .url but no .file) + newly uploaded
    const existingImages = images
      .filter((i) => !i.file && i.url)
      .map((i) => ({ url: i.url, publicId: i.publicId }));

    const validVariants = sizeVariants.filter((v) => v.size);
    const payload = {
      ...form,
      images: [...existingImages, ...uploadedImages],
      buyPrice: form.buyPrice !== '' ? Number(form.buyPrice) : undefined,
      isForResale: Boolean(form.isForResale),
      purchaseDate: form.purchaseDate ? new Date(form.purchaseDate).toISOString() : undefined,
      seller: form.seller || undefined,
      sizeVariants: validVariants.map((v) => ({ size: v.size, stockCount: Number(v.stockCount) || 1 })),
      size: validVariants[0]?.size || '',
      measurements: {
        armpit: form.measurements.armpit ? Number(form.measurements.armpit) : null,
        length: form.measurements.length ? Number(form.measurements.length) : null,
      },
    };
    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Images */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{t('form.images')}</h3>
        <ImageUploader images={images} onChange={setImages} maxFiles={10} />
      </section>

      <Separator />

      {/* Team */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{t('form.teamInfo')}</h3>
        <TeamSelector
          value={{ country: form.country, league: form.league, teamName: form.teamName }}
          onChange={({ country, league, teamName }) => {
            setForm((p) => ({ ...p, country, league, teamName }));
            if (teamName) setErrors((e) => ({ ...e, teamName: undefined }));
          }}
        />
        {errors.teamName && (
          <p className="text-xs text-red-500 mt-1">{errors.teamName}</p>
        )}
      </section>

      <Separator />

      {/* Jersey Details */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{t('form.jerseyDetails')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FormField label={t('form.season')}>
            <SelectSheet
              value={form.season}
              onValueChange={(v) => set('season', v)}
              placeholder={t('form.season')}
              options={SEASONS.map((s) => ({ value: s, label: s }))}
            />
          </FormField>
          <FormField label={t('jersey.type')}>
            <SelectSheet
              value={form.type}
              onValueChange={(v) => set('type', v)}
              placeholder={t('jersey.type')}
              options={JERSEY_TYPES.map((jt) => ({ value: jt, label: translateJerseyType(jt) }))}
            />
          </FormField>
          <FormField label={t('jersey.quality')}>
            <SelectSheet
              value={form.quality}
              onValueChange={(v) => set('quality', v)}
              placeholder={t('jersey.quality')}
              options={JERSEY_QUALITIES.map((q) => ({ value: q, label: translateJerseyQuality(q) }))}
            />
          </FormField>
          <FormField label={t('jersey.condition')}>
            <SelectSheet
              value={form.condition}
              onValueChange={(v) => set('condition', v)}
              placeholder={t('jersey.condition')}
              options={CONDITIONS.map((c) => ({ value: c, label: translateCondition(c) }))}
            />
          </FormField>
          <FormField label={t('jersey.brand')}>
            <Combobox
              options={brands}
              value={form.brand}
              onChange={(v) => { set('brand', v); set('technology', ''); }}
              placeholder={t('form.brandPlaceholder')}
              allowCustom
              clearable
            />
          </FormField>
          <FormField label={t('jersey.technology')}>
            <Combobox
              options={techOptions}
              value={form.technology}
              onChange={(v) => set('technology', v)}
              placeholder={form.brand ? t('form.techPlaceholder') : t('form.techDisabled')}
              allowCustom
              clearable
              disabled={!form.brand}
            />
          </FormField>
          <FormField label={t('jersey.sponsor')}>
            <Input value={form.sponsor} onChange={(e) => set('sponsor', e.target.value)} placeholder={t('form.sponsorPlaceholder')} />
          </FormField>
          <FormField label={t('form.productCode')}>
            <Input value={form.productCode} onChange={(e) => set('productCode', e.target.value)} placeholder={t('form.productCodePlaceholder')} />
          </FormField>
          <FormField label={t('jersey.purchaseDate')}>
            <DatePicker
              value={form.purchaseDate}
              onChange={(date) => set('purchaseDate', date ? date.toISOString().split('T')[0] : '')}
            />
          </FormField>
        </div>
      </section>

      <Separator />

      {/* Colors */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{t('form.colors')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ColorPicker label={t('form.primary')} value={form.primaryColor} onChange={(v) => set('primaryColor', v)} />
          <ColorPicker label={t('form.detail')} value={form.detailColor} onChange={(v) => set('detailColor', v)} />
        </div>
      </section>

      <Separator />

      {/* Measurements */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{t('form.measurements')}</h3>
        <div className="grid grid-cols-2 gap-3">
          <FormField label={t('form.measurementsArmpit')}>
            <Input type="number" value={form.measurements.armpit} onChange={(e) => setNested('measurements', 'armpit', e.target.value)} placeholder="cm" />
          </FormField>
          <FormField label={t('form.measurementsLength')}>
            <Input type="number" value={form.measurements.length} onChange={(e) => setNested('measurements', 'length', e.target.value)} placeholder="cm" />
          </FormField>
        </div>
      </section>

      <Separator />

      {/* Printing */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{t('form.printing')}</h3>
        <div className="flex items-center gap-2 mb-3">
          <Switch
            checked={form.printing.hasNumber}
            onCheckedChange={(v) => setNested('printing', 'hasNumber', v)}
          />
          <Label>{t('form.hasPrinting')}</Label>
        </div>
        {form.printing.hasNumber && (
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('form.number')}>
              <Input value={form.printing.number} onChange={(e) => setNested('printing', 'number', e.target.value)} placeholder="7" />
            </FormField>
            <FormField label={t('form.playerName')}>
              <Input value={form.printing.playerName} onChange={(e) => setNested('printing', 'playerName', e.target.value)} placeholder="RONALDO" />
            </FormField>
          </div>
        )}
      </section>

      <Separator />

      {/* Patches */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{t('form.patch')}</h3>
        <PatchesInput value={form.patches || []} onChange={(v) => set('patches', v)} />
      </section>

      <Separator />

      {/* Purchase Info */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{t('form.purchaseInfo')}</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <FormField label={t('form.buyPrice', { symbol })}>
            <Input type="number" min="0" value={form.buyPrice} onChange={(e) => set('buyPrice', e.target.value)} placeholder="0" />
          </FormField>
          <FormField label={t('form.platform')}>
            <SelectSheet
              value={form.platform}
              onValueChange={(v) => set('platform', v)}
              placeholder={t('form.platform')}
              options={PLATFORMS.map((p) => ({ value: p, label: translatePlatform(p) }))}
            />
          </FormField>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            checked={form.isForResale}
            onCheckedChange={(v) => set('isForResale', v)}
          />
          <span className="text-sm text-[var(--text-primary)]">{t('form.forResale')}</span>
        </div>
      </section>

      <Separator />

      {/* Seller */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{t('form.seller')}</h3>
        <div className="space-y-3">
          <FormField label={t('form.sellerName')}>
            <Combobox
              options={[
                ...sellers.map((s) => ({
                  value: s.name,
                  label: s.username ? `${s.name} (@${s.username})` : s.name,
                })),
                ...pastSellerNames
                  .filter((n) => !sellers.some((s) => s.name === n))
                  .map((n) => ({ value: n, label: n })),
              ]}
              value={form.sellerName}
              onChange={(name) => {
                set('sellerName', name);
                const match = sellers.find((s) => s.name === name);
                if (match) {
                  if (match.phone) set('sellerPhone', match.phone);
                  set('seller', match._id);
                } else {
                  set('seller', '');
                }
              }}
              placeholder={t('form.sellerNamePlaceholder')}
              allowCustom
              clearable
            />
          </FormField>
          <FormField label={t('form.sellerPhone')}>
            <PhoneInput
              value={form.sellerPhone}
              onChange={(v) => set('sellerPhone', v)}
            />
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

      {/* Notes */}
      <section>
        <FormField label={t('common.notes')}>
          <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder={t('form.additionalNotes')} rows={3} />
        </FormField>
      </section>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={saving || uploading}>
          {uploading ? t('form.uploading') : saving ? t('common.saving') : (submitLabel || t('form.saveButton'))}
        </Button>
      </DialogFooter>
    </form>
  );
}
