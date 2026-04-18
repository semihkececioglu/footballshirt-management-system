import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Trash2, Plus, Search, Pencil, MoreVertical,
  CalendarIcon, X, RotateCcw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { Pagination } from '@/components/common/DataTable/Pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  ResponsiveModal, ResponsiveModalContent, ResponsiveModalHeader, ResponsiveModalTitle, ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { SelectSheet } from '@/components/ui/select-sheet';
import { DatePicker } from '@/components/ui/date-picker';
import {
  AlertDialog, AlertDialogContent,
  AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { saleService, jerseyService } from '@/services/api';
import { JerseyDetailDialog } from '@/components/common/JerseyDetail/JerseyDetailDialog';
import { Combobox } from '@/components/ui/combobox';
import { TeamSelector } from '@/components/common/TeamSelector/TeamSelector';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { formatDate } from '@/lib/utils';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { useTranslateConstant } from '@/hooks/useTranslateConstant';
import { PLATFORMS, PAYMENT_METHODS, JERSEY_SIZES, JERSEY_TYPES, SEASONS } from '@/lib/constants';
import { tr } from 'date-fns/locale';
import { LazyImage } from '@/components/common/LazyImage/LazyImage';

const EMPTY_FORM = {
  jerseyId: '', teamName: '', season: '', type: '', brand: '',
  buyerName: '', buyerUsername: '', buyerPhone: '',
  platform: '', salePrice: '', buyPrice: '',
  paymentMethod: '', soldAt: '', soldSize: '', notes: '',
};

function MainThumb({ images }) {
  const main = images?.find((i) => i.isMain) || images?.[0];
  return <LazyImage src={main?.url} alt="" className="w-10 h-12 object-cover rounded" containerClassName="w-10 h-12 rounded" />;
}

function getPresetRange(preset) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (preset) {
    case 'today': return { from: today, to: today };
    case 'week': return { from: new Date(today.getTime() - 6 * 86400000), to: today };
    case 'month': return { from: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()), to: today };
    case '3months': return { from: new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()), to: today };
    case 'year': return { from: new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()), to: today };
    default: return null;
  }
}

function toIsoDate(date) {
  if (!date) return '';
  return date.toISOString().split('T')[0];
}

function formatShort(dateStr, lang = 'tr') {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat(lang, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateStr));
}

