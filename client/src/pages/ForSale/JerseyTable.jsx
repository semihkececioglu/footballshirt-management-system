import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Edit, Copy, CheckSquare, Trash2, ExternalLink, MoreVertical, Star } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { ConditionBadge } from '@/components/common/StatusBadge/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogContent,
  AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';

import { useTranslateConstant } from '@/hooks/useTranslateConstant';

function MainThumb({ images }) {
  const main = images?.find((i) => i.isMain) || images?.[0];
  if (!main?.url) return <div className="w-10 h-12 rounded bg-[var(--bg-secondary)]" />;
  return (
    <img src={main.url} alt="" className="w-10 h-12 object-cover rounded" loading="lazy" />
  );
}

function PlatformLinks({ platforms }) {
  const active = platforms?.filter((p) => p.isActive && p.listingUrl);
  if (!active?.length) return <span className="text-[var(--text-muted)]">—</span>;
  return (
    <div className="flex gap-1 flex-wrap">
      {active.map((p, i) => (
        <a
          key={i}
          href={p.listingUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-0.5 text-xs text-[var(--accent)] hover:underline"
        >
          {p.name} <ExternalLink size={10} />
        </a>
      ))}
    </div>
  );
}

function SizeVariantsCell({ row }) {
  const translateJerseySize = useTranslateConstant('jerseySize');
  const sizeInfo = row.sizeVariants?.length > 0
    ? row.sizeVariants
    : row.size ? [{ size: row.size, stockCount: row.stockCount ?? 1 }] : [];

  if (!sizeInfo.length) return <span className="text-[var(--text-muted)]">—</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {sizeInfo.map((v, i) => (
        <span
          key={i}
          className={cn(
            'text-xs px-1.5 py-0.5 rounded border font-medium',
            v.stockCount > 0
              ? 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)]'
              : 'opacity-40 bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-muted)] line-through'
          )}
        >
          {translateJerseySize(v.size)}{v.stockCount > 1 ? ` ×${v.stockCount}` : ''}
        </span>
      ))}
    </div>
  );
}

function ActionsMenu({ row, actions, onDeleteRequest }) {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
          <MoreVertical size={15} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => actions.onDetail(row)}>
          <Eye size={14} className="mr-2" /> {t('common.detail')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => actions.onEdit(row)}>
          <Edit size={14} className="mr-2" /> {t('common.edit')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => actions.onDuplicate(row._id)}>
          <Copy size={14} className="mr-2" /> {t('jersey.copyForm')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => actions.onToggleFeatured(row._id, row.featured)} className={row.featured ? 'text-amber-600 focus:text-amber-600' : ''}>
          <Star size={14} className={`mr-2 ${row.featured ? 'fill-amber-500' : ''}`} />
          {row.featured ? t('jersey.removeFeatured') : t('jersey.markFeatured')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => actions.onSale(row)} className="text-green-600 focus:text-green-600">
          <CheckSquare size={14} className="mr-2" /> {t('jersey.markSold')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDeleteRequest(row._id)}
          className="text-red-500 focus:text-red-500"
        >
          <Trash2 size={14} className="mr-2" /> {t('common.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function JerseyTable({ jerseys, loading, selected, onSelectionChange, actions }) {
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const translateJerseyQuality = useTranslateConstant('jerseyQuality');
  const translateJerseyType = useTranslateConstant('jerseyType');
  const [deleteId, setDeleteId] = useState(null);

  const columns = [
    {
      key: 'images',
      label: '',
      render: (v) => <MainThumb images={v} />,
      className: 'w-14',
    },
    {
      key: 'teamName',
      label: t('forSale.col.team'),
      sortable: true,
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--text-primary)] whitespace-nowrap">{v}</span>
          {row.featured && <Star size={11} className="fill-amber-400 text-amber-400 flex-shrink-0" />}
        </div>
      ),
    },
    { key: 'productCode', label: t('forSale.col.code'), className: 'hidden xl:table-cell text-xs text-[var(--text-muted)]' },
    { key: 'season', label: t('forSale.col.season'), sortable: true, className: 'whitespace-nowrap' },
    { key: 'type', label: t('forSale.col.type'), render: (v) => translateJerseyType(v) || '—' },
    { key: 'quality', label: t('forSale.col.quality'), className: 'hidden md:table-cell', render: (v) => translateJerseyQuality(v) },
    {
      key: 'sizeVariants',
      label: t('forSale.col.size'),
      render: (_, row) => <SizeVariantsCell row={row} />,
    },
    {
      key: 'condition',
      label: t('forSale.col.condition'),
      className: 'hidden lg:table-cell',
      render: (v) => <ConditionBadge condition={v} />,
    },
    {
      key: 'buyPrice',
      label: t('forSale.col.buyPrice'),
      className: 'hidden xl:table-cell',
      render: (v) => <span className="text-sm text-[var(--text-muted)]">{v ? formatCurrency(v) : '—'}</span>,
    },
    {
      key: 'sellPrice',
      label: t('forSale.col.sellPrice'),
      sortable: true,
      render: (v) => <span className="font-medium text-[var(--accent)]">{v ? formatCurrency(v) : '—'}</span>,
    },
    {
      key: 'measurements',
      label: t('forSale.col.measurement'),
      className: 'hidden lg:table-cell',
      render: (v) => {
        if (!v?.armpit && !v?.length) return <span className="text-[var(--text-muted)]">—</span>;
        const parts = [v.armpit, v.length].filter(Boolean);
        return (
          <span className="text-xs text-[var(--text-muted)]">
            {parts.join('×')}
          </span>
        );
      },
    },
    {
      key: 'platforms',
      label: t('forSale.col.platforms'),
      className: 'hidden xl:table-cell',
      render: (v) => <PlatformLinks platforms={v} />,
    },
    {
      key: '_id',
      label: '',
      className: 'w-12 text-right',
      render: (_, row) => (
        <ActionsMenu row={row} actions={actions} onDeleteRequest={setDeleteId} />
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={jerseys}
        loading={loading}
        selectable
        selectedIds={selected}
        onSelectionChange={onSelectionChange}
      />
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('jersey.deleteForm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('forSale.deleteDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { actions.onDelete(deleteId); setDeleteId(null); }}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
