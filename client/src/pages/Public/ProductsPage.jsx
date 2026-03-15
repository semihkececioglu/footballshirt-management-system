import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, SlidersHorizontal, X, LayoutGrid, List, Star, ShoppingBag, MessageCircle,
  AtSign, Link2, ExternalLink, Moon, Sun, Check, Menu,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguageStore, LANGUAGES } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { useCurrencyStore, CURRENCIES } from '@/store/currencyStore';
import { publicService } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { JerseyCard } from '@/components/common/JerseyCard/JerseyCard';
import { JerseyDetailDialog } from '@/components/common/JerseyDetail/JerseyDetailDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/common/DataTable/Pagination';
import { ConditionBadge } from '@/components/common/StatusBadge/StatusBadge';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { cn } from '@/lib/utils';
import { JERSEY_SIZES, JERSEY_COLORS } from '@/lib/constants';
import { useTranslateConstant } from '@/hooks/useTranslateConstant';

const PLATFORM_ICONS = {
  WhatsApp: MessageCircle,
  Instagram: AtSign,
  eBay: ShoppingBag,
  Depop: ShoppingBag,
  Dolap: ShoppingBag,
  Vinted: ShoppingBag,
  Facebook: Link2,
  Twitter: AtSign,
  TikTok: Link2,
};
function getPlatformIcon(platform) { return PLATFORM_ICONS[platform] || Link2; }

const FILTER_KEYS = ['team', 'type', 'quality', 'size', 'condition', 'brand', 'league', 'season', 'primaryColor', 'minPrice', 'maxPrice'];
const EMPTY_FILTERS = Object.fromEntries(FILTER_KEYS.map((k) => [k, '']));

function filtersFromParams(params) {
  return Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || '']));
}

function SizeChips({ jersey }) {
  const translateJerseySize = useTranslateConstant('jerseySize');
  const sizeInfo = jersey.sizeVariants?.length > 0
    ? jersey.sizeVariants
    : jersey.size ? [{ size: jersey.size, stockCount: 1 }] : [];

  if (!sizeInfo.length) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {sizeInfo.map((v, i) => (
        <span
          key={i}
          className="text-xs px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium"
        >
          {translateJerseySize(v.size)}
        </span>
      ))}
    </div>
  );
}

