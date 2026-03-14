import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

const COUNTRY_CODES = [
  { code: '+90', flag: '🇹🇷', name: 'Türkiye' },
  { code: '+1', flag: '🇺🇸', name: 'ABD / Kanada' },
  { code: '+44', flag: '🇬🇧', name: 'İngiltere' },
  { code: '+49', flag: '🇩🇪', name: 'Almanya' },
  { code: '+33', flag: '🇫🇷', name: 'Fransa' },
  { code: '+39', flag: '🇮🇹', name: 'İtalya' },
  { code: '+34', flag: '🇪🇸', name: 'İspanya' },
  { code: '+31', flag: '🇳🇱', name: 'Hollanda' },
  { code: '+32', flag: '🇧🇪', name: 'Belçika' },
  { code: '+43', flag: '🇦🇹', name: 'Avusturya' },
  { code: '+41', flag: '🇨🇭', name: 'İsviçre' },
  { code: '+351', flag: '🇵🇹', name: 'Portekiz' },
  { code: '+48', flag: '🇵🇱', name: 'Polonya' },
  { code: '+380', flag: '🇺🇦', name: 'Ukrayna' },
  { code: '+30', flag: '🇬🇷', name: 'Yunanistan' },
  { code: '+7', flag: '🇷🇺', name: 'Rusya' },
  { code: '+81', flag: '🇯🇵', name: 'Japonya' },
  { code: '+82', flag: '🇰🇷', name: 'G. Kore' },
  { code: '+86', flag: '🇨🇳', name: 'Çin' },
  { code: '+971', flag: '🇦🇪', name: 'BAE' },
  { code: '+966', flag: '🇸🇦', name: 'Suudi Arabistan' },
  { code: '+972', flag: '🇮🇱', name: 'İsrail' },
  { code: '+55', flag: '🇧🇷', name: 'Brezilya' },
  { code: '+54', flag: '🇦🇷', name: 'Arjantin' },
  { code: '+52', flag: '🇲🇽', name: 'Meksika' },
  { code: '+61', flag: '🇦🇺', name: 'Avustralya' },
  { code: '+64', flag: '🇳🇿', name: 'Yeni Zelanda' },
  { code: '+27', flag: '🇿🇦', name: 'G. Afrika' },
  { code: '+20', flag: '🇪🇬', name: 'Mısır' },
  { code: '+212', flag: '🇲🇦', name: 'Fas' },
];

function parsePhone(value) {
  if (!value) return { countryCode: '+90', localNumber: '' };
  if (value.startsWith('+')) {
    const match = COUNTRY_CODES.find((c) => value.startsWith(c.code));
    if (match) {
      return { countryCode: match.code, localNumber: value.slice(match.code.length) };
    }
    return { countryCode: '+90', localNumber: value.slice(3) };
  }
  return { countryCode: '+90', localNumber: value };
}

/**
 * Props:
 *  value: string — E.164 format (+905551234567) or empty
 *  onChange: (e164: string) => void
 *  placeholder: string
 *  className: string
 */
export function PhoneInput({ value, onChange, placeholder = '5XX XXX XX XX', className }) {
  const parsed = useMemo(() => parsePhone(value), [value]);
  const [selectedCode, setSelectedCode] = useState(parsed.countryCode);
  const [localNumber, setLocalNumber] = useState(parsed.localNumber);

  function handleCodeChange(e) {
    const code = e.target.value;
    setSelectedCode(code);
    const local = localNumber.replace(/^0/, '');
    onChange(local ? `${code}${local}` : '');
  }

  function handleNumberChange(e) {
    const raw = e.target.value;
    setLocalNumber(raw);
    const local = raw.replace(/^0/, '');
    onChange(local ? `${selectedCode}${local}` : '');
  }

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === selectedCode) || COUNTRY_CODES[0];

  return (
    <div className={cn('flex gap-1.5', className)}>
      <select
        value={selectedCode}
        onChange={handleCodeChange}
        className="h-9 rounded-lg border border-[var(--border)] bg-[var(--input)] px-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] shrink-0"
        style={{ minWidth: '5.5rem' }}
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.code}
          </option>
        ))}
      </select>
      <input
        type="tel"
        value={localNumber}
        onChange={handleNumberChange}
        placeholder={placeholder}
        className="flex-1 h-9 rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      />
    </div>
  );
}
