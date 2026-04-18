import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, ShoppingBag, Package, DollarSign, BarChart2, ShoppingCart, Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/common/StatCard/StatCard';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { statsService } from '@/services/api';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';

const CHART_COLORS = ['#8B4513', '#D2691E', '#C4854A', '#E8A06A', '#F5CBA7', '#2C2416', '#6B5B45'];

const CURRENT_YEAR = new Date().getFullYear();

function SectionTitle({ children }) {
  return (
    <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">
      {children}
    </h2>
  );
}

function ChartCard({ title, children, loading, action }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
        {action}
      </div>
      {loading ? <Skeleton className="h-56 w-full rounded-lg" /> : children}
    </div>
  );
}

export default function StatisticsPage() {
  const { t, i18n } = useTranslation();
  const formatCurrency = useFormatCurrency();

  const MONTHS = [
    t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'),
    t('months.may'), t('months.jun'), t('months.jul'), t('months.aug'),
    t('months.sep'), t('months.oct'), t('months.nov'), t('months.dec'),
  ];

  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [avgSaleTime, setAvgSaleTime] = useState(null);

  const [year, setYear] = useState(CURRENT_YEAR);
  const [monthly, setMonthly] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(true);

  const [purchaseYear, setPurchaseYear] = useState(CURRENT_YEAR);
  const [monthlyPurchases, setMonthlyPurchases] = useState([]);
  const [monthlyPurchasesLoading, setMonthlyPurchasesLoading] = useState(true);

  const [platforms, setPlatforms] = useState([]);
  const [platformsLoading, setPlatformsLoading] = useState(true);

  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);

  const [sizes, setSizes] = useState([]);
  const [sizesLoading, setSizesLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      setOverviewLoading(true);
      try {
        const res = await statsService.overview();
        setOverview(res.data.data);
      } catch {
        toast.error(t('statistics.loadError'));
      } finally {
        setOverviewLoading(false);
      }
    }
    async function loadAvgSaleTime() {
      try {
        const res = await statsService.averageSaleTime();
        setAvgSaleTime(res.data.data);
      } catch {
        // sessiz hata — isteğe bağlı stat
      }
    }
    async function loadPlatforms() {
      setPlatformsLoading(true);
      try {
        const res = await statsService.platforms();
        setPlatforms(res.data.data || []);
      } catch {
        toast.error(t('statistics.loadError'));
      } finally {
        setPlatformsLoading(false);
      }
    }
    async function loadTeams() {
      setTeamsLoading(true);
      try {
        const res = await statsService.teams();
        setTeams((res.data.data || []).slice(0, 10));
      } catch {
        toast.error(t('statistics.loadError'));
      } finally {
        setTeamsLoading(false);
      }
    }
    async function loadSizes() {
      setSizesLoading(true);
      try {
        const res = await statsService.sizes();
        setSizes(res.data.data || []);
      } catch {
        toast.error(t('statistics.loadError'));
      } finally {
        setSizesLoading(false);
      }
    }

    loadOverview();
    loadAvgSaleTime();
    loadPlatforms();
    loadTeams();
    loadSizes();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function loadMonthly() {
      setMonthlyLoading(true);
      try {
        const res = await statsService.monthlySales(year);
        const raw = res.data.data || [];
        const filled = MONTHS.map((name, i) => {
          const found = raw.find((r) => Number(r.month) === i + 1);
          return { name, count: found?.count || 0, revenue: found?.revenue || 0 };
        });
        setMonthly(filled);
      } catch {
        toast.error(t('statistics.loadError'));
      } finally {
        setMonthlyLoading(false);
      }
    }
    loadMonthly();
  }, [year, i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function loadMonthlyPurchases() {
      setMonthlyPurchasesLoading(true);
      try {
        const res = await statsService.monthlyPurchases(purchaseYear);
        const raw = res.data.data || [];
        const filled = MONTHS.map((name, i) => {
          const found = raw.find((r) => Number(r.month) === i + 1);
          return { name, count: found?.count || 0, itemCount: found?.itemCount || 0, spend: found?.spend || 0 };
        });
        setMonthlyPurchases(filled);
      } catch {
        toast.error(t('statistics.loadError'));
      } finally {
        setMonthlyPurchasesLoading(false);
      }
    }
    loadMonthlyPurchases();
  }, [purchaseYear, i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  const yearOptions = Array.from({ length: 7 }, (_, i) => CURRENT_YEAR - 3 + i);

  const YearSelect = ({ value, onChange }) => (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="w-20 h-7 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {yearOptions.map((y) => (
          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-6">
      {/* Sales Overview */}
      <div>
        <SectionTitle>{t('statistics.overview')}</SectionTitle>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            label={t('statistics.totalSales')}
            value={overviewLoading ? '—' : (overview?.totalSales ?? 0)}
            icon={TrendingUp}
            loading={overviewLoading}
          />
          <StatCard
            label={t('statistics.totalRevenue')}
            value={overviewLoading ? '—' : formatCurrency(overview?.totalRevenue ?? 0)}
            icon={DollarSign}
            loading={overviewLoading}
          />
          <StatCard
            label={t('statistics.netProfit')}
            value={overviewLoading ? '—' : formatCurrency(overview?.netProfit ?? 0)}
            icon={BarChart2}
            loading={overviewLoading}
          />
          <StatCard
            label={t('statistics.activeListings')}
            value={overviewLoading ? '—' : (overview?.totalForSale ?? 0)}
            icon={ShoppingBag}
            loading={overviewLoading}
          />
          <StatCard
            label={t('statistics.stockValue')}
            value={overviewLoading ? '—' : formatCurrency(overview?.stockValue ?? 0)}
            icon={Package}
            loading={overviewLoading}
          />
          {(overviewLoading || (avgSaleTime && avgSaleTime.count > 0)) && (
            <StatCard
              label={t('statistics.avgSaleTime')}
              value={overviewLoading ? '—' : t('statistics.avgSaleTimeDays', { days: avgSaleTime?.avgDays ?? 0 })}
              icon={Clock}
              loading={overviewLoading}
            />
          )}
        </div>
      </div>

      {/* Purchase Overview */}
      <div>
        <SectionTitle>{t('statistics.purchaseOverview')}</SectionTitle>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            label={t('statistics.totalPurchaseItems')}
            value={overviewLoading ? '—' : (overview?.totalPurchaseItems ?? 0)}
            icon={ShoppingCart}
            loading={overviewLoading}
          />
          <StatCard
            label={t('statistics.totalPurchaseSpend')}
            value={overviewLoading ? '—' : formatCurrency(overview?.totalPurchaseSpend ?? 0)}
            icon={DollarSign}
            loading={overviewLoading}
          />
          <StatCard
            label={t('statistics.totalPurchased')}
            value={overviewLoading ? '—' : (overview?.totalPurchased ?? 0)}
            icon={Package}
            loading={overviewLoading}
          />
        </div>
      </div>

      {/* Monthly Sales + Platform */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ChartCard
            title={t('statistics.monthlySales')}
            loading={monthlyLoading}
            action={<YearSelect value={year} onChange={setYear} />}
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  tickFormatter={(v) => v.slice(0, 3)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="count"
                  orientation="left"
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <YAxis
                  yAxisId="revenue"
                  orientation="right"
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <ChartTooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(value) : value,
                    name === 'revenue' ? t('statistics.revenue') : t('statistics.sales'),
                  ]}
                />
                <Bar yAxisId="count" dataKey="count" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar yAxisId="revenue" dataKey="revenue" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Platform Pie */}
        <div>
          <ChartCard title={t('statistics.topPlatforms')} loading={platformsLoading}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={platforms}
                  dataKey="count"
                  nameKey="platform"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                  label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                  labelLine={false}
                >
                  {platforms.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 justify-center">
              {platforms.map((p, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-xs text-[var(--text-muted)]">{p.platform}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Monthly Purchases */}
      <div>
        <ChartCard
          title={t('statistics.monthlyPurchases')}
          loading={monthlyPurchasesLoading}
          action={<YearSelect value={purchaseYear} onChange={setPurchaseYear} />}
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyPurchases} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                tickFormatter={(v) => v.slice(0, 3)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="items"
                orientation="left"
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <YAxis
                yAxisId="spend"
                orientation="right"
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <ChartTooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value, name) => [
                  name === 'spend' ? formatCurrency(value) : value,
                  name === 'spend' ? t('statistics.purchaseSpend') : t('statistics.purchaseCount'),
                ]}
              />
              <Bar yAxisId="items" dataKey="itemCount" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar yAxisId="spend" dataKey="spend" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Teams + Sizes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 10 Teams */}
        <ChartCard title={t('statistics.topTeams')} loading={teamsLoading}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={teams}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="teamName"
                width={90}
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v) => [v, t('statistics.sales')]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={18}>
                {teams.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Size Distribution */}
        <ChartCard title={t('statistics.sizeDistribution')} loading={sizesLoading}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sizes} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="size"
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <ChartTooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v) => [v, t('statistics.count')]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={36}>
                {sizes.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
