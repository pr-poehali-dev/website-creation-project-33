import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useMonthlyContacts } from '@/hooks/useAdminData';

interface DayDetail {
  day: string;
  contacts: number;
  promoters: number;
}

interface MonthlyStats {
  month: string;
  month_name: string;
  total_contacts: number;
  total_days: number;
  total_users: number;
  ranges: {
    '0-10': number;
    '11-15': number;
    '16-20': number;
    '21+': number;
  };
  days_21_plus?: DayDetail[];
}

export default function MonthlyContactsChart() {
  const { data, isLoading } = useMonthlyContacts(true);
  const monthlyStats: MonthlyStats[] = data?.monthly_stats || [];
  const [showAll, setShowAll] = useState(false);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [pinnedMonth, setPinnedMonth] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pinnedMonth) {
        const target = e.target as HTMLElement;
        if (!target.closest('.tooltip-container') && !target.closest('.green-zone-segment')) {
          setPinnedMonth(null);
          setHoveredMonth(null);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [pinnedMonth]);

  if (isLoading) {
    return (
      <Card className="bg-slate-900 border-slate-700 rounded-2xl">
        <CardContent className="p-4 md:p-8">
          <div className="text-center text-slate-300 flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base">
            <Icon name="Loader2" size={20} className="animate-spin md:w-6 md:h-6" />
            Загрузка статистики по месяцам...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!monthlyStats.length) {
    return null;
  }

  const rangeColors = {
    '0-10': 'bg-red-500',
    '11-15': 'bg-orange-500',
    '16-20': 'bg-blue-500',
    '21+': 'bg-green-500'
  };

  const rangeLabels = {
    '0-10': '0-10',
    '11-15': '11-15',
    '16-20': '16-20',
    '21+': '21+'
  };

  const displayedStats = showAll ? monthlyStats : monthlyStats.slice(-2);

  return (
    <Card className="bg-slate-900 border-slate-700 rounded-2xl slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 md:gap-3 text-slate-100 text-base md:text-xl">
          <div className="p-1.5 md:p-2 rounded-lg bg-slate-800">
            <Icon name="BarChart3" size={18} className="text-cyan-400 md:w-5 md:h-5" />
          </div>
          Распределение дней по контактам
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 md:space-y-5">
          {/* Легенда */}
          <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4 text-[10px] md:text-xs">
            <div className="flex flex-wrap gap-3 md:gap-4">
              {Object.entries(rangeLabels).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${rangeColors[key as keyof typeof rangeColors]}`} />
                  <span className="text-slate-300">{label} контактов</span>
                </div>
              ))}
            </div>
            <div className="text-[9px] md:text-xs text-slate-400 flex items-center gap-1">
              <Icon name="Info" size={12} />
              Кликните на зелёную зону для деталей
            </div>
          </div>

          {/* Графики по месяцам */}
          {displayedStats.map((stat) => {
            const totalDays = stat.total_days;
            
            return (
              <div key={stat.month} className="space-y-2 relative">
                <div className="flex items-center justify-between text-xs md:text-sm">
                  <span className="font-medium text-slate-200">{stat.month_name}</span>
                  <span className="text-slate-400 text-[10px] md:text-xs">
                    {stat.total_contacts} контактов / {totalDays} дней / {stat.total_users} промоутеров
                  </span>
                </div>
                
                <div className="flex h-8 md:h-10 rounded-lg overflow-hidden relative">
                  {Object.entries(stat.ranges).map(([range, count]) => {
                    const percentage = totalDays > 0 ? (count / totalDays) * 100 : 0;
                    
                    if (count === 0) return null;
                    
                    const isGreenZone = range === '21+';
                    
                    return (
                      <div
                        key={range}
                        className={`${rangeColors[range as keyof typeof rangeColors]} flex items-center justify-center transition-all duration-500 relative ${isGreenZone ? 'cursor-pointer hover:brightness-110 green-zone-segment' : ''}`}
                        style={{ width: `${percentage}%` }}
                        title={`${rangeLabels[range as keyof typeof rangeLabels]} контактов: ${count} дней`}
                        onMouseEnter={(e) => {
                          if (isGreenZone && stat.days_21_plus && stat.days_21_plus.length > 0 && !pinnedMonth) {
                            setHoveredMonth(stat.month);
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltipPosition({ x: rect.left, y: rect.top });
                          }
                        }}
                        onMouseLeave={() => {
                          if (isGreenZone && !pinnedMonth) {
                            setHoveredMonth(null);
                          }
                        }}
                        onClick={() => {
                          if (isGreenZone && stat.days_21_plus && stat.days_21_plus.length > 0) {
                            if (pinnedMonth === stat.month) {
                              setPinnedMonth(null);
                              setHoveredMonth(null);
                            } else {
                              setPinnedMonth(stat.month);
                              setHoveredMonth(stat.month);
                            }
                          }
                        }}
                      >
                        <span className="text-white font-bold text-[10px] md:text-xs">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Tooltip for green zone */}
                {(hoveredMonth === stat.month || pinnedMonth === stat.month) && stat.days_21_plus && stat.days_21_plus.length > 0 && (() => {
                  const totalContacts = stat.days_21_plus.reduce((sum, day) => sum + day.contacts, 0);
                  const totalPromoters = stat.days_21_plus.reduce((sum, day) => sum + day.promoters, 0);
                  const avgPerPromoter = totalPromoters > 0 ? (totalContacts / totalPromoters).toFixed(1) : '0';
                  
                  return (
                    <div 
                      className="absolute z-50 bg-slate-800 border-2 border-green-400 rounded-lg shadow-2xl p-3 mt-2 max-w-xs md:max-w-md tooltip-container"
                      style={{ 
                        left: '50%',
                        transform: 'translateX(-50%)'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="text-xs font-bold text-green-400 flex items-center gap-1.5">
                          <Icon name="TrendingUp" size={14} />
                          Дни с 21+ контактами:
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="text-[10px] md:text-xs font-semibold text-green-400">
                            ⌀ {avgPerPromoter} к/п
                          </div>
                          <div className="text-[9px] text-slate-400">
                            контактов/промоутер
                          </div>
                        </div>
                      </div>
                      {pinnedMonth === stat.month && (
                        <div className="text-[9px] text-slate-400 mb-2 flex items-center gap-1">
                          <Icon name="Pin" size={10} />
                          Закреплено • Кликните ещё раз для открепления
                        </div>
                      )}
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {stat.days_21_plus.map((day, idx) => {
                          const dayAvg = day.promoters > 0 ? (day.contacts / day.promoters).toFixed(1) : '0';
                          return (
                            <div key={idx} className="text-[10px] md:text-xs text-slate-200 flex items-center justify-between gap-2 py-0.5">
                              <span className="font-medium">{day.day}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-green-400 font-semibold">{day.contacts} к.</span>
                                <span className="text-slate-400">• {day.promoters} п.</span>
                                <span className="text-cyan-400 text-[9px] font-medium">⌀{dayAvg}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}

          {/* Кнопка показать все */}
          {monthlyStats.length > 2 && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => setShowAll(!showAll)}
                className="text-sm bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700"
              >
                <Icon name={showAll ? "ChevronUp" : "ChevronDown"} size={16} className="mr-2" />
                {showAll ? 'Скрыть старые месяцы' : `Показать все месяцы (${monthlyStats.length - 2})`}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}