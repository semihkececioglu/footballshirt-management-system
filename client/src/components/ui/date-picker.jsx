import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CalendarIcon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Calendar } from './calendar';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from './drawer';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/utils';

/**
 * DatePicker — value/onChange uses ISO string (YYYY-MM-DD) or Date object.
 * onChange receives a Date object (or null when cleared).
 * On mobile (< 768px) the calendar opens in a bottom-sheet Drawer.
 */
export function DatePicker({ value, onChange, placeholder, className, disabled }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const finalPlaceholder = placeholder || t('datepicker.placeholder', { defaultValue: 'Tarih seçin' });

  const selected = value
    ? (typeof value === 'string' ? parseISO(value) : value)
    : undefined;

  const display = selected
    ? format(selected, 'd MMMM yyyy', { locale: tr })
    : null;

  const trigger = (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'w-full flex items-center justify-between gap-2 px-3 h-9 rounded-md border border-[var(--border)]',
        'bg-[var(--bg-card)] text-sm transition-colors',
        'hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)]',
        !display && 'text-[var(--text-muted)]',
        display && 'text-[var(--text-primary)]',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <span className="flex items-center gap-2 truncate">
        <CalendarIcon size={15} className="text-[var(--text-muted)] flex-shrink-0" />
        {display ?? finalPlaceholder}
      </span>
      {selected && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onChange(null); }}
          onKeyDown={(e) => e.key === 'Enter' && onChange(null)}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] flex-shrink-0"
        >
          <X size={13} />
        </span>
      )}
    </button>
  );

  if (isMobile) {
    return (
      <>
        <div onClick={() => !disabled && setDrawerOpen(true)}>
          {trigger}
        </div>
        <Drawer nested open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent showClose={false}>
            <DrawerHeader>
              <DrawerTitle className="text-base">{finalPlaceholder}</DrawerTitle>
            </DrawerHeader>
            <div className="flex justify-center pb-4">
              <Calendar
                mode="single"
                selected={selected}
                onSelect={(date) => {
                  onChange(date ?? null);
                  setDrawerOpen(false);
                }}
                initialFocus
              />
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => onChange(date ?? null)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
