import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, ExternalLink, MessageCircle, X, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ResponsiveModal, ResponsiveModalContent, ResponsiveModalHeader, ResponsiveModalTitle, ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { FormField } from '@/components/forms/JerseyForm/FormField';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip, TooltipProvider, TooltipTrigger, TooltipContent,
} from '@/components/ui/tooltip';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Combobox } from '@/components/ui/combobox';
import { sellerService } from '@/services/api';
import { getWhatsAppUrl, formatDate } from '@/lib/utils';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';

const EMPTY_FORM = {
  name: '',
  username: '',
  phone: '',
  notes: '',
  platforms: [],
};

const EMPTY_PLATFORM = { name: '', profileUrl: '', username: '' };

export default function SellersPage() {
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const [sellers, setSellers] = useState([]);
  const [statsMap, setStatsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editSeller, setEditSeller] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sellerService.getAll();
      setSellers(res.data.data || res.data);
      sellerService.getStats()
        .then((r) => setStatsMap(r.data.data || {}))
        .catch(() => {});
    } catch {
      toast.error(t('sellers.toast.loadError'));
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditSeller(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(seller) {
    setEditSeller(seller);
    setForm({
      name: seller.name || '',
      username: seller.username || '',
      phone: seller.phone || '',
      notes: seller.notes || '',
      platforms: seller.platforms ? seller.platforms.map((p) => ({ ...p })) : [],
    });
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await sellerService.delete(deleteId);
      toast.success(t('sellers.toast.deleteSuccess'));
      load();
    } catch {
      toast.error(t('sellers.toast.deleteError'));
    } finally {
      setDeleteId(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t('sellers.toast.nameRequired'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        platforms: form.platforms.filter((p) => p.name.trim()),
      };
      if (editSeller) {
        await sellerService.update(editSeller._id, payload);
        toast.success(t('sellers.toast.updateSuccess'));
      } else {
        await sellerService.create(payload);
        toast.success(t('sellers.toast.createSuccess'));
      }
      setFormOpen(false);
      load();
    } catch {
      toast.error(t('sellers.toast.saveError'));
    } finally {
      setSaving(false);
    }
  }

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addPlatform() {
    setForm((prev) => ({ ...prev, platforms: [...prev.platforms, { ...EMPTY_PLATFORM }] }));
  }

  function removePlatform(idx) {
    setForm((prev) => ({ ...prev, platforms: prev.platforms.filter((_, i) => i !== idx) }));
  }

  function setPlatformField(idx, field, value) {
    setForm((prev) => {
      const platforms = prev.platforms.map((p, i) => i === idx ? { ...p, [field]: value } : p);
      return { ...prev, platforms };
    });
  }

  const columns = [
    {
      key: 'name',
      label: t('sellers.col.name'),
      sortable: true,
      render: (v) => <span className="font-medium text-[var(--text-primary)]">{v}</span>,
    },
    {
      key: 'username',
      label: t('sellers.col.username'),
      render: (v) => v ? <span className="text-[var(--text-muted)]">@{v}</span> : '—',
    },
    {
      key: 'phone',
      label: t('sellers.col.phone'),
      render: (v) => v || '—',
    },
    {
      key: 'platforms',
      label: t('sellers.col.platform'),
      render: (v) => {
        if (!v || v.length === 0) return '—';
        return (
          <div className="flex flex-wrap gap-1">
            {v.map((p, i) => (
              <span key={i}>
                {p.profileUrl ? (
                  <a
                    href={p.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-xs text-[var(--accent)] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {p.name}
                    <ExternalLink size={10} />
                  </a>
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">{p.name}</span>
                )}
                {i < v.length - 1 && <span className="text-[var(--border)] mx-1">·</span>}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'notes',
      label: t('sellers.col.notes'),
      className: 'hidden lg:table-cell max-w-[160px]',
      render: (v) => {
        if (!v) return '—';
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-[var(--text-muted)] truncate block max-w-[160px] cursor-default">
                  {v}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs whitespace-normal">{v}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      key: '_id',
      label: t('sellers.col.purchases'),
      className: 'hidden md:table-cell text-right',
      render: (id) => {
        const s = statsMap[id];
        if (!s) return '—';
        return (
          <div className="text-right">
            <p className="font-medium text-[var(--text-primary)]">{s.purchaseCount}</p>
            <p className="text-xs text-[var(--text-muted)]">{formatCurrency(s.totalSpent || 0)}</p>
          </div>
        );
      },
    },
    {
      key: '__lastPurchase',
      label: t('sellers.col.lastPurchase'),
      className: 'hidden lg:table-cell',
      render: (_, row) => {
        const s = statsMap[row._id];
        return s?.lastPurchaseDate ? formatDate(s.lastPurchaseDate) : '—';
      },
    },
    {
      key: '__actions',
      label: '',
      className: 'w-10',
      render: (_, row) => {
        const waUrl = row.phone ? getWhatsAppUrl(row.phone) : null;
        return (
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
              {waUrl && (
                <DropdownMenuItem asChild>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-green-600 cursor-pointer"
                  >
                    <MessageCircle size={13} className="mr-2" /> {t('sellers.whatsApp')}
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDeleteId(row._id)} className="text-red-600">
                <Trash2 size={13} className="mr-2" /> {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={openAdd} size="sm">
          <Plus size={16} /> {t('sellers.addSeller')}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={sellers}
        loading={loading}
        emptyText={t('sellers.noSellers')}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('sellers.deleteSeller')}</AlertDialogTitle>
            <AlertDialogDescription>{t('sellers.deleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ResponsiveModal open={formOpen} onOpenChange={setFormOpen}>
        <ResponsiveModalContent className="max-w-lg">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>{editSeller ? t('sellers.editSeller') : t('sellers.addSeller')}</ResponsiveModalTitle>
          </ResponsiveModalHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <FormField label={t('sellers.form.name')} required>
              <Combobox
                options={sellers.map((s) => ({ value: s.name, label: s.name }))}
                value={form.name}
                onChange={(v) => setField('name', v || '')}
                placeholder={t('sellers.form.namePlaceholder')}
                allowCustom
                clearable
              />
            </FormField>

            <FormField label={t('sellers.col.username')}>
              <Combobox
                options={sellers.filter((s) => s.username).map((s) => ({ value: s.username, label: s.username }))}
                value={form.username}
                onChange={(v) => setField('username', v || '')}
                placeholder={t('sellers.form.usernamePlaceholder')}
                allowCustom
                clearable
              />
            </FormField>

            <FormField label={t('sellers.col.phone')}>
              <PhoneInput
                value={form.phone}
                onChange={(v) => setField('phone', v)}
              />
            </FormField>

            <FormField label={t('sellers.col.notes')}>
              <Textarea
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                placeholder={t('sellers.form.notesPlaceholder')}
                rows={2}
              />
            </FormField>

            {/* Platforms */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--text-primary)]">{t('sellers.form.platforms')}</span>
                <Button type="button" variant="outline" size="sm" onClick={addPlatform}>
                  <Plus size={14} /> {t('sellers.form.addPlatform')}
                </Button>
              </div>
              {form.platforms.length === 0 && (
                <p className="text-xs text-[var(--text-muted)] py-2">{t('sellers.form.noPlatforms')}</p>
              )}
              {form.platforms.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]"
                >
                  <div className="grid grid-cols-3 gap-2 flex-1">
                    <Input
                      value={p.name}
                      onChange={(e) => setPlatformField(idx, 'name', e.target.value)}
                      placeholder={t('sellers.form.platformNamePlaceholder')}
                    />
                    <Input
                      value={p.username}
                      onChange={(e) => setPlatformField(idx, 'username', e.target.value)}
                      placeholder={t('sellers.form.platformUsernamePlaceholder')}
                    />
                    <Input
                      value={p.profileUrl}
                      onChange={(e) => setPlatformField(idx, 'profileUrl', e.target.value)}
                      placeholder={t('sellers.form.platformUrlPlaceholder')}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-red-500 mt-0.5"
                    onClick={() => removePlatform(idx)}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
            </div>

            <ResponsiveModalFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t('common.saving') : editSeller ? t('common.save') : t('common.add')}
              </Button>
            </ResponsiveModalFooter>
          </form>
        </ResponsiveModalContent>
      </ResponsiveModal>
    </div>
  );
}
