import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ViewToggle({ view, onChange }) {
  return (
    <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
      {[
        { key: 'list', Icon: List, label: 'Liste' },
        { key: 'grid', Icon: LayoutGrid, label: 'Kart' },
      ].map(({ key, Icon, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          title={label}
          className={cn(
            'flex items-center justify-center w-9 h-8 transition-colors',
            view === key
              ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
              : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]'
          )}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
