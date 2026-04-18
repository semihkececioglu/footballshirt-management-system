import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Search, SlidersHorizontal, X, ChevronDown, Check, MoreVertical, ArrowUpRight, Pencil, PackageMinus, Phone, Eye, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation, Trans } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  ResponsiveModal, ResponsiveModalContent, ResponsiveModalHeader, ResponsiveModalTitle, ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { SelectSheet } from '@/components/ui/select-sheet';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { Pagination } from '@/components/common/DataTable/Pagination';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { purchaseService, uploadService } from '@/services/api';
import { PurchaseForm, EMPTY_PURCHASE_FORM } from './PurchaseForm';
import { PurchaseDetailDialog } from './PurchaseDetailDialog';
import { FormField } from '@/components/forms/JerseyForm/FormField';
import { Combobox } from '@/components/ui/combobox';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { formatDate, getWhatsAppUrl } from '@/lib/utils';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { useTranslateConstant } from '@/hooks/useTranslateConstant';
import { cn } from '@/lib/utils';
import { ImageUploader } from '@/components/common/ImageUploader/ImageUploader';
import { LazyImage } from '@/components/common/LazyImage/LazyImage';
import { JERSEY_TYPES, JERSEY_QUALITIES, CONDITIONS } from '@/lib/constants';

/* ─── Multi-select dropdown ─── */
function MultiSelect({ label, options, values, onChange }) {
  const { t } = useTranslation();
  const translateCondition = useTranslateConstant('condition');
  const translateJerseyType = useTranslateConstant('jerseyType');
  const translateJerseyQuality = useTranslateConstant('jerseyQuality');

  const [open, setOpen] = useState(false);
  function toggle(val) {
    onChange(values.includes(val) ? values.filter((v) => v !== val) : [...values, val]);
  }

  const getLabel = (val) => {
    if (label === t('purchased.filter.type')) return translateJerseyType(val);
    if (label === t('purchased.filter.condition')) return translateCondition(val);
    if (label === t('purchased.filter.quality')) return translateJerseyQuality(val);
    return val;
  };

  const display = values.length === 0 ? t('common.all') : values.length === 1 ? getLabel(values[0]) : t('common.selected', { count: values.length });

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" className={cn(
            'w-full h-8 px-2.5 text-xs border border-[var(--border)] rounded-md',
            'bg-[var(--bg-card)] text-[var(--text-primary)] flex items-center justify-between gap-1',
            'hover:border-[var(--accent)] transition-colors outline-none',
            values.length > 0 && 'border-[var(--accent)]'
          )}>
            <span className="truncate">{display}</span>
            <ChevronDown size={12} className="flex-shrink-0 text-[var(--text-muted)]" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-1 w-44" align="start" sideOffset={4}>
          {options.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-[var(--text-muted)]">{t('common.noOptions')}</p>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              {options.map((opt) => {
                const selected = values.includes(opt);
                return (
                  <button key={opt} type="button" onClick={() => toggle(opt)}
                    className={cn('w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-colors hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]', selected && 'font-medium')}>
                    {getLabel(opt)}
                    {selected && <Check size={12} className="flex-shrink-0 text-[var(--accent)]" />}
                  </button>
                );
              })}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

/* ─── Filters bar ─── */
const FILTER_KEYS = ['search', 'type', 'quality', 'size', 'condition', 'brand', 'isForResale', 'sellerName', 'dateFrom', 'dateTo'];
const EMPTY_FILTERS = { search: '', type: [], quality: [], size: [], condition: [], brand: [], isForResale: '', sellerName: '', dateFrom: '', dateTo: '' };

function parseFiltersFromUrl(params) {
  const ARRAY_FIELDS = ['type', 'quality', 'size', 'condition', 'brand'];
  return {
    search: params.get('search') || '',
    isForResale: params.get('isForResale') || '',
    sellerName: params.get('sellerName') || '',
    dateFrom: params.get('dateFrom') || '',
    dateTo: params.get('dateTo') || '',
    ...Object.fromEntries(ARRAY_FIELDS.map((k) => [k, params.get(k) ? params.get(k).split(',') : []])),
  };
}

