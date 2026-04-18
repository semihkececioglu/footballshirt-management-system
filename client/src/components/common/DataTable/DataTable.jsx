import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

/**
 * Reusable DataTable
 * Props:
 *  columns: [{ key, label, render?, sortable?, className? }]
 *  data: any[]
 *  loading?: boolean
 *  selectable?: boolean
 *  selectedIds?: string[]
 *  onSelectionChange?: (ids) => void
 *  getRowId?: (row) => string
 *  emptyText?: string
 *  onSort?: (key, direction) => void  — if undefined, client-side sort
 *  sort?: { key, dir }                — controlled sort state
 */
export function DataTable({
  columns,
  data = [],
  loading,
  selectable,
  selectedIds = [],
  onSelectionChange,
  getRowId = (r) => r._id,
  emptyText,
  onSort,
  sort,
  rowClassName,
  onRowClick,
}) {
  const { t } = useTranslation();
  const [localSort, setLocalSort] = useState({ key: null, dir: 'asc' });

  const activeSort = sort || localSort;

  function handleHeaderClick(col) {
    if (!col.sortable) return;
    const newDir = activeSort.key === col.key && activeSort.dir === 'asc' ? 'desc' : 'asc';
    if (onSort) {
      onSort(col.key, newDir);
    } else {
      setLocalSort({ key: col.key, dir: newDir });
    }
  }

  const sortedData = useMemo(() => {
    if (onSort || !activeSort.key) return data;
    return [...data].sort((a, b) => {
      const av = a[activeSort.key] ?? '';
      const bv = b[activeSort.key] ?? '';
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv), 'tr');
      return activeSort.dir === 'asc' ? cmp : -cmp;
    });
  }, [data, activeSort, onSort]);

  function toggleAll() {
    if (!onSelectionChange) return;
    const allIds = data.map(getRowId);
    const allSelected = allIds.every((id) => selectedIds.includes(id));
    onSelectionChange(allSelected ? [] : allIds);
  }

  function toggleRow(id) {
    if (!onSelectionChange) return;
    onSelectionChange(
      selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]
    );
  }

  function SortIcon({ colKey }) {
    if (activeSort.key !== colKey) return <ChevronsUpDown size={14} className="opacity-30" />;
    return activeSort.dir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
              {selectable && (
                <th className="w-10 px-3 py-3">
                  <Checkbox
                    checked={data.length > 0 && data.map(getRowId).every((id) => selectedIds.includes(id))}
                    onCheckedChange={toggleAll}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-3 py-3 text-left font-medium text-[var(--text-muted)] whitespace-nowrap',
                    col.sortable && 'cursor-pointer select-none hover:text-[var(--text-primary)]',
                    col.className
                  )}
                  onClick={() => handleHeaderClick(col)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-3 py-12 text-center text-[var(--text-muted)]"
                >
                  {emptyText ?? t('common.noRecords')}
                </td>
              </tr>
            ) : (
              sortedData.map((row) => {
                const id = getRowId(row);
                const isSelected = selectedIds.includes(id);
                return (
                  <tr
                    key={id}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'border-b border-[var(--border)] last:border-0 transition-colors',
                      isSelected ? 'bg-[var(--accent)]/5' : 'hover:bg-[var(--bg-secondary)]/50',
                      onRowClick && 'cursor-pointer',
                      rowClassName?.(row)
                    )}
                  >
                    {selectable && (
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRow(id)}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className={cn('px-3 py-2.5', col.className)}>
                        {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '-')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
