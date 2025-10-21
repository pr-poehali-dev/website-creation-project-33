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
  user_stats: Array<{
    user_name: string;
    contacts: number;
  }>;
}

export default function OrganizationStatsChart() {
  const { data: orgStatsData = [], isLoading } = useOrganizationStats(true);
  const [timeRange, setTimeRange] = React.useState<'week' | 'month' | 'year'>('week');
  const [selectedOrg, setSelectedOrg] = React.useState<string | null>(null);
  const [selectedWeekIndex, setSelectedWeekIndex] = React.useState<number>(0);
  const [selectedMonthIndex, setSelectedMonthIndex] = React.useState<number>(0);
  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear());

  if (isLoading) {
    return (
      <Card className="bg-white border-gray-200 rounded-2xl">
        <CardContent className="p-4 md:p-8">
          <div className="text-center text-gray-600 flex items-center justify-center gap-2 text-sm">
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

  // Получаем доступные недели (последние 12 недель)
  const getAvailableWeeks = () => {
    const weeks = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - (i * 7));
      
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      
      weeks.push({
        start: weekStart,
        end: weekEnd,
        label: `${weekStart.getDate()} ${weekStart.toLocaleDateString('ru-RU', { month: 'short' })} - ${weekEnd.getDate()} ${weekEnd.toLocaleDateString('ru-RU', { month: 'short' })}`
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
  }, {} as Record<string, { name: string; total: number; users: Record<string, number> }>);

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
    <Card className="bg-white border-gray-200 rounded-2xl slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="flex items-center gap-2 md:gap-3 text-gray-900 text-lg md:text-xl">
          <div className="p-1.5 md:p-2 rounded-lg bg-gray-100">
            <Icon name="Building2" size={18} className="text-gray-900 md:w-5 md:h-5" />
          </div>
          Статистика по организациям
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 md:mb-6 space-y-3 md:space-y-4">
          <div className="flex flex-wrap gap-1.5 md:gap-2 items-center">
            <span className="text-xs md:text-sm text-gray-600 font-medium">Период:</span>
            <Button
              onClick={() => {
                setTimeRange('week');
                setSelectedWeekIndex(0);
              }}
              variant={timeRange === 'week' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${timeRange === 'week'
                ? 'bg-[#001f54] hover:bg-[#002b6b] text-white shadow-lg'
                : 'bg-gray-100 hover:bg-gray-100 text-gray-900 border-gray-200'
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
                ? 'bg-[#001f54] hover:bg-[#002b6b] text-white shadow-lg'
                : 'bg-gray-100 hover:bg-gray-100 text-gray-900 border-gray-200'
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
                ? 'bg-[#001f54] hover:bg-[#002b6b] text-white shadow-lg'
                : 'bg-gray-100 hover:bg-gray-100 text-gray-900 border-gray-200'
              }`}
            >
              Год
            </Button>
          </div>

          {/* Выбор конкретной недели */}
          {timeRange === 'week' && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setSelectedWeekIndex(prev => Math.min(prev + 1, availableWeeks.length - 1))}
                disabled={selectedWeekIndex >= availableWeeks.length - 1}
                variant="outline"
                size="sm"
                className="h-8"
              >
                <Icon name="ChevronLeft" size={16} />
              </Button>
              <span className="text-xs md:text-sm text-gray-700 font-medium min-w-[180px] text-center">
                {availableWeeks[selectedWeekIndex]?.label}
              </span>
              <Button
                onClick={() => setSelectedWeekIndex(prev => Math.max(prev - 1, 0))}
                disabled={selectedWeekIndex <= 0}
                variant="outline"
                size="sm"
                className="h-8"
              >
                <Icon name="ChevronRight" size={16} />
              </Button>
            </div>
          )}

          {/* Выбор конкретного месяца */}
          {timeRange === 'month' && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setSelectedMonthIndex(prev => Math.min(prev + 1, availableMonths.length - 1))}
                disabled={selectedMonthIndex >= availableMonths.length - 1}
                variant="outline"
                size="sm"
                className="h-8"
              >
                <Icon name="ChevronLeft" size={16} />
              </Button>
              <span className="text-xs md:text-sm text-gray-700 font-medium min-w-[180px] text-center">
                {availableMonths[selectedMonthIndex]?.label}
              </span>
              <Button
                onClick={() => setSelectedMonthIndex(prev => Math.max(prev - 1, 0))}
                disabled={selectedMonthIndex <= 0}
                variant="outline"
                size="sm"
                className="h-8"
              >
                <Icon name="ChevronRight" size={16} />
              </Button>
            </div>
          )}

          {/* Выбор года */}
          {timeRange === 'year' && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setSelectedYear(prev => Math.min(prev + 1, availableYears[0]))}
                disabled={selectedYear >= availableYears[0]}
                variant="outline"
                size="sm"
                className="h-8"
              >
                <Icon name="ChevronLeft" size={16} />
              </Button>
              <span className="text-xs md:text-sm text-gray-700 font-medium min-w-[100px] text-center">
                {selectedYear}
              </span>
              <Button
                onClick={() => setSelectedYear(prev => Math.max(prev - 1, availableYears[availableYears.length - 1]))}
                disabled={selectedYear <= availableYears[availableYears.length - 1]}
                variant="outline"
                size="sm"
                className="h-8"
              >
                <Icon name="ChevronRight" size={16} />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {sortedOrgs.map(org => {
            const isExpanded = selectedOrg === org.name;
            const usersList = Object.entries(org.users).sort((a, b) => b[1] - a[1]);
            
            return (
              <div key={org.name} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setSelectedOrg(isExpanded ? null : org.name)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: ORG_COLORS[org.name] || '#9ca3af' }}
                    />
                    <span className="font-semibold text-sm md:text-base text-gray-900">
                      {org.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg md:text-xl font-bold text-[#001f54]">
                      {org.total}
                    </span>
                    <Icon
                      name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
                      size={20}
                      className="text-gray-400"
                    />
                  </div>
                </button>

                {isExpanded && usersList.length > 0 && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <div className="space-y-2">
                      {usersList.map(([userName, contacts]) => (
                        <div
                          key={userName}
                          className="flex items-center justify-between py-2 px-3 bg-white rounded-lg"
                        >
                          <span className="text-sm text-gray-700">{userName}</span>
                          <span className="text-sm font-semibold text-gray-900">
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