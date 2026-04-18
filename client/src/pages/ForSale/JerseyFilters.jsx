import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, X, ChevronDown, Check, Bookmark, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { jerseyService } from '@/services/api';
import { useTranslateConstant } from '@/hooks/useTranslateConstant';
import { useCurrencyStore, CURRENCIES } from '@/store/currencyStore';
import { ColorFilterChips } from '@/components/common/ColorFilter/ColorFilterChips';

const SAVED_FILTERS_KEY = 'forsale_saved_filters';
const MAX_SAVED = 5;

function loadSavedFilters() {
  try { return JSON.parse(localStorage.getItem(SAVED_FILTERS_KEY) || '[]'); } catch { return []; }
}

const EMPTY = {
  search: '', type: [], quality: [], size: [], condition: [],
  brand: [], league: [], season: [], featured: '',
  primaryColor: [],
  minPrice: '', maxPrice: '',
};

/** Shadcn-style multi-select: tıklayınca tik, checkbox yok */
function MultiSelect({
  label, options, values, onChange, translateFn,
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  function toggle(val) {
    onChange(values.includes(val) ? values.filter((v) => v !== val) : [...values, val]);
  }

  const display = values.length === 0 ? t('common.all') : values.length === 1 ? (translateFn ? translateFn(values[0]) : values[0]) : `${values.length} ${t('common.selected')}`;

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'w-full h-8 px-2.5 text-xs border border-[var(--border)] rounded-md',
              'bg-[var(--bg-card)] text-[var(--text-primary)]',
              'flex items-center justify-between gap-1',
              'hover:border-[var(--accent)] transition-colors outline-none',
              'focus-visible:ring-1 focus-visible:ring-[var(--ring)]',
              values.length > 0 && 'border-[var(--accent)]'
            )}
          >
            <span className="truncate">{display}</span>
            <ChevronDown size={12} className="flex-shrink-0 text-[var(--text-muted)]" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="p-1 w-44"
          align="start"
          sideOffset={4}
        >
          {options.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-[var(--text-muted)]">{t('common.noOptions')}</p>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              {options.map((opt) => {
                const selected = values.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggle(opt)}
                    className={cn(
                      'w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-colors',
                      'hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]',
                      selected && 'font-medium'
                    )}
                  >
                    {translateFn ? translateFn(opt) : opt}
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

/** Shadcn-style single-select: tıklayınca tik, "Tümü" ile sıfırlanır */
function SingleSelect({ label, options, value, onChange }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const display = options.find((o) => o.value === value)?.label ?? t('common.all');

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'w-full h-8 px-2.5 text-xs border border-[var(--border)] rounded-md',
              'bg-[var(--bg-card)] text-[var(--text-primary)]',
              'flex items-center justify-between gap-1',
              'hover:border-[var(--accent)] transition-colors outline-none',
              'focus-visible:ring-1 focus-visible:ring-[var(--ring)]',
              value && 'border-[var(--accent)]'
            )}
          >
            <span className="truncate">{display}</span>
            <ChevronDown size={12} className="flex-shrink-0 text-[var(--text-muted)]" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-1 w-44" align="start" sideOffset={4}>
          <div className="max-h-48 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className={cn(
                'w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-colors',
                'hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]',
                !value && 'font-medium'
              )}
            >
              {t('common.all')}
              {!value && <Check size={12} className="flex-shrink-0 text-[var(--accent)]" />}
            </button>
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-colors',
                  'hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]',
                  value === opt.value && 'font-medium'
                )}
              >
                {opt.label}
                {value === opt.value && <Check size={12} className="flex-shrink-0 text-[var(--accent)]" />}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Parse URL param strings back to internal state (arrays for multi-select fields)
const ARRAY_FIELDS = ['type', 'quality', 'size', 'condition', 'brand', 'league', 'season', 'primaryColor'];

function parseInitialValues(initial) {
  if (!initial) return EMPTY;
  const result = { ...EMPTY };
  for (const [k, v] of Object.entries(initial)) {
    if (!v) continue;
    if (ARRAY_FIELDS.includes(k)) {
      result[k] = v.split(',').filter(Boolean);
    } else {
      result[k] = v;
    }
  }
  return result;
}

