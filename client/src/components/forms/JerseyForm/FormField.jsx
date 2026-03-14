import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function FormField({ label, error, required, className, children }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
      )}
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
