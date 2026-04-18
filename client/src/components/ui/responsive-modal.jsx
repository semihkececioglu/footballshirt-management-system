/**
 * ResponsiveModal: Dialog on desktop, bottom-sheet Drawer on mobile (< 768px).
 * API mirrors Dialog: ResponsiveModal, ResponsiveModalContent, ResponsiveModalHeader,
 * ResponsiveModalTitle, ResponsiveModalFooter.
 */
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter,
} from '@/components/ui/drawer';

export function ResponsiveModal({ open, onOpenChange, children }) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
}

export function ResponsiveModalContent({ className, children, ...props }) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <DrawerContent className={className} {...props}>
        {children}
      </DrawerContent>
    );
  }
  return (
    <DialogContent className={className} {...props}>
      {children}
    </DialogContent>
  );
}

export function ResponsiveModalHeader({ className, ...props }) {
  const isMobile = useIsMobile();
  if (isMobile) return <DrawerHeader className={className} {...props} />;
  return <DialogHeader className={className} {...props} />;
}

export function ResponsiveModalTitle({ className, ...props }) {
  const isMobile = useIsMobile();
  if (isMobile) return <DrawerTitle className={className} {...props} />;
  return <DialogTitle className={className} {...props} />;
}

export function ResponsiveModalFooter({ className, ...props }) {
  const isMobile = useIsMobile();
  if (isMobile) return <DrawerFooter className={className} {...props} />;
  return <DialogFooter className={className} {...props} />;
}
