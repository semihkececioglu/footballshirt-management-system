import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DayPicker } from 'react-day-picker';
import { tr, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { plannerService } from '@/services/api';
import DayDetailPanel, { PLAN_TYPES } from './DayDetailPanel';
import PlanItemDialog from './PlanItemDialog';

// Build a map: "YYYY-MM-DD" → [planItems...]
function buildDayMap(items) {
  const map = {};
  items.forEach((item) => {
    const d = new Date(item.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!map[key]) map[key] = [];
    map[key].push(item);
  });
  return map;
}

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toMonthParam(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function PlannerPage() {
  const { t, i18n } = useTranslation();
  const today = new Date();
  const [month, setMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [monthItems, setMonthItems] = useState([]);  // lightweight: date+type+status
  const [dayItems, setDayItems] = useState([]);      // full: with jersey populated
  const [dayLoading, setDayLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const dayMap = buildDayMap(monthItems);

  // Fetch month overview
  const fetchMonth = useCallback(async (m) => {
    try {
      const res = await plannerService.getMonth(toMonthParam(m));
      setMonthItems(res.data?.data || []);
    } catch {
      // ignore
    }
  }, []);

  // Fetch day detail
  const fetchDay = useCallback(async (d) => {
    setDayLoading(true);
    try {
      const res = await plannerService.getDay(toDateKey(d));
      setDayItems(res.data?.data || []);
    } catch {
      setDayItems([]);
    } finally {
      setDayLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonth(month);
  }, [month, fetchMonth]);

  useEffect(() => {
    if (selectedDate) fetchDay(selectedDate);
  }, [selectedDate, fetchDay]);

  const handleDayClick = (date) => {
    if (!date) return;
    setSelectedDate(date);
  };

  const handleMonthChange = (newMonth) => {
    setMonth(newMonth);
  };

  const openAdd = () => {
    setEditItem(null);
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleSaved = () => {
    fetchDay(selectedDate);
    fetchMonth(month);
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-0">
      {/* Calendar panel */}
      <div className="md:w-auto md:flex-shrink-0 p-4 md:p-6 border-b md:border-b-0 md:border-r border-[var(--border)]">
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={handleDayClick}
          month={month}
          onMonthChange={handleMonthChange}
          locale={i18n.language === 'en' ? enUS : tr}
          showOutsideDays
          captionLayout="dropdown"
          fromYear={2020}
          toYear={2030}
          className="planner-calendar"
          classNames={{
            months: 'flex flex-col',
            month: 'space-y-3',
            caption: 'flex justify-center pt-0.5 relative items-center gap-1',
            caption_label: 'hidden',
            caption_dropdowns: 'flex gap-1',
            dropdown: cn(
              'text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)]',
              'border border-[var(--border)] rounded-md px-1.5 py-1 cursor-pointer',
              'hover:border-[var(--accent)] transition-colors outline-none appearance-none'
            ),
            vhidden: 'hidden',
            nav: 'flex items-center gap-1',
            nav_button: cn(
              'h-6 w-6 bg-transparent p-0 rounded border border-[var(--border)]',
              'flex items-center justify-center text-[var(--text-muted)]',
              'hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors'
            ),
            nav_button_previous: '',
            nav_button_next: '',
            table: 'w-full border-collapse',
            head_row: 'flex',
            head_cell: 'text-[var(--text-muted)] w-9 font-normal text-[10px] text-center pb-1',
            row: 'flex w-full mt-1',
            cell: cn(
              'h-9 w-9 text-center text-xs p-0 relative',
              'focus-within:relative focus-within:z-20'
            ),
            day: cn(
              'h-9 w-9 p-0 font-normal rounded-md text-xs',
              'flex items-center justify-center',
              'hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors',
              'aria-selected:opacity-100'
            ),
            day_selected: 'bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]',
            day_today: 'border border-[var(--accent)] text-[var(--accent)] font-semibold',
            day_outside: 'text-[var(--text-muted)] opacity-40',
            day_disabled: 'text-[var(--text-muted)] opacity-40',
            day_hidden: 'invisible',
          }}
          components={{
            IconLeft: () => <ChevronLeft size={13} />,
            IconRight: () => <ChevronRight size={13} />,
            Day: ({ date, displayMonth }) => {
              const key = toDateKey(date);
              const items = dayMap[key] || [];
              const isCurrentMonth = date.getMonth() === displayMonth.getMonth();
              const types = [...new Set(items.map((i) => i.type))];
              const doneAll = items.length > 0 && items.every((i) => i.status === 'done');
              return (
                <button
                  type="button"
                  onClick={() => handleDayClick(date)}
                  className={cn(
                    'h-9 w-9 p-0 font-normal rounded-md text-xs relative',
                    'flex flex-col items-center justify-center gap-0',
                    'hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors',
                    !isCurrentMonth && 'opacity-40',
                    selectedDate && toDateKey(selectedDate) === key
                      ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                      : toDateKey(today) === key
                      ? 'border border-[var(--accent)] text-[var(--accent)] font-semibold'
                      : ''
                  )}
                >
                  <span className={cn('leading-none', items.length > 0 ? '-mt-0.5' : '')}>
                    {date.getDate()}
                  </span>
                  {types.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {types.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className={cn(
                            'w-1 h-1 rounded-full',
                            doneAll && 'opacity-40',
                            t === 'share' && 'bg-blue-500',
                            t === 'list' && 'bg-green-500',
                            t === 'photo' && 'bg-purple-500',
                            t === 'task' && 'bg-amber-500',
                            // Override dot color when selected to stay visible
                            selectedDate && toDateKey(selectedDate) === key && 'bg-white/70'
                          )}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            },
          }}
        />

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3">
          {Object.entries(PLAN_TYPES).map(([key, meta]) => {
            const Icon = meta.icon;
            const typeLabel = { share: t('planner.typeShare'), list: t('planner.typeList'), photo: t('planner.typePhoto'), task: t('planner.typeTask') }[key] ?? meta.label;
            return (
              <div key={key} className="flex items-center gap-1">
                <Icon size={11} className={meta.color} />
                <span className="text-[10px] text-[var(--text-muted)]">{typeLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day detail panel */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {dayLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-[var(--text-muted)]">{t('common.loading')}</div>
          </div>
        ) : (
          <DayDetailPanel
            date={selectedDate}
            items={dayItems}
            onAdd={openAdd}
            onEdit={openEdit}
            onRefresh={() => handleSaved()}
          />
        )}
      </div>

      <PlanItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        date={selectedDate}
        editItem={editItem}
        onSaved={handleSaved}
      />
    </div>
  );
}
