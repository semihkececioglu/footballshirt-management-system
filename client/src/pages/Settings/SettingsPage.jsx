import { useState, useEffect } from 'react';
import { Plus, X, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/forms/JerseyForm/FormField';
import { settingsService } from '@/services/api';
import { SETTINGS_CONTACT_PLATFORMS } from '@/lib/constants';
import { useThemeStore } from '@/store/themeStore';
import { useLanguageStore, LANGUAGES } from '@/store/languageStore';
import { useCurrencyStore, CURRENCIES } from '@/store/currencyStore';

const EMPTY_LINK = { platform: '', label: '', link: '' };

export default function SettingsPage() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();
  const { currency, setCurrency } = useCurrencyStore();

  const [storeTitle, setVitrinTitle] = useState('');
  const [contactLinks, setContactLinks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsService.get()
      .then((res) => {
        const data = res.data.data || res.data || {};
        setVitrinTitle(data.storeTitle || '');
        setContactLinks(data.contactLinks ? data.contactLinks.map((l) => ({ ...l })) : []);
      })
      .catch(() => toast.error(t('settings.loadError')))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleLanguageChange(code) {
    setLanguage(code);
  }

  function handleCurrencyChange(code) {
    setCurrency(code);
  }

  function addLink() {
    setContactLinks((prev) => [...prev, { ...EMPTY_LINK }]);
  }

  function removeLink(idx) {
    setContactLinks((prev) => prev.filter((_, i) => i !== idx));
  }

  function setLinkField(idx, field, value) {
    setContactLinks((prev) => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsService.update({
        storeTitle,
        contactLinks: contactLinks.filter((l) => l.platform && l.link),
      });
      toast.success(t('settings.saved'));
    } catch {
      toast.error(t('settings.saveError'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="py-8 text-center text-[var(--text-muted)]">{t('common.loading')}</div>;

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">{t('settings.title')}</h1>

      {/* Preferences */}
      <div className="space-y-4 rounded-lg border border-[var(--border)] p-4 bg-[var(--bg-card)]">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">
          {t('settings.preferences')}
        </h2>

        {/* Language */}
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-[var(--text-secondary)]">{t('settings.language')}</span>
          <div className="flex gap-1">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => handleLanguageChange(l.code)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  language === l.code
                    ? 'bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                }`}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Currency */}
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-[var(--text-secondary)]">{t('settings.currency')}</span>
          <div className="flex gap-1 flex-wrap justify-end">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleCurrencyChange(c.code)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  currency === c.code
                    ? 'bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                }`}
              >
                <span>{c.symbol}</span>
                <span>{c.code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-[var(--text-secondary)]">{t('settings.theme')}</span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => theme === 'dark' && toggleTheme()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                theme === 'light'
                  ? 'bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
              }`}
            >
              <Sun size={12} />
              <span>{t('settings.themeLight')}</span>
            </button>
            <button
              type="button"
              onClick={() => theme === 'light' && toggleTheme()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                theme === 'dark'
                  ? 'bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
              }`}
            >
              <Moon size={12} />
              <span>{t('settings.themeDark')}</span>
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Vitrin Title */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">
            {t('settings.storefront')}
          </h2>
          <FormField label={t('settings.storeTitle')}>
            <Input
              value={storeTitle}
              onChange={(e) => setVitrinTitle(e.target.value)}
              placeholder={t('settings.storeTitlePlaceholder')}
            />
          </FormField>
        </div>

        {/* Contact Links */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">{t('settings.contactLinks')}</h2>
            <Button type="button" variant="outline" size="sm" onClick={addLink}>
              <Plus size={14} /> {t('settings.addLink')}
            </Button>
          </div>

          {contactLinks.length === 0 && (
            <p className="text-xs text-[var(--text-muted)] py-1">{t('settings.noLinks')}</p>
          )}

          {contactLinks.map((link, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <div className="grid grid-cols-3 gap-2 flex-1">
                <Select
                  value={link.platform || '__none__'}
                  onValueChange={(v) => setLinkField(idx, 'platform', v === '__none__' ? '' : v)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder={t('settings.platform')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t('settings.platform')}</SelectItem>
                    {SETTINGS_CONTACT_PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={link.label}
                  onChange={(e) => setLinkField(idx, 'label', e.target.value)}
                  placeholder="Label"
                  className="text-xs"
                />
                <Input
                  value={link.link}
                  onChange={(e) => setLinkField(idx, 'link', e.target.value)}
                  placeholder={t('settings.url')}
                  className="text-xs"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-red-500 mt-0.5"
                onClick={() => removeLink(idx)}
              >
                <X size={14} />
              </Button>
            </div>
          ))}
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </form>
    </div>
  );
}
