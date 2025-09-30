import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartDataPoint, UserStats } from './types';

interface LeadsChartProps {
  chartData: ChartDataPoint[];
  selectedUsers: string[];
  filterType: 'contacts' | 'approaches';
  userStats: UserStats[];
  onFilterTypeChange: (type: 'contacts' | 'approaches') => void;
  onUsersChange: (users: string[]) => void;
}

export default function LeadsChart({ 
  chartData, 
  selectedUsers, 
  filterType, 
  userStats,
  onFilterTypeChange, 
  onUsersChange 
}: LeadsChartProps) {
  if (chartData.length === 0) {
    return null;
  }

  const toggleUser = (userName: string) => {
    const isSelected = selectedUsers.includes(userName);
    if (isSelected) {
      onUsersChange(selectedUsers.filter(u => u !== userName));
    } else {
      onUsersChange([...selectedUsers, userName]);
    }
  };

  const toggleAllUsers = () => {
    const allUsers = userStats.map(u => u.name);
    if (selectedUsers.length === allUsers.length) {
      onUsersChange([]);
    } else {
      onUsersChange(allUsers);
    }
  };

  // Цвета для пользователей - мягкие, приглушенные тона
  const USER_COLORS = [
    '#7C93C3', // Мягкий серо-синий
    '#9EB384', // Приглушенный зелёный
    '#C8A2C8', // Бледно-лиловый
    '#D4A574', // Приглушенный золотистый
    '#9DC5C3', // Мятный
    '#C48B9F', // Пыльная роза
    '#A7B8A8', // Серо-зелёный
    '#B89D9D', // Бежево-серый
    '#8EACCD'  // Пастельно-синий
  ];
  
  // Создаем маппинг пользователей к цветам
  const userColorMap = userStats.reduce((acc, user, index) => {
    acc[user.name] = USER_COLORS[index % USER_COLORS.length];
    return acc;
  }, {} as Record<string, string>);

  return (
    <Card className="border-[#001f54]/20 shadow-xl bg-white slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-[#001f54] text-xl">
          <div className="p-2 rounded-lg bg-[#001f54]/10">
            <Icon name="BarChart3" size={20} className="text-[#001f54]" />
          </div>
          График лидов по датам
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Фильтры */}
        <div className="mb-6 space-y-4">
          {/* Фильтр по типу */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => onFilterTypeChange('contacts')}
              variant={filterType === 'contacts' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 ${filterType === 'contacts'
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                : 'bg-white hover:bg-green-50 text-green-600 border-green-200'
              }`}
            >
              Контакты
            </Button>
            <Button
              onClick={() => onFilterTypeChange('approaches')}
              variant={filterType === 'approaches' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 ${filterType === 'approaches'
                ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg'
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
              onClick={toggleAllUsers}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-[#001f54]/5 text-[#001f54] border-[#001f54]/20 transition-all duration-300"
            >
              {selectedUsers.length === userStats.length ? 'Снять все' : 'Выбрать все'}
            </Button>
            {userStats.map(user => (
              <Button
                key={user.name}
                onClick={() => toggleUser(user.name)}
                variant={selectedUsers.includes(user.name) ? 'default' : 'outline'}
                size="sm"
                className={`transition-all duration-300 ${selectedUsers.includes(user.name)
                  ? 'bg-[#001f54] hover:bg-[#002b6b] text-white shadow-lg'
                  : 'bg-white hover:bg-[#001f54]/5 text-[#001f54] border-[#001f54]/20'
                }`}
              >
                {user.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Столбчатая диаграмма */}
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={80}
                tickFormatter={(date) => 
                  new Date(date).toLocaleDateString('ru-RU', { 
                    day: 'numeric', 
                    month: 'short' 
                  })
                }
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(0, 31, 84, 0.05)' }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '2px solid #001f54',
                  borderRadius: '12px',
                  padding: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                labelFormatter={(date) => 
                  new Date(date).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })
                }
                itemSorter={(item) => {
                  // Сортировка: сначала "Контакты" или "Подходы", потом пользователи
                  if (item.name === 'Контакты' || item.name === 'Подходы') {
                    return -1;
                  }
                  return 0;
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="rect"
              />
              
              {filterType === 'contacts' && (
                <Bar 
                  dataKey="contacts" 
                  fill="#16a34a" 
                  name="Контакты"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={60}
                />
              )}
              
              {filterType === 'approaches' && (
                <Bar 
                  dataKey="approaches" 
                  fill="#ea580c" 
                  name="Подходы"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={60}
                />
              )}

              {/* Столбцы для каждого выбранного пользователя */}
              {selectedUsers.length > 0 && selectedUsers.map((userName) => {
                const dataKey = filterType === 'contacts'
                  ? `${userName}_contacts`
                  : `${userName}_approaches`;
                
                return (
                  <Bar
                    key={dataKey}
                    dataKey={dataKey}
                    fill={userColorMap[userName]}
                    name={userName}
                    radius={[8, 8, 0, 0]}
                    maxBarSize={60}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Статистика под графиком */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Карточки пользователей */
          {userStats.map((user, index) => (
            <div 
              key={user.name}
              className="p-4 rounded-lg border-2 border-[#001f54]/10 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm" 
                  style={{ backgroundColor: USER_COLORS[index % USER_COLORS.length] }}
                />
                <span className="text-sm font-semibold text-[#001f54]">{user.name}</span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-[#001f54]">{user.lead_count}</div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="text-green-600 font-medium">К: {user.contacts}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-orange-600 font-medium">П: {user.approaches}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}