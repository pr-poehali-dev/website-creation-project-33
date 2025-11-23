import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { ShiftRecord } from './types';
import { useTrendAnalysis } from './useTrendAnalysis';
import ChartSVG from './ChartSVG';
import TrendAnalysisBlock from './TrendAnalysisBlock';

interface KmsRevenueChartProps {
  shifts: ShiftRecord[];
}

type Period = 'day' | 'week' | 'month' | 'year';

interface ChartData {
  label: string;
  revenue: number;
  date: string;
  startDate?: string;
  endDate?: string;
}

export default function KmsRevenueChart({ shifts }: KmsRevenueChartProps) {
  const [period, setPeriod] = useState<Period>('week');
  const [showAllPeriods, setShowAllPeriods] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [hoveredPoint, setHoveredPoint] = useState<{x: number; y: number; label: string; value: number} | null>(null);

  const calculateWorkerSalary = (contacts: number, shiftDate: string): number => {
    if (new Date(shiftDate) < new Date('2025-10-01')) {
      return contacts * 200;
    }
    return contacts >= 10 ? contacts * 300 : contacts * 200;
  };

  const chartData = useMemo(() => {
    const dataMap = new Map<string, {revenue: number; startDate: string; endDate: string}>();
    const cutoffDate = new Date('2025-03-18');

    shifts.forEach(shift => {
      if (new Date(shift.date) < cutoffDate) return;
      const shiftDate = new Date(shift.date);
      let key = '';
      let startDate = shift.date;
      let endDate = shift.date;

      if (period === 'day') {
        key = shift.date;
      } else if (period === 'week') {
        const weekStart = new Date(shiftDate);
        const day = weekStart.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        weekStart.setDate(weekStart.getDate() + diff);
        weekStart.setHours(0, 0, 0, 0);
        key = weekStart.toISOString().split('T')[0];
        startDate = key;
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        endDate = weekEnd.toISOString().split('T')[0];
      } else if (period === 'month') {
        key = `${shiftDate.getFullYear()}-${String(shiftDate.getMonth() + 1).padStart(2, '0')}`;
        startDate = `${key}-01`;
        const monthEnd = new Date(shiftDate.getFullYear(), shiftDate.getMonth() + 1, 0);
        endDate = monthEnd.toISOString().split('T')[0];
      } else if (period === 'year') {
        key = String(shiftDate.getFullYear());
        startDate = `${key}-01-01`;
        endDate = `${key}-12-31`;
      }

      const revenue = shift.contacts_count * shift.contact_rate;
      const tax = shift.payment_type === 'cashless' ? Math.round(revenue * 0.07) : 0;
      const afterTax = revenue - tax;
      const salary = calculateWorkerSalary(shift.contacts_count, shift.date);
      const expense = shift.expense_amount || 0;
      const kmsShare = Math.round((afterTax - salary - expense) / 2);

      const existing = dataMap.get(key);
      dataMap.set(key, {
        revenue: (existing?.revenue || 0) + kmsShare,
        startDate: existing?.startDate || startDate,
        endDate: existing?.endDate || endDate
      });
    });

    const data: ChartData[] = Array.from(dataMap.entries()).map(([key, value]) => {
      let label = '';
      if (period === 'day') {
        const date = new Date(key);
        label = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
      } else if (period === 'week') {
        const date = new Date(key);
        const endDate = new Date(date);
        endDate.setDate(date.getDate() + 6);
        label = `${date.getDate()}.${date.getMonth() + 1} - ${endDate.getDate()}.${endDate.getMonth() + 1}`;
      } else if (period === 'month') {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        label = date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
      } else if (period === 'year') {
        label = key;
      }

      return { 
        label, 
        revenue: value.revenue, 
        date: key,
        startDate: value.startDate,
        endDate: value.endDate
      };
    });

    return data.sort((a, b) => a.date.localeCompare(b.date));
  }, [shifts, period]);

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 0);
  const minRevenue = Math.min(...chartData.map(d => d.revenue), 0);
  const revenueRange = maxRevenue - minRevenue;
  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'day': return 'по дням';
      case 'week': return 'по неделям';
      case 'month': return 'по месяцам';
      case 'year': return 'по годам';
    }
  };

  const trendAnalysis = useTrendAnalysis(chartData, period);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <Card className="shadow-lg border-gray-200">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-xl md:text-2xl text-gray-800">
            <Icon name="TrendingUp" size={24} className="text-green-600" />
            Доход
          </CardTitle>
          
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setPeriod('day')}
              variant={period === 'day' ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
            >
              <Icon name="Calendar" size={14} className="mr-1.5" />
              Дни
            </Button>
            <Button
              onClick={() => setPeriod('week')}
              variant={period === 'week' ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
            >
              <Icon name="CalendarDays" size={14} className="mr-1.5" />
              Недели
            </Button>
            <Button
              onClick={() => setPeriod('month')}
              variant={period === 'month' ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
            >
              <Icon name="CalendarRange" size={14} className="mr-1.5" />
              Месяцы
            </Button>
            <Button
              onClick={() => setPeriod('year')}
              variant={period === 'year' ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
            >
              <Icon name="Calendar" size={14} className="mr-1.5" />
              Годы
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 md:p-6">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-600">
            Общий доход {getPeriodLabel()}: 
            <span className="ml-2 font-bold text-lg text-green-600">
              {formatCurrency(totalRevenue)} ₽
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleZoomOut}
              variant="outline"
              size="sm"
              disabled={zoom <= 0.5}
              className="text-xs"
            >
              <Icon name="ZoomOut" size={14} />
            </Button>
            <Button
              onClick={handleResetZoom}
              variant="outline"
              size="sm"
              disabled={zoom === 1}
              className="text-xs"
            >
              <Icon name="Maximize2" size={14} />
            </Button>
            <Button
              onClick={handleZoomIn}
              variant="outline"
              size="sm"
              disabled={zoom >= 2}
              className="text-xs"
            >
              <Icon name="ZoomIn" size={14} />
            </Button>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Icon name="BarChart3" size={48} className="mx-auto mb-3 text-gray-300" />
            <p>Нет данных для отображения</p>
          </div>
        ) : (
          <div>
            <ChartSVG
              chartData={chartData}
              maxRevenue={maxRevenue}
              minRevenue={minRevenue}
              revenueRange={revenueRange}
              zoom={zoom}
              onHoverPoint={setHoveredPoint}
              hoveredPoint={hoveredPoint}
              formatCurrency={formatCurrency}
            />

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2 md:gap-3 justify-start md:justify-center text-xs">
                {(showAllPeriods ? chartData : chartData.slice(0, 5)).map((item, index) => {
                  const isNegative = item.revenue < 0;
                  return (
                    <div key={index} className="flex items-center gap-1.5 md:gap-2 bg-white rounded-lg px-2 md:px-3 py-1.5 md:py-2 border border-gray-100 shadow-sm">
                      <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isNegative ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <span className="text-gray-600 text-[10px] md:text-xs">{item.label}:</span>
                      <span className={`font-bold text-[10px] md:text-xs ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(item.revenue)} ₽
                      </span>
                    </div>
                  );
                })}
              </div>
              
              {chartData.length > 5 && (
                <div className="mt-3 flex justify-center">
                  <Button
                    onClick={() => setShowAllPeriods(!showAllPeriods)}
                    variant="outline"
                    size="sm"
                    className="text-xs md:text-sm"
                  >
                    <Icon 
                      name={showAllPeriods ? "ChevronUp" : "ChevronDown"} 
                      size={14} 
                      className="mr-1.5" 
                    />
                    {showAllPeriods 
                      ? 'Скрыть' 
                      : `Показать все ${chartData.length} периодов`
                    }
                  </Button>
                </div>
              )}
            </div>

            {(period === 'week' || period === 'month') && (
              <TrendAnalysisBlock
                trendAnalysis={trendAnalysis}
                period={period}
                formatCurrency={formatCurrency}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}