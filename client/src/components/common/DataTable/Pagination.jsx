import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export function Pagination({ page, total, limit, onChange }) {
  const { t } = useTranslation();
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-1 py-2 text-sm text-[var(--text-muted)]">
      <span>
        {(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total} {t('common.records')}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={16} />
        </Button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          const p = i + 1;
          return (
            <Button
              key={p}
              variant={p === page ? 'default' : 'ghost'}
              size="icon-sm"
              onClick={() => onChange(p)}
              className="text-xs"
            >
              {p}
            </Button>
          );
        })}
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
