import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { JERSEY_COLORS } from '@/lib/constants';
import { useTranslateConstant } from '@/hooks/useTranslateConstant';

/**
 * Props:
 *  value: hex string | ''
 *  onChange: (hex: string) => void
 *  label: string
 */
export function ColorPicker({ value, onChange, label }) {
  const { t } = useTranslation();
  const translateColor = useTranslateConstant('color');
  const [hovered, setHovered] = useState(null);

  const selected = JERSEY_COLORS.find((c) => c.hex === value);

  function handleClick(hex) {
    onChange(value === hex ? '' : hex);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-secondary)]">{label}</span>
        {selected && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors"
          >
            <X size={12} />
            {t('common.clear')}
          </button>
        )}
      </div>

      {/* Selected preview */}
      {selected && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)]">
          <span
            className="w-4 h-4 rounded-full border border-black/20 flex-shrink-0"
            style={{ backgroundColor: selected.hex }}
          />
          <span className="text-xs font-medium text-[var(--text-primary)]">{translateColor(selected.name)}</span>
          <span className="text-xs text-[var(--text-muted)] ml-auto font-mono">{selected.hex}</span>
        </div>
      )}

      {/* Color grid */}
      <div className="flex flex-wrap gap-1.5">
        {JERSEY_COLORS.map((color) => {
          const isSelected = value === color.hex;
          const isHovered = hovered === color.hex;
          return (
            <div key={color.hex} className="relative group">
              <button
                type="button"
                onClick={() => handleClick(color.hex)}
                onMouseEnter={() => setHovered(color.hex)}
                onMouseLeave={() => setHovered(null)}
                className="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1"
                style={{
                  backgroundColor: color.hex,
                  borderColor: isSelected ? 'var(--accent)' : color.hex === '#FFFFFF' || color.hex === '#F5DEB3' || color.hex === '#CCFF00' ? '#d1d5db' : 'transparent',
                  boxShadow: isSelected ? '0 0 0 2px var(--accent)' : undefined,
                }}
                title={translateColor(color.name)}
              >
                {isSelected && (
                  <Check
                    size={13}
                    strokeWidth={3}
                    style={{
                      color: isLightColor(color.hex) ? '#111' : '#fff',
                    }}
                  />
                )}
              </button>
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border)] text-[10px] text-[var(--text-primary)] whitespace-nowrap shadow-md z-50 pointer-events-none">
                  {translateColor(color.name)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function isLightColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}
