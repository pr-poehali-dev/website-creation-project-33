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

interface ClientsChartProps {
  organizations: Organization[];
  shifts: Shift[];
}

export default function ClientsChart({ organizations, shifts }: ClientsChartProps) {
  const [chartMode, setChartMode] = useState<ChartMode>('month');
  const [dayPeriod, setDayPeriod] = useState<DayPeriod>(30);
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

    // Группируем смены по датам
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
      // Последние N дней (каждый день отдельно)
      for (let i = dayPeriod - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayShifts = shiftsByDate[dateStr] || [];
        
        data.push({
          label: `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, '0')}`,
          total: getTotalUniqueOrgs(dayShifts),
          selected: hasSelectedOrg(dayShifts),
          date: dateStr
        });
      }
    } else if (chartMode === 'week') {
      // Последние 12 недель (каждая неделя отдельно, пн-вс)
      for (let i = 11; i >= 0; i--) {
        const refDate = new Date(now);
        refDate.setDate(refDate.getDate() - i * 7);
        
        // Находим понедельник текущей недели
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
        
        data.push({
          label: `${weekStart.getDate()}.${String(weekStart.getMonth() + 1).padStart(2, '0')}-${weekEnd.getDate()}.${String(weekEnd.getMonth() + 1).padStart(2, '0')}`,
          total: getTotalUniqueOrgs(weekShifts),
          selected: hasSelectedOrg(weekShifts),
          date: weekStart.toISOString().split('T')[0]
        });
      }
    } else if (chartMode === 'month') {
      // Последние 12 месяцев (каждый месяц отдельно)
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
          label: monthDate.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' }),
          total: getTotalUniqueOrgs(monthShifts),
          selected: hasSelectedOrg(monthShifts),
          date: `${year}-${String(month + 1).padStart(2, '0')}-01`
        });
      }
    } else if (chartMode === 'year') {
      // Последние 5 лет (каждый год отдельно)
      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i;
        
        const yearShifts = shifts.filter(shift => {
          const shiftDate = new Date(shift.shift_date);
          return shiftDate.getFullYear() === year;
        });
        
        data.push({
          label: year.toString(),
          total: getTotalUniqueOrgs(yearShifts),
          selected: hasSelectedOrg(yearShifts),
          date: `${year}-01-01`
        });
      }
    }

    return data;
  }, [shifts, chartMode, dayPeriod, selectedOrgId]);

  const maxValue = useMemo(() => {
    return Math.max(...chartData.map(d => d.total), 1);
  }, [chartData]);
  
  const selectedOrg = organizations.find(org => org.id === selectedOrgId);
  const activeOrgs = organizations.filter(org => org.is_active !== false);

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
          
          <div className="flex flex-col gap-3">
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
            
            {chartMode === 'day' && (
              <div className="flex flex-wrap gap-2">
                {([7, 30, 60, 90, 365] as DayPeriod[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setDayPeriod(period)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      dayPeriod === period
                        ? 'bg-cyan-500 text-white shadow-md'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 border border-slate-600'
                    }`}
                  >
                    {period} дн.
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Выбор организации */}
        <div className="mt-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-300">Отслеживать организацию:</label>
            <select
              value={selectedOrgId || ''}
              onChange={(e) => setSelectedOrgId(e.target.value ? Number(e.target.value) : null)}
              className="bg-slate-700/50 text-slate-200 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Не выбрано</option>
              {activeOrgs.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
            {selectedOrg && (
              <button
                onClick={() => setSelectedOrgId(null)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <Icon name="X" size={18} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-4 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-cyan-500"></div>
              <span className="text-xs text-slate-400">Все организации</span>
            </div>
            {selectedOrg && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-pink-500"></div>
                <span className="text-xs text-slate-400">{selectedOrg.name}</span>
              </div>
            )}
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
          hasSelectedOrg={selectedOrgId !== null}
        />
      </CardContent>
    </Card>
  );
}