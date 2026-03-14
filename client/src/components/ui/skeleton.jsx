import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-[var(--bg-secondary)]', className)}
      {...props}
    />
  );
}