function PurchaseFilters({ onFilterChange, defaultValues }) {
  const { t } = useTranslation();
  const [f, setF] = useState(defaultValues || EMPTY_FILTERS);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState({ types: [], qualities: [], conditions: [], brands: [], sizes: [] });

  useEffect(() => {
    purchaseService.getFilterOptions().then((res) => setOptions(res.data.data)).catch(() => {});
  }, []);

  function update(key, val) {
    const next = { ...f, [key]: val };
    setF(next);
    if (key === 'search') onFilterChange(clean(next));
  }

  function clean(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (Array.isArray(v) && v.length > 0) out[k] = v.join(',');
      else if (v && !Array.isArray(v)) out[k] = v;
    }
    return out;
  }

  function apply() { onFilterChange(clean(f)); setOpen(false); }
  function reset() { setF(EMPTY_FILTERS); onFilterChange({}); setOpen(false); }

  const activeCount = Object.entries(f).filter(([k, v]) => k !== 'search' && (Array.isArray(v) ? v.length > 0 : !!v)).length;

  function dateValue(str) { return str ? new Date(str) : null; }
  function onDateChange(key, date) { update(key, date ? format(date, 'yyyy-MM-dd') : ''); }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <Input placeholder={t('purchased.filter.searchPlaceholder')} value={f.search} onChange={(e) => update('search', e.target.value)} className="pl-8 w-52" />
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <SlidersHorizontal size={14} />
            {t('common.filter')}
            {activeCount > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] text-[10px]">
                {activeCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px]" align="start">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{t('common.filters')}</p>
            <div className="grid grid-cols-2 gap-2">
              <MultiSelect label={t('purchased.filter.type')} options={options.types.length ? options.types : JERSEY_TYPES} values={f.type} onChange={(v) => update('type', v)} />
              <MultiSelect label={t('purchased.filter.quality')} options={options.qualities.length ? options.qualities : JERSEY_QUALITIES} values={f.quality} onChange={(v) => update('quality', v)} />
              <MultiSelect label={t('purchased.filter.condition')} options={options.conditions.length ? options.conditions : CONDITIONS} values={f.condition} onChange={(v) => update('condition', v)} />
              <MultiSelect label={t('purchased.filter.size')} options={options.sizes.length ? options.sizes : []} values={f.size} onChange={(v) => update('size', v)} />
              <MultiSelect label={t('purchased.filter.brand')} options={options.brands} values={f.brand} onChange={(v) => update('brand', v)} />
              <div className="space-y-1">
                <Label className="text-xs">{t('purchased.filter.forSale')}</Label>
                <SelectSheet
                  value={f.isForResale}
                  onValueChange={(v) => update('isForResale', v)}
                  placeholder={t('common.all')}
                  options={[
                    { value: 'true', label: t('purchased.status.forSale') },
                    { value: 'false', label: t('purchased.status.notForSale') },
                  ]}
                  label={t('purchased.filter.forSale')}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('purchased.filter.dateFrom')}</Label>
                <DatePicker value={dateValue(f.dateFrom)} onChange={(d) => onDateChange('dateFrom', d)} placeholder={t('common.select')} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('purchased.filter.dateTo')}</Label>
                <DatePicker value={dateValue(f.dateTo)} onChange={(d) => onDateChange('dateTo', d)} placeholder={t('common.select')} className="h-8 text-xs" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('purchased.filter.seller')}</Label>
              <Combobox
                options={(options.sellerNames || []).map((n) => ({ value: n, label: n }))}
                value={f.sellerName}
                onChange={(v) => update('sellerName', v || '')}
                placeholder={t('purchased.filter.sellerPlaceholder')}
                allowCustom
                clearable
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={reset} className="flex-1"><X size={13} /> {t('common.clear')}</Button>
              <Button size="sm" onClick={apply} className="flex-1">{t('common.apply')}</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}


