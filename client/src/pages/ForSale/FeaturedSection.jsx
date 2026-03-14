import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Eye, Edit, Copy, CheckSquare, Trash2, MoreVertical } from 'lucide-react';
import { JerseyCard } from '@/components/common/JerseyCard/JerseyCard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';

function FeaturedCardActions({ jersey, actions, onDeleteRequest }) {
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
          <Eye size={14} className="mr-2" /> {t('common.detail')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => actions.onEdit(jersey)}>
          <Edit size={14} className="mr-2" /> {t('common.edit')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => actions.onDuplicate(jersey._id)}>
          <Copy size={14} className="mr-2" /> {t('jersey.copyForm')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => actions.onToggleFeatured(jersey._id, jersey.featured)}
          className="text-amber-600 focus:text-amber-600"
        >
          <Star size={14} className="mr-2 fill-amber-500" />
          {t('jersey.removeFeatured')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => actions.onSale(jersey)} className="text-green-600 focus:text-green-600">
          <CheckSquare size={14} className="mr-2" /> {t('jersey.markSold')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDeleteRequest(jersey._id)}
          className="text-red-500 focus:text-red-500"
        >
          <Trash2 size={14} className="mr-2" /> {t('common.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FeaturedSection({ jerseys, actions }) {
  const { t } = useTranslation();
  const [deleteId, setDeleteId] = useState(null);

  if (!jerseys || jerseys.length === 0) return null;

  return (
    <>
      <div className="rounded-xl border border-amber-400/40 bg-amber-400/5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-400/30 bg-amber-400/10">
          <Star size={14} className="fill-amber-400 text-amber-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            {t('forSale.featuredSection')}
          </span>
          <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-400 font-medium border border-amber-400/30">
            {jerseys.length}
          </span>
        </div>

        {/* Horizontal scroll strip */}
        <div className="overflow-x-auto px-4 py-4">
          <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
            {jerseys.map((jersey) => (
              <div key={jersey._id} className="w-36 sm:w-44 flex-shrink-0">
                <JerseyCard
                  jersey={jersey}
                  onClick={() => actions.onDetail(jersey)}
                  actions={
                    <FeaturedCardActions
                      jersey={jersey}
                      actions={actions}
                      onDeleteRequest={setDeleteId}
                    />
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('jersey.deleteForm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.cannotBeUndone')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { actions.onDelete(deleteId); setDeleteId(null); }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
