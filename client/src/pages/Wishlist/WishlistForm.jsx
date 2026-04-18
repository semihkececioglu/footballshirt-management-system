import { useRef } from 'react';
import { Upload, X as XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTranslateConstant } from '@/hooks/useTranslateConstant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { FormField } from '@/components/forms/JerseyForm/FormField';
import { TeamSelector } from '@/components/common/TeamSelector/TeamSelector';
import { Combobox } from '@/components/ui/combobox';
import { SelectSheet } from '@/components/ui/select-sheet';
import { ResponsiveModalFooter } from '@/components/ui/responsive-modal';
import { JERSEY_TYPES, SEASONS } from '@/lib/constants';

/**
 * Shared wishlist add/edit form.
 * Props:
 *   form: object
 *   setForm: (obj) => void  — full form state setter
 *   brands: string[]
 *   imageFile: File|null
 *   imagePreview: string
 *   onImageFileChange: (e) => void
 *   onImageClear: () => void
 *   onSubmit: (e) => void
 *   onCancel: () => void
 *   saving: boolean
 *   isEdit: boolean
 */
export function WishlistForm({
  form, setForm, brands,
  imageFile, imagePreview,
  onImageFileChange, onImageClear,
  onSubmit, onCancel, saving, isEdit,
}) {
  const { t } = useTranslation();
  const translateJerseyType = useTranslateConstant('jerseyType');
  const imageFileRef = useRef(null);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 py-2">
      {/* Team */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('wishlist.form.teamInfo')}</h3>
        <TeamSelector
          value={{ country: form.country, league: form.league, teamName: form.teamName }}
          onChange={({ country, league, teamName }) =>
            setForm((p) => ({ ...p, country, league, teamName }))}
        />
      </section>

      <Separator />

      {/* Jersey Details */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('wishlist.form.jerseyDetails')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FormField label={t('wishlist.form.season')}>
            <SelectSheet
              value={form.season}
              onValueChange={(v) => setField('season', v)}
              placeholder={t('wishlist.form.selectPlaceholder')}
              options={SEASONS.map((s) => ({ value: s, label: s }))}
            />
          </FormField>
          <FormField label={t('wishlist.form.type')}>
            <SelectSheet
              value={form.type}
              onValueChange={(v) => setField('type', v)}
              placeholder={t('wishlist.form.selectPlaceholder')}
              options={JERSEY_TYPES.map((item) => ({ value: item, label: translateJerseyType(item) }))}
            />
          </FormField>
          <FormField label={t('wishlist.form.brand')}>
            <Combobox
              options={brands}
              value={form.brand}
              onChange={(v) => setField('brand', v)}
              placeholder={t('wishlist.form.brandPlaceholder')}
              allowCustom
              clearable
            />
          </FormField>
        </div>
      </section>

      <Separator />

      {/* Purchase Target */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('wishlist.form.purchaseTarget')}</h3>
        <div className="grid grid-cols-2 gap-3">
          <FormField label={t('wishlist.form.targetPrice')}>
            <Input
              type="number"
              min="0"
              value={form.targetPrice}
              onChange={(e) => setField('targetPrice', e.target.value)}
              placeholder={t('wishlist.form.pricePlaceholder')}
            />
          </FormField>
          <FormField label={t('wishlist.form.priority')}>
            <SelectSheet
              value={form.priority}
              onValueChange={(v) => setField('priority', v)}
              placeholder={t('wishlist.form.selectPlaceholder')}
              options={[
                { value: 'low', label: t('priority.low') },
                { value: 'medium', label: t('priority.medium') },
                { value: 'high', label: t('priority.high') },
              ]}
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label={t('wishlist.form.status')}>
            <SelectSheet
              value={form.status}
              onValueChange={(v) => setField('status', v)}
              placeholder={t('wishlist.form.selectPlaceholder')}
              options={[
                { value: 'active', label: t('wishlist.status.active') },
                { value: 'purchased', label: t('wishlist.status.purchased') },
                { value: 'cancelled', label: t('wishlist.status.cancelled') },
              ]}
            />
          </FormField>
          <FormField label={t('wishlist.form.listingUrl')}>
            <Input
              value={form.listingUrl}
              onChange={(e) => setField('listingUrl', e.target.value)}
              placeholder={t('wishlist.form.urlPlaceholder')}
            />
          </FormField>
        </div>
      </section>

      <Separator />

      {/* Image */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('wishlist.form.image')}</h3>
        <div className="flex gap-3 items-start flex-wrap">
          {(imagePreview || form.image) && (
            <div className="relative group w-20 h-24 rounded overflow-hidden border border-[var(--border)]">
              <img src={imagePreview || form.image} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={onImageClear}
                className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XIcon size={12} className="text-white" />
              </button>
            </div>
          )}
          {!imagePreview && !form.image && (
            <button
              type="button"
              onClick={() => imageFileRef.current?.click()}
              className="w-20 h-24 rounded border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-1 text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              <Upload size={18} />
              <span className="text-[10px]">{t('wishlist.form.upload')}</span>
            </button>
          )}
          <input ref={imageFileRef} type="file" accept="image/*" className="hidden" onChange={onImageFileChange} />
          <div className="flex-1 min-w-40">
            <FormField label={t('wishlist.form.orEnterUrl')}>
              <Input
                value={form.image}
                onChange={(e) => { setField('image', e.target.value); if (imagePreview) onImageClear(); }}
                placeholder={t('wishlist.form.urlPlaceholder')}
                disabled={!!imagePreview}
              />
            </FormField>
          </div>
        </div>
      </section>

      <Separator />

      {/* Notes */}
      <FormField label={t('wishlist.form.notes')}>
        <Textarea
          value={form.notes}
          onChange={(e) => setField('notes', e.target.value)}
          placeholder={t('wishlist.form.notesPlaceholder')}
          rows={3}
        />
      </FormField>

      <ResponsiveModalFooter>
        <Button type="button" variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={saving}>
          {saving ? t('common.saving') : isEdit ? t('common.save') : t('common.add')}
        </Button>
      </ResponsiveModalFooter>
    </form>
  );
}
