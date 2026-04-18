import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ViewToggle } from '@/components/common/ViewToggle/ViewToggle';
import { JerseyTable } from './JerseyTable';
import { JerseyGrid } from './JerseyGrid';
import { JerseyFilters } from './JerseyFilters';
import { JerseyFormDialog } from './JerseyFormDialog';
import { SaleDialog } from './SaleDialog';
import { BulkActionsBar } from './BulkActionsBar';
import { Pagination } from '@/components/common/DataTable/Pagination';
import { JerseyDetailDialog } from '@/components/common/JerseyDetail/JerseyDetailDialog';
import { FeaturedSection } from './FeaturedSection';
import { jerseyService } from '@/services/api';

// Filter URL param keys
const FILTER_KEYS = ['search', 'type', 'quality', 'size', 'condition', 'brand', 'league', 'season', 'featured', 'primaryColor', 'minPrice', 'maxPrice'];

function urlParamsToApiFilters(params) {
  const out = {};
  for (const k of FILTER_KEYS) {
    const v = params.get(k);
    if (v) out[k] = v;
  }
  return out;
}

function urlParamsToInitialValues(params) {
  return Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || '']));
}

export default function ForSalePage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Derived from URL
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const view = searchParams.get('view') || 'list';
  const modal = searchParams.get('modal') || '';
  const modalId = searchParams.get('id') || '';
  const detailId = searchParams.get('detail') || '';

  // Data state
  const [jerseys, setJerseys] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);

  // Modal data state (fetched as needed)
  const [editJersey, setEditJersey] = useState(null);
  const [saleJersey, setSaleJersey] = useState(null);
  const [detailJersey, setDetailJersey] = useState(null);

  const LIMIT = 50;

  function setParam(key, value, replace = true) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, String(value));
      else next.delete(key);
      return next;
    }, { replace });
  }

  function setParams(updates, replace = true) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(updates)) {
        if (v) next.set(k, String(v));
        else next.delete(k);
      }
      return next;
    }, { replace });
  }

  function clearModal() {
    setParams({ modal: null, id: null });
  }

  // Load key — changes only when page or filter params change (not modal/detail)
  const loadKey = [page, ...FILTER_KEYS.map((k) => searchParams.get(k) || '')].join('|');

  const loadJerseys = useCallback(() => {
    const apiFilters = urlParamsToApiFilters(searchParams);
    const currentPage = Math.max(1, Number(searchParams.get('page') || 1));
    setLoading(true);
    jerseyService.getAll({ status: 'for_sale', ...apiFilters, page: currentPage, limit: LIMIT })
      .then((res) => {
        setJerseys(res.data.data);
        setTotal(res.data.total);
      })
      .catch(() => toast.error(t('forSale.loadError')))
      .finally(() => setLoading(false));
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadJerseys(); }, [loadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle modal URL params — fetch jersey data as needed
  useEffect(() => {
    if (modal === 'edit' && modalId) {
      jerseyService.getOne(modalId)
        .then((res) => setEditJersey(res.data.data))
        .catch(() => { toast.error(t('forSale.loadJerseyError')); clearModal(); });
    } else if (modal === 'add') {
      setEditJersey(null);
    } else {
      setEditJersey(null);
    }

    if (modal === 'sale' && modalId) {
      jerseyService.getOne(modalId)
        .then((res) => setSaleJersey(res.data.data))
        .catch(() => { toast.error(t('forSale.loadJerseyError')); clearModal(); });
    } else {
      setSaleJersey(null);
    }
  }, [modal, modalId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle detail URL param
  useEffect(() => {
    if (detailId) {
      jerseyService.getOne(detailId)
        .then((res) => setDetailJersey(res.data.data))
        .catch(() => setParam('detail', null));
    } else {
      setDetailJersey(null);
    }
  }, [detailId]); // eslint-disable-line react-hooks/exhaustive-deps

  function openAdd() { setParams({ modal: 'add', id: null }, false); }
  function openEdit(jersey) { setParams({ modal: 'edit', id: jersey._id }, false); }
  function openSale(jersey) { setParams({ modal: 'sale', id: jersey._id }, false); }
  function openDetail(jersey) { setParams({ detail: jersey._id }, false); }

  async function handleDelete(id) {
    try {
      await jerseyService.delete(id);
      toast.success(t('forSale.deleteSuccess'));
      loadJerseys();
    } catch { toast.error(t('forSale.deleteError')); }
  }

  async function handleDuplicate(id) {
    try {
      await jerseyService.duplicate(id);
      toast.success(t('forSale.duplicateSuccess'));
      loadJerseys();
    } catch { toast.error(t('forSale.duplicateError')); }
  }

  async function handleToggleFeatured(id, currentFeatured) {
    try {
      await jerseyService.toggleFeatured(id);
      toast.success(currentFeatured ? t('forSale.unfeaturedSuccess') : t('forSale.featuredSuccess'));
      loadJerseys();
    } catch { toast.error(t('forSale.updateError')); }
  }

  function handleFormSuccess() { clearModal(); loadJerseys(); }
  function handleSaleSuccess() { clearModal(); loadJerseys(); }

  function handleFilterChange(newFilters) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('page');
      // Clear all filter keys first
      for (const k of FILTER_KEYS) next.delete(k);
      // Set new ones
      for (const [k, v] of Object.entries(newFilters)) {
        if (v) next.set(k, String(v));
      }
      return next;
    }, { replace: true });
    setSelected([]);
  }

  function handlePageChange(p) {
    setParam('page', p > 1 ? p : null);
  }

  async function handleBulkDelete() {
    try {
      await jerseyService.bulkDelete(selected);
      toast.success(t('forSale.bulkDeleteSuccess', { count: selected.length }));
      setSelected([]);
      loadJerseys();
    } catch { toast.error(t('forSale.bulkDeleteError')); }
  }

  async function handleBulkPrice(price) {
    try {
      await jerseyService.bulkUpdatePrice(selected, price);
      toast.success(t('forSale.bulkPriceSuccess'));
      setSelected([]);
      loadJerseys();
    } catch { toast.error(t('forSale.bulkPriceError')); }
  }

  async function handleBulkStatus(status) {
    try {
      await jerseyService.bulkUpdateStatus(selected, status);
      toast.success(t('forSale.bulkStatusSuccess'));
      setSelected([]);
      loadJerseys();
    } catch { toast.error(t('forSale.bulkStatusError')); }
  }

  const actions = {
    onEdit: openEdit,
    onSale: openSale,
    onDelete: handleDelete,
    onDuplicate: handleDuplicate,
    onDetail: openDetail,
    onToggleFeatured: handleToggleFeatured,
  };

  const showFeaturedSeparately = !searchParams.get('featured') && jerseys.some((j) => j.featured);
  const featuredJerseys = showFeaturedSeparately ? jerseys.filter((j) => j.featured) : [];
  const regularJerseys = showFeaturedSeparately ? jerseys.filter((j) => !j.featured) : jerseys;

  const formOpen = modal === 'add' || (modal === 'edit' && !!editJersey);
  const saleOpen = modal === 'sale' && !!saleJersey;
  const detailOpen = !!detailId && !!detailJersey;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <JerseyFilters
          onFilterChange={handleFilterChange}
          initialValues={urlParamsToInitialValues(searchParams)}
        />
        <div className="flex items-center gap-2 ml-auto">
          {total > 0 && (
            <span className="text-sm text-[var(--text-muted)]">{total} {t('jersey.countSuffix')}</span>
          )}
          <ViewToggle view={view} onChange={(v) => setParam('view', v === 'list' ? null : v)} />
          <Button onClick={openAdd} size="sm">
            <Plus size={16} /> {t('jersey.addForm')}
          </Button>
        </div>
      </div>

      {selected.length > 0 && (
        <BulkActionsBar
          count={selected.length}
          onDelete={handleBulkDelete}
          onPriceUpdate={handleBulkPrice}
          onStatusUpdate={handleBulkStatus}
          onClear={() => setSelected([])}
        />
      )}

      <FeaturedSection jerseys={featuredJerseys} actions={actions} />

      {view === 'list' ? (
        <JerseyTable
          jerseys={regularJerseys}
          loading={loading}
          selected={selected}
          onSelectionChange={setSelected}
          actions={actions}
          onUpdate={(updated) => {
            setJerseys((prev) => prev.map((j) => j._id === updated._id ? updated : j));
          }}
        />
      ) : (
        <JerseyGrid jerseys={regularJerseys} loading={loading} actions={actions} />
      )}

      <Pagination page={page} total={total} limit={LIMIT} onChange={handlePageChange} />

      <JerseyFormDialog
        open={formOpen}
        jersey={editJersey}
        onSuccess={handleFormSuccess}
        onClose={clearModal}
      />
      <SaleDialog
        open={saleOpen}
        jersey={saleJersey}
        onSuccess={handleSaleSuccess}
        onClose={clearModal}
      />
      <JerseyDetailDialog
        open={detailOpen}
        jersey={detailJersey}
        onClose={() => setParam('detail', null)}
        mode="admin"
      />
    </div>
  );
}
