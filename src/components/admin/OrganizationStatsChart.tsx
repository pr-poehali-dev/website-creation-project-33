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
  const [timeRange, setTimeRange] = React.useState<'week' | 'twoWeeks' | 'month' | 'year' | 'all'>('week');
  const [selectedOrg, setSelectedOrg] = React.useState<string | null>(null);

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

  const getFilteredData = () => {
    if (timeRange === 'all') {
      return orgStatsData;
    }

    const now = new Date();
    const daysToSubtract = {
      week: 7,
      twoWeeks: 14,
      month: 30,
      year: 365,
    }[timeRange];

    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - daysToSubtract);

    return orgStatsData.filter(item => new Date(item.date) >= cutoffDate);
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
              onClick={() => setTimeRange('week')}
              variant={timeRange === 'week' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${timeRange === 'week'
                ? 'bg-[#001f54] hover:bg-[#002b6b] text-white shadow-lg'
                : 'bg-gray-100 hover:bg-gray-100 text-gray-900 border-gray-200'
              }`}
            >
              7д
            </Button>
            <Button
              onClick={() => setTimeRange('twoWeeks')}
              variant={timeRange === 'twoWeeks' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${timeRange === 'twoWeeks'
                ? 'bg-[#001f54] hover:bg-[#002b6b] text-white shadow-lg'
                : 'bg-gray-100 hover:bg-gray-100 text-gray-900 border-gray-200'
              }`}
            >
              14д
            </Button>
            <Button
              onClick={() => setTimeRange('month')}
              variant={timeRange === 'month' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${timeRange === 'month'
                ? 'bg-[#001f54] hover:bg-[#002b6b] text-white shadow-lg'
                : 'bg-gray-100 hover:bg-gray-100 text-gray-900 border-gray-200'
              }`}
            >
              30д
            </Button>
            <Button
              onClick={() => setTimeRange('year')}
              variant={timeRange === 'year' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${timeRange === 'year'
                ? 'bg-[#001f54] hover:bg-[#002b6b] text-white shadow-lg'
                : 'bg-gray-100 hover:bg-gray-100 text-gray-900 border-gray-200'
              }`}
            >
              Год
            </Button>
            <Button
              onClick={() => setTimeRange('all')}
              variant={timeRange === 'all' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${timeRange === 'all'
                ? 'bg-[#001f54] hover:bg-[#002b6b] text-white shadow-lg'
                : 'bg-gray-100 hover:bg-gray-100 text-gray-900 border-gray-200'
              }`}
            >
              Всё
            </Button>
          </div>
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
