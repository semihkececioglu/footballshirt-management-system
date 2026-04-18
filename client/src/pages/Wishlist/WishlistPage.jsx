import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Trash2, ExternalLink, MoreVertical, ShoppingCart, XCircle, Pencil, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ResponsiveModal, ResponsiveModalContent, ResponsiveModalHeader, ResponsiveModalTitle,
} from '@/components/ui/responsive-modal';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { Pagination } from '@/components/common/DataTable/Pagination';
import { PriorityBadge } from '@/components/common/StatusBadge/StatusBadge';
import { LazyImage } from '@/components/common/LazyImage/LazyImage';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { wishlistService, purchaseService } from '@/services/api';
import { PurchaseForm, EMPTY_PURCHASE_FORM } from '@/pages/Purchased/PurchaseForm';
import { WishlistForm } from './WishlistForm';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { useTranslateConstant } from '@/hooks/useTranslateConstant';

const LIMIT = 20;

const STATUS_STYLE = {
  active: 'text-green-700 bg-green-50 border border-green-200',
  purchased: 'text-blue-700 bg-blue-50 border border-blue-200',
  cancelled: 'text-gray-500 bg-gray-100 border border-gray-200',
};

const EMPTY_FORM = {
  country: '', league: '', teamName: '',
  brand: '', season: '', type: '',
  targetPrice: '', listingUrl: '',
  priority: 'medium', status: 'active',
  image: '', notes: '',
};

