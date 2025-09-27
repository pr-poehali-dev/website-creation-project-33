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
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Загрузка статистики...</div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Статистика недоступна</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Общая статистика */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="TrendingUp" size={20} />
            Общая статистика
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {stats.total_leads}
            </div>
            <div className="text-gray-600">Всего лидов отправлено</div>
          </div>
        </CardContent>
      </Card>

      {/* Рейтинг пользователей */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Trophy" size={20} />
            Рейтинг пользователей
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.user_stats.map((user, index) => (
              <div key={user.email} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{user.lead_count}</div>
                  <div className="text-sm text-gray-500">лидов</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Статистика по дням */}
      {stats.daily_stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Calendar" size={20} />
              Статистика за последние дни
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.daily_stats.slice(0, 7).map((day) => (
                <div key={day.date} className="flex justify-between items-center p-2 border rounded">
                  <span className="text-sm">
                    {new Date(day.date).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <span className="font-medium">{day.count} лидов</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}