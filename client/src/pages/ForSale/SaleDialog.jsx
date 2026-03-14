import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { SaleForm } from '@/components/forms/SaleForm/SaleForm';

export function SaleDialog({ open, jersey, onSuccess, onClose }) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('saleDialog.title')}</DialogTitle>
          <DialogDescription>{t('saleDialog.subtitle')}</DialogDescription>
        </DialogHeader>
        {open && jersey && (
          <SaleForm jersey={jersey} onSuccess={onSuccess} onCancel={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}
