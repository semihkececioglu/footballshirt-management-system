import { useState, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

const COUNTRY_CODES = [
  { code: '+90',  flag: '🇹🇷', name: 'Türkiye',          placeholder: '5XX XXX XX XX' },
  { code: '+1',   flag: '🇺🇸', name: 'ABD / Kanada',     placeholder: 'XXX XXX XXXX' },
  { code: '+44',  flag: '🇬🇧', name: 'İngiltere',        placeholder: 'XXXX XXXXXX' },
  { code: '+49',  flag: '🇩🇪', name: 'Almanya',          placeholder: 'XXX XXXXXXXX' },
  { code: '+33',  flag: '🇫🇷', name: 'Fransa',           placeholder: 'X XX XX XX XX' },
  { code: '+39',  flag: '🇮🇹', name: 'İtalya',           placeholder: 'XXX XXX XXXX' },
  { code: '+34',  flag: '🇪🇸', name: 'İspanya',          placeholder: 'XXX XXX XXX' },
  { code: '+31',  flag: '🇳🇱', name: 'Hollanda',         placeholder: 'X XXXX XXXX' },
  { code: '+32',  flag: '🇧🇪', name: 'Belçika',          placeholder: 'XXX XX XX XX' },
  { code: '+43',  flag: '🇦🇹', name: 'Avusturya',        placeholder: 'XXX XXXXXXX' },
  { code: '+41',  flag: '🇨🇭', name: 'İsviçre',          placeholder: 'XX XXX XX XX' },
  { code: '+351', flag: '🇵🇹', name: 'Portekiz',         placeholder: 'XXX XXX XXX' },
  { code: '+48',  flag: '🇵🇱', name: 'Polonya',          placeholder: 'XXX XXX XXX' },
  { code: '+380', flag: '🇺🇦', name: 'Ukrayna',          placeholder: 'XX XXX XXXX' },
  { code: '+30',  flag: '🇬🇷', name: 'Yunanistan',       placeholder: 'XXX XXX XXXX' },
  { code: '+7',   flag: '🇷🇺', name: 'Rusya',            placeholder: 'XXX XXX XXXX' },
  { code: '+81',  flag: '🇯🇵', name: 'Japonya',          placeholder: 'XX XXXX XXXX' },
  { code: '+82',  flag: '🇰🇷', name: 'G. Kore',          placeholder: 'XX XXXX XXXX' },
  { code: '+86',  flag: '🇨🇳', name: 'Çin',              placeholder: 'XXX XXXX XXXX' },
  { code: '+971', flag: '🇦🇪', name: 'BAE',              placeholder: 'XX XXX XXXX' },
  { code: '+966', flag: '🇸🇦', name: 'Suudi Arabistan',  placeholder: 'XX XXX XXXX' },
  { code: '+972', flag: '🇮🇱', name: 'İsrail',           placeholder: 'XX XXX XXXX' },
  { code: '+55',  flag: '🇧🇷', name: 'Brezilya',         placeholder: 'XX XXXXX XXXX' },
  { code: '+54',  flag: '🇦🇷', name: 'Arjantin',         placeholder: 'XXX XXX XXXX' },
  { code: '+52',  flag: '🇲🇽', name: 'Meksika',          placeholder: 'XXX XXX XXXX' },
  { code: '+61',  flag: '🇦🇺', name: 'Avustralya',       placeholder: 'XXX XXX XXX' },
  { code: '+64',  flag: '🇳🇿', name: 'Yeni Zelanda',     placeholder: 'XX XXX XXXX' },
  { code: '+27',  flag: '🇿🇦', name: 'G. Afrika',        placeholder: 'XX XXX XXXX' },
  { code: '+20',  flag: '🇪🇬', name: 'Mısır',            placeholder: 'XX XXXX XXXX' },
  { code: '+212', flag: '🇲🇦', name: 'Fas',              placeholder: 'XXX XXX XXX' },
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
 *  className: string
 */
export function PhoneInput({ value, onChange, className }) {
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

  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const selectedCountry = COUNTRY_CODES.find((c) => c.code === selectedCode) || COUNTRY_CODES[0];

  function handleCodeSelect(code) {
    setSelectedCode(code);
    const local = localNumber.replace(/^0/, '');
    onChange(local ? `${code}${local}` : '');
    setDrawerOpen(false);
  }

  return (
    <div className={cn('flex gap-1.5', className)}>
      <div className="relative shrink-0" style={{ minWidth: '5.5rem' }}>
        {isMobile ? (
          <>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="h-9 w-full flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--input)] pl-2 pr-6 text-sm text-[var(--text-primary)]"
            >
              <span>{selectedCountry.flag}</span>
              <span>{selectedCountry.code}</span>
            </button>
            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} nested>
              <DrawerContent showClose={false}>
                <DrawerHeader>
                  <DrawerTitle>Ülke Kodu</DrawerTitle>
                </DrawerHeader>
                <div className="space-y-0.5 pt-1">
                  {COUNTRY_CODES.map((c) => {
                    const selected = c.code === selectedCode;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleCodeSelect(c.code)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors',
                          'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]',
                          selected && 'bg-[var(--bg-secondary)] font-medium'
                        )}
                      >
                        <span className="text-base">{c.flag}</span>
                        <span className="font-mono">{c.code}</span>
                        <span className="flex-1 text-left text-[var(--text-secondary)]">{c.name}</span>
                        {selected && <Check size={16} className="text-[var(--accent)] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </DrawerContent>
            </Drawer>
          </>
        ) : (
          <>
            <select
              value={selectedCode}
              onChange={handleCodeChange}
              className="h-9 w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--input)] pl-2 pr-6 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
          </>
        )}
      </div>
      <input
        type="tel"
        value={localNumber}
        onChange={handleNumberChange}
        placeholder={selectedCountry.placeholder}
        className="flex-1 h-9 rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      />
    </div>
  );
}
