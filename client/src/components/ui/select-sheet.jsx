/**
 * SelectSheet — responsive select:
 *   Desktop: standard Radix Select popover
 *   Mobile (<768px): vaul Drawer with scrollable option list
 *
 * Props:
 *   value: string
 *   onValueChange: (val: string) => void
 *   placeholder: string
 *   options: { value: string; label: string }[]
 *   disabled?: boolean
 *   className?: string
 */
import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/utils';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

const NONE = '__none__';

export function SelectSheet({
  value,
  onValueChange,
  placeholder = 'Seçin',
  options = [],
  disabled = false,
  className,
  label,
}) {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  function handleSelect(val) {
    onValueChange(val === NONE ? '' : val);
    setDrawerOpen(false);
  }

  if (!isMobile) {
    return (
      <Select
        value={value || NONE}
        onValueChange={(v) => onValueChange(v === NONE ? '' : v)}
        disabled={disabled}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>—</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Mobile: trigger opens a Drawer
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setDrawerOpen(true)}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-lg border border-[var(--border)]',
          'bg-[var(--input)] px-3 text-sm text-[var(--text-primary)] transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          !selectedLabel && 'text-[var(--text-muted)]',
          className
        )}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <ChevronDown size={14} className="text-[var(--text-muted)] flex-shrink-0 ml-1" />
      </button>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} nested>
        <DrawerContent showClose={false}>
          {label && (
            <DrawerHeader>
              <DrawerTitle>{label}</DrawerTitle>
            </DrawerHeader>
          )}
          <div className="space-y-0.5 pt-1">
            {/* Clear option */}
            <button
              type="button"
              onClick={() => handleSelect(NONE)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm transition-colors',
                'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]',
                !value && 'bg-[var(--bg-secondary)] font-medium text-[var(--text-primary)]'
              )}
            >
              <span>—</span>
              {!value && <Check size={16} className="text-[var(--accent)]" />}
            </button>
            {options.map((o) => {
              const selected = value === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => handleSelect(o.value)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm transition-colors',
                    'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]',
                    selected && 'bg-[var(--bg-secondary)] font-medium'
                  )}
                >
                  <span>{o.label}</span>
                  {selected && <Check size={16} className="text-[var(--accent)]" />}
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