function ListRow({ jersey, onClick }) {
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const translateJerseyQuality = useTranslateConstant('jerseyQuality');
  const mainImg = jersey.images?.find((i) => i.isMain) || jersey.images?.[0];
  const imgCount = jersey.images?.length || 0;

  return (
    <div
      className="flex gap-3 p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative w-16 h-[85px] sm:w-20 sm:h-[107px] flex-shrink-0 rounded-lg overflow-hidden bg-[var(--bg-secondary)]">
        {mainImg?.url && (
          <img src={mainImg.url} alt={jersey.teamName} className="w-full h-full object-cover" loading="lazy" />
        )}
        {imgCount > 1 && (
          <span className="absolute bottom-1 right-1 text-[9px] leading-none bg-black/60 text-white rounded px-1 py-0.5 pointer-events-none">
            +{imgCount - 1}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-semibold text-sm text-[var(--text-primary)] truncate">{jersey.teamName}</h3>
            {jersey.featured && <Star size={11} className="fill-amber-400 text-amber-400 flex-shrink-0" />}
          </div>
          <p className="text-xs text-[var(--text-muted)] truncate">
            {[jersey.season, jersey.brand, translateJerseyQuality(jersey.quality)].filter(Boolean).join(' · ')}
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap mt-1">
          <SizeChips jersey={jersey} />
          <ConditionBadge condition={jersey.condition} />
        </div>

        {jersey.productCode && (
          <p className="text-[10px] text-[var(--text-muted)] mt-1">{t('products.productCode')}: {jersey.productCode}</p>
        )}
      </div>

      {/* Price */}
      <div className="flex-shrink-0 flex flex-col items-end justify-between py-0.5">
        {jersey.sellPrice > 0 ? (
          <p className="text-base font-bold text-[var(--accent)]">{formatCurrency(jersey.sellPrice)}</p>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">{t('products.noPrice')}</span>
        )}
      </div>
    </div>
  );
}

function FSel({
  label, value, opts, onChange, allLabel, translateFn,
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select value={value || '__all__'} onValueChange={(v) => onChange(v === '__all__' ? '' : v)}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{allLabel}</SelectItem>
          {opts.map((o) => <SelectItem key={o} value={o}>{translateFn ? translateFn(o) : o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function ProductsPage() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();
  const { theme, toggleTheme } = useThemeStore();
  const { currency } = useCurrencyStore();
  const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol || '₺';
  const [searchParams, setSearchParams] = useSearchParams();

  const translateJerseySize = useTranslateConstant('jerseySize');
  const translateJerseyType = useTranslateConstant('jerseyType');
  const translateJerseyQuality = useTranslateConstant('jerseyQuality');
  const translateCondition = useTranslateConstant('condition');
  const translateColor = useTranslateConstant('color');

  const SORT_OPTIONS = [
    { value: '-createdAt', label: t('sort.newest') },
    { value: 'createdAt', label: t('sort.oldest') },
    { value: 'sellPrice', label: t('sort.priceLow') },
    { value: '-sellPrice', label: t('sort.priceHigh') },
    { value: 'teamName', label: t('sort.teamAZ') },
  ];

  // State derived from URL
  const search = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || '-createdAt';
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const view = searchParams.get('view') || 'grid';
  const detailId = searchParams.get('jersey') || '';
  const appliedFilters = filtersFromParams(searchParams);

  // Local state (not in URL)
  const searchRef = useRef(null);
  const [jerseys, setJerseys] = useState([]);
  const [pinnedJerseys, setPinnedJerseys] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState(EMPTY_FILTERS);
  const [detailJersey, setDetailJersey] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    types: [], qualities: [], conditions: [], brands: [], leagues: [], seasons: [], primaryColors: [],
  });
  const [teams, setTeams] = useState([]);
  const [contactLinks, setContactLinks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pub_settings') || '{}').contactLinks || []; } catch { return []; }
  });
  const [storeTitle, setVitrinTitle] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pub_settings') || '{}').storeTitle || ''; } catch { return ''; }
  });
  const [settingsLoaded, setSettingsLoaded] = useState(() => !!localStorage.getItem('pub_settings'));
  const LIMIT = 24;

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

  useEffect(() => {
    publicService.getFilterOptions()
      .then((res) => setFilterOptions(res.data.data))
      .catch(() => {});
    publicService.getTeams()
      .then((res) => setTeams(res.data.data || res.data || []))
      .catch(() => {});
    publicService.getSettings()
      .then((res) => {
        const s = res.data.data || res.data || {};
        setContactLinks(s.contactLinks || []);
        if (s.storeTitle) setVitrinTitle(s.storeTitle);
        try { localStorage.setItem('pub_settings', JSON.stringify(s)); } catch {}
      })
      .catch(() => {})
      .finally(() => setSettingsLoaded(true));
  }, []);

  const loadKey = [search, sort, page, ...FILTER_KEYS.map((k) => searchParams.get(k) || '')].join('|');

  useEffect(() => {
    const activeFilters = Object.fromEntries(Object.entries(appliedFilters).filter(([, v]) => v !== ''));
    const params = {
      sort,
      page,
      limit: LIMIT,
      ...(search ? { search } : {}),
      ...activeFilters,
    };
    setLoading(true);
    Promise.all([
      publicService.getJerseys(params),
      publicService.getJerseys({ ...activeFilters, ...(search ? { search } : {}), featured: 'true', limit: 50 }),
    ])
      .then(([listRes, featuredRes]) => {
        setJerseys(listRes.data.data);
        setTotal(listRes.data.total);
        setPinnedJerseys(featuredRes.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!detailId) { setDetailJersey(null); return; }
    publicService.getJerseyById(detailId)
      .then((res) => setDetailJersey(res.data.data))
      .catch(() => setParam('jersey', ''));
  }, [detailId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(val) {
    setParams({ q: val || null, page: null });
  }

  function handleSort(val) {
    setParams({ sort: val === '-createdAt' ? null : val, page: null });
  }

  function handlePageChange(p) {
    setParam('page', p > 1 ? p : null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleOpenFilter() {
    setPendingFilters(appliedFilters);
    setFilterOpen(true);
  }

  function applyFilters() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('page');
      for (const k of FILTER_KEYS) {
        const v = pendingFilters[k];
        if (v) next.set(k, v);
        else next.delete(k);
      }
      return next;
    }, { replace: true });
    setFilterOpen(false);
  }

  function resetFilters() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('page');
      for (const k of FILTER_KEYS) next.delete(k);
      return next;
    }, { replace: true });
    setPendingFilters(EMPTY_FILTERS);
    setFilterOpen(false);
  }

  function openDetail(jersey) {
    setParam('jersey', jersey._id, false);
  }

  function closeDetail() {
    setParam('jersey', null);
  }

  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;
  const pinnedIds = new Set(pinnedJerseys.map((j) => j._id));
  const regularJerseys = page === 1 && pinnedJerseys.length > 0
    ? jerseys.filter((j) => !pinnedIds.has(j._id))
    : jerseys;
  const allLabel = t('common.all');

  const filterPopover = (
    <Popover open={filterOpen} onOpenChange={(o) => { if (o) handleOpenFilter(); else setFilterOpen(false); }}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative flex-shrink-0 cursor-pointer">
          <SlidersHorizontal size={16} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] text-[10px]">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          <p className="text-sm font-semibold">{t('products.filters')}</p>
          <FSel label={t('products.team')} value={pendingFilters.team} opts={teams} allLabel={allLabel} onChange={(v) => setPendingFilters((p) => ({ ...p, team: v }))} />
          <div className="grid grid-cols-2 gap-2">
            <FSel label={t('products.size')} value={pendingFilters.size} opts={JERSEY_SIZES} allLabel={allLabel} onChange={(v) => setPendingFilters((p) => ({ ...p, size: v }))} translateFn={translateJerseySize} />
            <FSel label={t('products.type')} value={pendingFilters.type} opts={filterOptions.types} allLabel={allLabel} onChange={(v) => setPendingFilters((p) => ({ ...p, type: v }))} translateFn={translateJerseyType} />
            <FSel label={t('products.quality')} value={pendingFilters.quality} opts={filterOptions.qualities} allLabel={allLabel} onChange={(v) => setPendingFilters((p) => ({ ...p, quality: v }))} translateFn={translateJerseyQuality} />
            <FSel label={t('products.condition')} value={pendingFilters.condition} opts={filterOptions.conditions} allLabel={allLabel} onChange={(v) => setPendingFilters((p) => ({ ...p, condition: v }))} translateFn={translateCondition} />
            <FSel label={t('products.brand')} value={pendingFilters.brand} opts={filterOptions.brands} allLabel={allLabel} onChange={(v) => setPendingFilters((p) => ({ ...p, brand: v }))} />
            <FSel label={t('products.league')} value={pendingFilters.league} opts={filterOptions.leagues} allLabel={allLabel} onChange={(v) => setPendingFilters((p) => ({ ...p, league: v }))} />
            <FSel label={t('products.season')} value={pendingFilters.season} opts={filterOptions.seasons} allLabel={allLabel} onChange={(v) => setPendingFilters((p) => ({ ...p, season: v }))} />
          </div>
          {filterOptions.primaryColors.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">{t('products.primaryColor')}</Label>
              <div className="flex flex-wrap gap-1.5">
                {filterOptions.primaryColors.map((hex) => {
                  const rawName = JERSEY_COLORS.find((c) => c.hex === hex)?.name ?? hex;
                  const name = translateColor(rawName);
                  const isSelected = pendingFilters.primaryColor === hex;
                  const r = parseInt(hex.slice(1, 3), 16);
                  const g = parseInt(hex.slice(3, 5), 16);
                  const b = parseInt(hex.slice(5, 7), 16);
                  const isLight = (r * 299 + g * 587 + b * 114) / 1000 > 128;
                  return (
                    <button
                      key={hex}
                      type="button"
                      title={name}
                      onClick={() => setPendingFilters((p) => ({ ...p, primaryColor: p.primaryColor === hex ? '' : hex }))}
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                      style={{
                        backgroundColor: hex,
                        border: isSelected ? '2px solid var(--accent)' : isLight ? '1.5px solid #d1d5db' : '1.5px solid transparent',
                        boxShadow: isSelected ? '0 0 0 1.5px var(--accent)' : undefined,
                      }}
                    >
                      {isSelected && <Check size={11} strokeWidth={3} style={{ color: isLight ? '#111' : '#fff' }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">{t('products.priceRange', { symbol })}</Label>
            <div className="flex gap-2 items-center">
              <Input type="number" placeholder={t('products.priceMin')} value={pendingFilters.minPrice}
                onChange={(e) => setPendingFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
                className="h-8 text-xs" />
              <span className="text-[var(--text-muted)] text-xs">–</span>
              <Input type="number" placeholder={t('products.priceMax')} value={pendingFilters.maxPrice}
                onChange={(e) => setPendingFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
                className="h-8 text-xs" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={resetFilters} className="flex-1 cursor-pointer">
              <X size={13} /> {t('common.clear')}
            </Button>
            <Button size="sm" onClick={applyFilters} className="flex-1 cursor-pointer">{t('common.apply')}</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Authenticity banner */}
      <div className="bg-[var(--accent)] text-[var(--accent-foreground)] text-center text-xs py-2 px-4 font-medium tracking-wide">
        {t('products.allOriginalBanner')}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        {/* Main row */}
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          {/* Logo + Title */}
          <div className="flex items-center gap-2.5 whitespace-nowrap flex-shrink-0">
            <img src="/logo.png" alt="logo" className="h-8 w-8 object-contain rounded-full" />
            {settingsLoaded ? (
              <h1 className="font-display text-lg font-bold text-[var(--text-primary)]">
                {storeTitle || t('products.defaultTitle')}
              </h1>
            ) : (
              <Skeleton className="h-5 w-32 rounded" />
            )}
          </div>

          {/* Desktop search */}
          <div className="hidden sm:flex flex-1 max-w-lg relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <Input
              ref={searchRef}
              placeholder={t('products.searchPlaceholder')}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 pr-9 h-9 bg-[var(--bg-primary)] focus-visible:ring-[var(--accent)]"
            />
            {search && (
              <button
                onClick={() => { handleSearch(''); searchRef.current?.focus(); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {/* Desktop: contact links */}
            {contactLinks.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 mr-1">
                {contactLinks.map(({ platform, label, link }) => {
                  const Icon = getPlatformIcon(platform);
                  return (
                    <a key={`${platform}-${label}`} href={link} target="_blank" rel="noreferrer" className="cursor-pointer">
                      <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer">
                        <Icon size={14} /> {label || platform} <ExternalLink size={11} className="opacity-60" />
                      </Button>
                    </a>
                  );
                })}
              </div>
            )}

            {/* Filter — always single instance */}
            {filterPopover}

            {/* Desktop: language */}
            <div className="hidden sm:flex rounded-lg border border-[var(--border)] overflow-hidden">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  title={l.label}
                  className={cn(
                    'px-2 py-1.5 text-xs font-medium transition-colors',
                    language === l.code
                      ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-primary)]'
                  )}
                >
                  {l.flag}
                </button>
              ))}
            </div>

            {/* Desktop: theme */}
            <button
              onClick={toggleTheme}
              className="hidden sm:flex p-2 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] transition-colors"
              aria-label={t('common.changeTheme')}
            >
              {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
            </button>

            {/* Mobile: hamburger */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="sm:hidden h-9 w-9">
                  <Menu size={17} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-3 space-y-3">
                {/* Language */}
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1.5">{t('settings.language')}</p>
                  <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => setLanguage(l.code)}
                        className={cn(
                          'flex-1 py-1.5 text-xs font-medium transition-colors',
                          language === l.code
                            ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                            : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]'
                        )}
                      >
                        {l.flag} {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme */}
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1.5">{t('settings.theme')}</p>
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors text-sm text-[var(--text-primary)]"
                  >
                    {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
                    {theme === 'light' ? t('settings.themeDark') : t('settings.themeLight')}
                  </button>
                </div>

                {/* Contact links */}
                {contactLinks.length > 0 && (
                  <div className="space-y-1.5 border-t border-[var(--border)] pt-3">
                    {contactLinks.map(({ platform, label, link }) => {
                      const Icon = getPlatformIcon(platform);
                      return (
                        <a key={`${platform}-${label}`} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-sm text-[var(--text-primary)] cursor-pointer">
                          <Icon size={15} /> {label || platform} <ExternalLink size={11} className="opacity-50 ml-auto" />
                        </a>
                      );
                    })}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile search row */}
        <div className="sm:hidden px-4 pb-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <Input
              placeholder={t('products.searchPlaceholder')}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 pr-9 h-10 bg-[var(--bg-primary)] focus-visible:ring-[var(--accent)] text-sm"
            />
            {search && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-[var(--text-muted)]">
          {loading ? t('common.loading') : (
            <><span className="font-medium text-[var(--text-primary)]">{total}</span> {t('jersey.countSuffix')}</>
          )}
        </p>
        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={handleSort}>
            <SelectTrigger className="h-8 w-52 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
            {[{ key: 'grid', Icon: LayoutGrid }, { key: 'list', Icon: List }].map(({ key, Icon }) => (
              <button
                key={key}
                onClick={() => setParam('view', key === 'grid' ? null : key)}
                aria-label={key === 'grid' ? t('products.gridView') : t('products.listView')}
                className={cn(
                  'flex items-center justify-center w-8 h-8 transition-colors',
                  view === key
                    ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]'
                )}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 pb-24 sm:pb-8">
        {loading ? (
          <div className={view === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'
            : 'space-y-3'
          }>
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className={view === 'grid' ? 'aspect-[3/4] rounded-xl' : 'h-32 rounded-xl'} />
            ))}
          </div>
        ) : jerseys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-[var(--text-muted)]">
            <p className="text-lg">{t('products.empty')}</p>
            <p className="text-sm mt-1">{t('products.emptyHint')}</p>
          </div>
        ) : (
          <>
            {/* Featured section */}
            {pinnedJerseys.length > 0 && page === 1 && (
              <div className="mb-8">
                <div className="rounded-xl border border-amber-400/40 bg-amber-400/5 overflow-hidden mb-6">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-400/30 bg-amber-400/10">
                    <Star size={15} className="fill-amber-400 text-amber-400 flex-shrink-0" />
                    <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                      {t('products.featured')}
                    </h2>
                    <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-400 font-medium border border-amber-400/30">
                      {pinnedJerseys.length}
                    </span>
                  </div>
                  <div className={cn(
                    'p-4',
                    view === 'grid'
                      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'
                      : 'space-y-3'
                  )}>
                    {view === 'grid'
                      ? pinnedJerseys.map((j) => (
                          <JerseyCard key={j._id} jersey={j} onClick={() => openDetail(j)} />
                        ))
                      : pinnedJerseys.map((j) => (
                          <ListRow key={j._id} jersey={j} onClick={() => openDetail(j)} />
                        ))
                    }
                  </div>
                </div>

                {regularJerseys.length > 0 && (
                  <h2 className="text-sm font-medium text-[var(--text-muted)] mb-4">{t('products.allJerseys')}</h2>
                )}
              </div>
            )}

            {/* Regular jerseys */}
            {view === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {regularJerseys.map((j) => (
                  <JerseyCard key={j._id} jersey={j} onClick={() => openDetail(j)} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {regularJerseys.map((j) => (
                  <ListRow key={j._id} jersey={j} onClick={() => openDetail(j)} />
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-6">
          <Pagination
            page={page}
            total={total}
            limit={LIMIT}
            onChange={handlePageChange}
          />
        </div>
      </main>

      {/* Mobile contact bar */}
      {contactLinks.length > 0 && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-[var(--bg-secondary)] border-t border-[var(--border)] flex gap-2">
          {contactLinks.map(({ platform, label, link }) => {
            const Icon = getPlatformIcon(platform);
            return (
              <a key={`${platform}-${label}`} href={link} target="_blank" rel="noreferrer" className="flex-1 cursor-pointer">
                <Button variant="outline" size="sm" className="w-full gap-1.5 cursor-pointer">
                  <Icon size={14} /> {label || platform} <ExternalLink size={11} className="opacity-60" />
                </Button>
              </a>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <JerseyDetailDialog
        jersey={detailJersey}
        open={!!detailJersey}
        onClose={closeDetail}
        mode="public"
      />
    </div>
  );
}
