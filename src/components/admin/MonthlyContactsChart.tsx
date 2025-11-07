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
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  if (isLoading) {
    return (
      <Card className="bg-white border-gray-200 rounded-2xl">
        <CardContent className="p-4 md:p-8">
          <div className="text-center text-gray-600 flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base">
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
    <Card className="bg-white border-gray-200 rounded-2xl slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 md:gap-3 text-gray-900 text-base md:text-xl">
          <div className="p-1.5 md:p-2 rounded-lg bg-gray-100">
            <Icon name="BarChart3" size={18} className="text-gray-900 md:w-5 md:h-5" />
          </div>
          Распределение дней по контактам
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 md:space-y-5">
          {/* Легенда */}
          <div className="flex flex-wrap gap-3 md:gap-4 text-[10px] md:text-xs">
            {Object.entries(rangeLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${rangeColors[key as keyof typeof rangeColors]}`} />
                <span className="text-gray-700">{label} контактов</span>
              </div>
            ))}
          </div>

          {/* Графики по месяцам */}
          {displayedStats.map((stat) => {
            const totalDays = stat.total_days;
            
            return (
              <div key={stat.month} className="space-y-2 relative">
                <div className="flex items-center justify-between text-xs md:text-sm">
                  <span className="font-medium text-gray-700">{stat.month_name}</span>
                  <span className="text-gray-500 text-[10px] md:text-xs">
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
                        className={`${rangeColors[range as keyof typeof rangeColors]} flex items-center justify-center transition-all duration-500 relative ${isGreenZone ? 'cursor-pointer hover:brightness-110' : ''}`}
                        style={{ width: `${percentage}%` }}
                        title={`${rangeLabels[range as keyof typeof rangeLabels]} контактов: ${count} дней`}
                        onMouseEnter={(e) => {
                          if (isGreenZone && stat.days_21_plus && stat.days_21_plus.length > 0) {
                            setHoveredMonth(stat.month);
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltipPosition({ x: rect.left, y: rect.top });
                          }
                        }}
                        onMouseLeave={() => {
                          if (isGreenZone) {
                            setHoveredMonth(null);
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
                {hoveredMonth === stat.month && stat.days_21_plus && stat.days_21_plus.length > 0 && (
                  <div 
                    className="absolute z-50 bg-white border-2 border-green-500 rounded-lg shadow-2xl p-3 mt-2 max-w-xs md:max-w-md"
                    style={{ 
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <div className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1.5">
                      <Icon name="TrendingUp" size={14} />
                      Дни с 21+ контактами:
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {stat.days_21_plus.map((day, idx) => (
                        <div key={idx} className="text-[10px] md:text-xs text-gray-700 flex items-center justify-between gap-2 py-0.5">
                          <span className="font-medium">{day.day}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600 font-semibold">{day.contacts} контактов</span>
                            <span className="text-gray-500">• {day.promoters} пром.</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Кнопка показать все */}
          {monthlyStats.length > 2 && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => setShowAll(!showAll)}
                className="text-sm"
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