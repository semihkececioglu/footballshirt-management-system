import { useTranslation } from 'react-i18next';
import { Star, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConditionBadge } from '@/components/common/StatusBadge/StatusBadge';
import { DragScrollGallery } from '@/components/common/DragScrollGallery/DragScrollGallery';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { useTranslateConstant } from '@/hooks/useTranslateConstant';
import { JERSEY_COLORS } from '@/lib/constants';

function DetailRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="text-sm font-medium text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function ColorDot({ hex }) {
  const translateColor = useTranslateConstant('color');
  const rawName = JERSEY_COLORS.find((c) => c.hex === hex)?.name ?? hex;
  const colorName = translateColor(rawName);
  const isLight = (() => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  })();
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-5 h-5 rounded-full flex-shrink-0 border"
        style={{
          backgroundColor: hex,
          borderColor: isLight ? '#d1d5db' : 'transparent',
        }}
      />
      <span className="text-sm font-medium text-[var(--text-primary)]">{colorName}</span>
    </div>
  );
}

/**
 * mode: 'public' (hide buy price, stock counts) | 'admin' (show all)
 */
export function JerseyDetailDialog({ jersey, open, onClose, mode = 'admin' }) {
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const translateCountry = useTranslateConstant('country');
  const translateJerseyType = useTranslateConstant('jerseyType');
  const translateJerseyQuality = useTranslateConstant('jerseyQuality');
  if (!jersey) return null;

  const sizeInfo = jersey.sizeVariants?.length > 0
    ? jersey.sizeVariants
    : jersey.size ? [{ size: jersey.size, stockCount: jersey.stockCount ?? 1 }] : [];

  const activePlatforms = jersey.platforms?.filter((p) => p.isActive && p.listingUrl) || [];
  const measurementStr = (() => {
    const a = jersey.measurements?.armpit;
    const l = jersey.measurements?.length;
    const parts = [a, l].filter(Boolean);
    return parts.length > 0 ? parts.join('×') : null;
  })();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2 flex-wrap">
              {jersey.teamName}
              {jersey.featured && (
                <span className="flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full bg-amber-400 text-amber-900 font-semibold">
                  <Star size={10} className="fill-amber-900" /> {t('jersey.featured')}
                </span>
              )}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
          {/* Gallery with drag support */}
          <DragScrollGallery images={jersey.images} className="aspect-[3/4]" enableKeyboard />

          <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-1">
            {jersey.league && (
              <p className="text-xs text-[var(--text-muted)]">
                {[jersey.country ? translateCountry(jersey.country) : null, jersey.league].filter(Boolean).join(' · ')}
              </p>
            )}

            {/* Key details grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <DetailRow label={t('jersey.productCode')} value={jersey.productCode} />
              <DetailRow label={t('jersey.season')} value={jersey.season} />
              <DetailRow label={t('jersey.type')} value={translateJerseyType(jersey.type)} />
              <DetailRow label={t('jersey.quality')} value={translateJerseyQuality(jersey.quality)} />
              <DetailRow label={t('jersey.brand')} value={jersey.brand} />
              <DetailRow label={t('jersey.technology')} value={jersey.technology} />
              <DetailRow label={t('jersey.sponsor')} value={jersey.sponsor} />
              <DetailRow label={t('jersey.measurement')} value={measurementStr} />
              {jersey.printing?.hasNumber && (
                <DetailRow
                  label={t('jersey.printing')}
                  value={[jersey.printing.playerName, jersey.printing.number && `#${jersey.printing.number}`].filter(Boolean).join(' ')}
                />
              )}
              {mode === 'admin' && jersey.purchaseDate && (
                <DetailRow label={t('jersey.purchaseDate')} value={new Date(jersey.purchaseDate).toLocaleDateString('tr-TR')} />
              )}
            </div>

            {/* Colors */}
            {(jersey.primaryColor || jersey.detailColor) && (
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1.5">{t('jersey.colors')}</p>
                <div className="flex flex-wrap gap-3">
                  {jersey.primaryColor && (
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] mb-0.5">{t('jersey.primaryColor')}</p>
                      <ColorDot hex={jersey.primaryColor} />
                    </div>
                  )}
                  {jersey.detailColor && (
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] mb-0.5">{t('jersey.detailColor')}</p>
                      <ColorDot hex={jersey.detailColor} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Condition */}
            {jersey.condition && (
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">{t('jersey.condition')}</p>
                <ConditionBadge condition={jersey.condition} />
              </div>
            )}

            {/* Size / stock */}
            {sizeInfo.length > 0 && (
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1.5">
                  {mode === 'admin' ? t('jersey.sizeStock') : t('jersey.sizeOnly')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizeInfo.map((v, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${
                        v.stockCount > 0
                          ? 'bg-[var(--bg-card)] border-[var(--accent)] text-[var(--text-primary)]'
                          : 'opacity-40 bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-muted)] line-through'
                      }`}
                    >
                      {v.size}{mode === 'admin' && ` · ${v.stockCount}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 flex-wrap">
              {jersey.sellPrice > 0 && (
                <p className="text-2xl font-bold text-[var(--accent)]">
                  {formatCurrency(jersey.sellPrice)}
                </p>
              )}
              {mode === 'admin' && jersey.buyPrice > 0 && (
                <p className="text-sm text-[var(--text-muted)]">
                  {t('jersey.buyPrice')}: {formatCurrency(jersey.buyPrice)}
                </p>
              )}
              {mode === 'admin' && jersey.buyPrice > 0 && jersey.sellPrice > 0 && (
                <p className="text-xs font-medium text-green-600">
                  +{formatCurrency(jersey.sellPrice - jersey.buyPrice)}
                </p>
              )}
            </div>

            {/* Platforms */}
            {activePlatforms.length > 0 && (
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1.5">{t('jersey.platforms')}</p>
                <div className="flex flex-wrap gap-3">
                  {activePlatforms.map((p, i) => (
                    <a key={i} href={p.listingUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-sm text-[var(--accent)] hover:underline">
                      {p.name} <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {jersey.notes && (
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-0.5">{t('jersey.notes')}</p>
                <p className="text-sm text-[var(--text-secondary)]">{jersey.notes}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
