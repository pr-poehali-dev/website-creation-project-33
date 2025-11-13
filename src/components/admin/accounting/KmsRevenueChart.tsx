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
  const [hoveredPoint, setHoveredPoint] = useState<{x: number; y: number; label: string; value: number} | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);

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

  const trendAnalysis = useMemo(() => {
    if (chartData.length < 3) return null;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const recentDataCount = Math.min(Math.ceil(chartData.length / 3), 10);
    const recentData = chartData.slice(-recentDataCount);
    
    const n = recentData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    recentData.forEach((item, i) => {
      sumX += i;
      sumY += item.revenue;
      sumXY += i * item.revenue;
      sumX2 += i * i;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const avgRevenue = recentData.reduce((sum, d) => sum + d.revenue, 0) / n;
    const trendPercentage = Math.abs(slope) / (avgRevenue || 1) * 100;
    
    let trendText = '';
    let trendIcon: 'TrendingUp' | 'TrendingDown' | 'Minus' = 'Minus';
    let trendColor = 'text-gray-600';
    
    if (slope > 0 && trendPercentage > 5) {
      trendText = 'Растущий тренд';
      trendIcon = 'TrendingUp';
      trendColor = 'text-green-600';
    } else if (slope < 0 && trendPercentage > 5) {
      trendText = 'Падающий тренд';
      trendIcon = 'TrendingDown';
      trendColor = 'text-red-600';
    } else {
      trendText = 'Стабильный уровень';
      trendIcon = 'Minus';
      trendColor = 'text-blue-600';
    }
    
    const calculateMonthlyForecast = (targetMonth: number, targetYear: number) => {
      const monthStart = new Date(targetYear, targetMonth, 1);
      const monthEnd = new Date(targetYear, targetMonth + 1, 0);
      
      let existingRevenue = 0;
      let periodsInMonth = 0;
      let lastPeriodEndDate = monthStart;
      
      chartData.forEach(item => {
        const itemStart = new Date(item.startDate);
        const itemEnd = new Date(item.endDate);
        
        if (itemEnd >= monthStart && itemStart <= monthEnd) {
          existingRevenue += item.revenue;
          periodsInMonth++;
          if (itemEnd > lastPeriodEndDate) {
            lastPeriodEndDate = itemEnd;
          }
        }
      });
      
      if (targetMonth < currentMonth || targetYear < currentYear) {
        return Math.round(existingRevenue);
      }
      
      if (targetMonth === currentMonth && targetYear === currentYear) {
        if (lastPeriodEndDate >= monthEnd) {
          return Math.round(existingRevenue);
        }
        
        const daysInMonth = monthEnd.getDate();
        const daysCovered = Math.min(now.getDate(), lastPeriodEndDate.getDate());
        const daysRemaining = daysInMonth - daysCovered;
        
        if (daysRemaining <= 0) {
          return Math.round(existingRevenue);
        }
        
        const periodsPerDay = period === 'day' ? 1 : period === 'week' ? 1/7 : 1/30;
        const remainingPeriods = Math.ceil(daysRemaining * periodsPerDay);
        
        let projectedRevenue = 0;
        for (let i = 0; i < remainingPeriods; i++) {
          const forecastValue = intercept + slope * (n + i);
          projectedRevenue += Math.max(0, forecastValue);
        }
        
        return Math.round(existingRevenue + projectedRevenue);
      }
      
      const periodsPerMonth = period === 'day' ? 30 : period === 'week' ? 4.33 : 1;
      const periodsToForecast = Math.ceil(periodsPerMonth);
      const monthsAhead = (targetYear - currentYear) * 12 + (targetMonth - currentMonth);
      
      let forecastSum = 0;
      for (let i = 0; i < periodsToForecast; i++) {
        const periodOffset = (monthsAhead - 1) * periodsToForecast + i;
        const forecastValue = intercept + slope * (n + periodOffset);
        forecastSum += Math.max(0, forecastValue);
      }
      
      return Math.round(forecastSum);
    };
    
    const novemberForecast = calculateMonthlyForecast(10, 2025);
    const decemberForecast = calculateMonthlyForecast(11, 2025);
    
    return {
      trendText,
      trendIcon,
      trendColor,
      slope,
      avgRevenue: Math.round(avgRevenue),
      novemberForecast,
      decemberForecast,
      changePerPeriod: Math.round(slope)
    };
  }, [chartData, period]);

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
              <svg 
                ref={svgRef}
                style={{ width: `${Math.max(100, zoom * 100)}%`, minWidth: '100%', height: '100%' }} 
                viewBox="0 0 1000 400" 
                preserveAspectRatio="xMidYMin meet"
                onMouseMove={(e) => {
                  if (!svgRef.current) return;
                  const rect = svgRef.current.getBoundingClientRect();
                  const mouseX = ((e.clientX - rect.left) / rect.width) * 1000;
                  
                  if (mouseX < 60 || mouseX > 980) {
                    setHoveredPoint(null);
                    return;
                  }
                  
                  const relativeX = (mouseX - 60) / 920;
                  const closestIndex = Math.round(relativeX * (chartData.length - 1));
                  
                  if (closestIndex >= 0 && closestIndex < chartData.length) {
                    const item = chartData[closestIndex];
                    const x = 60 + (closestIndex / (chartData.length - 1 || 1)) * 920;
                    const y = 370 - (((item.revenue - minRevenue) / revenueRange) * 340);
                    setHoveredPoint({ x, y, label: item.label, value: item.revenue });
                  }
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
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

                {/* Main line */}
                <polyline
                  points={chartData.map((item, index) => {
                    const x = 60 + (index / (chartData.length - 1 || 1)) * 920;
                    const y = 370 - (((item.revenue - minRevenue) / revenueRange) * 340);
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke={totalRevenue >= 0 ? "#10b981" : "#dc2626"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points */}
                {chartData.map((item, index) => {
                  const x = 60 + (index / (chartData.length - 1 || 1)) * 920;
                  const y = 370 - (((item.revenue - minRevenue) / revenueRange) * 340);
                  const isNegative = item.revenue < 0;
                  
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="3"
                      fill={isNegative ? "#dc2626" : "#10b981"}
                      stroke="#fff"
                      strokeWidth="1.5"
                    />
                  );
                })}

                {/* Hovered point highlight */}
                {hoveredPoint && (
                  <>
                    {/* Vertical line */}
                    <line
                      x1={hoveredPoint.x}
                      y1="30"
                      x2={hoveredPoint.x}
                      y2="370"
                      stroke="#6b7280"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      opacity="0.5"
                    />
                    {/* Point */}
                    <circle
                      cx={hoveredPoint.x}
                      cy={hoveredPoint.y}
                      r="5"
                      fill={hoveredPoint.value >= 0 ? "#10b981" : "#dc2626"}
                      stroke="#fff"
                      strokeWidth="2"
                    />
                  </>
                )}

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
              
              {/* Tooltip */}
              {hoveredPoint && (
                <div 
                  className="absolute pointer-events-none bg-white border border-gray-300 rounded-lg shadow-lg px-3 py-2 text-xs"
                  style={{
                    left: `${(hoveredPoint.x / 1000) * 100}%`,
                    top: `${(hoveredPoint.y / 400) * 100}%`,
                    transform: 'translate(-50%, -120%)'
                  }}
                >
                  <div className="font-semibold text-gray-700">{hoveredPoint.label}</div>
                  <div className={`font-bold ${hoveredPoint.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(hoveredPoint.value)} ₽
                  </div>
                </div>
              )}
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

            {/* Trend Analysis */}
            {trendAnalysis && (
              <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white shadow-sm">
                    <Icon name={trendAnalysis.trendIcon} size={20} className={trendAnalysis.trendColor} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      {trendAnalysis.trendText}
                      {trendAnalysis.changePerPeriod !== 0 && (
                        <span className={`text-sm font-normal ${trendAnalysis.trendColor}`}>
                          ({trendAnalysis.changePerPeriod > 0 ? '+' : ''}{formatCurrency(trendAnalysis.changePerPeriod)} ₽/{period === 'day' ? 'день' : period === 'week' ? 'неделю' : period === 'month' ? 'месяц' : 'год'})
                        </span>
                      )}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-xs text-gray-600 mb-1">Средний доход</div>
                        <div className="text-lg font-bold text-gray-900">{formatCurrency(trendAnalysis.avgRevenue)} ₽</div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-xs text-gray-600 mb-1">Прогноз на ноябрь</div>
                        <div className={`text-lg font-bold ${trendAnalysis.novemberForecast >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(trendAnalysis.novemberForecast)} ₽
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-xs text-gray-600 mb-1">Прогноз на декабрь</div>
                        <div className={`text-lg font-bold ${trendAnalysis.decemberForecast >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(trendAnalysis.decemberForecast)} ₽
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}