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
  const [showAllPeriods, setShowAllPeriods] = useState(false);
  const [zoom, setZoom] = useState(1);

  const calculateWorkerSalary = (contacts: number, shiftDate: string): number => {
    // До 01.10.2025 все контакты по 200₽
    if (new Date(shiftDate) < new Date('2025-10-01')) {
      return contacts * 200;
    }
    // С 01.10.2025 прогрессивная шкала
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
      const salary = calculateWorkerSalary(shift.contacts_count, shift.date);
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
            <div className="p-2 rounded-lg bg-green-100">
              <Icon name="TrendingUp" size={20} className="text-green-600" />
            </div>
            Доход {getPeriodLabel()}
          </CardTitle>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setPeriod('day')}
              variant={period === 'day' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 ${period === 'day'
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
              }`}
            >
              <Icon name="Calendar" size={14} className="mr-1 md:mr-1.5" />
              <span className="hidden sm:inline">Дни</span>
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
              <Icon name="CalendarDays" size={14} className="mr-1 md:mr-1.5" />
              <span className="hidden sm:inline">Недели</span>
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
              <Icon name="CalendarRange" size={14} className="mr-1 md:mr-1.5" />
              <span className="hidden sm:inline">Месяцы</span>
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
              <Icon name="CalendarClock" size={14} className="mr-1 md:mr-1.5" />
              <span className="hidden sm:inline">Годы</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>


        {chartData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Icon name="BarChart3" size={48} className="mx-auto mb-3 opacity-30" />
            <div className="text-sm">Нет данных за выбранный период</div>
          </div>
        ) : (
          <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-3 md:p-6 border border-gray-100">
            <div className="flex items-center justify-end gap-2 mb-4">
              <Button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                variant="outline"
                size="sm"
                disabled={zoom <= 0.5}
                className="h-8 w-8 p-0"
              >
                <Icon name="ZoomOut" size={16} />
              </Button>
              <span className="text-xs text-gray-600 min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                variant="outline"
                size="sm"
                disabled={zoom >= 3}
                className="h-8 w-8 p-0"
              >
                <Icon name="ZoomIn" size={16} />
              </Button>
              {zoom !== 1 && (
                <Button
                  onClick={() => setZoom(1)}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                >
                  <Icon name="RotateCcw" size={14} className="mr-1" />
                  Сбросить
                </Button>
              )}
            </div>
            <div className="relative h-[280px] sm:h-[350px] md:h-[450px] overflow-x-auto overflow-y-hidden">
              <div style={{ width: `${Math.max(100, zoom * 100)}%`, minWidth: '100%', height: '100%' }}>
              <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
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
                      fontSize="10"
                      fill={value < 0 ? "#dc2626" : "#6b7280"}
                      fontWeight="500"
                      className="text-[8px] sm:text-[10px] md:text-[11px]"
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
                  if (chartData.length <= 7) return true;
                  const step = Math.ceil(chartData.length / 7);
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
                        fontSize="9"
                        fill="#6b7280"
                        fontWeight="500"
                        className="text-[7px] sm:text-[9px] md:text-[10px]"
                      >
                        {item.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
              </div>
            </div>

            {/* Bottom info bar */}
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}