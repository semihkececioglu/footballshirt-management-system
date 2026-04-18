import { useTranslation } from 'react-i18next';
import {
  ResponsiveModal, ResponsiveModalContent, ResponsiveModalHeader, ResponsiveModalTitle,
} from '@/components/ui/responsive-modal';
import { SaleForm } from '@/components/forms/SaleForm/SaleForm';

export function SaleDialog({ open, jersey, onSuccess, onClose }) {
  const { t } = useTranslation();
  return (
    <ResponsiveModal open={open} onOpenChange={(o) => !o && onClose()}>
      <ResponsiveModalContent className="max-w-md">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>{t('saleDialog.title')}</ResponsiveModalTitle>
        </ResponsiveModalHeader>
        {open && jersey && (
          <SaleForm jersey={jersey} onSuccess={onSuccess} onCancel={onClose} />
        )}
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
