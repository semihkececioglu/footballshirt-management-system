import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { reportService } from '@/services/api';
import { formatDate } from '@/lib/utils';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';

function SectionTitle({ children }) {
  return (
    <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
      {children}
    </h3>
  );
}

function StatRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
      <span className="text-sm text-[var(--text-muted)]">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>
        {value}
      </span>
    </div>
  );
}

export default function ReportsPage() {
  const { t, i18n } = useTranslation();
  const formatCurrency = useFormatCurrency();

  const MONTHS = [
    t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'),
    t('months.may'), t('months.jun'), t('months.jul'), t('months.aug'),
    t('months.sep'), t('months.oct'), t('months.nov'), t('months.dec'),
  ];

  const [available, setAvailable] = useState({});
  const [availableLoading, setAvailableLoading] = useState(true);
  const [expandedYears, setExpandedYears] = useState({});

  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    async function loadAvailable() {
      setAvailableLoading(true);
      try {
        const res = await reportService.available();
        const data = res.data.data || {};
        setAvailable(data);
        // Auto-expand the most recent year
        const years = Object.keys(data).sort((a, b) => Number(b) - Number(a));
        if (years.length > 0) {
          setExpandedYears({ [years[0]]: true });
        }
      } catch {
        toast.error(t('reports.listLoadError'));
      } finally {
        setAvailableLoading(false);
      }
    }
    loadAvailable();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedYear || !selectedMonth) return;
    async function loadReport() {
      setReportLoading(true);
      setReport(null);
      try {
        const res = await reportService.monthly(selectedYear, selectedMonth);
        setReport(res.data.data);
      } catch {
        toast.error(t('reports.loadError'));
      } finally {
        setReportLoading(false);
      }
    }
    loadReport();
  }, [selectedYear, selectedMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleYear(year) {
    setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }));
  }

  function selectMonth(year, month) {
    setSelectedYear(year);
    setSelectedMonth(month);
  }

  function handleExportExcel() {
    if (!report) return;
    const wb = XLSX.utils.book_new();
    // Sales sheet
    const salesData = (report.sales || []).map((s) => ({
      [t('reports.tableHeader.date')]: s.soldAt ? formatDate(s.soldAt) : '',
      [t('reports.tableHeader.jersey')]: s.jerseyId?.teamName || s.teamName || '',
      [t('reports.tableHeader.buyer')]: s.buyerName || '',
      [t('reports.tableHeader.platform')]: s.platform || '',
      [t('reports.tableHeader.buyPrice')]: s.buyPrice || 0,
      [t('reports.tableHeader.sellPrice')]: s.salePrice || 0,
      [t('reports.tableHeader.profit')]: (s.salePrice || 0) - (s.buyPrice || 0),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salesData), t('reports.salesList'));
    // Purchases sheet
    const purchasesData = (report.purchases || []).map((p) => ({
      [t('reports.tableHeader.date')]: p.purchaseDate ? formatDate(p.purchaseDate) : '',
      [t('reports.tableHeader.jersey')]: p.teamName || '',
      [t('reports.tableHeader.platform')]: p.platform || '',
      [t('reports.tableHeader.price')]: p.buyPrice || 0,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(purchasesData), t('reports.purchasesList'));
    XLSX.writeFile(wb, `report_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.xlsx`);
  }

  function handleExportCSV() {
    if (!report) return;
    const headers = [t('reports.tableHeader.date'), t('reports.tableHeader.jersey'), t('reports.tableHeader.buyer'), t('reports.tableHeader.platform'), t('reports.tableHeader.buyPrice'), t('reports.tableHeader.sellPrice'), t('reports.tableHeader.profit')];
    const rows = (report.sales || []).map((s) => [
      s.soldAt ? formatDate(s.soldAt) : '',
      s.jerseyId?.teamName || s.teamName || '',
      s.buyerName || '',
      s.platform || '',
      s.buyPrice || 0,
      s.salePrice || 0,
      (s.salePrice || 0) - (s.buyPrice || 0),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const sortedYears = Object.keys(available).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="flex gap-4 h-full min-h-[600px]">
      {/* Left: Navigation Panel */}
      <div className="w-52 flex-shrink-0 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
            {t('reports.periods')}
          </p>
        </div>
        <div className="overflow-y-auto max-h-[calc(100vh-220px)]">
          {availableLoading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-7 rounded" />
              ))}
            </div>
          ) : sortedYears.length === 0 ? (
            <p className="px-4 py-6 text-xs text-[var(--text-muted)]">{t('reports.noReports')}</p>
          ) : (
            <div className="py-1">
              {sortedYears.map((year) => {
                const months = (available[year] || []).sort((a, b) => Number(b) - Number(a));
                const isExpanded = expandedYears[year];
                return (
                  <div key={year}>
                    <button
                      onClick={() => toggleYear(year)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown size={14} className="text-[var(--text-muted)]" />
                      ) : (
                        <ChevronRight size={14} className="text-[var(--text-muted)]" />
                      )}
                      {year}
                    </button>
                    {isExpanded && (
                      <div className="ml-4 border-l border-[var(--border)] pl-3 mb-1">
                        {months.map((month) => {
                          const isSelected =
                            selectedYear === year && selectedMonth === month;
                          const monthName = MONTHS[Number(month) - 1] || month;
                          return (
                            <button
                              key={month}
                              onClick={() => selectMonth(year, month)}
                              className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                                isSelected
                                  ? 'bg-[var(--accent)] text-white font-medium'
                                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                              }`}
                            >
                              <FileText size={12} />
                              {monthName}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Report Detail */}
      <div className="flex-1 min-w-0">
        {!selectedYear ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-3">
            <FileText size={40} className="opacity-30" />
            <p className="text-sm">{t('reports.selectPeriod')}</p>
          </div>
        ) : reportLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48 rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-48 rounded-xl" />
          </div>
        ) : !report ? (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
            <p className="text-sm">{t('reports.reportNotFound')}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Title */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  {MONTHS[Number(selectedMonth) - 1]} {selectedYear} {t('reports.monthlyReport')}
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{t('reports.monthlySummary')}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                    <Download size={14} /> {t('reports.export')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportExcel}>{t('reports.exportExcel')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCSV}>{t('reports.exportCSV')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: t('reports.totalSold'), value: report.totalSold ?? 0 },
                { label: t('reports.totalRevenue'), value: formatCurrency(report.totalRevenue ?? 0), highlight: true },
                { label: t('reports.totalCost'), value: formatCurrency(report.totalCost ?? 0) },
                { label: t('reports.netProfit'), value: formatCurrency(report.netProfit ?? 0), highlight: true },
                {
                  label: t('reports.profitRate'),
                  value:
                    report.totalRevenue > 0
                      ? `%${(((report.netProfit ?? 0) / report.totalRevenue) * 100).toFixed(1)}`
                      : '—',
                  highlight: true,
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4"
                >
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">{card.label}</p>
                  <p
                    className={`text-xl font-semibold mt-1 ${
                      card.highlight ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Purchase Summary Cards */}
            {(report.totalPurchases > 0 || report.totalPurchaseSpend > 0) && (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t('reports.totalPurchases'), value: report.totalPurchases ?? 0 },
                  { label: t('reports.totalPurchaseSpend'), value: formatCurrency(report.totalPurchaseSpend ?? 0) },
                ].map((card) => (
                  <div key={card.label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">{card.label}</p>
                    <p className="text-xl font-semibold mt-1 text-[var(--text-primary)]">{card.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Platform Breakdown */}
            {report.platforms && report.platforms.length > 0 && (
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
                <SectionTitle>{t('reports.platformBreakdown')}</SectionTitle>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="py-2 text-left text-xs text-[var(--text-muted)] font-medium">{t('reports.tableHeader.platform')}</th>
                      <th className="py-2 text-right text-xs text-[var(--text-muted)] font-medium">{t('reports.tableHeader.sales')}</th>
                      <th className="py-2 text-right text-xs text-[var(--text-muted)] font-medium">{t('reports.tableHeader.revenue')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.platforms.map((p, i) => (
                      <tr key={i} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-2 text-[var(--text-primary)]">{p.platform || '—'}</td>
                        <td className="py-2 text-right text-[var(--text-muted)]">{p.count ?? 0}</td>
                        <td className="py-2 text-right font-medium text-[var(--accent)]">
                          {formatCurrency(p.revenue ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sales List */}
            {report.sales && report.sales.length > 0 && (
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
                <SectionTitle>{t('reports.salesList')} ({report.sales.length})</SectionTitle>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="py-2 text-left text-xs text-[var(--text-muted)] font-medium">{t('reports.tableHeader.jersey')}</th>
                      <th className="py-2 text-left text-xs text-[var(--text-muted)] font-medium hidden sm:table-cell">{t('reports.tableHeader.buyer')}</th>
                      <th className="py-2 text-right text-xs text-[var(--text-muted)] font-medium hidden lg:table-cell">{t('reports.tableHeader.buyPrice')}</th>
                      <th className="py-2 text-right text-xs text-[var(--text-muted)] font-medium">{t('reports.tableHeader.sellPrice')}</th>
                      <th className="py-2 text-right text-xs text-[var(--text-muted)] font-medium hidden md:table-cell">{t('reports.tableHeader.profit')}</th>
                      <th className="py-2 text-right text-xs text-[var(--text-muted)] font-medium hidden md:table-cell">{t('reports.tableHeader.date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.sales.map((sale, i) => {
                      const profit = (sale.salePrice ?? 0) - (sale.buyPrice || 0);
                      const hasBuyPrice = sale.buyPrice > 0;
                      const saleSeason = sale.jerseyId?.season || sale.season;
                      const saleType = sale.jerseyId?.type || sale.type;
                      return (
                      <tr key={i} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-2">
                          <span className="text-[var(--text-primary)] font-medium">
                            {sale.jerseyId?.teamName || sale.teamName || '—'}
                          </span>
                          {(saleSeason || saleType) && (
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">
                              {[saleSeason, saleType].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </td>
                        <td className="py-2 text-[var(--text-muted)] hidden sm:table-cell">
                          {sale.buyerName || '—'}
                        </td>
                        <td className="py-2 text-right text-[var(--text-muted)] hidden lg:table-cell">
                          {hasBuyPrice ? formatCurrency(sale.buyPrice) : '—'}
                        </td>
                        <td className="py-2 text-right font-medium text-[var(--accent)]">
                          {formatCurrency(sale.salePrice ?? 0)}
                        </td>
                        <td className="py-2 text-right hidden md:table-cell">
                          {hasBuyPrice ? (
                            <span className={profit >= 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                              {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-2 text-right text-[var(--text-muted)] hidden md:table-cell">
                          {formatDate(sale.soldAt)}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Purchases List */}
            {report.purchases && report.purchases.length > 0 && (
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
                <SectionTitle>{t('reports.purchasesList')} ({report.purchases.length})</SectionTitle>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="py-2 text-left text-xs text-[var(--text-muted)] font-medium">{t('reports.tableHeader.jersey')}</th>
                      <th className="py-2 text-left text-xs text-[var(--text-muted)] font-medium hidden sm:table-cell">{t('reports.tableHeader.platform')}</th>
                      <th className="py-2 text-right text-xs text-[var(--text-muted)] font-medium">{t('reports.tableHeader.price')}</th>
                      <th className="py-2 text-right text-xs text-[var(--text-muted)] font-medium hidden md:table-cell">{t('reports.tableHeader.date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.purchases.map((purchase, i) => {
                      const totalQty = purchase.sizeVariants?.length
                        ? purchase.sizeVariants.reduce((s, v) => s + (v.stockCount || 1), 0)
                        : 1;
                      return (
                        <tr key={i} className="border-b border-[var(--border)] last:border-0">
                          <td className="py-2">
                            <span className="text-[var(--text-primary)] font-medium">
                              {purchase.teamName || '—'}
                            </span>
                            {(purchase.season || purchase.type) && (
                              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                {[purchase.season, purchase.type].filter(Boolean).join(' · ')}
                              </p>
                            )}
                          </td>
                          <td className="py-2 text-[var(--text-muted)] hidden sm:table-cell">
                            {purchase.platform || '—'}
                          </td>
                          <td className="py-2 text-right font-medium text-[var(--text-primary)]">
                            <span>{formatCurrency((purchase.buyPrice ?? 0) * totalQty)}</span>
                            {totalQty > 1 && (
                              <span className="block text-[10px] text-[var(--text-muted)]">
                                {formatCurrency(purchase.buyPrice ?? 0)} × {totalQty}
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-right text-[var(--text-muted)] hidden md:table-cell">
                            {formatDate(purchase.purchaseDate)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Empty state */}
            {(!report.sales || report.sales.length === 0) &&
              (!report.purchases || report.purchases.length === 0) && (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-10 text-center">
                  <p className="text-sm text-[var(--text-muted)]">{t('reports.noRecords')}</p>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
