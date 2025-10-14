import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import StatsOverview from './StatsOverview';
import UsersRanking from './UsersRanking';
import DailyStatsCard from './DailyStatsCard';
import LeadsChart from './LeadsChart';
import DailyModal from './DailyModal';
import { Stats, UserStats, ChartDataPoint, ADMIN_API } from './types';

export default function StatsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dailyUserStats, setDailyUserStats] = useState<UserStats[]>([]);
  const [detailedLeads, setDetailedLeads] = useState<any[]>([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  
  // Состояния для графика
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<'contacts' | 'approaches'>('contacts');

  const getSessionToken = () => localStorage.getItem('session_token');

  const fetchChartData = async () => {
    try {
      const response = await fetch(`${ADMIN_API}?action=chart_data`, {
        headers: {
          'X-Session-Token': getSessionToken() || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        prepareChartData(data.chart_data);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных графика:', error);
    }
  };

  const prepareChartData = (rawData: any[]) => {
    // Группируем данные по датам
    const dateGroups = rawData.reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = { date, total: 0, contacts: 0, approaches: 0 };
      }
      
      acc[date].total += item.total_leads;
      acc[date].contacts += item.contacts;
      acc[date].approaches += item.approaches;
      acc[date][`${item.user_name}_total`] = item.total_leads;
      acc[date][`${item.user_name}_contacts`] = item.contacts;
      acc[date][`${item.user_name}_approaches`] = item.approaches;
      
      return acc;
    }, {} as Record<string, any>);

    // Преобразуем в массив и сортируем по дате
    const chartArray = Object.values(dateGroups).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    setChartData(chartArray as ChartDataPoint[]);
    
    // Получаем список всех пользователей
    const allUsers = [...new Set(rawData.map(item => item.user_name))];
    setSelectedUsers(allUsers);
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${ADMIN_API}?action=stats`, {
        headers: {
          'X-Session-Token': getSessionToken() || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
    setLoading(false);
  };

  const fetchDailyUserStats = async (date: string) => {
    setDailyLoading(true);
    try {
      const response = await fetch(`${ADMIN_API}?action=daily_user_stats&date=${date}`, {
        headers: {
          'X-Session-Token': getSessionToken() || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDailyUserStats(data.user_stats || []);
        setDetailedLeads(data.detailed_leads || []);
      }
    } catch (error) {
      console.error('Error fetching daily user stats:', error);
    }
    setDailyLoading(false);
  };

  const handleDayClick = async (date: string, count: number) => {
    if (count > 0) {
      setSelectedDate(date);
      await fetchDailyUserStats(date);
    }
  };

  const closeDailyModal = () => {
    setSelectedDate(null);
    setDailyUserStats([]);
    setDetailedLeads([]);
  };

  useEffect(() => {
    fetchStats();
    fetchChartData();
  }, []);

  if (loading) {
    return (
      <Card className="glass-panel border-white/10 rounded-2xl">
        <CardContent className="p-4 md:p-8">
          <div className="text-center text-white/70 flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base">
            <Icon name="Loader2" size={20} className="animate-spin md:w-6 md:h-6" />
            Загрузка статистики...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="glass-panel border-white/10 rounded-2xl">
        <CardContent className="p-4 md:p-8">
          <div className="text-center text-white/70">
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

      {/* Рейтинг пользователей */}
      <UsersRanking 
        userStats={stats.user_stats}
      />

      {/* Статистика за последние дни */}
      <DailyStatsCard 
        dailyStats={stats.daily_stats} 
        onDayClick={handleDayClick}
      />

      {/* График с лидами */}
      <LeadsChart
        chartData={chartData}
        selectedUsers={selectedUsers}
        filterType={filterType}
        userStats={stats.user_stats}
        onFilterTypeChange={setFilterType}
        onUsersChange={setSelectedUsers}
      />

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