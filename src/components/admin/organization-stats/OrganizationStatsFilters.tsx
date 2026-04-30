import React from 'react';
import Icon from '@/components/ui/icon';

interface OrganizationStatsFiltersProps {
  sortBy: 'revenue' | 'contacts' | 'average';
  setSortBy: (value: 'revenue' | 'contacts' | 'average') => void;
  timeRange: 'week' | 'month' | 'year';
  setTimeRange: (value: 'week' | 'month' | 'year') => void;
  setSelectedWeekIndex: (value: number) => void;
  setSelectedMonthIndex: (value: number) => void;
  selectedWeekIndex: number;
  selectedMonthIndex: number;
  selectedYear: number;
  setSelectedYear: (value: number) => void;
  availableWeeks: Array<{ start: Date; end: Date; label: string }>;
  availableMonths: Array<{ date: Date; label: string }>;
  availableYears: number[];
  totalContactsForPeriod: number;
}

const btn = (active: boolean) =>
  `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
    active ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
  }`;

const navBtn = (disabled: boolean) =>
  `w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${
    disabled ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
  }`;

export default function OrganizationStatsFilters({
  sortBy, setSortBy,
  timeRange, setTimeRange,
  setSelectedWeekIndex, setSelectedMonthIndex,
  selectedWeekIndex, selectedMonthIndex,
  selectedYear, setSelectedYear,
  availableWeeks, availableMonths, availableYears,
  totalContactsForPeriod,
}: OrganizationStatsFiltersProps) {
  return (
    <div className="space-y-3 mb-4">
      {/* Сортировка */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-xs text-gray-500 font-medium">Сортировка:</span>
        <button onClick={() => setSortBy('revenue')} className={btn(sortBy === 'revenue')}>По доходу</button>
        <button onClick={() => setSortBy('contacts')} className={btn(sortBy === 'contacts')}>По контактам</button>
        <button onClick={() => setSortBy('average')} className={btn(sortBy === 'average')}>По среднему</button>
      </div>

      {/* Период */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-xs text-gray-500 font-medium">Период:</span>
        <button onClick={() => { setTimeRange('week'); setSelectedWeekIndex(0); }} className={btn(timeRange === 'week')}>Неделя</button>
        <button onClick={() => { setTimeRange('month'); setSelectedMonthIndex(0); }} className={btn(timeRange === 'month')}>Месяц</button>
        <button onClick={() => { setTimeRange('year'); setSelectedYear(new Date().getFullYear()); }} className={btn(timeRange === 'year')}>Год</button>
      </div>

      {/* Навигация по неделям */}
      {timeRange === 'week' && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedWeekIndex(Math.min(availableWeeks.length - 1, selectedWeekIndex + 1))}
              disabled={selectedWeekIndex >= availableWeeks.length - 1}
              className={navBtn(selectedWeekIndex >= availableWeeks.length - 1)}
            >
              <Icon name="ChevronLeft" size={15} />
            </button>
            <span className="text-xs text-gray-600 font-medium flex-1 text-center">
              {availableWeeks[selectedWeekIndex]?.label}
            </span>
            <button
              onClick={() => setSelectedWeekIndex(Math.max(0, selectedWeekIndex - 1))}
              disabled={selectedWeekIndex === 0}
              className={navBtn(selectedWeekIndex === 0)}
            >
              <Icon name="ChevronRight" size={15} />
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center">
            Всего за неделю: <span className="font-semibold text-gray-600">{totalContactsForPeriod.toLocaleString('ru-RU')} контактов</span>
          </p>
        </div>
      )}

      {/* Навигация по месяцам */}
      {timeRange === 'month' && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedMonthIndex(Math.min(availableMonths.length - 1, selectedMonthIndex + 1))}
              disabled={selectedMonthIndex >= availableMonths.length - 1}
              className={navBtn(selectedMonthIndex >= availableMonths.length - 1)}
            >
              <Icon name="ChevronLeft" size={15} />
            </button>
            <span className="text-xs text-gray-600 font-medium flex-1 text-center">
              {availableMonths[selectedMonthIndex]?.label}
            </span>
            <button
              onClick={() => setSelectedMonthIndex(Math.max(0, selectedMonthIndex - 1))}
              disabled={selectedMonthIndex === 0}
              className={navBtn(selectedMonthIndex === 0)}
            >
              <Icon name="ChevronRight" size={15} />
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center">
            Всего за месяц: <span className="font-semibold text-gray-600">{totalContactsForPeriod.toLocaleString('ru-RU')} контактов</span>
          </p>
        </div>
      )}

      {/* Навигация по годам */}
      {timeRange === 'year' && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedYear(Math.min(selectedYear + 1, availableYears[0]))}
              disabled={selectedYear >= availableYears[0]}
              className={navBtn(selectedYear >= availableYears[0])}
            >
              <Icon name="ChevronLeft" size={15} />
            </button>
            <span className="text-xs text-gray-600 font-medium flex-1 text-center">{selectedYear}</span>
            <button
              onClick={() => setSelectedYear(Math.max(selectedYear - 1, availableYears[availableYears.length - 1]))}
              disabled={selectedYear <= availableYears[availableYears.length - 1]}
              className={navBtn(selectedYear <= availableYears[availableYears.length - 1])}
            >
              <Icon name="ChevronRight" size={15} />
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center">
            Всего за год: <span className="font-semibold text-gray-600">{totalContactsForPeriod.toLocaleString('ru-RU')} контактов</span>
          </p>
        </div>
      )}
    </div>
  );
}
