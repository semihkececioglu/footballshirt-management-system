import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Edit, Copy, CheckSquare, Trash2, ExternalLink, MoreVertical, Star } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { ConditionBadge } from '@/components/common/StatusBadge/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { jerseyService } from '@/services/api';
import { useTranslateConstant } from '@/hooks/useTranslateConstant';
import { LazyImage } from '@/components/common/LazyImage/LazyImage';

function MainThumb({ images }) {
  const main = images?.find((i) => i.isMain) || images?.[0];
  return <LazyImage src={main?.url} alt="" className="w-10 h-12 object-cover rounded" containerClassName="w-10 h-12 rounded" />;
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

export function JerseyTable({ jerseys, loading, selected, onSelectionChange, actions, onUpdate }) {
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const translateJerseyType = useTranslateConstant('jerseyType');
  const [deleteId, setDeleteId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingPrice, setEditingPrice] = useState('');
  const inputRef = useRef(null);

  async function savePrice(id) {
    const price = Number(editingPrice);
    if (isNaN(price) || price < 0) { setEditingId(null); return; }
    try {
      const fd = new FormData();
      fd.append('data', JSON.stringify({ sellPrice: price }));
      const res = await jerseyService.update(id, fd);
      onUpdate?.(res.data.data);
      toast.success(t('forSale.priceUpdated'));
    } catch {
      toast.error(t('forSale.priceUpdateError'));
    }
    setEditingId(null);
  }

  function startEdit(row) {
    setEditingId(row._id);
    setEditingPrice(String(row.sellPrice || 0));
    setTimeout(() => inputRef.current?.select(), 30);
  }

  const columns = [
    {
      key: 'images',
      label: '',
      render: (v, row) => (
        <div
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={(e) => { e.stopPropagation(); actions.onDetail(row); }}
        >
          <MainThumb images={v} />
        </div>
      ),
      className: 'w-14',
    },
    {
      key: 'teamName',
      label: t('forSale.col.team'),
      sortable: true,
      render: (v, row) => {
        const subtitle = [
          row.season,
          row.type ? translateJerseyType(row.type) : null,
          row.brand,
        ].filter(Boolean).join(' · ');
        return (
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-[var(--text-primary)]">{v || '—'}</span>
              {row.featured && <Star size={11} className="fill-amber-400 text-amber-400 flex-shrink-0" />}
            </div>
            {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
          </div>
        );
      },
    },
    {
      key: 'sizeVariants',
      label: t('forSale.col.size'),
      render: (_, row) => <SizeVariantsCell row={row} />,
    },
    {
      key: 'condition',
      label: t('forSale.col.condition'),
      className: 'hidden md:table-cell',
      render: (v) => <ConditionBadge condition={v} />,
    },
    {
      key: 'sellPrice',
      label: t('forSale.col.price'),
      sortable: true,
      render: (v, row) => editingId === row._id ? (
        <Input
          ref={inputRef}
          type="number"
          value={editingPrice}
          onChange={(e) => setEditingPrice(e.target.value)}
          onBlur={() => savePrice(row._id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); savePrice(row._id); }
            if (e.key === 'Escape') setEditingId(null);
          }}
          className="h-7 w-20 text-sm px-1.5"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          onDoubleClick={(e) => { e.stopPropagation(); startEdit(row); }}
          title={t('forSale.doubleClickToEdit')}
          className="cursor-default select-none"
        >
          {row.buyPrice != null && (
            <p className="text-xs text-[var(--text-muted)]">{formatCurrency(row.buyPrice)}</p>
          )}
          <p className="font-medium text-[var(--accent)]">{v ? formatCurrency(v) : '—'}</p>
        </div>
      ),
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
