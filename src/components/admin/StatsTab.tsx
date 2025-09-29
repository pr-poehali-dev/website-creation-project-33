import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
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
  
  // Состояния для графика
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'contacts' | 'approaches'>('all');

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
    fetchChartData();
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

      {/* График с лидами */}
      {chartData.length > 0 && (
        <Card className="border-gray-200 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-black text-xl">
              <div className="p-2 rounded-lg bg-gray-100">
                <Icon name="TrendingUp" size={20} className="text-gray-600" />
              </div>
              График лидов
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Фильтры */}
            <div className="mb-6 space-y-4">
              {/* Фильтр по типу */}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setFilterType('all')}
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className={`${filterType === 'all' 
                    ? 'bg-black hover:bg-gray-800 text-white' 
                    : 'bg-white hover:bg-gray-50 text-black border-gray-200'
                  }`}
                >
                  Все лиды
                </Button>
                <Button
                  onClick={() => setFilterType('contacts')}
                  variant={filterType === 'contacts' ? 'default' : 'outline'}
                  size="sm"
                  className={`${filterType === 'contacts'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-white hover:bg-green-50 text-green-600 border-green-200'
                  }`}
                >
                  Контакты
                </Button>
                <Button
                  onClick={() => setFilterType('approaches')}
                  variant={filterType === 'approaches' ? 'default' : 'outline'}
                  size="sm"
                  className={`${filterType === 'approaches'
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-white hover:bg-orange-50 text-orange-600 border-orange-200'
                  }`}
                >
                  Подходы
                </Button>
              </div>

              {/* Фильтр по пользователям */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600 font-medium">Пользователи:</span>
                <Button
                  onClick={() => {
                    const allUsers = stats?.user_stats.map(u => u.name) || [];
                    if (selectedUsers.length === allUsers.length) {
                      setSelectedUsers([]);
                    } else {
                      setSelectedUsers(allUsers);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-gray-50 text-black border-gray-300"
                >
                  {selectedUsers.length === stats?.user_stats.length ? 'Снять все' : 'Выбрать все'}
                </Button>
                {stats?.user_stats.map(user => (
                  <Button
                    key={user.name}
                    onClick={() => {
                      const isSelected = selectedUsers.includes(user.name);
                      if (isSelected) {
                        setSelectedUsers(selectedUsers.filter(u => u !== user.name));
                      } else {
                        setSelectedUsers([...selectedUsers, user.name]);
                      }
                    }}
                    variant={selectedUsers.includes(user.name) ? 'default' : 'outline'}
                    size="sm"
                    className={`${selectedUsers.includes(user.name)
                      ? 'bg-black hover:bg-gray-800 text-white'
                      : 'bg-white hover:bg-gray-50 text-black border-gray-200'
                    }`}
                  >
                    {user.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* График */}
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(date) => 
                      new Date(date).toLocaleDateString('ru-RU', { 
                        day: 'numeric', 
                        month: 'short' 
                      })
                    }
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(date) => 
                      new Date(date).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })
                    }
                  />
                  <Legend />
                  
                  {filterType === 'all' && (
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#000000" 
                      strokeWidth={2}
                      name="Все лиды"
                      dot={{ fill: '#000000', strokeWidth: 2, r: 4 }}
                    />
                  )}
                  
                  {filterType === 'contacts' && (
                    <Line 
                      type="monotone" 
                      dataKey="contacts" 
                      stroke="#16a34a" 
                      strokeWidth={2}
                      name="Контакты"
                      dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                    />
                  )}
                  
                  {filterType === 'approaches' && (
                    <Line 
                      type="monotone" 
                      dataKey="approaches" 
                      stroke="#ea580c" 
                      strokeWidth={2}
                      name="Подходы"
                      dot={{ fill: '#ea580c', strokeWidth: 2, r: 4 }}
                    />
                  )}

                  {/* Линии для каждого пользователя */}
                  {filterType === 'all' && selectedUsers.length > 0 && selectedUsers.map((userName, index) => {
                    const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];
                    const color = colors[index % colors.length];
                    
                    return (
                      <Line
                        key={`${userName}_total`}
                        type="monotone"
                        dataKey={`${userName}_total`}
                        stroke={color}
                        strokeWidth={2}
                        name={userName}
                        dot={{ fill: color, strokeWidth: 2, r: 3 }}
                        strokeDasharray="5 5"
                        opacity={0.7}
                      />
                    );
                  })}

                  {filterType === 'contacts' && selectedUsers.length > 0 && selectedUsers.map((userName, index) => {
                    const colors = ['#22c55e', '#15803d', '#84cc16', '#65a30d'];
                    const color = colors[index % colors.length];
                    
                    return (
                      <Line
                        key={`${userName}_contacts`}
                        type="monotone"
                        dataKey={`${userName}_contacts`}
                        stroke={color}
                        strokeWidth={2}
                        name={`${userName} (контакты)`}
                        dot={{ fill: color, strokeWidth: 2, r: 3 }}
                        strokeDasharray="5 5"
                        opacity={0.7}
                      />
                    );
                  })}

                  {filterType === 'approaches' && selectedUsers.length > 0 && selectedUsers.map((userName, index) => {
                    const colors = ['#f97316', '#ea580c', '#fb923c', '#fdba74'];
                    const color = colors[index % colors.length];
                    
                    return (
                      <Line
                        key={`${userName}_approaches`}
                        type="monotone"
                        dataKey={`${userName}_approaches`}
                        stroke={color}
                        strokeWidth={2}
                        name={`${userName} (подходы)`}
                        dot={{ fill: color, strokeWidth: 2, r: 3 }}
                        strokeDasharray="5 5"
                        opacity={0.7}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
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