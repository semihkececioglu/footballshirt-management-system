import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Trash2, ExternalLink, MoreVertical, ShoppingCart, XCircle, Pencil, Upload, X as XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { PriorityBadge } from '@/components/common/StatusBadge/StatusBadge';
import { FormField } from '@/components/forms/JerseyForm/FormField';
import { Combobox } from '@/components/ui/combobox';
import { Separator } from '@/components/ui/separator';
import { TeamSelector } from '@/components/common/TeamSelector/TeamSelector';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { wishlistService, purchaseService } from '@/services/api';
import { PurchaseForm, EMPTY_PURCHASE_FORM } from '@/pages/Purchased/PurchaseForm';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { useTranslateConstant } from '@/hooks/useTranslateConstant';
import { JERSEY_TYPES, SEASONS } from '@/lib/constants';

const STATUS_STYLE = {
  active: 'text-green-700 bg-green-50 border border-green-200',
  purchased: 'text-blue-700 bg-blue-50 border border-blue-200',
  cancelled: 'text-gray-500 bg-gray-100 border border-gray-200',
};

const EMPTY_FORM = {
  country: '', league: '', teamName: '',
  brand: '',
  season: '',
  type: '',
  targetPrice: '',
  listingUrl: '',
  priority: 'medium',
  status: 'active',
  image: '',
  notes: '',
};

