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
      <Card className="glass-effect border-white/20 shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center text-white flex items-center justify-center gap-3">
            <Icon name="Loader2" size={24} className="animate-spin" />
            Загрузка статистики...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="glass-effect border-white/20 shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center text-white/70 flex items-center justify-center gap-3">
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
      <Card className="glass-effect border-white/20 shadow-2xl slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 pulse-glow">
              <Icon name="TrendingUp" size={20} className="text-white" />
            </div>
            Общая статистика
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-6xl font-bold gradient-text mb-4 pulse-glow">
              {stats.total_leads}
            </div>
            <div className="text-white/80 text-lg">Всего лидов отправлено</div>
          </div>
        </CardContent>
      </Card>

      {/* Рейтинг пользователей */}
      <Card className="glass-effect border-white/20 shadow-2xl slide-up" style={{animationDelay: '0.2s'}}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 pulse-glow">
              <Icon name="Trophy" size={20} className="text-white" />
            </div>
            Рейтинг пользователей
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.user_stats.map((user, index) => {
              const isTop3 = index < 3;
              const medalColors = ['from-yellow-400 to-yellow-600', 'from-gray-300 to-gray-500', 'from-amber-600 to-amber-800'];
              
              return (
                <div 
                  key={user.email} 
                  className="glass-effect border-white/10 rounded-xl p-4 hover:bg-white/5 transition-all duration-300 slide-up"
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        isTop3 
                          ? `bg-gradient-to-br ${medalColors[index]} text-white shadow-lg glow-button`
                          : 'glass-effect border-white/20 text-white'
                      } font-bold text-lg`}>
                        {isTop3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-white text-lg">{user.name}</div>
                        <div className="text-sm text-white/70">{user.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-400 pulse-glow">{user.lead_count}</div>
                      <div className="text-sm text-white/60">лидов</div>
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
        <Card className="glass-effect border-white/20 shadow-2xl slide-up" style={{animationDelay: '0.4s'}}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white text-xl">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 pulse-glow">
                <Icon name="Calendar" size={20} className="text-white" />
              </div>
              Статистика за последние дни
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.daily_stats.slice(0, 7).map((day, index) => (
                <div 
                  key={day.date} 
                  className="flex justify-between items-center p-3 glass-effect border-white/10 rounded-lg transition-all duration-300 hover:bg-white/5 slide-up"
                  style={{animationDelay: `${index * 0.05}s`}}
                >
                  <span className="text-white/90 font-medium">
                    {new Date(day.date).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold text-lg">{day.count}</span>
                    <span className="text-white/60 text-sm">лидов</span>
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