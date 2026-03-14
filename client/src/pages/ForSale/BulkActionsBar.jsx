import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, DollarSign, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent,
  AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';

export function BulkActionsBar({ count, onDelete, onPriceUpdate, onClear }) {
  const { t } = useTranslation();
  const [priceInput, setPriceInput] = useState('');
  const [showPrice, setShowPrice] = useState(false);

  function handlePriceApply() {
    const price = Number(priceInput);
    if (!price || price < 0) return;
    onPriceUpdate(price);
    setShowPrice(false);
    setPriceInput('');
  }

  return (
    <div className="flex items-center gap-2 flex-wrap px-4 py-2.5 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20">
      <span className="text-sm font-medium text-[var(--text-primary)]">
        {t('forSale.bulkSelected', { count })}
      </span>

      <div className="flex items-center gap-2 ml-2 flex-wrap">
        {/* Bulk price */}
        {showPrice ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              placeholder={t('forSale.bulkNewPrice')}
              className="h-7 w-32 text-xs"
              autoFocus
            />
            <Button size="sm" onClick={handlePriceApply} className="h-7 text-xs px-2">{t('common.apply')}</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowPrice(false)} className="h-7 text-xs px-2">{t('common.cancel')}</Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShowPrice(true)}>
            <DollarSign size={13} /> {t('forSale.bulkUpdatePrice')}
          </Button>
        )}

        {/* Bulk delete */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 size={13} /> {t('common.delete')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('forSale.bulkDeleteConfirm', { count })}</AlertDialogTitle>
              <AlertDialogDescription>{t('common.cannotBeUndone')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>{t('common.delete')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <button onClick={onClear} className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-primary)]">
        <X size={16} />
      </button>
    </div>
  );
}
