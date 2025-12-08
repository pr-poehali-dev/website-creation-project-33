import React from 'react';
import { Button } from '@/components/ui/button';
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

export default function OrganizationStatsFilters({
  sortBy,
  setSortBy,
  timeRange,
  setTimeRange,
  setSelectedWeekIndex,
  setSelectedMonthIndex,
  selectedWeekIndex,
  selectedMonthIndex,
  selectedYear,
  setSelectedYear,
  availableWeeks,
  availableMonths,
  availableYears,
  totalContactsForPeriod,
}: OrganizationStatsFiltersProps) {
  return (
    <div className="mb-4 md:mb-6 space-y-3 md:space-y-4">
      <div className="flex flex-wrap gap-1.5 md:gap-2 items-center">
        <span className="text-xs md:text-sm text-slate-300 font-medium">Сортировка:</span>
        <Button
          onClick={() => setSortBy('revenue')}
          variant={sortBy === 'revenue' ? 'default' : 'outline'}
          size="sm"
          className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${sortBy === 'revenue'
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
        >
          По доходу
        </Button>
        <Button
          onClick={() => setSortBy('contacts')}
          variant={sortBy === 'contacts' ? 'default' : 'outline'}
          size="sm"
          className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${sortBy === 'contacts'
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
        >
          По контактам
        </Button>
        <Button
          onClick={() => setSortBy('average')}
          variant={sortBy === 'average' ? 'default' : 'outline'}
          size="sm"
          className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${sortBy === 'average'
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
        >
          По среднему
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-1.5 md:gap-2 items-center">
        <span className="text-xs md:text-sm text-slate-300 font-medium">Период:</span>
        <Button
          onClick={() => {
            setTimeRange('week');
            setSelectedWeekIndex(0);
          }}
          variant={timeRange === 'week' ? 'default' : 'outline'}
          size="sm"
          className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${timeRange === 'week'
            ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
        >
          Неделя
        </Button>
        <Button
          onClick={() => {
            setTimeRange('month');
            setSelectedMonthIndex(0);
          }}
          variant={timeRange === 'month' ? 'default' : 'outline'}
          size="sm"
          className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${timeRange === 'month'
            ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
        >
          Месяц
        </Button>
        <Button
          onClick={() => {
            setTimeRange('year');
            setSelectedYear(new Date().getFullYear());
          }}
          variant={timeRange === 'year' ? 'default' : 'outline'}
          size="sm"
          className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${timeRange === 'year'
            ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
        >
          Год
        </Button>
      </div>

      {timeRange === 'week' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setSelectedWeekIndex(prev => Math.max(0, prev - 1))}
              disabled={selectedWeekIndex === 0}
              variant="outline"
              size="sm"
              className="h-8 bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700"
            >
              <Icon name="ChevronLeft" size={16} />
            </Button>
            <span className="text-xs md:text-sm text-slate-200 font-medium min-w-[180px] text-center">
              {availableWeeks[selectedWeekIndex]?.label}
            </span>
            <Button
              onClick={() => setSelectedWeekIndex(prev => Math.min(availableWeeks.length - 1, prev + 1))}
              disabled={selectedWeekIndex >= availableWeeks.length - 1}
              variant="outline"
              size="sm"
              className="h-8 bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700"
            >
              <Icon name="ChevronRight" size={16} />
            </Button>
          </div>
          <div className="text-center">
            <span className="text-sm font-semibold text-slate-100">
              Всего за неделю: {totalContactsForPeriod.toLocaleString('ru-RU')} контактов
            </span>
          </div>
        </div>
      )}

      {timeRange === 'month' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setSelectedMonthIndex(prev => Math.max(0, prev - 1))}
              disabled={selectedMonthIndex === 0}
              variant="outline"
              size="sm"
              className="h-8 bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700"
            >
              <Icon name="ChevronLeft" size={16} />
            </Button>
            <span className="text-xs md:text-sm text-slate-200 font-medium min-w-[180px] text-center">
              {availableMonths[selectedMonthIndex]?.label}
            </span>
            <Button
              onClick={() => setSelectedMonthIndex(prev => Math.min(availableMonths.length - 1, prev + 1))}
              disabled={selectedMonthIndex >= availableMonths.length - 1}
              variant="outline"
              size="sm"
              className="h-8 bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700"
            >
              <Icon name="ChevronRight" size={16} />
            </Button>
          </div>
          <div className="text-center">
            <span className="text-sm font-semibold text-slate-100">
              Всего за месяц: {totalContactsForPeriod.toLocaleString('ru-RU')} контактов
            </span>
          </div>
        </div>
      )}

      {timeRange === 'year' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setSelectedYear(prev => Math.min(prev + 1, availableYears[0]))}
              disabled={selectedYear >= availableYears[0]}
              variant="outline"
              size="sm"
              className="h-8 bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700"
            >
              <Icon name="ChevronLeft" size={16} />
            </Button>
            <span className="text-xs md:text-sm text-slate-200 font-medium min-w-[100px] text-center">
              {selectedYear}
            </span>
            <Button
              onClick={() => setSelectedYear(prev => Math.max(prev - 1, availableYears[availableYears.length - 1]))}
              disabled={selectedYear <= availableYears[availableYears.length - 1]}
              variant="outline"
              size="sm"
              className="h-8 bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700"
            >
              <Icon name="ChevronRight" size={16} />
            </Button>
          </div>
          <div className="text-center">
            <span className="text-sm font-semibold text-slate-100">
              Всего за год: {totalContactsForPeriod.toLocaleString('ru-RU')} контактов
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