export default function SoldPage() {
  const { t, i18n } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const translatePlatform = useTranslateConstant('platform');
  const translatePaymentMethod = useTranslateConstant('payment_method');
  const translateJerseyType = useTranslateConstant('jerseyType');
  const translateJerseySize = useTranslateConstant('jerseySize');

  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const search = searchParams.get('q') || '';
  const platform = searchParams.get('platform') || '';
  const paymentMethod = searchParams.get('paymentMethod') || '';
  const sort = searchParams.get('sort') || '-soldAt';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const modal = searchParams.get('modal') || '';

  const SORT_OPTIONS = [
    { label: t('sold.sort.newest'), value: '-soldAt' },
    { label: t('sold.sort.oldest'), value: 'soldAt' },
    { label: t('sold.sort.priceHigh'), value: '-salePrice' },
    { label: t('sold.sort.priceLow'), value: 'salePrice' },
    { label: t('sold.sort.profitHigh'), value: '-buyPrice' },
    { label: t('sold.sort.profitLow'), value: 'buyPrice' },
  ];

  const DATE_PRESETS = [
    { label: t('sold.today'), value: 'today' },
    { label: t('sold.last7'), value: 'week' },
    { label: t('sold.last30'), value: 'month' },
    { label: t('sold.last3months'), value: '3months' },
    { label: t('sold.thisYear'), value: 'year' },
  ];

  const [sales, setSales] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState({ platforms: [], paymentMethods: [], brands: [] });
  const [allBrands, setAllBrands] = useState([]);
  const [editSale, setEditSale] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [jerseySearch, setJerseySearch] = useState('');
  const [jerseyResults, setJerseyResults] = useState([]);
  const [selectedJersey, setSelectedJersey] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [teamSelectorData, setTeamSelectorData] = useState({ country: '', league: '', teamName: '' });
  const [detailItem, setDetailItem] = useState(null);
  const [returnItem, setReturnItem] = useState(null);
  const [returnForm, setReturnForm] = useState({ returnReason: '', refundAmount: '' });
  const [returning, setReturning] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: dateFrom ? new Date(dateFrom) : undefined,
    to: dateTo ? new Date(dateTo) : undefined,
  });

  const LIMIT = 50;

  function setParam(key, value, replace = true) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, String(value));
      else next.delete(key);
      if (key !== 'page') next.delete('page');
      return next;
    }, { replace });
  }

  function setMultiParam(updates, replace = true) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('page');
      Object.entries(updates).forEach(([k, v]) => {
        if (v) next.set(k, String(v));
        else next.delete(k);
      });
      return next;
    }, { replace });
  }

  const loadKey = [page, search, platform, paymentMethod, dateFrom, dateTo, sort, i18n.language].join('|');

  const load = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    setLoading(true);
    try {
      const res = await saleService.getAll({
        page: Math.max(1, Number(params.get('page') || 1)),
        limit: LIMIT,
        search: params.get('q') || undefined,
        platform: params.get('platform') || undefined,
        paymentMethod: params.get('paymentMethod') || undefined,
        dateFrom: params.get('dateFrom') || undefined,
        dateTo: params.get('dateTo') || undefined,
        sort: params.get('sort') || '-soldAt',
      });
      setSales(res.data.data);
      setTotal(res.data.total);
    } catch {
      toast.error(t('sold.toast.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [loadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    saleService.getFilterOptions()
      .then((r) => setFilterOptions(r.data.data || {}))
      .catch(() => {});
    fetch('/data/brands.json').then((r) => r.json()).then(setAllBrands).catch(() => {});
  }, []);

  const formOpen = modal === 'add' || (modal === 'edit' && !!editSale);
  const activeFilterCount = [search, platform, paymentMethod, dateFrom || dateTo].filter(Boolean).length;

  function clearFilters() {
    setDateRange({ from: undefined, to: undefined });
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      ['q', 'platform', 'paymentMethod', 'dateFrom', 'dateTo'].forEach((k) => next.delete(k));
      next.delete('page');
      return next;
    }, { replace: true });
  }

  function applyDateRange(range) {
    setDateRange(range || { from: undefined, to: undefined });
    if (range?.from && range?.to) {
      setMultiParam({ dateFrom: toIsoDate(range.from), dateTo: toIsoDate(range.to) });
      setDatePopoverOpen(false);
    } else if (!range?.from && !range?.to) {
      setMultiParam({ dateFrom: '', dateTo: '' });
    }
  }

  function applyPreset(preset) {
    const range = getPresetRange(preset);
    if (range) {
      setDateRange(range);
      setMultiParam({ dateFrom: toIsoDate(range.from), dateTo: toIsoDate(range.to) });
      setDatePopoverOpen(false);
    }
  }

  function clearModal() { setParam('modal', null); }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await saleService.delete(deleteId);
      toast.success(t('sold.toast.deleteSuccess'));
      load();
    } catch {
      toast.error(t('sold.toast.deleteError'));
    } finally {
      setDeleteId(null);
    }
  }

  async function handleReturn() {
    if (!returnItem) return;
    setReturning(true);
    try {
      await saleService.markAsReturned(returnItem._id, {
        returnReason: returnForm.returnReason,
        refundAmount: returnForm.refundAmount ? Number(returnForm.refundAmount) : undefined,
      });
      toast.success(t('sold.returnSuccess'));
      setReturnItem(null);
      setReturnForm({ returnReason: '', refundAmount: '' });
      load();
    } catch {
      toast.error(t('sold.returnError'));
    } finally {
      setReturning(false);
    }
  }

  function openEdit(sale) {
    const jersey = sale.jerseyId;
    setEditSale(sale);
    setForm({
      jerseyId: jersey?._id || sale.jerseyId || '',
      teamName: jersey?.teamName || sale.teamName || '',
      season: jersey?.season || sale.season || '',
      type: jersey?.type || sale.type || '',
      brand: sale.brand || '',
      buyerName: sale.buyerName || '',
      buyerUsername: sale.buyerUsername || '',
      buyerPhone: sale.buyerPhone || '',
      platform: sale.platform || '',
      salePrice: String(sale.salePrice || ''),
      buyPrice: sale.buyPrice ? String(sale.buyPrice) : '',
      paymentMethod: sale.paymentMethod || '',
      soldAt: sale.soldAt ? sale.soldAt.slice(0, 10) : '',
      soldSize: sale.soldSize || '',
      notes: sale.notes || '',
    });
    setTeamSelectorData({
      country: jersey?.country || '',
      league: jersey?.league || '',
      teamName: jersey?.teamName || sale.teamName || '',
    });
    setSelectedJersey(jersey || null);
    setJerseySearch(jersey?.teamName || '');
    setParam('modal', 'edit', false);
  }

  function closeForm() {
    clearModal();
    setEditSale(null);
    setForm(EMPTY_FORM);
    setSelectedJersey(null);
    setJerseySearch('');
    setManualMode(false);
    setTeamSelectorData({ country: '', league: '', teamName: '' });
  }

  async function searchJerseys(q) {
    setJerseySearch(q);
    if (!q.trim()) { setJerseyResults([]); return; }
    try {
      const res = await jerseyService.getAll({ search: q, limit: 10 });
      setJerseyResults(res.data.data || []);
    } catch {}
  }

  function selectJersey(j) {
    setSelectedJersey(j);
    setForm((prev) => ({
      ...prev,
      jerseyId: j._id,
      salePrice: String(j.sellPrice || ''),
      buyPrice: j.buyPrice ? String(j.buyPrice) : prev.buyPrice,
      brand: j.brand || prev.brand,
    }));
    setJerseyResults([]);
    setJerseySearch(j.teamName);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!editSale && !manualMode && !form.jerseyId) { toast.error(t('sold.toast.jerseyRequired')); return; }
    if (!editSale && manualMode && !form.teamName.trim()) { toast.error(t('sold.toast.teamRequired')); return; }
    if (editSale && !form.teamName.trim()) { toast.error(t('sold.toast.teamRequired')); return; }
    if (!form.salePrice) { toast.error(t('sold.toast.priceRequired')); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        jerseyId: manualMode ? undefined : form.jerseyId || undefined,
        teamName: (manualMode || editSale) ? (form.teamName.trim() || undefined) : undefined,
        season: (manualMode || editSale) ? (form.season || undefined) : undefined,
        type: (manualMode || editSale) ? (form.type || undefined) : undefined,
        brand: form.brand || undefined,
        salePrice: Number(form.salePrice),
        buyPrice: form.buyPrice ? Number(form.buyPrice) : 0,
        soldAt: form.soldAt || undefined,
      };
      if (editSale) {
        await saleService.update(editSale._id, payload);
        toast.success(t('sold.toast.updateSuccess'));
      } else {
        await saleService.create(payload);
        toast.success(t('sold.toast.createSuccess'));
      }
      closeForm();
      load();
    } catch {
      toast.error(t('sold.toast.saveError'));
    } finally {
      setSaving(false);
    }
  }

  const dateLabel = dateFrom && dateTo
    ? `${formatShort(dateFrom, i18n.language)} – ${formatShort(dateTo, i18n.language)}`
    : t('sold.dateRange');

  const columns = [
    {
      key: '_thumb',
      label: '',
      render: (_, row) => {
        const jersey = row.jerseyId;
        return (
          <div
            className={jersey ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
            onClick={jersey ? (e) => { e.stopPropagation(); setDetailItem(jersey); } : undefined}
          >
            <MainThumb images={jersey?.images} />
          </div>
        );
      },
      className: 'w-14',
    },
    {
      key: 'jerseyId',
      label: t('sold.col.jersey'),
      render: (v, row) => {
        const name = v?.teamName || row.teamName || '—';
        const subtitle = [v?.season || row.season, translateJerseyType(v?.type || row.type)].filter(Boolean).join(' · ');
        return (
          <div>
            <p className="font-medium text-[var(--text-primary)]">{name}</p>
            {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
          </div>
        );
      },
    },
    {
      key: 'buyerName',
      label: t('sold.buyer'),
      render: (v, row) => (
        <div>
          <p className="text-[var(--text-primary)]">{v || '—'}</p>
          {row.buyerUsername && <p className="text-xs text-[var(--text-muted)]">@{row.buyerUsername}</p>}
        </div>
      ),
    },
    { key: 'platform', label: t('sold.platform'), className: 'hidden sm:table-cell', render: (v) => v ? translatePlatform(v) : '—' },
    { key: 'soldSize', label: t('sold.size'), className: 'hidden sm:table-cell', render: (v) => v || '—' },
    {
      key: 'salePrice',
      label: t('sold.col.sellPrice'),
      sortable: true,
      render: (v, row) => {
        const profit = row.buyPrice > 0 ? v - row.buyPrice : null;
        return (
          <div>
            <span className="font-medium text-[var(--accent)]">{formatCurrency(v)}</span>
            {profit !== null && (
              <span className={`block text-[10px] font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: '_actions',
      label: '',
      className: 'w-28 text-right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          {row.isReturned && (
            <span title={t('sold.returned')}>
              <RotateCcw size={12} className="text-red-500" />
            </span>
          )}
          <span className="text-xs text-[var(--text-muted)] hidden md:block whitespace-nowrap">{formatDate(row.soldAt)}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                <MoreVertical size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(row)}>
                <Pencil size={13} className="mr-2" /> {t('common.edit')}
              </DropdownMenuItem>
              {!row.isReturned && (
                <DropdownMenuItem onClick={() => { setReturnItem(row); setReturnForm({ returnReason: '', refundAmount: '' }); }} className="text-orange-600">
                  <RotateCcw size={13} className="mr-2" /> {t('sold.markAsReturned')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDeleteId(row._id)} className="text-red-600">
                <Trash2 size={13} className="mr-2" /> {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            placeholder={t('sold.placeholder.search')}
            value={search}
            onChange={(e) => setParam('q', e.target.value || null)}
            className="pl-8 w-44"
          />
        </div>

        <SelectSheet
          value={platform}
          onValueChange={(v) => setParam('platform', v || null)}
          placeholder={t('sold.placeholder.platform')}
          options={(filterOptions.platforms?.length ? filterOptions.platforms : PLATFORMS).map((p) => ({ value: p, label: translatePlatform(p) }))}
          className="w-36 h-9"
          label={t('sold.platform')}
        />

        <SelectSheet
          value={paymentMethod}
          onValueChange={(v) => setParam('paymentMethod', v || null)}
          placeholder={t('sold.placeholder.payment')}
          options={(filterOptions.paymentMethods?.length ? filterOptions.paymentMethods : PAYMENT_METHODS).map((m) => ({ value: m, label: translatePaymentMethod(m) }))}
          className="w-36 h-9"
          label={t('sold.paymentMethod')}
        />

        {/* Date range picker */}
        <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-9 gap-1.5 ${(dateFrom || dateTo) ? 'border-[var(--accent)] text-[var(--accent)]' : ''}`}
            >
              <CalendarIcon size={13} />
              <span className="text-xs">{dateLabel}</span>
              {(dateFrom || dateTo) && (
                <span
                  className="ml-1 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDateRange({ from: undefined, to: undefined });
                    setMultiParam({ dateFrom: '', dateTo: '' });
                  }}
                >
                  <X size={11} />
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex">
              <div className="flex flex-col gap-1 p-3 border-r border-[var(--border)] min-w-[130px]">
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">{t('sold.form.quickSelect')}</p>
                {DATE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => applyPreset(preset.value)}
                    className="text-left text-xs px-2 py-1.5 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setDateRange({ from: undefined, to: undefined });
                    setMultiParam({ dateFrom: '', dateTo: '' });
                    setDatePopoverOpen(false);
                  }}
                  className="text-left text-xs px-2 py-1.5 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors mt-1"
                >
                  {t('common.clear')}
                </button>
              </div>
              <div>
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={applyDateRange}
                  locale={tr}
                  numberOfMonths={1}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort */}
        <SelectSheet
          value={sort || '-soldAt'}
          onValueChange={(v) => setParam('sort', (v && v !== '-soldAt') ? v : null)}
          placeholder={t('sort.label')}
          options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          className="w-40 h-9"
          label={t('sort.label')}
        />

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-[var(--text-muted)]">
            <X size={13} className="mr-1" /> {t('common.clear')} ({activeFilterCount})
          </Button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {total > 0 && (
            <span className="text-sm text-[var(--text-muted)]">
              {total} {t('sold.recordCountSuffix')}
            </span>
          )}
          <Button size="sm" onClick={() => setParam('modal', 'add', false)}>
            <Plus size={16} /> {t('sold.addSale')}
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={sales}
        loading={loading}
        emptyText={t('sold.noSales')}
      />

      <Pagination page={page} total={total} limit={LIMIT} onChange={(p) => setParam('page', p > 1 ? p : null)} />

      <ResponsiveModal open={formOpen} onOpenChange={(o) => { if (!o) closeForm(); }}>
        <ResponsiveModalContent className="max-w-lg">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>{editSale ? t('sold.editSale') : t('sold.addSale')}</ResponsiveModalTitle>
          </ResponsiveModalHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>{t('sold.form.jersey')} <span className="text-red-500">*</span></Label>
                {!editSale && (
                  <button
                    type="button"
                    className="text-xs text-[var(--accent)] hover:underline"
                    onClick={() => {
                      setManualMode((m) => !m);
                      setSelectedJersey(null);
                      setJerseySearch('');
                      setJerseyResults([]);
                      setTeamSelectorData({ country: '', league: '', teamName: '' });
                      setForm((p) => ({ ...p, jerseyId: '', teamName: '', season: '', type: '' }));
                    }}
                  >
                    {manualMode ? t('sold.form.selectFromSystem') : t('sold.form.manualEntry')}
                  </button>
                )}
              </div>
              {editSale ? (
                <div className="space-y-2">
                  <TeamSelector
                    value={teamSelectorData}
                    onChange={(val) => {
                      setTeamSelectorData(val);
                      setForm((p) => ({ ...p, teamName: val.teamName || '' }));
                    }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('form.season')}</Label>
                      <SelectSheet
                        value={form.season}
                        onValueChange={(v) => setForm((p) => ({ ...p, season: v }))}
                        placeholder="—"
                        options={SEASONS.map((s) => ({ value: s, label: s }))}
                        label={t('form.season')}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('jersey.type')}</Label>
                      <SelectSheet
                        value={form.type}
                        onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}
                        placeholder="—"
                        options={JERSEY_TYPES.map((tp) => ({ value: tp, label: translateJerseyType(tp) }))}
                        label={t('jersey.type')}
                      />
                    </div>
                  </div>
                </div>
              ) : manualMode ? (
                <div className="space-y-2">
                  <TeamSelector
                    value={teamSelectorData}
                    onChange={(val) => {
                      setTeamSelectorData(val);
                      setForm((p) => ({ ...p, teamName: val.teamName || '' }));
                    }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('form.season')}</Label>
                      <SelectSheet
                        value={form.season}
                        onValueChange={(v) => setForm((p) => ({ ...p, season: v }))}
                        placeholder="—"
                        options={SEASONS.map((s) => ({ value: s, label: s }))}
                        label={t('form.season')}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('jersey.type')}</Label>
                      <SelectSheet
                        value={form.type}
                        onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}
                        placeholder="—"
                        options={JERSEY_TYPES.map((tp) => ({ value: tp, label: translateJerseyType(tp) }))}
                        label={t('jersey.type')}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder={t('sold.placeholder.jerseySearch')}
                    value={jerseySearch}
                    onChange={(e) => searchJerseys(e.target.value)}
                    onBlur={() => setTimeout(() => setJerseyResults([]), 150)}
                  />
                  {jerseyResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {jerseyResults.map((j) => (
                        <button
                          key={j._id}
                          type="button"
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[var(--bg-secondary)] text-sm rounded-md"
                          onMouseDown={(e) => { e.preventDefault(); selectJersey(j); }}
                        >
                          {j.images?.[0]?.url && (
                            <img src={j.images[0].url} alt="" className="w-8 h-10 object-cover rounded flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-[var(--text-primary)] truncate">{j.teamName}</p>
                            <p className="text-xs text-[var(--text-muted)]">{[j.season, translateJerseyType(j.type)].filter(Boolean).join(' · ')}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!editSale && !manualMode && selectedJersey && (
                <p className="text-xs text-green-600">
                  {t('sold.form.selectedJersey', { name: selectedJersey.teamName, details: [selectedJersey.season, translateJerseyType(selectedJersey.type)].filter(Boolean).join(' · ') })}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('sold.buyer')}</Label>
                <Combobox
                  options={filterOptions.buyerNames || []}
                  value={form.buyerName}
                  onChange={(v) => setForm((p) => ({ ...p, buyerName: v }))}
                  placeholder={t('sold.placeholder.buyerName')}
                  allowCustom
                  clearable
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('sold.form.username')}</Label>
                <Combobox
                  options={filterOptions.buyerUsernames || []}
                  value={form.buyerUsername}
                  onChange={(v) => setForm((p) => ({ ...p, buyerUsername: v }))}
                  placeholder={t('sold.placeholder.buyerUsername')}
                  allowCustom
                  clearable
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t('sold.form.buyerPhone')}</Label>
              <PhoneInput
                value={form.buyerPhone}
                onChange={(v) => setForm((p) => ({ ...p, buyerPhone: v }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('sold.platform')}</Label>
                <SelectSheet
                  value={form.platform}
                  onValueChange={(v) => setForm((p) => ({ ...p, platform: v }))}
                  placeholder={t('sold.placeholder.select')}
                  options={PLATFORMS.map((p) => ({ value: p, label: translatePlatform(p) }))}
                  clearable
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('sold.size')}</Label>
                <SelectSheet
                  value={form.soldSize}
                  onValueChange={(v) => setForm((p) => ({ ...p, soldSize: v }))}
                  placeholder={t('sold.placeholder.select')}
                  options={JERSEY_SIZES.map((s) => ({ value: s, label: translateJerseySize(s) }))}
                  clearable
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>{t('jersey.brand')}</Label>
                <SelectSheet
                  value={form.brand}
                  onValueChange={(v) => setForm((p) => ({ ...p, brand: v }))}
                  placeholder="—"
                  options={allBrands.map((b) => ({ value: b, label: b }))}
                  clearable
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('sold.col.buyPrice')}</Label>
                <Input type="number" value={form.buyPrice} onChange={(e) => setForm((p) => ({ ...p, buyPrice: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>{t('sold.col.sellPrice')} <span className="text-red-500">*</span></Label>
                <Input type="number" value={form.salePrice} onChange={(e) => setForm((p) => ({ ...p, salePrice: e.target.value }))} placeholder="0" />
              </div>
            </div>

            {form.buyPrice && form.salePrice && (
              <p className={`text-xs font-medium ${Number(form.salePrice) - Number(form.buyPrice) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {t('sold.form.profit', { amount: formatCurrency(Number(form.salePrice) - Number(form.buyPrice)) })}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('sold.paymentMethod')}</Label>
                <SelectSheet
                  value={form.paymentMethod}
                  onValueChange={(v) => setForm((p) => ({ ...p, paymentMethod: v }))}
                  placeholder={t('sold.placeholder.select')}
                  options={PAYMENT_METHODS.map((m) => ({ value: m, label: translatePaymentMethod(m) }))}
                  clearable
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('sold.saleDate')}</Label>
                <DatePicker
                  value={form.soldAt}
                  onChange={(date) => setForm((p) => ({ ...p, soldAt: date ? format(date, 'yyyy-MM-dd') : '' }))}
                  placeholder={t('sold.saleDate')}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t('common.notes')}</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder={t('form.additionalNotes')}
                rows={2}
              />
            </div>

            <ResponsiveModalFooter>
              <Button type="button" variant="outline" onClick={closeForm}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={saving}>{saving ? t('common.saving') : t('common.save')}</Button>
            </ResponsiveModalFooter>
          </form>
        </ResponsiveModalContent>
      </ResponsiveModal>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('sold.deleteSale')}</AlertDialogTitle>
            <AlertDialogDescription>{t('sold.deleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <JerseyDetailDialog
        jersey={detailItem}
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        mode="admin"
      />

      {/* Return dialog */}
      <ResponsiveModal open={!!returnItem} onOpenChange={(o) => { if (!o) setReturnItem(null); }}>
        <ResponsiveModalContent className="max-w-sm">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>{t('sold.markAsReturned')}</ResponsiveModalTitle>
          </ResponsiveModalHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-[var(--text-secondary)]">
              {returnItem && (returnItem.jerseyId?.teamName || returnItem.teamName || '—')}
            </p>
            <div className="space-y-1.5">
              <Label>{t('sold.returnReason')}</Label>
              <SelectSheet
                value={returnForm.returnReason}
                onValueChange={(v) => setReturnForm((p) => ({ ...p, returnReason: v }))}
                placeholder={t('common.select')}
                options={[
                  { value: 'Kusurlu', label: t('sold.returnReasons.defective') },
                  { value: 'Müşteri İsteği', label: t('sold.returnReasons.customerRequest') },
                  { value: 'Yanlış Ürün', label: t('sold.returnReasons.wrongItem') },
                  { value: 'Diğer', label: t('sold.returnReasons.other') },
                ]}
                label={t('sold.returnReason')}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('sold.refundAmount')}</Label>
              <Input
                type="number"
                value={returnForm.refundAmount}
                onChange={(e) => setReturnForm((p) => ({ ...p, refundAmount: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>
          <ResponsiveModalFooter>
            <Button variant="outline" onClick={() => setReturnItem(null)}>{t('common.cancel')}</Button>
            <Button onClick={handleReturn} disabled={returning} className="bg-orange-600 hover:bg-orange-700">
              {returning ? t('common.saving') : t('sold.markAsReturned')}
            </Button>
          </ResponsiveModalFooter>
        </ResponsiveModalContent>
      </ResponsiveModal>
    </div>
  );
}
