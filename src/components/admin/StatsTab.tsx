import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import StatsOverview from './StatsOverview';
import UsersRanking from './UsersRanking';
import DailyStatsCard from './DailyStatsCard';
import LeadsChart from './LeadsChart';
import OrganizationStatsChart from './OrganizationStatsChart';
import MonthlyContactsChart from './MonthlyContactsChart';
import DailyModal from './DailyModal';
import { Stats, UserStats, ChartDataPoint } from './types';
import { useStats, useChartData, useDailyUserStats } from '@/hooks/useAdminData';

interface StatsTabProps {
  enabled?: boolean;
}

export default function StatsTab({ enabled = true }: StatsTabProps) {
  const { data: stats = null, isLoading: loading } = useStats(enabled);
  const { data: rawChartData = [] } = useChartData(enabled);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { data: dailyData, isLoading: dailyLoading } = useDailyUserStats(selectedDate);
  const dailyUserStats = dailyData?.user_stats || [];
  const detailedLeads = dailyData?.detailed_leads || [];
  const [exportingAll, setExportingAll] = useState(false);
  
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<'contacts' | 'approaches'>('contacts');
  const [selectedOrganizations, setSelectedOrganizations] = useState<number[]>([]);

  const getSessionToken = () => localStorage.getItem('session_token');



  const prepareChartData = (rawData: any[]) => {
    // Группируем данные по датам
    const dateGroups = rawData.reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = { date, total: 0, contacts: 0, approaches: 0, organization_ids: [], user_orgs: {} };
      }
      
      acc[date].total += item.total_leads;
      acc[date].contacts += item.contacts;
      acc[date].approaches += item.approaches;
      acc[date][`${item.user_name}_total`] = item.total_leads;
      acc[date][`${item.user_name}_contacts`] = item.contacts;
      acc[date][`${item.user_name}_approaches`] = item.approaches;
      
      // Сохраняем привязку организаций к пользователю
      if (item.organization_ids && Array.isArray(item.organization_ids) && item.organization_ids.length > 0) {
        acc[date].user_orgs[item.user_name] = item.organization_ids;
        
        // Также добавляем в общий список организаций
        const existingIds = acc[date].organization_ids as number[];
        item.organization_ids.forEach((orgId: number) => {
          if (!existingIds.includes(orgId)) {
            existingIds.push(orgId);
          }
        });
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Преобразуем в массив и сортируем по дате
    const chartArray = Object.values(dateGroups).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    console.log('📊 Подготовленные данные графика:', chartArray.slice(0, 3));
    setChartData(chartArray as ChartDataPoint[]);
    
    // Изначально не выбираем никаких пользователей - только общая статистика
    setSelectedUsers([]);
  };



  const handleDayClick = async (date: string, count: number) => {
    if (count > 0) {
      setSelectedDate(date);
    }
  };

  const closeDailyModal = () => {
    setSelectedDate(null);
  };

  useEffect(() => {
    if (rawChartData.length > 0) {
      prepareChartData(rawChartData);
    }
  }, [rawChartData]);

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-700 rounded-2xl">
        <CardContent className="p-4 md:p-8">
          <div className="text-center text-slate-300 flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base">
            <Icon name="Loader2" size={20} className="animate-spin md:w-6 md:h-6" />
            Загрузка статистики...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="bg-slate-900 border-slate-700 rounded-2xl">
        <CardContent className="p-4 md:p-8">
          <div className="text-center text-slate-300">
            <Icon name="AlertCircle" size={28} className="mx-auto mb-3 opacity-60 md:w-8 md:h-8" />
            <div className="text-base md:text-lg font-medium">Ошибка загрузки данных</div>
            <div className="text-xs md:text-sm">Попробуйте обновить страницу</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const exportAllToGoogleSheets = async () => {
    setExportingAll(true);
    try {
      const response = await fetch('https://functions.poehali.dev/b5adaa83-68c7-43cf-a042-4b4b60dc8d82', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          total_leads: stats.total_leads,
          contacts: stats.contacts,
          approaches: stats.approaches,
          user_stats: stats.user_stats,
          daily_stats: stats.daily_stats,
          chart_data: chartData
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка экспорта');
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Успешно!',
          description: `Экспортировано ${result.sheets_created} листов с данными в Google Sheets`
        });
      } else {
        throw new Error(result.error || 'Неизвестная ошибка');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Ошибка экспорта',
        description: 'Не удалось экспортировать данные в Google Sheets',
        variant: 'destructive'
      });
    } finally {
      setExportingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Общая статистика */}
      <StatsOverview 
        stats={stats} 
        onExportAll={exportAllToGoogleSheets}
        exportingAll={exportingAll}
      />

      {/* Статистика за последние дни */}
      <DailyStatsCard 
        dailyStats={stats.daily_stats} 
        onDayClick={handleDayClick}
      />

      {/* Средние контакты по месяцам */}
      <MonthlyContactsChart />

      {/* Рейтинг пользователей */}
      <UsersRanking 
        userStats={stats.user_stats}
      />

      {/* График с лидами */}
      <LeadsChart
        chartData={chartData}
        selectedUsers={selectedUsers}
        filterType={filterType}
        userStats={stats.user_stats}
        onFilterTypeChange={setFilterType}
        onUsersChange={setSelectedUsers}
        selectedOrganizations={selectedOrganizations}
        onOrganizationsChange={setSelectedOrganizations}
      />

      {/* Статистика по организациям */}
      <OrganizationStatsChart />

      {/* Модальное окно с детализацией по дням */}
      <DailyModal
        selectedDate={selectedDate}
        dailyUserStats={dailyUserStats}
        detailedLeads={detailedLeads}
        dailyLoading={dailyLoading}
        onClose={closeDailyModal}
      />
    </div>
  );
}