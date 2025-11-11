import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { ShiftRecord } from './types';

interface KmsRevenueChartProps {
  shifts: ShiftRecord[];
}

type Period = 'day' | 'week' | 'month' | 'year';

interface ChartData {
  label: string;
  revenue: number;
  date: string;
}

export default function KmsRevenueChart({ shifts }: KmsRevenueChartProps) {
  const [period, setPeriod] = useState<Period>('week');

  const calculateWorkerSalary = (contacts: number): number => {
    return contacts >= 10 ? contacts * 300 : contacts * 200;
  };

  const chartData = useMemo(() => {
    const dataMap = new Map<string, number>();

    shifts.forEach(shift => {
      const shiftDate = new Date(shift.date);
      let key = '';

      if (period === 'day') {
        key = shift.date;
      } else if (period === 'week') {
        const weekStart = new Date(shiftDate);
        weekStart.setDate(shiftDate.getDate() - shiftDate.getDay() + 1);
        key = weekStart.toISOString().split('T')[0];
      } else if (period === 'month') {
        key = `${shiftDate.getFullYear()}-${String(shiftDate.getMonth() + 1).padStart(2, '0')}`;
      } else if (period === 'year') {
        key = String(shiftDate.getFullYear());
      }

      const revenue = shift.contacts_count * shift.contact_rate;
      const tax = shift.payment_type === 'cashless' ? Math.round(revenue * 0.07) : 0;
      const afterTax = revenue - tax;
      const salary = calculateWorkerSalary(shift.contacts_count);
      const expense = shift.expense_amount || 0;
      const kmsShare = Math.round((afterTax - salary - expense) / 2);

      dataMap.set(key, (dataMap.get(key) || 0) + kmsShare);
    });

    const data: ChartData[] = Array.from(dataMap.entries()).map(([key, revenue]) => {
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

      return { label, revenue, date: key };
    });

    return data.sort((a, b) => a.date.localeCompare(b.date));
  }, [shifts, period]);

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 0);
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

  return (
    <Card className="bg-white border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
            <div className="p-2 rounded-lg bg-yellow-100">
              <Icon name="TrendingUp" size={20} className="text-yellow-600" />
            </div>
            Доход КМС {getPeriodLabel()}
          </CardTitle>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setPeriod('day')}
              variant={period === 'day' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 ${period === 'day'
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-md'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
              }`}
            >
              <Icon name="Calendar" size={14} className="mr-1.5" />
              Дни
            </Button>
            <Button
              onClick={() => setPeriod('week')}
              variant={period === 'week' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 ${period === 'week'
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-md'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
              }`}
            >
              <Icon name="CalendarDays" size={14} className="mr-1.5" />
              Недели
            </Button>
            <Button
              onClick={() => setPeriod('month')}
              variant={period === 'month' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 ${period === 'month'
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-md'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
              }`}
            >
              <Icon name="CalendarRange" size={14} className="mr-1.5" />
              Месяцы
            </Button>
            <Button
              onClick={() => setPeriod('year')}
              variant={period === 'year' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 ${period === 'year'
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-md'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
              }`}
            >
              <Icon name="CalendarClock" size={14} className="mr-1.5" />
              Годы
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="Wallet" size={24} className="text-green-600" />
              <span className="text-gray-700 font-medium">Общий доход за период:</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)} ₽
            </div>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Icon name="BarChart3" size={48} className="mx-auto mb-3 opacity-30" />
            <div className="text-sm">Нет данных за выбранный период</div>
          </div>
        ) : (
          <div className="relative">
            <div className="relative h-[300px] md:h-[400px] pl-12 pr-4">
              <svg className="w-full h-full" viewBox="0 0 1000 400">
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map(i => {
                  const y = (i / 4) * 360 + 20;
                  return (
                    <line
                      key={`grid-${i}`}
                      x1="0"
                      y1={y}
                      x2="1000"
                      y2={y}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {/* Area under line */}
                <path
                  d={(() => {
                    const points = chartData.map((item, index) => {
                      const x = (index / (chartData.length - 1 || 1)) * 1000;
                      const y = 380 - ((item.revenue / maxRevenue) * 360);
                      return `${x},${y}`;
                    });
                    return `M 0,380 L ${points.join(' L ')} L 1000,380 Z`;
                  })()}
                  fill="url(#areaGradient)"
                />

                {/* Line */}
                <polyline
                  points={chartData.map((item, index) => {
                    const x = (index / (chartData.length - 1 || 1)) * 1000;
                    const y = 380 - ((item.revenue / maxRevenue) * 360);
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Points */}
                {chartData.map((item, index) => {
                  const x = (index / (chartData.length - 1 || 1)) * 1000;
                  const y = 380 - ((item.revenue / maxRevenue) * 360);
                  
                  return (
                    <g key={index}>
                      <circle
                        cx={x}
                        cy={y}
                        r="7"
                        fill="#059669"
                        stroke="#fff"
                        strokeWidth="3"
                        className="transition-all cursor-pointer"
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                      />
                      <title>{`${item.label}: ${formatCurrency(item.revenue)} ₽`}</title>
                    </g>
                  );
                })}
              </svg>

              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-2 text-xs text-gray-500 -ml-12 w-10">
                {[4, 3, 2, 1, 0].map(i => (
                  <div key={i} className="text-right">
                    {formatCurrency(Math.round((maxRevenue / 4) * i))}
                  </div>
                ))}
              </div>
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between mt-4 px-12 text-xs text-gray-600 overflow-x-auto">
              {chartData.filter((_, i) => {
                if (chartData.length <= 10) return true;
                const step = Math.ceil(chartData.length / 10);
                return i % step === 0 || i === chartData.length - 1;
              }).map((item, index) => (
                <div key={index} className="text-center flex-shrink-0">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-green-600 font-bold">{formatCurrency(item.revenue)} ₽</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}