import { useTranslation } from 'react-i18next';
import { Phone } from 'lucide-react';
import {
  ResponsiveModal, ResponsiveModalContent, ResponsiveModalHeader, ResponsiveModalTitle,
} from '@/components/ui/responsive-modal';
import { DragScrollGallery } from '@/components/common/DragScrollGallery/DragScrollGallery';
import { ConditionBadge } from '@/components/common/StatusBadge/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { useTranslateConstant } from '@/hooks/useTranslateConstant';
import { formatDate, getWhatsAppUrl } from '@/lib/utils';
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
        style={{ backgroundColor: hex, borderColor: isLight ? '#d1d5db' : 'transparent' }}
      />
      <span className="text-sm font-medium text-[var(--text-primary)]">{colorName}</span>
    </div>
  );
}

export function PurchaseDetailDialog({ purchase, open, onClose }) {
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const translateCountry = useTranslateConstant('country');
  const translateJerseyType = useTranslateConstant('jerseyType');
  const translateJerseyQuality = useTranslateConstant('jerseyQuality');
  const translatePlatform = useTranslateConstant('platform');

  if (!purchase) return null;

  const sizeInfo = purchase.sizeVariants?.length > 0
    ? purchase.sizeVariants
    : purchase.size ? [{ size: purchase.size, stockCount: purchase.stockCount ?? 1 }] : [];

  const measurementStr = (() => {
    const a = purchase.measurements?.armpit;
    const l = purchase.measurements?.length;
    const parts = [a, l].filter(Boolean);
    return parts.length > 0 ? `${parts.join(' × ')} cm` : null;
  })();

  const waUrl = purchase.sellerPhone ? getWhatsAppUrl(purchase.sellerPhone) : null;

  return (
    <ResponsiveModal open={open} onOpenChange={(o) => !o && onClose()}>
      <ResponsiveModalContent className="max-w-2xl">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>
            <span className="flex items-center gap-2 flex-wrap">
              {purchase.teamName}
              {purchase.isForResale && (
                <Badge variant="success" className="text-xs">{t('purchased.status.forSale')}</Badge>
              )}
            </span>
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pb-4">
          {/* Gallery */}
          <DragScrollGallery images={purchase.images} className="aspect-[3/4]" enableKeyboard />

          {/* Details */}
          <div className="space-y-4 overflow-y-auto sm:max-h-[65vh] pr-1">
            {(purchase.country || purchase.league) && (
              <p className="text-xs text-[var(--text-muted)]">
                {[purchase.country ? translateCountry(purchase.country) : null, purchase.league].filter(Boolean).join(' · ')}
              </p>
            )}

            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <DetailRow label={t('jersey.season')} value={purchase.season} />
              <DetailRow label={t('jersey.type')} value={translateJerseyType(purchase.type)} />
              <DetailRow label={t('jersey.quality')} value={translateJerseyQuality(purchase.quality)} />
              <DetailRow label={t('jersey.brand')} value={purchase.brand} />
              <DetailRow label={t('jersey.technology')} value={purchase.technology} />
              <DetailRow label={t('jersey.sponsor')} value={purchase.sponsor} />
              <DetailRow label={t('jersey.productCode')} value={purchase.productCode} />
              <DetailRow label={t('jersey.measurement')} value={measurementStr} />
              {purchase.printing?.hasNumber && (
                <DetailRow
                  label={t('jersey.printing')}
                  value={[purchase.printing.playerName, purchase.printing.number && `#${purchase.printing.number}`].filter(Boolean).join(' ')}
                />
              )}
              <DetailRow label={t('jersey.purchaseDate')} value={formatDate(purchase.purchaseDate)} />
              {purchase.platform && (
                <DetailRow label={t('purchased.col.platform')} value={translatePlatform(purchase.platform)} />
              )}
            </div>

            {/* Colors */}
            {(purchase.primaryColor || purchase.detailColor) && (
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1.5">{t('jersey.colors')}</p>
                <div className="flex flex-wrap gap-3">
                  {purchase.primaryColor && (
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] mb-0.5">{t('jersey.primaryColor')}</p>
                      <ColorDot hex={purchase.primaryColor} />
                    </div>
                  )}
                  {purchase.detailColor && (
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] mb-0.5">{t('jersey.detailColor')}</p>
                      <ColorDot hex={purchase.detailColor} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Condition */}
            {purchase.condition && (
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">{t('jersey.condition')}</p>
                <ConditionBadge condition={purchase.condition} />
              </div>
            )}

            {/* Sizes */}
            {sizeInfo.length > 0 && (
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1.5">{t('jersey.sizeStock')}</p>
                <div className="flex flex-wrap gap-2">
                  {sizeInfo.map((v, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-lg font-medium border bg-[var(--bg-card)] border-[var(--accent)] text-[var(--text-primary)]"
                    >
                      {v.size}{v.stockCount != null && ` · ${v.stockCount}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Buy price */}
            {purchase.buyPrice > 0 && (() => {
              const totalQty = sizeInfo.reduce((s, v) => s + (v.stockCount || 1), 0) || 1;
              return (
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-0.5">{t('purchased.col.buyPrice')}</p>
                  <p className="text-xl font-bold text-[var(--accent)]">{formatCurrency(purchase.buyPrice)}</p>
                  {totalQty > 1 && (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      × {totalQty} = {formatCurrency(purchase.buyPrice * totalQty)}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Patches */}
            {purchase.patches?.length > 0 && (
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1.5">{t('form.patch')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {purchase.patches.map((p, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Seller */}
            {purchase.sellerName && (
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-0.5">{t('form.sellerName')}</p>
                {waUrl ? (
                  <a href={waUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors">
                    {purchase.sellerName}
                    <Phone size={13} className="text-green-500 shrink-0" />
                  </a>
                ) : (
                  <p className="text-sm font-medium text-[var(--text-primary)]">{purchase.sellerName}</p>
                )}
              </div>
            )}

            {/* Notes */}
            {purchase.notes && (
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-0.5">{t('common.notes')}</p>
                <p className="text-sm text-[var(--text-secondary)]">{purchase.notes}</p>
              </div>
            )}
          </div>
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
