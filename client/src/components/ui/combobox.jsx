import { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Lightweight Combobox: search + select + custom value
 * Props:
 *  options: string[] | { label, value }[]
 *  value: string
 *  onChange: (val) => void
 *  placeholder: string
 *  allowCustom: boolean  — allow typing a value not in list
 *  clearable: boolean
 */
export function Combobox({
  options = [],
  value,
  onChange,
  placeholder = 'Seçin...',
  allowCustom = false,
  clearable = false,
  className,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const normalized = options.map((o) =>
    typeof o === 'string' ? { label: o, value: o } : o
  );

  const filtered = query
    ? normalized.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : normalized;

  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleSelect(val) {
    onChange(val);
    setOpen(false);
    setQuery('');
  }

  function handleInputChange(e) {
    setQuery(e.target.value);
    if (!open) setOpen(true);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && allowCustom && query) {
      e.preventDefault();
      handleSelect(query);
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  }

  const displayValue = value || '';

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div
        className={cn(
          'flex h-9 w-full items-center rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 text-sm transition-colors',
          open && 'ring-2 ring-[var(--ring)]',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => { if (!disabled) { setOpen(true); inputRef.current?.focus(); } }}
      >
        <input
          ref={inputRef}
          value={open ? query : displayValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={!displayValue ? placeholder : undefined}
          disabled={disabled}
          className="flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none min-w-0"
        />
        <div className="flex items-center gap-1 ml-1">
          {clearable && value && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X size={14} />
            </button>
          )}
          <ChevronsUpDown size={14} className="text-[var(--text-muted)]" />
        </div>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-lg max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-2 px-3 text-sm text-[var(--text-muted)]">
              {allowCustom ? `"${query}" eklemek için Enter'a bas` : 'Sonuç yok'}
            </div>
          ) : (
            filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => handleSelect(o.value)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] text-left',
                  value === o.value && 'text-[var(--accent)]'
                )}
              >
                <Check size={14} className={value === o.value ? 'opacity-100' : 'opacity-0'} />
                {o.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
