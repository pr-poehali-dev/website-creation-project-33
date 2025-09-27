import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface UserStats {
  name: string;
  email: string;
  lead_count: number;
}

interface DailyStats {
  date: string;
  count: number;
}

interface Stats {
  total_leads: number;
  user_stats: UserStats[];
  daily_stats: DailyStats[];
}

const ADMIN_API = 'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214';

export default function StatsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const getSessionToken = () => localStorage.getItem('session_token');

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

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Card className="border-gray-200 shadow-lg bg-white">
        <CardContent className="p-8">
          <div className="text-center text-gray-600 flex items-center justify-center gap-3">
            <Icon name="Loader2" size={24} className="animate-spin" />
            Загрузка статистики...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="border-gray-200 shadow-lg bg-white">
        <CardContent className="p-8">
          <div className="text-center text-gray-600 flex items-center justify-center gap-3">
            <Icon name="AlertCircle" size={24} />
            Статистика недоступна
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Общая статистика */}
      <Card className="border-gray-200 shadow-lg bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-black text-xl">
            <div className="p-2 rounded-lg bg-gray-100">
              <Icon name="TrendingUp" size={20} className="text-gray-600" />
            </div>
            Общая статистика
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-6xl font-bold text-black mb-4">
              {stats.total_leads}
            </div>
            <div className="text-gray-600 text-lg">Всего лидов отправлено</div>
          </div>
        </CardContent>
      </Card>

      {/* Рейтинг пользователей */}
      <Card className="border-gray-200 shadow-lg bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-black text-xl">
            <div className="p-2 rounded-lg bg-gray-100">
              <Icon name="Trophy" size={20} className="text-gray-600" />
            </div>
            Рейтинг пользователей
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.user_stats.map((user, index) => {
              const isTop3 = index < 3;
              const medalColors = ['from-black to-gray-800', 'from-gray-400 to-gray-600', 'from-gray-600 to-gray-800'];
              
              return (
                <div 
                  key={user.email} 
                  className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-all duration-300 bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        isTop3 
                          ? `bg-gradient-to-br ${medalColors[index]} text-white shadow-lg`
                          : 'bg-gray-100 border border-gray-200 text-gray-700'
                      } font-bold text-lg`}>
                        {isTop3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-black text-lg">{user.name}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-black">{user.lead_count}</div>
                      <div className="text-sm text-gray-500">лидов</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Статистика по дням */}
      {stats.daily_stats.length > 0 && (
        <Card className="border-gray-200 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-black text-xl">
              <div className="p-2 rounded-lg bg-gray-100">
                <Icon name="Calendar" size={20} className="text-gray-600" />
              </div>
              Статистика за последние дни
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.daily_stats.slice(0, 7).map((day, index) => (
                <div 
                  key={day.date} 
                  className="flex justify-between items-center p-3 border border-gray-100 rounded-lg transition-all duration-300 hover:bg-gray-50 bg-white shadow-sm"
                >
                  <span className="text-black font-medium">
                    {new Date(day.date).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-black font-bold text-lg">{day.count}</span>
                    <span className="text-gray-500 text-sm">лидов</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}