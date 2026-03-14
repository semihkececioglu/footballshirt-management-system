import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { JerseyForm } from '@/components/forms/JerseyForm/JerseyForm';

export function JerseyFormDialog({ open, jersey, onSuccess, onClose }) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{jersey ? t('jersey.editForm') : t('jersey.addForm')}</DialogTitle>
        </DialogHeader>
        {open && (
          <JerseyForm
            jersey={jersey}
            onSuccess={onSuccess}
            onCancel={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
