import { useTranslation } from 'react-i18next';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from '@/components/ui/responsive-modal';
import { JerseyForm } from '@/components/forms/JerseyForm/JerseyForm';

export function JerseyFormDialog({ open, jersey, onSuccess, onClose }) {
  const { t } = useTranslation();
  return (
    <ResponsiveModal open={open} onOpenChange={(o) => !o && onClose()}>
      <ResponsiveModalContent className="max-w-3xl">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>{jersey ? t('jersey.editForm') : t('jersey.addForm')}</ResponsiveModalTitle>
        </ResponsiveModalHeader>
        {open && (
          <JerseyForm
            jersey={jersey}
            onSuccess={onSuccess}
            onCancel={onClose}
          />
        )}
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