export default function WishlistPage() {
  const { t } = useTranslation();
  const translateJerseyType = useTranslateConstant('jerseyType');
  const formatCurrency = useFormatCurrency();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') ?? 'active';
  const modal = searchParams.get('modal') || '';
  const modalId = searchParams.get('id') || '';
  const searchQ = searchParams.get('q') || '';
  const page = Math.max(1, Number(searchParams.get('page') || 1));

  const STATUS_TABS = [
    { key: 'active', label: t('wishlist.tab.active') },
    { key: 'purchased', label: t('wishlist.tab.purchased') },
    { key: 'cancelled', label: t('wishlist.tab.cancelled') },
    { key: 'all', label: t('common.all') },
  ];

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [purchaseItem, setPurchaseItem] = useState(null);
  const [purchaseSaving, setPurchaseSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [brands, setBrands] = useState([]);
  const [selected, setSelected] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  useEffect(() => {
    fetch('/data/brands.json').then((r) => r.json()).then(setBrands).catch(() => {});
  }, []);

  function setParam(key, value, replace = true) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value != null && value !== '') next.set(key, String(value));
      else next.delete(key);
      return next;
    }, { replace });
  }

  function setParams(updates, replace = true) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(updates)) {
        if (v != null && v !== '') next.set(k, String(v));
        else next.delete(k);
      }
      return next;
    }, { replace });
  }

  function resetImageState() { setImageFile(null); setImagePreview(''); }
  function clearModal() { setParams({ modal: null, id: null }); resetImageState(); }

  const formOpen = modal === 'add' || (modal === 'edit' && !!editItem);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await wishlistService.getAll({
        status: activeTab !== 'all' ? activeTab : undefined,
        q: searchQ || undefined,
        page,
        limit: LIMIT,
      });
      setItems(res.data.data || res.data);
      setTotal(res.data.total || 0);
    } catch {
      toast.error(t('wishlist.toast.loadError'));
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQ, page, t]);

  useEffect(() => { load(); }, [load]);

  // Tab veya arama değişince sayfa ve seçimi sıfırla
  useEffect(() => { setSelected([]); }, [activeTab, searchQ]);

  function buildForm(src) {
    return {
      country: src.country || '', league: src.league || '', teamName: src.teamName || '',
      brand: src.brand || '', season: src.season || '', type: src.type || '',
      targetPrice: src.targetPrice != null ? String(src.targetPrice) : '',
      listingUrl: src.listingUrl || '', priority: src.priority || 'medium',
      status: src.status || 'active', image: src.image || '', notes: src.notes || '',
    };
  }

  useEffect(() => {
    if (modal === 'edit' && modalId) {
      const found = items.find((i) => i._id === modalId);
      if (found) { setEditItem(found); setForm(buildForm(found)); resetImageState(); }
      else clearModal();
    } else if (modal === 'add') {
      setEditItem(null); setForm(EMPTY_FORM); resetImageState();
    }
  }, [modal, modalId, items]); // eslint-disable-line react-hooks/exhaustive-deps

  function openAdd() { setParam('modal', 'add', false); }
  function openEdit(item) {
    setParams({ modal: 'edit', id: item._id }, false);
    setEditItem(item); setForm(buildForm(item)); resetImageState();
  }

  function handleImageFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleImageClear() { setImageFile(null); setImagePreview(''); setForm((p) => ({ ...p, image: '' })); }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await wishlistService.delete(deleteId);
      toast.success(t('wishlist.toast.deleteSuccess'));
      load();
    } catch { toast.error(t('wishlist.toast.deleteError')); }
    finally { setDeleteId(null); }
  }

  async function handleBulkDelete() {
    try {
      await wishlistService.bulkDelete(selected);
      toast.success(t('wishlist.bulkDeleteSuccess'));
      setSelected([]);
      setBulkDeleteOpen(false);
      load();
    } catch { toast.error(t('wishlist.bulkDeleteError')); }
  }

  async function handleBulkCancel() {
    try {
      await wishlistService.bulkCancel(selected);
      toast.success(t('wishlist.bulkCancelSuccess'));
      setSelected([]);
      load();
    } catch { toast.error(t('wishlist.bulkCancelError')); }
  }

  async function handlePurchaseFromWishlist(payload) {
    if (!purchaseItem) return;
    setPurchaseSaving(true);
    try {
      await purchaseService.create(payload);
      await wishlistService.update(purchaseItem._id, { status: 'purchased' });
      toast.success(t('wishlist.toast.purchaseSuccess'));
      setPurchaseItem(null);
      load();
    } catch { toast.error(t('wishlist.toast.purchaseError')); }
    finally { setPurchaseSaving(false); }
  }

  async function handleCancelItem(id) {
    try {
      await wishlistService.update(id, { status: 'cancelled' });
      toast.success(t('wishlist.toast.cancelSuccess'));
      load();
    } catch { toast.error(t('wishlist.toast.cancelError')); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.teamName.trim()) { toast.error(t('wishlist.toast.teamRequired')); return; }
    setSaving(true);
    try {
      const payload = { ...form, targetPrice: form.targetPrice !== '' ? Number(form.targetPrice) : undefined };
      if (editItem) {
        await wishlistService.update(editItem._id, payload, imageFile || undefined);
        toast.success(t('wishlist.toast.updateSuccess'));
      } else {
        await wishlistService.create(payload, imageFile || undefined);
        toast.success(t('wishlist.toast.addSuccess'));
      }
      clearModal(); resetImageState(); load();
    } catch { toast.error(t('wishlist.toast.saveError')); }
    finally { setSaving(false); }
  }

  const columns = [
    {
      key: 'image',
      label: '',
      className: 'w-14',
      render: (v, row) => (
        <LazyImage
          src={v}
          alt={row.teamName}
          className="w-10 h-12 object-cover rounded"
          containerClassName="w-10 h-12 rounded"
        />
      ),
    },
    {
      key: 'teamName',
      label: t('wishlist.col.team'),
      sortable: true,
      render: (v, row) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-[var(--text-primary)]">{v || '—'}</span>
            {row.listingUrl && (
              <a href={row.listingUrl} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[var(--accent)] hover:opacity-70">
                <ExternalLink size={11} />
              </a>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {[row.season, row.type ? translateJerseyType(row.type) : null, row.brand].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'targetPrice',
      label: t('wishlist.col.targetPrice'),
      sortable: true,
      render: (v) => v != null
        ? <span className="text-[var(--accent)] font-medium">{formatCurrency(v)}</span>
        : '—',
    },
    {
      key: 'priority',
      label: t('wishlist.col.priority'),
      render: (v) => <PriorityBadge priority={v} />,
    },
    {
      key: 'status',
      label: t('common.status'),
      render: (v) => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[v] || ''}`}>
          {{ active: t('wishlist.status.active'), purchased: t('wishlist.status.purchased'), cancelled: t('wishlist.status.cancelled') }[v] || v}
        </span>
      ),
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
            <DropdownMenuItem onClick={() => openEdit(row)}>
              <Pencil size={13} className="mr-2" /> {t('common.edit')}
            </DropdownMenuItem>
            {row.status === 'active' && (
              <DropdownMenuItem onClick={() => setPurchaseItem(row)} className="text-green-700">
                <ShoppingCart size={13} className="mr-2" /> {t('wishlist.buy')}
              </DropdownMenuItem>
            )}
            {row.status === 'active' && (
              <DropdownMenuItem onClick={() => handleCancelItem(row._id)} className="text-[var(--text-muted)]">
                <XCircle size={13} className="mr-2" /> {t('wishlist.cancel')}
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
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[var(--bg-secondary)] rounded-lg">
            {STATUS_TABS.map((tab) => (
              <button key={tab.key} onClick={() => setParams({ tab: tab.key || null, page: null, q: null })}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeTab === tab.key
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm font-medium'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              placeholder={t('wishlist.searchPlaceholder')}
              value={searchQ}
              onChange={(e) => setParams({ q: e.target.value || null, page: null })}
              className="pl-8 w-44 h-9"
            />
          </div>
        </div>
        <Button onClick={openAdd} size="sm">
          <Plus size={16} /> {t('wishlist.addItem')}
        </Button>
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div className="flex items-center gap-2 bg-[var(--bg-secondary)] rounded-lg px-3 py-2 text-sm flex-wrap">
          <span className="font-medium text-[var(--text-primary)]">
            {t('wishlist.bulkSelected', { count: selected.length })}
          </span>
          <Button size="sm" variant="ghost" onClick={handleBulkCancel} className="h-7 gap-1 text-[var(--text-muted)]">
            <XCircle size={13} /> {t('wishlist.cancel')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setBulkDeleteOpen(true)} className="h-7 gap-1 text-red-600 hover:text-red-700">
            <Trash2 size={13} /> {t('common.delete')}
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => setSelected([])} className="ml-auto h-7 w-7">
            <X size={13} />
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        emptyText={t('wishlist.noItems')}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
      />

      <Pagination page={page} total={total} limit={LIMIT} onChange={(p) => setParam('page', p > 1 ? p : null)} />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('wishlist.deleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirm */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={(o) => !o && setBulkDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('wishlist.bulkDeleteConfirm', { count: selected.length })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Purchase (Satın Al) dialog */}
      <ResponsiveModal open={!!purchaseItem} onOpenChange={(o) => { if (!o) setPurchaseItem(null); }}>
        <ResponsiveModalContent className="max-w-xl">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>{t('wishlist.buy')}</ResponsiveModalTitle>
          </ResponsiveModalHeader>
          {purchaseItem && (
            <PurchaseForm
              initialValues={{
                ...EMPTY_PURCHASE_FORM,
                country: purchaseItem.country || '',
                league: purchaseItem.league || '',
                teamName: purchaseItem.teamName || '',
                season: purchaseItem.season || '',
                type: purchaseItem.type || '',
                brand: purchaseItem.brand || '',
                buyPrice: purchaseItem.targetPrice != null ? String(purchaseItem.targetPrice) : '',
                notes: purchaseItem.notes || '',
                isForResale: true,
                purchaseDate: new Date().toISOString().slice(0, 10),
                images: purchaseItem.image
                  ? [{ id: purchaseItem.image, preview: purchaseItem.image, url: purchaseItem.image, publicId: '' }]
                  : [],
              }}
              onSubmit={handlePurchaseFromWishlist}
              onCancel={() => setPurchaseItem(null)}
              saving={purchaseSaving}
              submitLabel={t('wishlist.form.addToPurchased')}
            />
          )}
        </ResponsiveModalContent>
      </ResponsiveModal>

      {/* Add / Edit form */}
      <ResponsiveModal open={formOpen} onOpenChange={(o) => { if (!o) clearModal(); }}>
        <ResponsiveModalContent className="max-w-xl">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>{editItem ? t('wishlist.editItem') : t('wishlist.addItem')}</ResponsiveModalTitle>
          </ResponsiveModalHeader>
          <WishlistForm
            form={form}
            setForm={setForm}
            brands={brands}
            imageFile={imageFile}
            imagePreview={imagePreview}
            onImageFileChange={handleImageFileChange}
            onImageClear={handleImageClear}
            onSubmit={handleSubmit}
            onCancel={clearModal}
            saving={saving}
            isEdit={!!editItem}
          />
        </ResponsiveModalContent>
      </ResponsiveModal>
    </div>
  );
}
