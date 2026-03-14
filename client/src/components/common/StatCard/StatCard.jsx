import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function StatCard({ label, value, sub, icon: Icon, className, loading }) {
  if (loading) return <Skeleton className={cn('h-28 rounded-xl', className)} />;
  return (
    <div className={cn('bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">{value}</p>
          {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
        </div>
        {Icon && (
          <div className="p-2 rounded-lg bg-[var(--bg-secondary)]">
            <Icon size={20} className="text-[var(--accent)]" />
          </div>
        )}
      </div>
    </div>
  );
}
