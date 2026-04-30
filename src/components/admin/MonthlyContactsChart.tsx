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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
          <Icon name="Loader2" size={18} className="animate-spin text-blue-400" />
          Загрузка статистики по месяцам...
        </div>
      </div>
    );
  }

  if (!monthlyStats.length) {
    return null;
  }

  const rangeColors = {
    '0-10': 'bg-gray-200',
    '11-15': 'bg-blue-300',
    '16-20': 'bg-blue-400',
    '21+': 'bg-emerald-400'
  };
  
  const rangeLabels = {
    '0-10': '0-10',
    '11-15': '11-15',
    '16-20': '16-20',
    '21+': '21+'
  };

  const displayedStats = showAll ? monthlyStats : monthlyStats.slice(-2);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
          <Icon name="BarChart3" size={18} className="text-indigo-500" />
        </div>
        <h2 className="font-semibold text-gray-800 text-base">Распределение дней по контактам</h2>
      </div>
      <div className="p-5">
        <div className="space-y-4">
          {/* Легенда */}
          <div className="flex flex-wrap gap-3 text-xs">
            {Object.entries(rangeLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${rangeColors[key as keyof typeof rangeColors]}`} />
                <span className="text-gray-500">{label} контактов</span>
              </div>
            ))}
          </div>

          {/* Графики по месяцам */}
          {displayedStats.map((stat) => {
            const totalDays = stat.total_days;
            
            return (
              <div key={stat.month} className="space-y-2 relative">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700">{stat.month_name}</span>
                  <span className="text-gray-400 text-[10px]">
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
                        <span className="text-white font-bold text-[10px]">
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
                      className="absolute z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-3 mt-2 max-w-xs md:max-w-md tooltip-container"
                      style={{ left: '50%', transform: 'translateX(-50%)' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                          <Icon name="TrendingUp" size={13} />
                          Дни с 21+ контактами:
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="text-xs font-semibold text-emerald-500">⌀ {avgPerPromoter} к/п</div>
                          <div className="text-[9px] text-gray-400">контактов/промоутер</div>
                        </div>
                      </div>
                      {pinnedMonth === stat.month && (
                        <div className="text-[9px] text-gray-400 mb-2 flex items-center gap-1">
                          <Icon name="Pin" size={10} />
                          Закреплено • Кликните ещё раз для открепления
                        </div>
                      )}
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {stat.days_21_plus.map((day, idx) => {
                          const dayAvg = day.promoters > 0 ? (day.contacts / day.promoters).toFixed(1) : '0';
                          return (
                            <div key={idx} className="text-xs text-gray-700 flex items-center justify-between gap-2 py-0.5">
                              <span className="font-medium">{day.day}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-500 font-semibold">{day.contacts} к.</span>
                                <span className="text-gray-400">• {day.promoters} п.</span>
                                <span className="text-blue-400 text-[10px] font-medium">⌀{dayAvg}</span>
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
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2.5 text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <Icon name={showAll ? 'ChevronUp' : 'ChevronDown'} size={14} />
              {showAll ? 'Скрыть старые месяцы' : `Показать все месяцы (${monthlyStats.length - 2})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}