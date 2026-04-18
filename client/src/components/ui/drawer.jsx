import { Drawer as DrawerPrimitive } from 'vaul';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Drawer = ({ shouldScaleBackground = true, ...props }) => (
  <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
);

export const DrawerTrigger = DrawerPrimitive.Trigger;
export const DrawerPortal = DrawerPrimitive.Portal;
export const DrawerClose = DrawerPrimitive.Close;

export function DrawerOverlay({ className, ...props }) {
  return (
    <DrawerPrimitive.Overlay
      className={cn('fixed inset-0 z-50 bg-black/50 backdrop-blur-sm', className)}
      {...props}
    />
  );
}

export function DrawerContent({ className, children, showClose = true, ...props }) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex flex-col',
          'rounded-t-2xl border border-[var(--border)] bg-[var(--bg-card)]',
          'max-h-[92dvh]',
          className
        )}
        {...props}
      >
        {/* Drag handle */}
        <div className="mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-[var(--border)] flex-shrink-0" />
        {/* Scrollable content area — overscroll-contain prevents background page scroll */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-2">
          {children}
        </div>
        {showClose && (
          <DrawerPrimitive.Close className="absolute right-4 top-4 rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
            <X size={16} />
          </DrawerPrimitive.Close>
        )}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

export function DrawerHeader({ className, ...props }) {
  return (
    <div
      className={cn(
        'sticky top-0 z-10 bg-[var(--bg-card)] pt-1 pb-3',
        className
      )}
      {...props}
    />
  );
}

export function DrawerTitle({ className, ...props }) {
  return (
    <DrawerPrimitive.Title
      className={cn('font-display text-lg font-semibold text-[var(--text-primary)]', className)}
      {...props}
    />
  );
}

export function DrawerFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-10 -mx-6 px-6 bg-[var(--bg-card)] border-t border-[var(--border)]',
        'flex justify-end gap-2 py-4',
        // Safe area for iOS home indicator
        'pb-[max(16px,env(safe-area-inset-bottom))]',
        className
      )}
      {...props}
    />
  );
}
