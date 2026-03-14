import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Upload, X as XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTranslateConstant } from '@/hooks/useTranslateConstant';
import { uploadService } from '@/services/api';
import { TeamSelector } from '@/components/common/TeamSelector/TeamSelector';
import { ColorPicker } from '@/components/common/ColorPicker/ColorPicker';
import { Combobox } from '@/components/ui/combobox';
import { FormField } from '@/components/forms/JerseyForm/FormField';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DialogFooter } from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  JERSEY_TYPES, JERSEY_QUALITIES, JERSEY_SIZES, CONDITIONS, SEASONS, PLATFORMS,
} from '@/lib/constants';
import { PatchesInput } from '@/components/common/PatchesInput/PatchesInput';
import { toast } from 'sonner';

export const EMPTY_PURCHASE_FORM = {
  country: '', league: '', teamName: '',
  season: '', type: '', quality: '',
  brand: '', technology: '', sponsor: '', productCode: '',
  size: '',
  measurements: { armpit: '', length: '' },
  condition: '',
  printing: { hasNumber: false, number: '', playerName: '' },
  patches: [],
  primaryColor: '', detailColor: '',
  images: [],
  buyPrice: '', platform: '',
  purchaseDate: '',
  isForResale: false,
  notes: '',
};

function Sel({ value, onValueChange, children, placeholder }) {
  return (
    <Select value={value || '__none__'} onValueChange={(v) => onValueChange(v === '__none__' ? '' : v)}>
      <SelectTrigger><SelectValue placeholder={placeholder || 'Seçin'} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">—</SelectItem>
        {children}
      </SelectContent>
    </Select>
  );
}

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
  const translateCondition = useTranslateConstant('condition');
  const translateJerseyType = useTranslateConstant('jerseyType');
  const translateJerseyQuality = useTranslateConstant('jerseyQuality');
  const translateJerseySize = useTranslateConstant('jerseySize');
  const translatePlatform = useTranslateConstant('platform');
  const [form, setForm] = useState({ ...EMPTY_PURCHASE_FORM, ...initialValues });
  const [brands, setBrands] = useState([]);
  const [technologies, setTechnologies] = useState({});
  // Image management
  const [pendingFiles, setPendingFiles] = useState([]);
  const [pendingPreviews, setPendingPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch('/data/brands.json').then((r) => r.json()).then(setBrands).catch(() => {});
    fetch('/data/technologies.json').then((r) => r.json()).then(setTechnologies).catch(() => {});
  }, []);

  // Re-sync when initialValues change (e.g. opening edit for different item)
  useEffect(() => {
    setForm({ ...EMPTY_PURCHASE_FORM, ...initialValues });
    setPendingFiles([]);
    setPendingPreviews([]);
  }, [JSON.stringify(initialValues)]); // eslint-disable-line react-hooks/exhaustive-deps

  const techOptions = form.brand ? (technologies[form.brand] || technologies.generic || []) : [];

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function setNested(parent, field, value) {
    setForm((prev) => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));
  }

  const MAX_IMAGES = 10;

  function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = MAX_IMAGES - (form.images?.length || 0) - pendingFiles.length;
    if (remaining <= 0) {
      toast.warning(t('form.imageMaxWarning', { max: MAX_IMAGES }));
      e.target.value = '';
      return;
    }
    const allowed = files.slice(0, remaining);
    if (files.length > remaining) {
      toast.warning(t('form.imageMaxWarningPartial', { max: MAX_IMAGES, added: remaining }));
    }
    setPendingFiles((prev) => [...prev, ...allowed]);
    allowed.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPendingPreviews((prev) => [...prev, ev.target.result]);
      reader.readAsDataURL(f);
    });
    e.target.value = '';
  }

  function removeExistingImage(idx) {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  }

  function removePendingFile(idx) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
    setPendingPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    let uploadedImages = [];
    if (pendingFiles.length > 0) {
      setUploading(true);
      try {
        const res = await uploadService.images(pendingFiles);
        uploadedImages = res.data.data || [];
      } finally {
        setUploading(false);
      }
    }
    const payload = {
      ...form,
      images: [...(form.images || []), ...uploadedImages],
      buyPrice: form.buyPrice !== '' ? Number(form.buyPrice) : undefined,
      isForResale: Boolean(form.isForResale),
      purchaseDate: form.purchaseDate ? new Date(form.purchaseDate).toISOString() : undefined,
      measurements: {
        armpit: form.measurements.armpit ? Number(form.measurements.armpit) : null,
        length: form.measurements.length ? Number(form.measurements.length) : null,
      },
    };
    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 py-2">

      {/* Team */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('form.teamInfo')}</h3>
        <TeamSelector
          value={{ country: form.country, league: form.league, teamName: form.teamName }}
          onChange={({ country, league, teamName }) => setForm((p) => ({ ...p, country, league, teamName }))}
        />
      </section>

      <Separator />

      {/* Jersey Details */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('form.jerseyDetails')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FormField label={t('form.season')}>
            <Sel value={form.season} onValueChange={(v) => set('season', v)}>
              {SEASONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </Sel>
          </FormField>
          <FormField label={t('jersey.type')}>
            <Sel value={form.type} onValueChange={(v) => set('type', v)}>
              {JERSEY_TYPES.map((jt) => <SelectItem key={jt} value={jt}>{translateJerseyType(jt)}</SelectItem>)}
            </Sel>
          </FormField>
          <FormField label={t('jersey.quality')}>
            <Sel value={form.quality} onValueChange={(v) => set('quality', v)}>
              {JERSEY_QUALITIES.map((q) => <SelectItem key={q} value={q}>{translateJerseyQuality(q)}</SelectItem>)}
            </Sel>
          </FormField>
          <FormField label={t('jersey.condition')}>
            <Sel value={form.condition} onValueChange={(v) => set('condition', v)}>
              {CONDITIONS.map((c) => <SelectItem key={c} value={c}>{translateCondition(c)}</SelectItem>)}
            </Sel>
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
          <FormField label={t('form.size')}>
            <Sel value={form.size} onValueChange={(v) => set('size', v)}>
              {JERSEY_SIZES.map((s) => <SelectItem key={s} value={s}>{translateJerseySize(s)}</SelectItem>)}
            </Sel>
          </FormField>
        </div>
      </section>

      <Separator />

      {/* Measurements */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('form.measurements')}</h3>
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
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('form.printing')}</h3>
        <div className="flex items-center gap-2">
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

      {/* Patch */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('form.patch')}</h3>
        <PatchesInput value={form.patches || []} onChange={(v) => set('patches', v)} />
      </section>

      <Separator />

      {/* Colors */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('form.colors')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ColorPicker label={t('form.primary')} value={form.primaryColor} onChange={(v) => set('primaryColor', v)} />
          <ColorPicker label={t('form.detail')} value={form.detailColor} onChange={(v) => set('detailColor', v)} />
        </div>
      </section>

      <Separator />

      {/* Purchase Info */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('form.purchaseInfo')}</h3>
        <div className="grid grid-cols-2 gap-3">
          <FormField label={t('form.buyPriceSimple')}>
            <Input type="number" min="0" value={form.buyPrice} onChange={(e) => set('buyPrice', e.target.value)} placeholder="0" />
          </FormField>
          <FormField label={t('form.platform')}>
            <Sel value={form.platform} onValueChange={(v) => set('platform', v)}>
              {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{translatePlatform(p)}</SelectItem>)}
            </Sel>
          </FormField>
        </div>
        <FormField label={t('form.purchaseDateLabel')}>
          <Input type="date" value={form.purchaseDate || ''} onChange={(e) => set('purchaseDate', e.target.value || '')} />
        </FormField>
        <div className="flex items-center gap-3">
          <Switch
            checked={form.isForResale}
            onCheckedChange={(v) => set('isForResale', v)}
          />
          <span className="text-sm text-[var(--text-primary)]">{t('form.forResale')}</span>
        </div>
      </section>

      <Separator />

      {/* Images */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('form.images')}</h3>
        <div className="flex flex-wrap gap-2">
          {(form.images || []).map((img, i) => (
            <div key={i} className="relative group w-20 h-24 rounded overflow-hidden border border-[var(--border)]">
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeExistingImage(i)}
                className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XIcon size={12} className="text-white" />
              </button>
            </div>
          ))}
          {pendingPreviews.map((src, i) => (
            <div key={`p-${i}`} className="relative group w-20 h-24 rounded overflow-hidden border border-blue-300 border-dashed">
              <img src={src} alt="" className="w-full h-full object-cover opacity-70" />
              <button
                type="button"
                onClick={() => removePendingFile(i)}
                className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XIcon size={12} className="text-white" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-24 rounded border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-1 text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            <Upload size={18} />
            <span className="text-[10px]">{t('form.imageAdd')}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </section>

      <Separator />

      {/* Notes */}
      <FormField label={t('common.notes')}>
        <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder={t('form.additionalNotes')} rows={3} />
      </FormField>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={saving || uploading}>
          {uploading ? t('form.uploading') : saving ? t('common.saving') : (submitLabel || t('form.saveButton'))}
        </Button>
      </DialogFooter>
    </form>
  );
}
