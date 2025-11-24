import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useOrganizationStats } from '@/hooks/useAdminData';

interface OrganizationStat {
  date: string;
  organization_name: string;
  organization_id: number;
  total_contacts: number;
  contact_rate: number;
  payment_type: string;
  user_stats: Array<{
    user_name: string;
    contacts: number;
  }>;
}

export default function OrganizationStatsChart() {
  const { data: orgStatsData = [], isLoading, refetch } = useOrganizationStats(true);
  const [timeRange, setTimeRange] = React.useState<'week' | 'month' | 'year'>('week');
  const [selectedOrg, setSelectedOrg] = React.useState<string | null>(null);
  const [selectedWeekIndex, setSelectedWeekIndex] = React.useState<number>(0);
  const [selectedMonthIndex, setSelectedMonthIndex] = React.useState<number>(0);
  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear());

  if (isLoading) {
    return (
      <Card className="bg-slate-900 border-slate-700 rounded-2xl">
        <CardContent className="p-4 md:p-8">
          <div className="text-center text-slate-300 flex items-center justify-center gap-2 text-sm">
            <Icon name="Loader2" size={20} className="animate-spin" />
            Загрузка статистики по организациям...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orgStatsData.length === 0) {
    return null;
  }

  // Получаем доступные недели (последние 12 недель с понедельника по воскресенье)
  const getAvailableWeeks = () => {
    const weeks = [];
    const now = new Date();
    
    // Находим ближайшее воскресенье (конец недели)
    const currentDayOfWeek = now.getDay(); // 0 = воскресенье, 1 = понедельник, ..., 6 = суббота
    const daysUntilSunday = currentDayOfWeek === 0 ? 0 : 7 - currentDayOfWeek;
    
    const lastSunday = new Date(now);
    lastSunday.setDate(now.getDate() + daysUntilSunday);
    lastSunday.setHours(23, 59, 59, 999);
    
    for (let i = 0; i < 12; i++) {
      const weekEnd = new Date(lastSunday);
      weekEnd.setDate(lastSunday.getDate() - (i * 7));
      
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);
      
      weeks.push({
        start: weekStart,
        end: weekEnd,
        label: `${weekStart.getDate()}.${String(weekStart.getMonth() + 1).padStart(2, '0')} - ${weekEnd.getDate()}.${String(weekEnd.getMonth() + 1).padStart(2, '0')}`
      });
    }
    
    return weeks;
  };

  // Получаем доступные месяцы (последние 12 месяцев)
  const getAvailableMonths = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        date: monthDate,
        label: monthDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
      });
    }
    
    return months;
  };

  // Получаем доступные годы
  const getAvailableYears = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    const oldestDataYear = orgStatsData.length > 0 
      ? new Date(orgStatsData[orgStatsData.length - 1].date).getFullYear()
      : currentYear;
    
    for (let year = currentYear; year >= Math.max(oldestDataYear, currentYear - 5); year--) {
      years.push(year);
    }
    
    return years;
  };

  const availableWeeks = getAvailableWeeks();
  const availableMonths = getAvailableMonths();
  const availableYears = getAvailableYears();

  const getFilteredData = () => {
    if (timeRange === 'week') {
      const week = availableWeeks[selectedWeekIndex];
      return orgStatsData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= week.start && itemDate <= week.end;
      });
    }
    
    if (timeRange === 'month') {
      const month = availableMonths[selectedMonthIndex];
      return orgStatsData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === month.date.getMonth() && 
               itemDate.getFullYear() === month.date.getFullYear();
      });
    }
    
    if (timeRange === 'year') {
      return orgStatsData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getFullYear() === selectedYear;
      });
    }

    return orgStatsData;
  };

  const filteredData = getFilteredData();

  // Подсчитываем общее количество контактов за выбранный период
  const totalContactsForPeriod = filteredData.reduce((sum, item) => sum + item.total_contacts, 0);

  // Получаем список всех организаций
  const organizations = Array.from(
    new Set(filteredData.map(d => d.organization_name))
  ).sort();

  // Агрегируем статистику по организациям
  const orgTotals = filteredData.reduce((acc, item) => {
    if (!acc[item.organization_name]) {
      acc[item.organization_name] = {
        name: item.organization_name,
        total: 0,
        contact_rate: item.contact_rate || 0,
        payment_type: item.payment_type || 'cash',
        users: {}
      };
    }
    acc[item.organization_name].total += item.total_contacts;
    
    // Агрегируем по пользователям
    item.user_stats.forEach(userStat => {
      if (!acc[item.organization_name].users[userStat.user_name]) {
        acc[item.organization_name].users[userStat.user_name] = 0;
      }
      acc[item.organization_name].users[userStat.user_name] += userStat.contacts;
    });
    
    return acc;
  }, {} as Record<string, { name: string; total: number; contact_rate: number; payment_type: string; users: Record<string, number> }>);

  // Сортируем организации по количеству контактов
  const sortedOrgs = Object.values(orgTotals).sort((a, b) => b.total - a.total);

  const ORG_COLORS: Record<string, string> = {
    'Сотка': '#10b981',
    'ТОП (Академическая)': '#3b82f6',
    'ТОП (Беляево)': '#6366f1',
    'ТОП (Коломенская)': '#8b5cf6',
    'ТОП (Юго-Западная)': '#a855f7',
    'ТОП (Речной Вокзал)': '#ec4899',
    'ТОП (Домодедовская)': '#f59e0b',
    'ТОП (Митино)': '#ef4444',
    'ТОП (Перово)': '#14b8a6',
    'ТОП (Реутов)': '#06b6d4',
    'ТОП (Тушинская)': '#84cc16',
    'ТОП (Ногинск)': '#f97316',
    'ТОП (Воскресенск)': '#d946ef',
    'KIBERONE (Бабушкинская)': '#0891b2',
    'KIBERONE (Бибирево)': '#7c3aed',
    'KIBERONE (Деловой Центр)': '#dc2626',
    'KIBERONE (Электросталь)': '#ca8a04',
    'WORKOUT ANT': '#16a34a',
    'Не указана': '#9ca3af'
  };

  return (
    <Card className="bg-slate-900 border-slate-700 rounded-2xl slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="flex items-center justify-between gap-2 md:gap-3 text-slate-100 text-lg md:text-xl">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 rounded-lg bg-slate-800">
              <Icon name="Building2" size={18} className="text-cyan-400 md:w-5 md:h-5" />
            </div>
            Статистика по организациям
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700"
          >
            <Icon name="RefreshCw" size={14} className="md:w-4 md:h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 md:mb-6 space-y-3 md:space-y-4">
          <div className="flex flex-wrap gap-1.5 md:gap-2 items-center">
            <span className="text-xs md:text-sm text-slate-300 font-medium">Период:</span>
            <Button
              onClick={() => {
                setTimeRange('week');
                setSelectedWeekIndex(0);
              }}
              variant={timeRange === 'week' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${timeRange === 'week'
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              Неделя
            </Button>
            <Button
              onClick={() => {
                setTimeRange('month');
                setSelectedMonthIndex(0);
              }}
              variant={timeRange === 'month' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${timeRange === 'month'
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              Месяц
            </Button>
            <Button
              onClick={() => {
                setTimeRange('year');
                setSelectedYear(new Date().getFullYear());
              }}
              variant={timeRange === 'year' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${timeRange === 'year'
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              Год
            </Button>
          </div>

          {/* Выбор конкретной недели */}
          {timeRange === 'week' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setSelectedWeekIndex(prev => Math.min(prev + 1, availableWeeks.length - 1))}
                  disabled={selectedWeekIndex >= availableWeeks.length - 1}
                  variant="outline"
                  size="sm"
                  className="h-8 bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700"
                >
                  <Icon name="ChevronLeft" size={16} />
                </Button>
                <span className="text-xs md:text-sm text-slate-200 font-medium min-w-[180px] text-center">
                  {availableWeeks[selectedWeekIndex]?.label}
                </span>
                <Button
                  onClick={() => setSelectedWeekIndex(prev => Math.max(prev - 1, 0))}
                  disabled={selectedWeekIndex <= 0}
                  variant="outline"
                  size="sm"
                  className="h-8 bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700"
                >
                  <Icon name="ChevronRight" size={16} />
                </Button>
              </div>
              <div className="text-center">
                <span className="text-sm font-semibold text-cyan-400">
                  Всего за неделю: {totalContactsForPeriod.toLocaleString('ru-RU')} контактов
                </span>
              </div>
            </div>
          )}

          {/* Выбор конкретного месяца */}
          {timeRange === 'month' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setSelectedMonthIndex(prev => Math.min(prev + 1, availableMonths.length - 1))}
                  disabled={selectedMonthIndex >= availableMonths.length - 1}
                  variant="outline"
                  size="sm"
                  className="h-8 bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700"
                >
                  <Icon name="ChevronLeft" size={16} />
                </Button>
                <span className="text-xs md:text-sm text-slate-200 font-medium min-w-[180px] text-center">
                  {availableMonths[selectedMonthIndex]?.label}
                </span>
                <Button
                  onClick={() => setSelectedMonthIndex(prev => Math.max(prev - 1, 0))}
                  disabled={selectedMonthIndex <= 0}
                  variant="outline"
                  size="sm"
                  className="h-8 bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700"
                >
                  <Icon name="ChevronRight" size={16} />
                </Button>
              </div>
              <div className="text-center">
                <span className="text-sm font-semibold text-cyan-400">
                  Всего за месяц: {totalContactsForPeriod.toLocaleString('ru-RU')} контактов
                </span>
              </div>
            </div>
          )}

          {/* Выбор года */}
          {timeRange === 'year' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setSelectedYear(prev => Math.min(prev + 1, availableYears[0]))}
                  disabled={selectedYear >= availableYears[0]}
                  variant="outline"
                  size="sm"
                  className="h-8 bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700"
                >
                  <Icon name="ChevronLeft" size={16} />
                </Button>
                <span className="text-xs md:text-sm text-slate-200 font-medium min-w-[100px] text-center">
                  {selectedYear}
                </span>
                <Button
                  onClick={() => setSelectedYear(prev => Math.max(prev - 1, availableYears[availableYears.length - 1]))}
                  disabled={selectedYear <= availableYears[availableYears.length - 1]}
                  variant="outline"
                  size="sm"
                  className="h-8 bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700"
                >
                  <Icon name="ChevronRight" size={16} />
                </Button>
              </div>
              <div className="text-center">
                <span className="text-sm font-semibold text-cyan-400">
                  Всего за год: {totalContactsForPeriod.toLocaleString('ru-RU')} контактов
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {sortedOrgs.map(org => {
            const isExpanded = selectedOrg === org.name;
            const usersList = Object.entries(org.users).sort((a, b) => b[1] - a[1]);
            
            return (
              <div key={org.name} className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800">
                <button
                  onClick={() => setSelectedOrg(isExpanded ? null : org.name)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: ORG_COLORS[org.name] || '#9ca3af' }}
                    />
                    <span className="font-semibold text-sm md:text-base text-slate-100">
                      {org.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {org.contact_rate > 0 && (
                      <div className="text-right">
                        <div className="text-base md:text-lg font-bold text-yellow-400">
                          {(() => {
                            const revenue = org.total * org.contact_rate;
                            const revenueAfterTax = org.payment_type === 'cashless' ? revenue * 0.93 : revenue;
                            return Math.round(revenueAfterTax).toLocaleString('ru-RU');
                          })()}₽
                        </div>
                        <div className="text-xs text-slate-400">
                          {org.payment_type === 'cash' ? 'наличка' : 'безнал'}
                        </div>
                      </div>
                    )}
                    <span className="text-lg md:text-xl font-bold text-cyan-400">
                      {org.total}
                    </span>
                    <Icon
                      name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
                      size={20}
                      className="text-slate-400"
                    />
                  </div>
                </button>

                {isExpanded && usersList.length > 0 && (
                  <div className="border-t border-slate-700 bg-slate-700/50 p-4">
                    <div className="space-y-2">
                      {usersList.map(([userName, contacts]) => (
                        <div
                          key={userName}
                          className="flex items-center justify-between py-2 px-3 bg-slate-800 rounded-lg"
                        >
                          <span className="text-sm text-slate-200">{userName}</span>
                          <span className="text-sm font-semibold text-slate-100">
                            {contacts} контакт{contacts === 1 ? '' : contacts < 5 ? 'а' : 'ов'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}