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

interface ClientsChartProps {
  organizations: Organization[];
  shifts: Shift[];
}

export default function ClientsChart({ organizations, shifts }: ClientsChartProps) {
  const [chartMode, setChartMode] = useState<ChartMode>('month');
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    label: string;
    all: number;
    top: number;
    kiberone: number;
  } | null>(null);

  const chartData = useMemo(() => {
    const now = new Date();
    const data: { label: string; all: number; top: number; kiberone: number; date: string }[] = [];

    // Группируем смены по датам
    const shiftsByDate = shifts.reduce((acc, shift) => {
      const date = shift.shift_date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(shift);
      return acc;
    }, {} as Record<string, Shift[]>);

    const getUniqueOrgs = (shiftsArray: Shift[], filter?: (name: string) => boolean) => {
      const uniqueOrgIds = new Set(
        shiftsArray
          .filter(s => !filter || filter(s.organization_name))
          .map(s => s.organization_id)
      );
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
          all: getUniqueOrgs(dayShifts),
          top: getUniqueOrgs(dayShifts, name => name.includes('ТОП')),
          kiberone: getUniqueOrgs(dayShifts, name => name.includes('KIBERONE')),
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
          all: getUniqueOrgs(weekShifts),
          top: getUniqueOrgs(weekShifts, name => name.includes('ТОП')),
          kiberone: getUniqueOrgs(weekShifts, name => name.includes('KIBERONE')),
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
          all: getUniqueOrgs(monthShifts),
          top: getUniqueOrgs(monthShifts, name => name.includes('ТОП')),
          kiberone: getUniqueOrgs(monthShifts, name => name.includes('KIBERONE')),
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
          all: getUniqueOrgs(yearShifts),
          top: getUniqueOrgs(yearShifts, name => name.includes('ТОП')),
          kiberone: getUniqueOrgs(yearShifts, name => name.includes('KIBERONE')),
          date: `${year}-01-01`
        });
      }
    }

    return data;
  }, [shifts, chartMode]);

  const maxValue = useMemo(() => {
    const allMax = Math.max(...chartData.map(d => d.all), 1);
    const topMax = Math.max(...chartData.map(d => d.top), 1);
    const kiberoneMax = Math.max(...chartData.map(d => d.kiberone), 1);
    return Math.max(allMax, topMax, kiberoneMax);
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
        
        {/* Легенда */}
        <div className="flex flex-wrap gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-cyan-500"></div>
            <span className="text-sm text-slate-300">ВСЕ организации</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span className="text-sm text-slate-300">ТОП организации</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-indigo-500"></div>
            <span className="text-sm text-slate-300">KIBERONE организации</span>
          </div>
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
