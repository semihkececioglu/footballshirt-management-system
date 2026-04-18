import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Share2, ShoppingCart, CheckSquare, Search, X } from 'lucide-react';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { plannerService, jerseyService } from '@/services/api';
import { PLAN_TYPES } from './DayDetailPanel';

const EMPTY_FORM = { type: 'task', title: '', platform: '', description: '', jerseyId: null, status: 'pending' };

function JerseySearch({ value, onChange }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await jerseyService.getAll({ q: query, limit: 8 });
        setResults(res.data?.data || []);
        setOpen(true);
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [query]);

  const select = (jersey) => {
    onChange(jersey);
    setQuery('');
    setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setQuery('');
  };

  if (value) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)]">
        {value.images?.[0]?.url && (
          <img src={value.images[0].url} alt="" className="h-8 w-8 rounded object-cover flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--text-primary)] truncate">
            {value.teamName} {value.season}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">{value.type}</p>
        </div>
        <button onClick={clear} className="text-[var(--text-muted)] hover:text-red-500 transition-colors">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('planner.form.selectJersey')}
          className="pl-8 text-xs h-8"
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-md shadow-lg max-h-48 overflow-y-auto">
          {searching && <div className="px-3 py-2 text-xs text-[var(--text-muted)]">{t('planner.searching')}</div>}
          {results.map((j) => (
            <button
              key={j._id}
              type="button"
              onMouseDown={() => select(j)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-secondary)] transition-colors text-left"
            >
              {j.images?.[0]?.url && (
                <img src={j.images[0].url} alt="" className="h-7 w-7 rounded object-cover flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--text-primary)] truncate">{j.teamName}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{j.season} · {j.type}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlanItemDialog({ open, onOpenChange, date, editItem, onSaved }) {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedJersey, setSelectedJersey] = useState(null);
  const [saving, setSaving] = useState(false);

  const TYPE_OPTIONS = [
    { value: 'task', label: t('planner.typeTask'), icon: CheckSquare },
    { value: 'share', label: t('planner.typeShare'), icon: Share2 },
    { value: 'list', label: t('planner.typeList'), icon: ShoppingCart },
    { value: 'photo', label: t('planner.typePhoto'), icon: Camera },
  ];

  useEffect(() => {
    if (open) {
      if (editItem) {
        setForm({
          type: editItem.type,
          title: editItem.title,
          platform: editItem.platform || '',
          description: editItem.description || '',
          jerseyId: editItem.jerseyId?._id || editItem.jerseyId || null,
          status: editItem.status,
        });
        setSelectedJersey(editItem.jerseyId || null);
      } else {
        setForm(EMPTY_FORM);
        setSelectedJersey(null);
      }
    }
  }, [open, editItem]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleJerseyChange = (jersey) => {
    setSelectedJersey(jersey);
    set('jerseyId', jersey?._id || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error(t('planner.form.titleRequired')); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!editItem) {
        const d = new Date(date);
        d.setHours(12, 0, 0, 0);
        payload.date = d.toISOString();
      }
      if (!payload.jerseyId) delete payload.jerseyId;
      if (!payload.platform) delete payload.platform;
      if (!payload.description) delete payload.description;

      if (editItem) {
        await plannerService.update(editItem._id, payload);
        toast.success(t('planner.updateSuccess'));
      } else {
        await plannerService.create(payload);
        toast.success(t('planner.saveSuccess'));
      }
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error(t('planner.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const showPlatform = form.type === 'share' || form.type === 'list';
  const locale = i18n.language === 'en' ? 'en-US' : 'tr-TR';
  const title = editItem ? t('planner.editPlan') : `${t('planner.addPlan')} — ${date?.toLocaleDateString(locale, { day: 'numeric', month: 'long' }) ?? ''}`;

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="max-w-md">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="text-sm">{title}</ResponsiveModalTitle>
        </ResponsiveModalHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1.5 block">{t('planner.form.type')}</label>
            <div className="grid grid-cols-4 gap-1.5">
              {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => {
                const meta = PLAN_TYPES[value];
                const active = form.type === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set('type', value)}
                    className={cn(
                      'flex flex-col items-center gap-1 py-2 px-1 rounded-md border text-[10px] font-medium transition-colors',
                      active
                        ? cn(meta.bg, meta.color, 'border-current')
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1.5 block">{t('planner.form.title')} *</label>
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder={t('planner.form.shortDesc')}
              className="h-8 text-xs"
              autoFocus
            />
          </div>

          {/* Platform (conditional) */}
          {showPlatform && (
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1.5 block">
                {t('planner.form.platform')} <span className="opacity-60">({t('common.optional')})</span>
              </label>
              <Input
                value={form.platform}
                onChange={(e) => set('platform', e.target.value)}
                placeholder={form.type === 'share' ? t('planner.form.sharePlatformPlaceholder') : t('planner.form.listPlatformPlaceholder')}
                className="h-8 text-xs"
              />
            </div>
          )}

          {/* Jersey link */}
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1.5 block">
              {t('planner.form.jersey')} <span className="opacity-60">({t('common.optional')})</span>
            </label>
            <JerseySearch value={selectedJersey} onChange={handleJerseyChange} />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1.5 block">
              {t('planner.form.notes')} <span className="opacity-60">({t('common.optional')})</span>
            </label>
            <Textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder={t('planner.form.notesPlaceholder')}
              className="text-xs min-h-[60px] resize-none"
              rows={2}
            />
          </div>

          {/* Status (edit only) */}
          {editItem && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.status === 'done'}
                onChange={(e) => set('status', e.target.checked ? 'done' : 'pending')}
                className="rounded"
              />
              <span className="text-xs text-[var(--text-primary)]">{t('planner.form.done')}</span>
            </label>
          )}

          <ResponsiveModalFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-md hover:bg-[var(--bg-secondary)] transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-1.5 text-xs bg-[var(--accent)] text-[var(--accent-foreground)] rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity font-medium"
            >
              {saving ? t('common.saving') : editItem ? t('common.save') : t('common.add')}
            </button>
          </ResponsiveModalFooter>
        </form>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
