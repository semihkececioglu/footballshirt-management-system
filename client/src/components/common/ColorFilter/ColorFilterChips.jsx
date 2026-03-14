import { Check } from 'lucide-react';
import { JERSEY_COLORS } from '@/lib/constants';
import { Label } from '@/components/ui/label';

/**
 * Renk filtresi — DB'den gelen hex değerlerini görsel chip olarak gösterir.
 *
 * Props:
 *   availableHexes: string[]   — API'den dönen distinct primaryColor değerleri
 *   selected: string[]         — seçili hex listesi (multi-select)
 *   onChange: (hex[]) => void
 *   label?: string
 */
export function ColorFilterChips({ availableHexes = [], selected = [], onChange, label = 'Ana Renk' }) {
  if (availableHexes.length === 0) return null;

  function toggle(hex) {
    onChange(selected.includes(hex) ? selected.filter((h) => h !== hex) : [...selected, hex]);
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {availableHexes.map((hex) => {
          const name = JERSEY_COLORS.find((c) => c.hex === hex)?.name ?? hex;
          const isSelected = selected.includes(hex);
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          const isLight = (r * 299 + g * 587 + b * 114) / 1000 > 128;

          return (
            <button
              key={hex}
              type="button"
              title={name}
              onClick={() => toggle(hex)}
              className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none"
              style={{
                backgroundColor: hex,
                border: isSelected
                  ? '2px solid var(--accent)'
                  : isLight ? '1.5px solid #d1d5db' : '1.5px solid transparent',
                boxShadow: isSelected ? '0 0 0 1.5px var(--accent)' : undefined,
              }}
            >
              {isSelected && (
                <Check size={11} strokeWidth={3} style={{ color: isLight ? '#111' : '#fff' }} />
              )}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="text-[10px] text-[var(--text-muted)] hover:text-red-500 transition-colors"
        >
          Temizle
        </button>
      )}
    </div>
  );
}
