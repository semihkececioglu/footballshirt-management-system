import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Edit, Copy, CheckSquare, Trash2, MoreVertical, Star } from 'lucide-react';
import { JerseyCard } from '@/components/common/JerseyCard/JerseyCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogContent,
  AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';

function GridActions({ jersey, actions, onDeleteRequest }) {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="bg-white/20 hover:bg-white/40 text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical size={14} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => actions.onDetail(jersey)}>
          <Eye size={14} className="mr-2" /> {t('forSale.grid.detail')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => actions.onEdit(jersey)}>
          <Edit size={14} className="mr-2" /> {t('forSale.grid.edit')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => actions.onDuplicate(jersey._id)}>
          <Copy size={14} className="mr-2" /> {t('forSale.grid.duplicate')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => actions.onToggleFeatured(jersey._id, jersey.featured)} className={jersey.featured ? 'text-amber-600 focus:text-amber-600' : ''}>
          <Star size={14} className={`mr-2 ${jersey.featured ? 'fill-amber-500' : ''}`} />
          {jersey.featured ? t('forSale.grid.removeFeatured') : t('forSale.grid.addFeatured')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => actions.onSale(jersey)} className="text-green-600 focus:text-green-600">
          <CheckSquare size={14} className="mr-2" /> {t('forSale.grid.markSold')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDeleteRequest(jersey._id)}
          className="text-red-500 focus:text-red-500"
        >
          <Trash2 size={14} className="mr-2" /> {t('forSale.grid.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function JerseyGrid({ jerseys, loading, actions }) {
  const { t } = useTranslation();
  const [deleteId, setDeleteId] = useState(null);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
        ))}
      </div>
    );
  }

  if (!jerseys.length) {
    return (
      <div className="flex items-center justify-center h-48 text-[var(--text-muted)] text-sm">
        {t('forSale.grid.noJerseys')}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {jerseys.map((jersey) => (
          <JerseyCard
            key={jersey._id}
            jersey={jersey}
            onClick={() => actions.onDetail(jersey)}
            actions={<GridActions jersey={jersey} actions={actions} onDeleteRequest={setDeleteId} />}
          />
        ))}
      </div>
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('forSale.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('forSale.deleteDialog.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('forSale.deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { actions.onDelete(deleteId); setDeleteId(null); }}>{t('forSale.deleteDialog.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
