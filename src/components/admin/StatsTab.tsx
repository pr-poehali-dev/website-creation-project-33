import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface UserStats {
  name: string;
  email: string;
  lead_count: number;
  contacts: number;
  approaches: number;
}

interface DailyStats {
  date: string;
  count: number;
  contacts: number;
  approaches: number;
}

interface DailyUserStats {
  user_stats: UserStats[];
}

interface Stats {
  total_leads: number;
  contacts: number;
  approaches: number;
  user_stats: UserStats[];
  daily_stats: DailyStats[];
}

const ADMIN_API = 'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214';

export default function StatsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dailyUserStats, setDailyUserStats] = useState<UserStats[]>([]);
  const [dailyLoading, setDailyLoading] = useState(false);

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
      }
    } catch (error) {
      console.error('Error fetching daily user stats:', error);
    }
    setDailyLoading(false);
  };

  const handleDayClick = async (date: string, count: number) => {
    if (count === 0) return; // Не показываем пустые дни
    
    setSelectedDate(date);
    await fetchDailyUserStats(date);
  };

  const closeDailyModal = () => {
    setSelectedDate(null);
    setDailyUserStats([]);
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Всего лидов */}
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-black mb-2">
                {stats.total_leads}
              </div>
              <div className="text-gray-600 text-sm md:text-base">Всего лидов</div>
            </div>
            
            {/* Контакты */}
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">
                {stats.contacts}
              </div>
              <div className="text-gray-600 text-sm md:text-base">Контакты</div>
              <div className="text-xs text-gray-500 mt-1">с номером телефона</div>
            </div>
            
            {/* Подходы */}
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-orange-600 mb-2">
                {stats.approaches}
              </div>
              <div className="text-gray-600 text-sm md:text-base">Подходы</div>
              <div className="text-xs text-gray-500 mt-1">без номера телефона</div>
            </div>
          </div>
          
          {/* Процентное соотношение */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <span>Контакты: {stats.total_leads > 0 ? Math.round((stats.contacts / stats.total_leads) * 100) : 0}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                <span>Подходы: {stats.total_leads > 0 ? Math.round((stats.approaches / stats.total_leads) * 100) : 0}%</span>
              </div>
            </div>
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
                      <div className="text-3xl font-bold text-black mb-1">{user.lead_count}</div>
                      <div className="text-xs text-gray-500 mb-2">всего лидов</div>
                      <div className="flex justify-end gap-4 text-xs">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{user.contacts}</div>
                          <div className="text-gray-500">контакты</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">{user.approaches}</div>
                          <div className="text-gray-500">подходы</div>
                        </div>
                      </div>
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
                  onClick={() => handleDayClick(day.date, day.count)}
                  className={`flex justify-between items-center p-3 border border-gray-100 rounded-lg transition-all duration-300 bg-white shadow-sm ${
                    day.count > 0 
                      ? 'hover:bg-gray-50 cursor-pointer hover:border-gray-300' 
                      : 'opacity-60'
                  }`}
                >
                  <span className="text-black font-medium">
                    {new Date(day.date).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${day.count > 0 ? 'text-black' : 'text-gray-400'} mb-1`}>
                        {day.count}
                      </div>
                      <div className="text-xs text-gray-500">всего</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-600 mb-1">{day.contacts}</div>
                      <div className="text-xs text-gray-500">контакты</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-orange-600 mb-1">{day.approaches}</div>
                      <div className="text-xs text-gray-500">подходы</div>
                    </div>
                    {day.count > 0 && (
                      <Icon name="ChevronRight" size={16} className="text-gray-400 ml-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Модальное окно с детализацией по дням */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-black">
                    Статистика по пользователям
                  </h3>
                  <p className="text-gray-600 text-sm md:text-base">
                    {new Date(selectedDate).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <Button
                  onClick={closeDailyModal}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <Icon name="X" size={16} />
                </Button>
              </div>
            </div>
            
            <div className="p-4 md:p-6 overflow-y-auto">
              {dailyLoading ? (
                <div className="text-center text-gray-600 flex items-center justify-center gap-3 py-8">
                  <Icon name="Loader2" size={24} className="animate-spin" />
                  Загрузка статистики...
                </div>
              ) : dailyUserStats.length > 0 ? (
                <div className="space-y-3">
                  {dailyUserStats.map((user, index) => (
                    <div 
                      key={user.email} 
                      className="border border-gray-100 rounded-xl p-3 md:p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-black text-sm md:text-base">{user.name}</div>
                            <div className="text-xs md:text-sm text-gray-600">{user.email}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg md:text-xl font-bold text-black mb-1">{user.lead_count}</div>
                          <div className="text-xs text-gray-500 mb-2">всего лидов</div>
                          <div className="flex justify-end gap-3 text-xs">
                            <div className="text-center">
                              <div className="text-sm font-bold text-green-600">{user.contacts}</div>
                              <div className="text-gray-500">контакты</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-bold text-orange-600">{user.approaches}</div>
                              <div className="text-gray-500">подходы</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-600 py-8">
                  <Icon name="Users" size={32} className="mx-auto mb-3 opacity-60" />
                  <div className="text-lg font-medium">Нет данных</div>
                  <div className="text-sm">В этот день лиды не отправлялись</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}