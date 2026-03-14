import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';

import { useTranslateConstant } from '@/hooks/useTranslateConstant';

const CONDITION_DOT = {
  'Sıfır etiketli': 'bg-green-500',
  'Sıfır etiketli defolu': 'bg-amber-500',
  'Sıfır': 'bg-green-500',
  'Sıfır defolu': 'bg-amber-500',
  'Mükemmel': 'bg-blue-500',
  'İyi': 'bg-blue-400',
  'Orta': 'bg-amber-400',
  'Kötü': 'bg-red-500',
};

function MainImage({ images, teamName }) {
  const { t } = useTranslation();
  const main = images?.find((i) => i.isMain) || images?.[0];
  if (!main?.url) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-muted)] text-sm">
        {t('jersey.noImage', { defaultValue: 'No Image' })}
      </div>
    );
  }
  return (
    <img
      src={main.url}
      alt={teamName}
      className="w-full h-full object-cover"
      loading="lazy"
    />
  );
}

export function JerseyCard({ jersey, onClick, actions }) {
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const translateQuality = useTranslateConstant('jerseyQuality');
  const translateCondition = useTranslateConstant('condition');
  const translateJerseySize = useTranslateConstant('jerseySize');
  const translateJerseyType = useTranslateConstant('jerseyType');

  const {
    teamName, season, type, quality, condition, sellPrice, images, brand, featured,
  } = jersey;

  const sizeInfo = jersey.sizeVariants?.length > 0
    ? jersey.sizeVariants
    : jersey.size ? [{ size: jersey.size, stockCount: jersey.stockCount ?? 1 }] : [];

  const availableSizes = sizeInfo.filter((v) => v.stockCount > 0).map((v) => translateJerseySize(v.size));
  const soldOutSizes = sizeInfo.filter((v) => v.stockCount === 0).map((v) => translateJerseySize(v.size));

  return (
    <div
      className={cn(
        'group bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden flex flex-col transition-shadow hover:shadow-lg',
        onClick && 'cursor-pointer',
        featured && 'ring-1 ring-amber-400/60'
      )}
      onClick={onClick}
    >
      {/* 3:4 image area */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--bg-secondary)]">
        <MainImage images={images} teamName={teamName} />

        {/* Featured star */}
        {featured && (
          <div className="absolute top-2 left-2">
            <span className="flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-amber-900 font-semibold shadow">
              <Star size={8} className="fill-amber-900" /> {t('jersey.featured', { defaultValue: 'Featured' })}
            </span>
          </div>
        )}

        {/* Actions overlay */}
        {actions && (
          <div
            className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <div>
          <p className="font-medium text-sm text-[var(--text-primary)] truncate">{teamName}</p>
          <p className="text-xs text-[var(--text-muted)] truncate">
            {[season, translateJerseyType(type), translateQuality(quality)].filter(Boolean).join(' · ')}
          </p>
        </div>

        {/* Sizes + Condition row */}
        {(sizeInfo.length > 0 || condition) && (
          <div className="flex items-center justify-between gap-1 mt-0.5">
            {sizeInfo.length > 0 ? (
              <p className="text-[10px] text-[var(--text-muted)] truncate">
                {availableSizes.length > 0 && (
                  <span>{availableSizes.join(' · ')}</span>
                )}
                {soldOutSizes.length > 0 && (
                  <span className="line-through ml-1 opacity-40">{soldOutSizes.join(' · ')}</span>
                )}
              </p>
            ) : <span />}
            {condition && (
              <span className="flex items-center gap-1 flex-shrink-0">
                <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', CONDITION_DOT[condition] || 'bg-gray-400')} />
                <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">{translateCondition(condition)}</span>
              </span>
            )}
          </div>
        )}

        {brand && <p className="text-[10px] text-[var(--text-muted)] truncate">{brand}</p>}

        {sellPrice > 0 && (
          <p className="text-sm font-semibold text-[var(--accent)] mt-auto pt-1">
            {formatCurrency(sellPrice)}
          </p>
        )}
      </div>
    </div>
  );
}