export default function WishlistPage() {
  const { t } = useTranslation();
  const translateJerseyType = useTranslateConstant('jerseyType');
  const formatCurrency = useFormatCurrency();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') ?? 'active';
  const modal = searchParams.get('modal') || '';
  const modalId = searchParams.get('id') || '';

  const STATUS_TABS = [
    { key: 'active', label: t('wishlist.tab.active') },
    { key: 'purchased', label: t('wishlist.tab.purchased') },
    { key: 'cancelled', label: t('wishlist.tab.cancelled') },
    { key: 'all', label: t('common.all') },
  ];

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [purchaseItem, setPurchaseItem] = useState(null);
  const [purchaseSaving, setPurchaseSaving] = useState(false);
  // Image upload for wishlist form
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const imageFileRef = useRef(null);
  // Brands for combobox
  const [brands, setBrands] = useState([]);
  useEffect(() => { fetch('/data/brands.json').then((r) => r.json()).then(setBrands).catch(() => {}); }, []);

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

  function clearModal() { setParams({ modal: null, id: null }); resetImageState(); }

  const formOpen = modal === 'add' || (modal === 'edit' && !!editItem);

  const load = useCallback(async (status) => {
    setLoading(true);
    try {
      const params = (status && status !== 'all') ? { status } : {};
      const res = await wishlistService.getAll(params);
      setItems(res.data.data || res.data);
    } catch {
      toast.error(t('wishlist.toast.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(activeTab); }, [activeTab, load]);

  function buildForm(src) {
    return {
      country: src.country || '',
      league: src.league || '',
      teamName: src.teamName || '',
      brand: src.brand || '',
      season: src.season || '',
      type: src.type || '',
      targetPrice: src.targetPrice != null ? String(src.targetPrice) : '',
      listingUrl: src.listingUrl || '',
      priority: src.priority || 'medium',
      status: src.status || 'active',
      image: src.image || '',
      notes: src.notes || '',
    };
  }

  function resetImageState() {
    setImageFile(null);
    setImagePreview('');
  }

  // Handle modal=edit — find item in list
  useEffect(() => {
    if (modal === 'edit' && modalId) {
      const found = items.find((i) => i._id === modalId);
      if (found) {
        setEditItem(found);
        setForm(buildForm(found));
        resetImageState();
      } else {
        clearModal();
      }
    } else if (modal === 'add') {
      setEditItem(null);
      setForm(EMPTY_FORM);
      resetImageState();
    }
  }, [modal, modalId, items]); // eslint-disable-line react-hooks/exhaustive-deps

  function openAdd() {
    setParam('modal', 'add', false);
  }

  function openEdit(item) {
    setParams({ modal: 'edit', id: item._id }, false);
    setEditItem(item);
    setForm(buildForm(item));
    resetImageState();
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

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await wishlistService.delete(deleteId);
      toast.success(t('wishlist.toast.deleteSuccess'));
      load(activeTab);
    } catch {
      toast.error(t('wishlist.toast.deleteError'));
    } finally {
      setDeleteId(null);
    }
  }

  function openPurchaseDialog(item) {
    setPurchaseItem(item);
  }

  async function handlePurchaseFromWishlist(payload) {
    if (!purchaseItem) return;
    setPurchaseSaving(true);
    try {
      await purchaseService.create(payload);
      await wishlistService.update(purchaseItem._id, { status: 'purchased' });
      toast.success(t('wishlist.toast.purchaseSuccess'));
      setPurchaseItem(null);
      load(activeTab);
    } catch {
      toast.error(t('wishlist.toast.purchaseError'));
    } finally {
      setPurchaseSaving(false);
    }
  }

  async function handleCancelItem(id) {
    try {
      await wishlistService.update(id, { status: 'cancelled' });
      toast.success(t('wishlist.toast.cancelSuccess'));
      load(activeTab);
    } catch {
      toast.error(t('wishlist.toast.cancelError'));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.teamName.trim()) {
      toast.error(t('wishlist.toast.teamRequired'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        targetPrice: form.targetPrice !== '' ? Number(form.targetPrice) : undefined,
      };
      if (editItem) {
        await wishlistService.update(editItem._id, payload, imageFile || undefined);
        toast.success(t('wishlist.toast.updateSuccess'));
      } else {
        await wishlistService.create(payload, imageFile || undefined);
        toast.success(t('wishlist.toast.addSuccess'));
      }
      clearModal();
      resetImageState();
      load(activeTab);
    } catch {
      toast.error(t('wishlist.toast.saveError'));
    } finally {
      setSaving(false);
    }
  }

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const columns = [
    {
      key: 'image',
      label: '',
      className: 'w-14',
      render: (v, row) =>
        v ? (
          <img src={v} alt={row.teamName} className="w-10 h-12 object-cover rounded" loading="lazy" />
        ) : (
          <div className="w-10 h-12 rounded bg-[var(--bg-secondary)]" />
        ),
    },
    {
      key: 'teamName',
      label: t('wishlist.col.team'),
      sortable: true,
      render: (v) => <span className="font-medium text-[var(--text-primary)]">{v}</span>,
    },
    { key: 'season', label: t('wishlist.col.season'), render: (v) => v || '—' },
    { key: 'type', label: t('wishlist.col.type'), render: (v) => v ? translateJerseyType(v) : '—' },
    { key: 'brand', label: t('jersey.brand'), className: 'hidden md:table-cell', render: (v) => v || '—' },
    {
      key: 'targetPrice',
      label: t('wishlist.col.targetPrice'),
      sortable: true,
      render: (v) =>
        v != null ? (
          <span className="text-[var(--accent)] font-medium">{formatCurrency(v)}</span>
        ) : (
          '—'
        ),
    },
    {
      key: 'listingUrl',
      label: t('wishlist.col.listing'),
      render: (v) =>
        v ? (
          <a
            href={v}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={12} /> {t('wishlist.seeListing')}
          </a>
        ) : (
          '—'
        ),
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
              <DropdownMenuItem onClick={() => openPurchaseDialog(row)} className="text-green-700">
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
        <div className="flex items-center gap-1 p-1 bg-[var(--bg-secondary)] rounded-lg">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setParam('tab', tab.key || null)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm font-medium'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button onClick={openAdd} size="sm">
          <Plus size={16} /> {t('wishlist.addItem')}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        emptyText={t('wishlist.noItems')}
      />

      {/* Delete Confirm Dialog */}
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

      {/* Purchase Dialog — full form */}
      <Dialog open={!!purchaseItem} onOpenChange={(o) => { if (!o) setPurchaseItem(null); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('wishlist.buy')}</DialogTitle>
          </DialogHeader>
          {purchaseItem && (
            <PurchaseForm
              initialValues={{
                ...EMPTY_PURCHASE_FORM,
                teamName: purchaseItem.teamName || '',
                season: purchaseItem.season || '',
                type: purchaseItem.type || '',
                buyPrice: purchaseItem.targetPrice != null ? String(purchaseItem.targetPrice) : '',
                notes: purchaseItem.notes || '',
                isForResale: true,
                purchaseDate: new Date().toISOString().slice(0, 10),
              }}
              onSubmit={handlePurchaseFromWishlist}
              onCancel={() => setPurchaseItem(null)}
              saving={purchaseSaving}
              submitLabel={t('wishlist.form.addToPurchased')}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => { if (!o) clearModal(); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? t('wishlist.editItem') : t('wishlist.addItem')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 py-2">

            {/* ─── Takım ─── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('wishlist.form.teamInfo')}</h3>
              <TeamSelector
                value={{ country: form.country, league: form.league, teamName: form.teamName }}
                onChange={({ country, league, teamName }) =>
                  setForm((p) => ({ ...p, country, league, teamName }))}
              />
            </section>

            <Separator />

            {/* ─── Forma Detayları ─── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('wishlist.form.jerseyDetails')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <FormField label={t('wishlist.form.season')}>
                  <Select value={form.season || '__none__'} onValueChange={(v) => setField('season', v === '__none__' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder={t('wishlist.form.selectPlaceholder')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">—</SelectItem>
                      {SEASONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label={t('wishlist.form.type')}>
                  <Select value={form.type || '__none__'} onValueChange={(v) => setField('type', v === '__none__' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder={t('wishlist.form.selectPlaceholder')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">—</SelectItem>
                      {JERSEY_TYPES.map((item) => <SelectItem key={item} value={item}>{translateJerseyType(item)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label={t('wishlist.form.brand')}>
                  <Combobox
                    options={brands}
                    value={form.brand}
                    onChange={(v) => setField('brand', v)}
                    placeholder={t('wishlist.form.brandPlaceholder')}
                    allowCustom
                    clearable
                  />
                </FormField>
              </div>
            </section>

            <Separator />

            {/* ─── Satın Alma Hedefi ─── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('wishlist.form.purchaseTarget')}</h3>
              <div className="grid grid-cols-2 gap-3">
                <FormField label={t('wishlist.form.targetPrice')}>
                  <Input type="number" min="0" value={form.targetPrice}
                    onChange={(e) => setField('targetPrice', e.target.value)} placeholder={t('wishlist.form.pricePlaceholder')} />
                </FormField>
                <FormField label={t('wishlist.form.priority')}>
                  <Select value={form.priority} onValueChange={(v) => setField('priority', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('priority.low')}</SelectItem>
                      <SelectItem value="medium">{t('priority.medium')}</SelectItem>
                      <SelectItem value="high">{t('priority.high')}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label={t('wishlist.form.status')}>
                  <Select value={form.status} onValueChange={(v) => setField('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t('wishlist.status.active')}</SelectItem>
                      <SelectItem value="purchased">{t('wishlist.status.purchased')}</SelectItem>
                      <SelectItem value="cancelled">{t('wishlist.status.cancelled')}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label={t('wishlist.form.listingUrl')}>
                  <Input value={form.listingUrl} onChange={(e) => setField('listingUrl', e.target.value)} placeholder={t('wishlist.form.urlPlaceholder')} />
                </FormField>
              </div>
            </section>

            <Separator />

            {/* ─── Görsel ─── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('wishlist.form.image')}</h3>
              <div className="flex gap-3 items-start flex-wrap">
                {/* Preview */}
                {(imagePreview || form.image) && (
                  <div className="relative group w-20 h-24 rounded overflow-hidden border border-[var(--border)]">
                    <img src={imagePreview || form.image} alt="" className="w-full h-full object-cover" />
                    <button type="button"
                      onClick={() => { setImageFile(null); setImagePreview(''); setField('image', ''); }}
                      className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <XIcon size={12} className="text-white" />
                    </button>
                  </div>
                )}
                {!imagePreview && !form.image && (
                  <button type="button" onClick={() => imageFileRef.current?.click()}
                    className="w-20 h-24 rounded border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-1 text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
                    <Upload size={18} />
                    <span className="text-[10px]">{t('wishlist.form.upload')}</span>
                  </button>
                )}
                <input ref={imageFileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />
                <div className="flex-1 min-w-40">
                  <FormField label={t('wishlist.form.orEnterUrl')}>
                    <Input value={form.image} onChange={(e) => { setField('image', e.target.value); setImagePreview(''); setImageFile(null); }}
                      placeholder={t('wishlist.form.urlPlaceholder')} disabled={!!imagePreview} />
                  </FormField>
                </div>
              </div>
            </section>

            <Separator />

            <FormField label={t('wishlist.form.notes')}>
              <Textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)}
                placeholder={t('wishlist.form.notesPlaceholder')} rows={3} />
            </FormField>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={clearModal}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={saving}>
                {saving ? t('common.saving') : editItem ? t('common.save') : t('common.add')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
