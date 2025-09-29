import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartDataPoint, UserStats } from './types';

interface LeadsChartProps {
  chartData: ChartDataPoint[];
  selectedUsers: string[];
  filterType: 'all' | 'contacts' | 'approaches';
  userStats: UserStats[];
  onFilterTypeChange: (type: 'all' | 'contacts' | 'approaches') => void;
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

  return (
    <Card className="border-[#001f54]/20 shadow-xl bg-white slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-[#001f54] text-xl">
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
              onClick={() => onFilterTypeChange('all')}
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
              onClick={() => onFilterTypeChange('contacts')}
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
              onClick={() => onFilterTypeChange('approaches')}
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
              onClick={toggleAllUsers}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-gray-50 text-black border-gray-300"
            >
              {selectedUsers.length === userStats.length ? 'Снять все' : 'Выбрать все'}
            </Button>
            {userStats.map(user => (
              <Button
                key={user.name}
                onClick={() => toggleUser(user.name)}
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
  );
}