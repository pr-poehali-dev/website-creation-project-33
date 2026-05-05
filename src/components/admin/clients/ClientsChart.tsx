import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import ClientsChartSVG from './ClientsChartSVG';

interface Organization {
  id: number;
  name: string;
  last_shift_date: string | null;
  days_since_last_shift: number | null;
  has_shift_in_period: boolean;
}

interface Shift {
  id: number;
  user_id: number;
  user_name: string;
  organization_id: number;
  organization_name: string;
  shift_date: string;
  shift_start: string;
  shift_end: string;
}

type ChartMode = 'day' | 'week' | 'month' | 'year';
type DayPeriod = 7 | 30 | 60 | 90 | 365;
type WeekPeriod = 7 | 30 | 60 | 90 | 365;
type MonthPeriod = 7 | 30 | 60 | 90 | 365;
type YearPeriod = 1 | 2 | 3 | 5 | 10;

interface ClientsChartProps {
  organizations: Organization[];
  shifts: Shift[];
}

export default function ClientsChart({ organizations, shifts }: ClientsChartProps) {
  const [chartMode, setChartMode] = useState<ChartMode>('month');
  const [dayPeriod, setDayPeriod] = useState<DayPeriod>(30);
  const [weekPeriod, setWeekPeriod] = useState<WeekPeriod>(30);
  const [monthPeriod, setMonthPeriod] = useState<MonthPeriod>(30);
  const [yearPeriod, setYearPeriod] = useState<YearPeriod>(5);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    label: string;
    total: number;
    selected?: number;
  } | null>(null);

  const chartData = useMemo(() => {
    const now = new Date();
    const data: { label: string; total: number; selected: number; date: string }[] = [];

    const shiftsByDate = shifts.reduce((acc, shift) => {
      const date = shift.shift_date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(shift);
      return acc;
    }, {} as Record<string, Shift[]>);

    const getTotalUniqueOrgs = (shiftsArray: Shift[]) => {
      const uniqueOrgIds = new Set(shiftsArray.map(s => s.organization_id));
      return uniqueOrgIds.size;
    };
    
    const hasSelectedOrg = (shiftsArray: Shift[]) => {
      if (!selectedOrgId) return 0;
      return shiftsArray.some(s => s.organization_id === selectedOrgId) ? 1 : 0;
    };

    if (chartMode === 'day') {
      for (let i = dayPeriod - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayShifts = shiftsByDate[dateStr] || [];
        if (getTotalUniqueOrgs(dayShifts) === 0) continue;
        data.push({
          label: `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, '0')}`,
          total: getTotalUniqueOrgs(dayShifts),
          selected: hasSelectedOrg(dayShifts),
          date: dateStr
        });
      }
    } else if (chartMode === 'week') {
      for (let i = weekPeriod - 1; i >= 0; i--) {
        const refDate = new Date(now);
        refDate.setDate(refDate.getDate() - i * 7);
        const day = refDate.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const weekStart = new Date(refDate);
        weekStart.setDate(refDate.getDate() + diff);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const weekShifts: Shift[] = [];
        for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          weekShifts.push(...(shiftsByDate[dateStr] || []));
        }
        if (getTotalUniqueOrgs(weekShifts) === 0) continue;
        data.push({
          label: `${weekStart.getDate()}.${String(weekStart.getMonth() + 1).padStart(2, '0')}-${weekEnd.getDate()}.${String(weekEnd.getMonth() + 1).padStart(2, '0')}`,
          total: getTotalUniqueOrgs(weekShifts),
          selected: hasSelectedOrg(weekShifts),
          date: weekStart.toISOString().split('T')[0]
        });
      }
    } else if (chartMode === 'month') {
      for (let i = monthPeriod - 1; i >= 0; i--) {
        const monthDate = new Date(now);
        monthDate.setMonth(monthDate.getMonth() - i);
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        const monthShifts = shifts.filter(shift => {
          const shiftDate = new Date(shift.shift_date);
          return shiftDate.getFullYear() === year && shiftDate.getMonth() === month;
        });
        if (getTotalUniqueOrgs(monthShifts) === 0) continue;
        data.push({
          label: monthDate.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' }),
          total: getTotalUniqueOrgs(monthShifts),
          selected: hasSelectedOrg(monthShifts),
          date: `${year}-${String(month + 1).padStart(2, '0')}-01`
        });
      }
    } else if (chartMode === 'year') {
      for (let i = yearPeriod - 1; i >= 0; i--) {
        const year = now.getFullYear() - i;
        const yearShifts = shifts.filter(shift => {
          const shiftDate = new Date(shift.shift_date);
          return shiftDate.getFullYear() === year;
        });
        if (getTotalUniqueOrgs(yearShifts) === 0) continue;
        data.push({
          label: year.toString(),
          total: getTotalUniqueOrgs(yearShifts),
          selected: hasSelectedOrg(yearShifts),
          date: `${year}-01-01`
        });
      }
    }

    return data;
  }, [shifts, chartMode, dayPeriod, weekPeriod, monthPeriod, yearPeriod, selectedOrgId]);

  const maxValue = useMemo(() => Math.max(...chartData.map(d => d.total), 1), [chartData]);
  const selectedOrg = organizations.find(org => org.id === selectedOrgId);
  const activeOrgs = organizations.filter((org) => (org as Organization & { is_active?: boolean }).is_active !== false);
  const minValue = 0;
  const valueRange = maxValue - minValue;

  const chartModeLabels: Record<ChartMode, string> = { day: 'Дни', week: 'Недели', month: 'Месяцы', year: 'Годы' };

  const renderPeriodButtons = () => {
    const btnCls = (active: boolean) =>
      `px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all border ${
        active ? 'bg-blue-600 text-white border-transparent shadow-sm' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
      }`;

    if (chartMode === 'day') return (
      <div className="flex flex-wrap gap-1.5 md:gap-2">
        {([7, 30, 60, 90, 365] as DayPeriod[]).map(p => (
          <button key={p} onClick={() => setDayPeriod(p)} className={btnCls(dayPeriod === p)}>{p} дн.</button>
        ))}
      </div>
    );
    if (chartMode === 'week') return (
      <div className="flex flex-wrap gap-1.5 md:gap-2">
        {([7, 30, 60, 90, 365] as WeekPeriod[]).map(p => (
          <button key={p} onClick={() => setWeekPeriod(p)} className={btnCls(weekPeriod === p)}>{p} дн.</button>
        ))}
      </div>
    );
    if (chartMode === 'month') return (
      <div className="flex flex-wrap gap-1.5 md:gap-2">
        {([7, 30, 60, 90, 365] as MonthPeriod[]).map(p => (
          <button key={p} onClick={() => setMonthPeriod(p)} className={btnCls(monthPeriod === p)}>{p} дн.</button>
        ))}
      </div>
    );
    if (chartMode === 'year') return (
      <div className="flex flex-wrap gap-1.5 md:gap-2">
        {([1, 2, 3, 5, 10] as YearPeriod[]).map(p => (
          <button key={p} onClick={() => setYearPeriod(p)} className={btnCls(yearPeriod === p)}>
            {p} {p === 1 ? 'год' : p < 5 ? 'года' : 'лет'}
          </button>
        ))}
      </div>
    );
    return null;
  };

  return (
    <Card className="shadow-sm border-gray-200 bg-white rounded-2xl overflow-hidden">
      <CardHeader className="bg-white border-b border-gray-100 pb-4 md:pb-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 md:gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-100">
                <Icon name="TrendingUp" size={18} className="text-blue-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-800">
                Динамика задействованных организаций
              </h3>
            </div>
            <p className="text-xs md:text-sm text-gray-500 ml-9">
              Отслеживание активности организаций по категориям
            </p>
          </div>
          
          <div className="flex flex-col gap-2 md:gap-3 flex-shrink-0">
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {(['day', 'week', 'month', 'year'] as ChartMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setChartMode(mode)}
                  className={`px-2 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all border ${
                    chartMode === mode
                      ? 'bg-blue-600 text-white border-transparent shadow-sm'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {chartModeLabels[mode]}
                </button>
              ))}
            </div>
            {renderPeriodButtons()}
          </div>
        </div>
        
        <div className="mt-3 md:mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3">
            <label className="text-xs md:text-sm text-gray-600 whitespace-nowrap">Отслеживать организацию:</label>
            <div className="flex items-center gap-2 flex-1">
              <select
                value={selectedOrgId || ''}
                onChange={(e) => setSelectedOrgId(e.target.value ? Number(e.target.value) : null)}
                className="bg-white text-gray-700 border border-gray-300 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-0"
              >
                <option value="">Не выбрано</option>
                {activeOrgs.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
              {selectedOrg && (
                <button
                  onClick={() => setSelectedOrgId(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <Icon name="X" size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-500">Все организации</span>
            </div>
            {selectedOrg && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                <span className="text-xs text-gray-500">{selectedOrg.name}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6 bg-white">
        <ClientsChartSVG
          chartData={chartData}
          maxValue={maxValue}
          minValue={minValue}
          valueRange={valueRange}
          onHoverPoint={setHoveredPoint}
          hoveredPoint={hoveredPoint}
          hasSelectedOrg={selectedOrgId !== null}
        />
      </CardContent>
    </Card>
  );
}