/* ─── Page ─── */
export default function PurchasedPage() {
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const translateJerseyType = useTranslateConstant('jerseyType');
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const modal = searchParams.get('modal') || '';

  // Derive filters from URL params
  const filters = Object.fromEntries(
    FILTER_KEYS.map((k) => [k, searchParams.get(k) || ''])
  );

  const [purchases, setPurchases] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [editItem, setEditItem] = useState(null);
  const [formInitial, setFormInitial] = useState(EMPTY_PURCHASE_FORM);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [selected, setSelected] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Promote dialog
  const [promoteItem, setPromoteItem] = useState(null);
  const [sellPrice, setSellPrice] = useState('');
  const [promoting, setPromoting] = useState(false);
  const [promoteImages, setPromoteImages] = useState([]);

  // Demote (satılıktan kaldır)
  const [demoteItem, setDemoteItem] = useState(null);
  const [demoting, setDemoting] = useState(false);

  const LIMIT = 50;

  function setParam(key, value, replace = true) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, String(value));
      else next.delete(key);
      return next;
    }, { replace });
  }

  // loadKey: changes only when page or filters change
  const loadKey = [page, ...FILTER_KEYS.map((k) => searchParams.get(k) || '')].join('|');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      for (const k of FILTER_KEYS) {
        const v = searchParams.get(k);
        if (v) params[k] = v;
      }
      const res = await purchaseService.getAll(params);
      setPurchases(res.data.data || res.data);
      setTotal(res.data.total || 0);
    } catch {
      toast.error(t('purchased.toast.loadError'));
    } finally {
      setLoading(false);
    }
  }, [loadKey, t]);

  useEffect(() => { load(); }, [load]);

  // Sync formOpen with modal param
  useEffect(() => {
    if (modal === 'add') {
      setEditItem(null);
      setFormInitial(EMPTY_PURCHASE_FORM);
      setFormOpen(true);
    } else if (modal === 'edit') {
      setFormOpen(true);
    } else {
      setFormOpen(false);
    }
  }, [modal]);

  function handleFilterChange(newFilters) {
    setSelected([]);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('page');
      for (const k of FILTER_KEYS) {
        if (newFilters[k]) next.set(k, newFilters[k]);
        else next.delete(k);
      }
      return next;
    }, { replace: true });
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await purchaseService.delete(deleteId);
      toast.success(t('purchased.toast.deleteSuccess'));
      load();
    } catch {
      toast.error(t('purchased.toast.deleteError'));
    } finally {
      setDeleteId(null);
    }
  }

  async function handleBulkDelete() {
    try {
      await purchaseService.bulkDelete(selected);
      toast.success(t('purchased.bulkDeleteSuccess'));
      setSelected([]);
      setBulkDeleteOpen(false);
      load();
    } catch {
      toast.error(t('purchased.bulkDeleteError'));
    }
  }

  function openEdit(row) {
    setEditItem(row);
    setFormInitial({
      country: row.country || '',
      league: row.league || '',
      teamName: row.teamName || '',
      season: row.season || '',
      type: row.type || '',
      quality: row.quality || '',
      brand: row.brand || '',
      technology: row.technology || '',
      sponsor: row.sponsor || '',
      productCode: row.productCode || '',
      size: row.size || '',
      sizeVariants: row.sizeVariants?.length ? row.sizeVariants : (row.size ? [{ size: row.size, stockCount: 1 }] : []),
      measurements: { armpit: row.measurements?.armpit ?? '', length: row.measurements?.length ?? '' },
      condition: row.condition || '',
      printing: {
        hasNumber: row.printing?.hasNumber ?? false,
        number: row.printing?.number || '',
        playerName: row.printing?.playerName || '',
      },
      primaryColor: row.primaryColor || '',
      detailColor: row.detailColor || '',
      buyPrice: row.buyPrice != null ? String(row.buyPrice) : '',
      platform: row.platform || '',
      purchaseDate: row.purchaseDate ? new Date(row.purchaseDate).toISOString().slice(0, 10) : '',
      isForResale: row.isForResale ?? false,
      seller: row.seller?._id || (typeof row.seller === 'string' ? row.seller : '') || '',
      sellerName: row.sellerName || '',
      sellerPhone: row.sellerPhone || '',
      images: row.images || [],
      patches: row.patches || [],
      notes: row.notes || '',
    });
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('modal', 'edit');
      return next;
    }, { replace: false });
  }

  function closeForm() {
    setParam('modal', null);
    setFormOpen(false);
    setEditItem(null);
    setFormInitial(EMPTY_PURCHASE_FORM);
  }

  async function handleSubmit(payload) {
    if (!payload.teamName?.trim()) { toast.error(t('purchased.toast.teamRequired')); return; }
    setSaving(true);
    try {
      if (editItem) {
        await purchaseService.update(editItem._id, payload);
        toast.success(t('purchased.toast.updateSuccess'));
      } else {
        await purchaseService.create(payload);
        toast.success(t('purchased.toast.createSuccess'));
      }
      closeForm();
      load();
    } catch {
      toast.error(t('purchased.toast.saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function handlePromote() {
    if (!promoteItem) return;
    setPromoting(true);
    try {
      const newFiles = promoteImages.filter((i) => i.file).map((i) => i.file);
      let uploadedImages = [];
      if (newFiles.length > 0) {
        const res = await uploadService.images(newFiles);
        uploadedImages = res.data.data || [];
      }
      const existingImages = promoteImages
        .filter((i) => !i.file && i.url)
        .map((i) => ({ url: i.url, publicId: i.publicId }));
      const finalImages = [...existingImages, ...uploadedImages];
      await purchaseService.promote(promoteItem._id, {
        sellPrice: Number(sellPrice) || 0,
        images: finalImages,
      });
      toast.success(t('purchased.toast.promoteSuccess'));
      setPromoteItem(null);
      setSellPrice('');
      setPromoteImages([]);
      load();
    } catch {
      toast.error(t('purchased.toast.promoteError'));
    } finally {
      setPromoting(false);
    }
  }

  async function handleDemote() {
    if (!demoteItem) return;
    setDemoting(true);
    try {
      await purchaseService.demote(demoteItem._id);
      toast.success(t('purchased.toast.demoteSuccess'));
      setDemoteItem(null);
      load();
    } catch {
      toast.error(t('purchased.toast.demoteError'));
    } finally {
      setDemoting(false);
    }
  }

  const columns = [
    {
      key: 'images',
      label: '',
      className: 'w-14',
      render: (v, row) => {
        const img = Array.isArray(v) ? v[0] : null;
        return (
          <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); setDetailItem(row); }}>
            <LazyImage src={img?.url} alt="" className="w-10 h-12 object-cover rounded" containerClassName="w-10 h-12 rounded" />
          </div>
        );
      },
    },
    {
      key: 'teamName',
      label: t('purchased.col.team'),
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
              {row.isForResale && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] font-medium leading-none">
                  {t('purchased.status.forSale')}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
          </div>
        );
      },
    },
    {
      key: 'sellerName',
      label: t('purchased.col.seller'),
      className: 'hidden lg:table-cell',
      render: (v, row) => {
        if (!v) return '—';
        const waUrl = row.sellerPhone ? getWhatsAppUrl(row.sellerPhone) : null;
        return waUrl ? (
          <a href={waUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 hover:text-[var(--accent)] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {v}
            <Phone size={11} className="text-green-500 shrink-0" />
          </a>
        ) : v;
      },
    },
    {
      key: 'sizeVariants',
      label: t('purchased.col.size'),
      className: 'hidden sm:table-cell',
      render: (v, row) => {
        const variants = v?.length ? v : (row.size ? [{ size: row.size }] : []);
        if (!variants.length) return '—';
        return variants.map((sv) => sv.size).filter(Boolean).join(', ') || '—';
      },
    },
    {
      key: 'buyPrice',
      label: t('purchased.col.buyPrice'),
      sortable: true,
      render: (v, row) => {
        if (v == null) return '—';
        const totalQty = row.sizeVariants?.length
          ? row.sizeVariants.reduce((s, sv) => s + (sv.stockCount || 1), 0)
          : 1;
        return (
          <div>
            <span className="font-medium text-[var(--accent)]">{formatCurrency(v)}</span>
            {totalQty > 1 && (
              <span className="block text-[10px] text-[var(--text-muted)]">
                × {totalQty} = {formatCurrency(v * totalQty)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'purchaseDate',
      label: t('purchased.col.date'),
      sortable: true,
      className: 'hidden md:table-cell',
      render: (v) => formatDate(v),
    },
    {
      key: '_id',
      label: '',
      className: 'w-10 text-right',
      render: (_, row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
              <MoreVertical size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setDetailItem(row)}>
              <Eye size={13} className="mr-2" /> {t('purchased.viewDetail')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEdit(row)}>
              <Pencil size={13} className="mr-2" /> {t('common.edit')}
            </DropdownMenuItem>
            {!row.linkedJerseyId && (
              <DropdownMenuItem
                onClick={() => {
                  setPromoteItem(row);
                  setSellPrice('');
                  setPromoteImages(
                    (row.images || []).map((img) => ({
                      id: img.publicId || img.url,
                      preview: img.url,
                      url: img.url,
                      publicId: img.publicId,
                    }))
                  );
                }}
                className="text-[var(--accent)]"
              >
                <ArrowUpRight size={13} className="mr-2" /> {t('purchased.moveToForSale')}
              </DropdownMenuItem>
            )}
            {row.linkedJerseyId && (
              <DropdownMenuItem
                onClick={() => setDemoteItem(row)}
                className="text-orange-600"
              >
                <PackageMinus size={13} className="mr-2" /> {t('purchased.demote.title')}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDeleteId(row._id)} className="text-red-600">
              <Trash2 size={13} className="mr-2" /> {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <PurchaseFilters
          onFilterChange={handleFilterChange}
          defaultValues={parseFiltersFromUrl(searchParams)}
        />
        <div className="flex items-center gap-2 ml-auto">
          {total > 0 && <span className="text-sm text-[var(--text-muted)]">{t('purchased.recordCount', { count: total })}</span>}
          <Button onClick={() => { setEditItem(null); setFormInitial(EMPTY_PURCHASE_FORM); setParam('modal', 'add', false); }} size="sm">
            <Plus size={16} /> {t('purchased.addItem')}
          </Button>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex items-center gap-2 bg-[var(--bg-secondary)] rounded-lg px-3 py-2 text-sm flex-wrap">
          <span className="font-medium">{t('purchased.bulkSelected', { count: selected.length })}</span>
          <Button size="sm" variant="ghost" onClick={() => setBulkDeleteOpen(true)} className="text-red-600">
            <Trash2 size={13} className="mr-1" />{t('common.delete')}
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => setSelected([])} className="ml-auto">
            <X size={13} />
          </Button>
        </div>
      )}

      <DataTable columns={columns} data={purchases} loading={loading} emptyText={t('purchased.noItems')} selectable selectedIds={selected} onSelectionChange={setSelected} />

      <Pagination page={page} total={total} limit={LIMIT} onChange={(p) => { setSelected([]); setParam('page', p > 1 ? p : null); }} />

      {/* Bulk delete confirm */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={(o) => !o && setBulkDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('purchased.bulkDeleteConfirm', { count: selected.length })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('purchased.deleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promote dialog */}
      <ResponsiveModal open={!!promoteItem} onOpenChange={(o) => { if (!o) { setPromoteItem(null); setPromoteImages([]); } }}>
        <ResponsiveModalContent className="max-w-md">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>{t('purchased.moveToForSale')}</ResponsiveModalTitle>
          </ResponsiveModalHeader>
          {promoteItem && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-[var(--text-secondary)]">
                <span className="font-medium text-[var(--text-primary)]">{promoteItem.teamName}</span>
                {promoteItem.season && ` · ${promoteItem.season}`}
                {promoteItem.type && ` · ${translateJerseyType(promoteItem.type)}`}
              </p>
              <FormField label={t('purchased.promote.sellPrice')}>
                <Input
                  type="number"
                  min="0"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  placeholder="0"
                  autoFocus
                />
              </FormField>
              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--text-primary)]">{t('purchased.promote.images')}</p>
                <ImageUploader images={promoteImages} onChange={setPromoteImages} maxFiles={10} />
              </div>
            </div>
          )}
          <ResponsiveModalFooter>
            <Button variant="outline" onClick={() => { setPromoteItem(null); setPromoteImages([]); }}>{t('common.cancel')}</Button>
            <Button onClick={handlePromote} disabled={promoting}>
              {promoting ? t('common.saving') : t('purchased.moveToForSale')}
            </Button>
          </ResponsiveModalFooter>
        </ResponsiveModalContent>
      </ResponsiveModal>

      {/* Demote confirm */}
      <AlertDialog open={!!demoteItem} onOpenChange={(o) => !o && setDemoteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('purchased.demote.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              <Trans
                i18nKey="purchased.demote.description"
                values={{ name: demoteItem?.teamName }}
                components={{ medium: <span className="font-medium" /> }}
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDemote} disabled={demoting} className="bg-orange-600 hover:bg-orange-700">
              {demoting ? t('common.saving') : t('common.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail dialog */}
      <PurchaseDetailDialog
        purchase={detailItem}
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
      />

      {/* Add / Edit form dialog */}
      <ResponsiveModal open={formOpen} onOpenChange={(o) => { if (!o) closeForm(); }}>
        <ResponsiveModalContent className="max-w-xl">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>{editItem ? t('purchased.editItem') : t('purchased.addItem')}</ResponsiveModalTitle>
          </ResponsiveModalHeader>
          <PurchaseForm
            initialValues={formInitial}
            onSubmit={handleSubmit}
            onCancel={closeForm}
            saving={saving}
            submitLabel={editItem ? t('common.save') : t('common.add')}
          />
        </ResponsiveModalContent>
      </ResponsiveModal>
    </div>
  );
}
