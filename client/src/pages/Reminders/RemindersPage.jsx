import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, MessageCircle, X, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { PhoneInput } from '@/components/ui/PhoneInput';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { ReminderStatusBadge } from '@/components/common/StatusBadge/StatusBadge';
import { FormField } from '@/components/forms/JerseyForm/FormField';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Tooltip, TooltipProvider, TooltipTrigger, TooltipContent,
} from '@/components/ui/tooltip';
import { reminderService } from '@/services/api';
import { formatDate, getWhatsAppUrl } from '@/lib/utils';

const EMPTY_FORM = {
  contactName: '',
  contactPhone: '',
  contactPlatforms: [],
  requestNote: '',
  teamName: '',
  season: '',
  type: '',
  status: 'open',
};

const EMPTY_PLATFORM = { name: '', username: '' };

export default function RemindersPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') ?? 'open';
  const modal = searchParams.get('modal') || '';
  const modalId = searchParams.get('id') || '';

  const STATUS_TABS = [
    { key: 'open', label: t('reminders.tab.open') },
    { key: 'notified', label: t('reminders.tab.notified') },
    { key: 'closed', label: t('reminders.tab.closed') },
    { key: '', label: t('common.all') },
  ];

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editReminder, setEditReminder] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

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

  function clearModal() { setParams({ modal: null, id: null }); }

  const formOpen = modal === 'add' || (modal === 'edit' && !!editReminder);

  const load = useCallback(async (status) => {
    setLoading(true);
    try {
      const params = status ? { status } : {};
      const res = await reminderService.getAll(params);
      setReminders(res.data.data || res.data);
    } catch {
      toast.error(t('reminders.toast.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(activeTab); }, [activeTab, load]);

  // Handle modal=edit — find reminder in list
  useEffect(() => {
    if (modal === 'edit' && modalId) {
      const found = reminders.find((r) => r._id === modalId);
      if (found) {
        setEditReminder(found);
        setForm({
          contactName: found.contactName || '',
          contactPhone: found.contactPhone || '',
          contactPlatforms: found.contactPlatforms ? found.contactPlatforms.map((p) => ({ ...p })) : [],
          requestNote: found.requestNote || '',
          teamName: found.teamName || '',
          season: found.season || '',
          type: found.type || '',
          status: found.status || 'open',
        });
      } else {
        clearModal();
      }
    } else if (modal === 'add') {
      setEditReminder(null);
      setForm(EMPTY_FORM);
    }
  }, [modal, modalId, reminders]); // eslint-disable-line react-hooks/exhaustive-deps

  function openAdd() {
    setParam('modal', 'add', false);
  }

  function openEdit(reminder) {
    setParams({ modal: 'edit', id: reminder._id }, false);
    setEditReminder(reminder);
    setForm({
      contactName: reminder.contactName || '',
      contactPhone: reminder.contactPhone || '',
      contactPlatforms: reminder.contactPlatforms
        ? reminder.contactPlatforms.map((p) => ({ ...p }))
        : [],
      requestNote: reminder.requestNote || '',
      teamName: reminder.teamName || '',
      season: reminder.season || '',
      type: reminder.type || '',
      status: reminder.status || 'open',
    });
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await reminderService.delete(deleteId);
      toast.success(t('reminders.toast.deleteSuccess'));
      load(activeTab);
    } catch {
      toast.error(t('reminders.toast.deleteError'));
    } finally {
      setDeleteId(null);
    }
  }

  async function handleStatusChange(reminder, newStatus) {
    try {
      await reminderService.update(reminder._id, { status: newStatus });
      toast.success(t('reminders.toast.statusUpdateSuccess'));
      load(activeTab);
    } catch {
      toast.error(t('reminders.toast.statusUpdateError'));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.contactName.trim()) {
      toast.error(t('reminders.toast.nameRequired'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        contactPlatforms: form.contactPlatforms.filter((p) => p.name.trim()),
      };
      if (editReminder) {
        await reminderService.update(editReminder._id, payload);
        toast.success(t('reminders.toast.updateSuccess'));
      } else {
        await reminderService.create(payload);
        toast.success(t('reminders.toast.createSuccess'));
      }
      clearModal();
      load(activeTab);
    } catch {
      toast.error(t('reminders.toast.saveError'));
    } finally {
      setSaving(false);
    }
  }

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addPlatform() {
    setForm((prev) => ({
      ...prev,
      contactPlatforms: [...prev.contactPlatforms, { ...EMPTY_PLATFORM }],
    }));
  }

  function removePlatform(idx) {
    setForm((prev) => ({
      ...prev,
      contactPlatforms: prev.contactPlatforms.filter((_, i) => i !== idx),
    }));
  }

  function setPlatformField(idx, field, value) {
    setForm((prev) => ({
      ...prev,
      contactPlatforms: prev.contactPlatforms.map((p, i) =>
        i === idx ? { ...p, [field]: value } : p
      ),
    }));
  }

  const columns = [
    {
      key: 'contactName',
      label: t('reminders.col.contact'),
      sortable: true,
      render: (v) => <span className="font-medium text-[var(--text-primary)]">{v || '—'}</span>,
    },
    {
      key: 'contactPhone',
      label: t('reminders.col.phone'),
      render: (v) => v || '—',
    },
    {
      key: 'contactPlatforms',
      label: t('reminders.col.platforms'),
      className: 'hidden md:table-cell',
      render: (v) => {
        if (!v || v.length === 0) return '—';
        return (
          <span className="text-xs text-[var(--text-muted)]">
            {v.map((p) => `${p.name}${p.username ? `: ${p.username}` : ''}`).join(', ')}
          </span>
        );
      },
    },
    {
      key: 'requestNote',
      label: t('reminders.col.requestNote'),
      className: 'hidden lg:table-cell',
      render: (v) =>
        v ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-[var(--text-muted)] max-w-[200px] truncate block cursor-default">
                  {v}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs whitespace-normal">{v}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          '—'
        ),
    },
    {
      key: 'teamName',
      label: t('reminders.col.team'),
      render: (v) => v || '—',
    },
    {
      key: 'status',
      label: t('reminders.col.status'),
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <ReminderStatusBadge status={v} />
          <Select
            value={v}
            onValueChange={(newStatus) => handleStatusChange(row, newStatus)}
          >
            <SelectTrigger className="h-6 w-6 p-0 border-0 bg-transparent opacity-50 hover:opacity-100 [&>svg]:hidden">
              <span className="sr-only">{t('reminders.changeStatus')}</span>
              <Pencil size={12} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">{t('reminderStatus.open')}</SelectItem>
              <SelectItem value="notified">{t('reminderStatus.notified')}</SelectItem>
              <SelectItem value="closed">{t('reminderStatus.closed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: t('reminders.col.dueDate'),
      sortable: true,
      render: (v) => formatDate(v),
    },
    {
      key: '_id',
      label: '',
      className: 'w-10',
      render: (_, row) => {
        const waUrl = row.contactPhone ? getWhatsAppUrl(row.contactPhone) : null;
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
                    <MessageCircle size={13} className="mr-2" /> {t('reminders.whatsApp')}
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
          <Plus size={16} /> {t('reminders.addReminder')}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={reminders}
        loading={loading}
        emptyText={t('reminders.noReminders')}
      />

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('reminders.deleteReminder')}</AlertDialogTitle>
            <AlertDialogDescription>{t('reminders.deleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => { if (!o) clearModal(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editReminder ? t('reminders.editReminder') : t('reminders.addReminder')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <FormField label={t('reminders.form.contactName')} required>
              <Input
                value={form.contactName}
                onChange={(e) => setField('contactName', e.target.value)}
                placeholder={t('reminders.form.contactNamePlaceholder')}
              />
            </FormField>

            <FormField label={t('reminders.form.phone')}>
              <PhoneInput
                value={form.contactPhone}
                onChange={(v) => setField('contactPhone', v)}
              />
            </FormField>

            {/* Contact Platforms */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--text-primary)]">{t('reminders.form.platforms')}</span>
                <Button type="button" variant="outline" size="sm" onClick={addPlatform}>
                  <Plus size={14} /> {t('reminders.form.addPlatform')}
                </Button>
              </div>
              {form.contactPlatforms.length === 0 && (
                <p className="text-xs text-[var(--text-muted)] py-1">{t('reminders.form.noPlatforms')}</p>
              )}
              {form.contactPlatforms.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={p.name}
                    onChange={(e) => setPlatformField(idx, 'name', e.target.value)}
                    placeholder={t('reminders.form.platformNamePlaceholder')}
                    className="flex-1"
                  />
                  <Input
                    value={p.username}
                    onChange={(e) => setPlatformField(idx, 'username', e.target.value)}
                    placeholder={t('reminders.form.usernamePlaceholder')}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-red-500"
                    onClick={() => removePlatform(idx)}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
            </div>

            <FormField label={t('reminders.col.requestNote')}>
              <Textarea
                value={form.requestNote}
                onChange={(e) => setField('requestNote', e.target.value)}
                placeholder={t('reminders.form.requestNotePlaceholder')}
                rows={3}
              />
            </FormField>

            <div className="grid grid-cols-3 gap-3">
              <FormField label={t('reminders.form.team')}>
                <Input
                  value={form.teamName}
                  onChange={(e) => setField('teamName', e.target.value)}
                  placeholder={t('reminders.form.teamPlaceholder')}
                />
              </FormField>
              <FormField label={t('reminders.form.season')}>
                <Input
                  value={form.season}
                  onChange={(e) => setField('season', e.target.value)}
                  placeholder={t('reminders.form.seasonPlaceholder')}
                />
              </FormField>
              <FormField label={t('reminders.form.type')}>
                <Input
                  value={form.type}
                  onChange={(e) => setField('type', e.target.value)}
                  placeholder={t('reminders.form.typePlaceholder')}
                />
              </FormField>
            </div>

            <FormField label={t('common.status')}>
              <Select value={form.status} onValueChange={(v) => setField('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">{t('reminderStatus.open')}</SelectItem>
                  <SelectItem value="notified">{t('reminderStatus.notified')}</SelectItem>
                  <SelectItem value="closed">{t('reminderStatus.closed')}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={clearModal}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t('common.saving') : editReminder ? t('common.save') : t('common.add')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
