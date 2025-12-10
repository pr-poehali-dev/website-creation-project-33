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
type OrgFilter = 'ALL' | 'TOP' | 'KIBERONE';

interface ClientsChartProps {
  organizations: Organization[];
  shifts: Shift[];
}

export default function ClientsChart({ organizations, shifts }: ClientsChartProps) {
  const [chartMode, setChartMode] = useState<ChartMode>('month');
  const [orgFilter, setOrgFilter] = useState<OrgFilter>('ALL');
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    label: string;
    value: number;
  } | null>(null);

  const chartData = useMemo(() => {
    const now = new Date();
    const data: { label: string; value: number; date: string }[] = [];

    // Фильтр по категориям
    const filterShifts = (shiftsArray: Shift[]) => {
      if (orgFilter === 'ALL') return shiftsArray;
      if (orgFilter === 'TOP') return shiftsArray.filter(s => s.organization_name.includes('ТОП'));
      if (orgFilter === 'KIBERONE') return shiftsArray.filter(s => s.organization_name.includes('KIBERONE'));
      return shiftsArray;
    };

    // Группируем смены по датам
    const shiftsByDate = shifts.reduce((acc, shift) => {
      const date = shift.shift_date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(shift);
      return acc;
    }, {} as Record<string, Shift[]>);

    const getUniqueOrgs = (shiftsArray: Shift[]) => {
      const filtered = filterShifts(shiftsArray);
      const uniqueOrgIds = new Set(filtered.map(s => s.organization_id));
      return uniqueOrgIds.size;
    };

    if (chartMode === 'day') {
      // Последние 14 дней
      for (let i = 13; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayShifts = shiftsByDate[dateStr] || [];
        
        data.push({
          label: date.getDate().toString(),
          value: getUniqueOrgs(dayShifts),
          date: dateStr
        });
      }
    } else if (chartMode === 'week') {
      // Последние 12 недель
      for (let i = 11; i >= 0; i--) {
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - i * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        
        const weekShifts: Shift[] = [];
        for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          weekShifts.push(...(shiftsByDate[dateStr] || []));
        }
        
        data.push({
          label: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
          value: getUniqueOrgs(weekShifts),
          date: weekStart.toISOString().split('T')[0]
        });
      }
    } else if (chartMode === 'month') {
      // Последние 12 месяцев
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now);
        monthDate.setMonth(monthDate.getMonth() - i);
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        
        const monthShifts = shifts.filter(shift => {
          const shiftDate = new Date(shift.shift_date);
          return shiftDate.getFullYear() === year && shiftDate.getMonth() === month;
        });
        
        data.push({
          label: monthDate.toLocaleDateString('ru-RU', { month: 'short' }),
          value: getUniqueOrgs(monthShifts),
          date: `${year}-${String(month + 1).padStart(2, '0')}-01`
        });
      }
    } else if (chartMode === 'year') {
      // Последние 5 лет
      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i;
        
        const yearShifts = shifts.filter(shift => {
          const shiftDate = new Date(shift.shift_date);
          return shiftDate.getFullYear() === year;
        });
        
        data.push({
          label: year.toString(),
          value: getUniqueOrgs(yearShifts),
          date: `${year}-01-01`
        });
      }
    }

    return data;
  }, [shifts, chartMode, orgFilter]);

  const maxValue = useMemo(() => {
    return Math.max(...chartData.map(d => d.value), 1);
  }, [chartData]);

  const minValue = 0;
  const valueRange = maxValue - minValue;

  return (
    <Card className="shadow-2xl border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl">
      <CardHeader className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-b border-slate-700/50 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-100 mb-2">
              Динамика задействованных организаций
            </h3>
            <p className="text-sm text-slate-400">
              Отслеживание активности организаций по категориям
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {(['day', 'week', 'month', 'year'] as ChartMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setChartMode(mode)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  chartMode === mode
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600'
                }`}
              >
                {mode === 'day' && 'Дни'}
                {mode === 'week' && 'Недели'}
                {mode === 'month' && 'Месяцы'}
                {mode === 'year' && 'Годы'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Фильтрация */}
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={() => setOrgFilter('ALL')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              orgFilter === 'ALL'
                ? 'bg-cyan-500 text-white shadow-lg'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600'
            }`}
          >
            ВСЕ
          </button>
          <button
            onClick={() => setOrgFilter('TOP')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              orgFilter === 'TOP'
                ? 'bg-cyan-500 text-white shadow-lg'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600'
            }`}
          >
            ТОП
          </button>
          <button
            onClick={() => setOrgFilter('KIBERONE')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              orgFilter === 'KIBERONE'
                ? 'bg-cyan-500 text-white shadow-lg'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600'
            }`}
          >
            KIBERONE
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <ClientsChartSVG
          chartData={chartData}
          maxValue={maxValue}
          minValue={minValue}
          valueRange={valueRange}
          onHoverPoint={setHoveredPoint}
          hoveredPoint={hoveredPoint}
        />
      </CardContent>
    </Card>
  );
}