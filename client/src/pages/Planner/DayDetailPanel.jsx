import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Pencil, Trash2, Plus, Camera, Share2, ShoppingCart, CheckSquare, ExternalLink } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { plannerService } from '@/services/api';

export const PLAN_TYPES = {
  share: { label: 'Paylaşım', icon: Share2, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
  list: { label: 'Listeleme', icon: ShoppingCart, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' },
  photo: { label: 'Fotoğraf', icon: Camera, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
  task: { label: 'Görev', icon: CheckSquare, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
};

function PlanCard({ item, onEdit, onDelete, onToggle }) {
  const { t } = useTranslation();
  const meta = PLAN_TYPES[item.type] || PLAN_TYPES.task;
  const Icon = meta.icon;
  const jersey = item.jerseyId;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-opacity',
        'bg-[var(--bg-card)] border-[var(--border)]',
        item.status === 'done' && 'opacity-60'
      )}
    >
      {/* Type icon */}
      <div className={cn('mt-0.5 p-1.5 rounded-md border flex-shrink-0', meta.bg)}>
        <Icon size={13} className={meta.color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm font-medium text-[var(--text-primary)] leading-tight', item.status === 'done' && 'line-through')}>
            {item.title}
          </p>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Toggle done */}
            <button
              onClick={() => onToggle(item._id)}
              title={item.status === 'done' ? t('planner.undone') : t('planner.complete')}
              className={cn(
                'h-6 w-6 rounded flex items-center justify-center border transition-colors',
                item.status === 'done'
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-green-500 hover:text-green-500'
              )}
            >
              <Check size={11} />
            </button>
            <button
              onClick={() => onEdit(item)}
              className="h-6 w-6 rounded flex items-center justify-center border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
            >
              <Pencil size={11} />
            </button>
            <button
              onClick={() => onDelete(item._id)}
              className="h-6 w-6 rounded flex items-center justify-center border border-[var(--border)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500 transition-colors"
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        {/* Platform badge */}
        {item.platform && (
          <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border)]">
            {item.platform}
          </span>
        )}

        {/* Jersey link */}
        {jersey && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {jersey.images?.[0]?.url && (
              <img src={jersey.images[0].url} alt="" className="h-7 w-7 rounded object-cover border border-[var(--border)] flex-shrink-0" />
            )}
            <span className="text-[11px] text-[var(--text-secondary)] truncate">
              {jersey.teamName} {jersey.season} {jersey.type}
            </span>
            <ExternalLink size={10} className="text-[var(--text-muted)] flex-shrink-0" />
          </div>
        )}

        {/* Description */}
        {item.description && (
          <p className="mt-1 text-[11px] text-[var(--text-muted)] leading-relaxed">{item.description}</p>
        )}
      </div>
    </div>
  );
}

export default function DayDetailPanel({ date, items, onAdd, onEdit, onRefresh }) {
  const { t, i18n } = useTranslation();
  const [deleteId, setDeleteId] = useState(null);
  const locale = i18n.language === 'en' ? 'en-US' : 'tr-TR';

  const handleToggle = async (id) => {
    try {
      await plannerService.toggle(id);
      onRefresh();
    } catch {
      toast.error(t('planner.toggleError'));
    }
  };

  const handleDelete = async () => {
    try {
      await plannerService.delete(deleteId);
      toast.success(t('planner.deleteSuccess'));
      setDeleteId(null);
      onRefresh();
    } catch {
      toast.error(t('planner.deleteError'));
    }
  };

  if (!date) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-4xl mb-3">📅</div>
        <p className="text-sm text-[var(--text-muted)]">{t('planner.clickDay')}</p>
      </div>
    );
  }

  const dateLabel = date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  const dayName = date.toLocaleDateString(locale, { weekday: 'long' });

  const pending = items.filter((i) => i.status === 'pending');
  const done = items.filter((i) => i.status === 'done');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <div>
          <p className="text-xs text-[var(--text-muted)] capitalize">{dayName}</p>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{dateLabel}</h3>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--accent)] text-[var(--accent-foreground)] text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={12} />
          {t('planner.addPlan')}
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {items.length === 0 && (
          <div className="text-center py-8 text-[var(--text-muted)] text-sm">
            {t('planner.noPlans')}
          </div>
        )}

        {pending.map((item) => (
          <PlanCard key={item._id} item={item} onEdit={onEdit} onDelete={setDeleteId} onToggle={handleToggle} />
        ))}

        {done.length > 0 && (
          <>
            {pending.length > 0 && <div className="pt-2 pb-1 text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{t('planner.completed')}</div>}
            {done.map((item) => (
              <PlanCard key={item._id} item={item} onEdit={onEdit} onDelete={setDeleteId} onToggle={handleToggle} />
            ))}
          </>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('planner.deletePlan')}</AlertDialogTitle>
            <AlertDialogDescription>{t('planner.deleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
