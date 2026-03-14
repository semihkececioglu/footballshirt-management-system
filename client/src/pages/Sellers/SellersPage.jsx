import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, ExternalLink, MessageCircle, X, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
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
import { sellerService } from '@/services/api';
import { getWhatsAppUrl } from '@/lib/utils';

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
  const [sellers, setSellers] = useState([]);
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
    } catch {
      toast.error(t('sellers.toast.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

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

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editSeller ? t('sellers.editSeller') : t('sellers.addSeller')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <FormField label={t('sellers.form.name')} required>
              <Input
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder={t('sellers.form.namePlaceholder')}
              />
            </FormField>

            <FormField label={t('sellers.col.username')}>
              <Input
                value={form.username}
                onChange={(e) => setField('username', e.target.value)}
                placeholder={t('sellers.form.usernamePlaceholder')}
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t('common.saving') : editSeller ? t('common.save') : t('common.add')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