export function JerseyFilters({ onFilterChange, initialValues }) {
  const { t } = useTranslation();
  const { currency } = useCurrencyStore();
  const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol || '₺';
  const translateJerseyType = useTranslateConstant('jerseyType');
  const translateJerseyQuality = useTranslateConstant('jerseyQuality');
  const translateCondition = useTranslateConstant('condition');
  const translateJerseySize = useTranslateConstant('jerseySize');

  const [f, setF] = useState(() => parseInitialValues(initialValues));
  const [open, setOpen] = useState(false);
  const [savedFilters, setSavedFilters] = useState(loadSavedFilters);
  const [options, setOptions] = useState({
    types: [], qualities: [], conditions: [], brands: [], leagues: [], seasons: [], sizes: [], primaryColors: [],
  });

  useEffect(() => {
    jerseyService.getFilterOptions({ status: 'for_sale' })
      .then((res) => setOptions(res.data.data))
      .catch(() => {});
  }, []);

  function update(key, val) {
    const next = { ...f, [key]: val };
    setF(next);
    if (key === 'search') onFilterChange(clean(next));
  }

  function apply() {
    onFilterChange(clean(f));
    setOpen(false);
  }

  function reset() {
    setF(EMPTY);
    onFilterChange({});
    setOpen(false);
  }

  function clean(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (Array.isArray(v) && v.length > 0) out[k] = v.join(',');
      else if (v && !Array.isArray(v)) out[k] = v;
    }
    return out;
  }

  const activeCount = Object.entries(f).filter(([k, v]) => {
    if (k === 'search') return false;
    return Array.isArray(v) ? v.length > 0 : !!v;
  }).length;

  function saveCurrentFilter() {
    const current = savedFilters;
    if (current.length >= MAX_SAVED) {
      toast.error?.(t('forSale.savedFiltersMax', { max: MAX_SAVED }));
      return;
    }
    const name = window.prompt(t('forSale.savedFilterName'));
    if (!name?.trim()) return;
    const next = [...current, { name: name.trim(), filters: clean(f) }];
    setSavedFilters(next);
    localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(next));
  }

  function applySavedFilter(sf) {
    const parsed = parseInitialValues(sf.filters);
    setF(parsed);
    onFilterChange(sf.filters);
    setOpen(false);
  }

  function deleteSavedFilter(idx) {
    const next = savedFilters.filter((_, i) => i !== idx);
    setSavedFilters(next);
    localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(next));
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <Input
          placeholder={t('sold.searchPlaceholder')}
          value={f.search}
          onChange={(e) => update('search', e.target.value)}
          className="pl-8 w-52"
        />
      </div>

      {/* Advanced filters */}
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
        <PopoverContent className="w-[340px]" align="start">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{t('common.filters')}</p>

            <div className="grid grid-cols-2 gap-2">
              <MultiSelect label={t('jersey.type')} options={options.types} values={f.type} onChange={(v) => update('type', v)} translateFn={translateJerseyType} />
              <MultiSelect label={t('jersey.quality')} options={options.qualities} values={f.quality} onChange={(v) => update('quality', v)} translateFn={translateJerseyQuality} />
              <MultiSelect label={t('jersey.condition')} options={options.conditions} values={f.condition} onChange={(v) => update('condition', v)} translateFn={translateCondition} />
              <MultiSelect label={t('jersey.size')} options={options.sizes} values={f.size} onChange={(v) => update('size', v)} translateFn={translateJerseySize} />
              <MultiSelect label={t('jersey.brand')} options={options.brands} values={f.brand} onChange={(v) => update('brand', v)} />
              <MultiSelect label={t('jersey.league')} options={options.leagues} values={f.league} onChange={(v) => update('league', v)} />
              <MultiSelect label={t('jersey.season')} options={options.seasons} values={f.season} onChange={(v) => update('season', v)} />

              <SingleSelect
                label={t('jersey.featured')}
                options={[{ value: 'true', label: t('products.featuredOnly') }]}
                value={f.featured}
                onChange={(v) => update('featured', v)}
              />
            </div>

            {options.primaryColors.length > 0 && (
              <ColorFilterChips
                availableHexes={options.primaryColors}
                selected={f.primaryColor}
                onChange={(v) => update('primaryColor', v)}
                label={t('products.primaryColor')}
              />
            )}

            <div className="space-y-1">
              <Label className="text-xs">{t('products.priceRange', { symbol })}</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder={t('products.priceMin')}
                  value={f.minPrice}
                  onChange={(e) => update('minPrice', e.target.value)}
                  className="h-8 text-xs"
                />
                <span className="text-[var(--text-muted)] text-xs">–</span>
                <Input
                  type="number"
                  placeholder={t('products.priceMax')}
                  value={f.maxPrice}
                  onChange={(e) => update('maxPrice', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={reset} className="flex-1">
                <X size={13} /> {t('common.clear')}
              </Button>
              <Button size="sm" onClick={apply} className="flex-1">
                {t('common.apply')}
              </Button>
            </div>

            {/* Saved filters */}
            <div className="border-t border-[var(--border)] pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium text-[var(--text-muted)]">{t('forSale.savedFilters')}</p>
                {savedFilters.length < MAX_SAVED && (
                  <button
                    type="button"
                    onClick={saveCurrentFilter}
                    className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                  >
                    <Bookmark size={11} /> {t('forSale.saveFilter')}
                  </button>
                )}
              </div>
              {savedFilters.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">{t('forSale.noSavedFilters')}</p>
              ) : (
                <div className="space-y-1">
                  {savedFilters.map((sf, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => applySavedFilter(sf)}
                        className="flex-1 text-left text-xs px-2 py-1 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] truncate"
                      >
                        {sf.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSavedFilter(idx)}
                        className="p-1 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-red-500"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
