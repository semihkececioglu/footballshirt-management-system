import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--accent)] text-[var(--accent-foreground)]',
        secondary: 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)]',
        outline: 'border border-[var(--border)] text-[var(--text-secondary)]',
        success: 'bg-white text-green-800 border border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
        warning: 'bg-white text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
        destructive: 'bg-white text-red-800 border border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
        blue: 'bg-white text-blue-800 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
