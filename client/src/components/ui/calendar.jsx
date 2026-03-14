import { DayPicker } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout="dropdown"
      fromYear={2000}
      toYear={2035}
      className={cn('p-2', className)}
      classNames={{
        months: 'flex flex-col',
        month: 'space-y-2',
        caption: 'flex justify-center pt-0.5 relative items-center gap-1',
        caption_label: 'hidden',
        caption_dropdowns: 'flex gap-1',
        dropdown: cn(
          'text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)]',
          'border border-[var(--border)] rounded-md px-1.5 py-1 cursor-pointer',
          'hover:border-[var(--accent)] transition-colors outline-none',
          'appearance-none'
        ),
        dropdown_month: '',
        dropdown_year: '',
        vhidden: 'hidden',
        nav: 'flex items-center gap-1',
        nav_button: cn(
          'h-6 w-6 bg-transparent p-0 rounded border border-[var(--border)]',
          'flex items-center justify-center text-[var(--text-muted)]',
          'hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors'
        ),
        nav_button_previous: '',
        nav_button_next: '',
        table: 'w-full border-collapse',
        head_row: 'flex',
        head_cell: 'text-[var(--text-muted)] w-7 font-normal text-[10px] text-center pb-1',
        row: 'flex w-full mt-0.5',
        cell: cn(
          'h-7 w-7 text-center text-xs p-0 relative',
          '[&:has([aria-selected])]:bg-[var(--bg-secondary)]',
          'first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md',
          'focus-within:relative focus-within:z-20'
        ),
        day: cn(
          'h-7 w-7 p-0 font-normal rounded text-xs',
          'flex items-center justify-center',
          'hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors',
          'aria-selected:opacity-100'
        ),
        day_selected:
          'bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]',
        day_today: 'border border-[var(--accent)] text-[var(--accent)] font-semibold',
        day_outside: 'day-outside text-[var(--text-muted)] opacity-40',
        day_disabled: 'text-[var(--text-muted)] opacity-40',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft size={13} />,
        IconRight: () => <ChevronRight size={13} />,
      }}
      {...props}
    />
  );
}
