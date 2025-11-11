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
          <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
            <div className="relative h-[350px] md:h-[450px]">
              <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map(i => {
                  const y = 30 + (i / 4) * 340;
                  return (
                    <line
                      key={`grid-${i}`}
                      x1="60"
                      y1={y}
                      x2="980"
                      y2={y}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      opacity="0.5"
                    />
                  );
                })}

                {/* Y-axis labels inside SVG */}
                {[4, 3, 2, 1, 0].map(i => {
                  const y = 30 + ((4 - i) / 4) * 340;
                  const value = Math.round(minRevenue + (revenueRange / 4) * i);
                  return (
                    <text
                      key={`y-label-${i}`}
                      x="50"
                      y={y + 5}
                      textAnchor="end"
                      fontSize="11"
                      fill={value < 0 ? "#dc2626" : "#6b7280"}
                      fontWeight="500"
                    >
                      {formatCurrency(value)}
                    </text>
                  );
                })}

                {/* Zero line (if there are negative values) */}
                {minRevenue < 0 && (
                  <line
                    x1="60"
                    y1={370 - ((-minRevenue / revenueRange) * 340)}
                    x2="980"
                    y2={370 - ((-minRevenue / revenueRange) * 340)}
                    stroke="#dc2626"
                    strokeWidth="1.5"
                    strokeDasharray="5 5"
                    opacity="0.6"
                  />
                )}

                {/* Area under line */}
                <path
                  d={(() => {
                    const zeroY = 370 - ((-minRevenue / revenueRange) * 340);
                    const points = chartData.map((item, index) => {
                      const x = 60 + (index / (chartData.length - 1 || 1)) * 920;
                      const y = 370 - (((item.revenue - minRevenue) / revenueRange) * 340);
                      return `${x},${y}`;
                    });
                    return `M 60,${zeroY} L ${points.join(' L ')} L 980,${zeroY} Z`;
                  })()}
                  fill="url(#areaGradient)"
                />

                {/* Line with glow */}
                <polyline
                  points={chartData.map((item, index) => {
                    const x = 60 + (index / (chartData.length - 1 || 1)) * 920;
                    const y = 370 - (((item.revenue - minRevenue) / revenueRange) * 340);
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow)"
                />

                {/* Points */}
                {chartData.map((item, index) => {
                  const x = 60 + (index / (chartData.length - 1 || 1)) * 920;
                  const y = 370 - (((item.revenue - minRevenue) / revenueRange) * 340);
                  const isNegative = item.revenue < 0;
                  
                  return (
                    <g key={index} className="hover:opacity-100 opacity-90 transition-opacity">
                      <circle
                        cx={x}
                        cy={y}
                        r="6"
                        fill={isNegative ? "#dc2626" : "#10b981"}
                        stroke="#fff"
                        strokeWidth="3"
                        filter="url(#glow)"
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r="3"
                        fill="#fff"
                        opacity="0.8"
                      />
                      <title>{`${item.label}: ${formatCurrency(item.revenue)} ₽`}</title>
                    </g>
                  );
                })}

                {/* X-axis labels inside SVG */}
                {chartData.filter((_, i) => {
                  if (chartData.length <= 12) return true;
                  const step = Math.ceil(chartData.length / 12);
                  return i % step === 0 || i === chartData.length - 1;
                }).map((item, idx) => {
                  const index = chartData.indexOf(item);
                  const x = 60 + (index / (chartData.length - 1 || 1)) * 920;
                  return (
                    <g key={`x-label-${idx}`}>
                      <text
                        x={x}
                        y="395"
                        textAnchor="middle"
                        fontSize="10"
                        fill="#6b7280"
                        fontWeight="500"
                      >
                        {item.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Bottom info bar */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-4 justify-center text-xs">
              {chartData.slice(0, 5).map((item, index) => {
                const isNegative = item.revenue < 0;
                return (
                  <div key={index} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
                    <div className={`w-2 h-2 rounded-full ${isNegative ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <span className="text-gray-600">{item.label}:</span>
                    <span className={`font-bold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(item.revenue)} ₽
                    </span>
                  </div>
                );
              })}
              {chartData.length > 5 && (
                <div className="flex items-center gap-1 text-gray-400">
                  <span>и ещё {chartData.length - 5} периодов</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}