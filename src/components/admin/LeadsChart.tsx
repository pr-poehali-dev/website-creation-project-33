import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
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

  // Подготовка данных для круговой диаграммы
  const getPieData = () => {
    if (filterType === 'all') {
      return userStats.map(user => ({
        name: user.name,
        value: user.lead_count,
        contacts: user.contacts,
        approaches: user.approaches
      }));
    } else if (filterType === 'contacts') {
      return userStats.map(user => ({
        name: user.name,
        value: user.contacts
      }));
    } else {
      return userStats.map(user => ({
        name: user.name,
        value: user.approaches
      }));
    }
  };

  const pieData = getPieData();
  const COLORS = ['#001f54', '#002b6b', '#0041a8', '#16a34a', '#ea580c', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

  return (
    <Card className="border-[#001f54]/20 shadow-xl bg-white slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-[#001f54] text-xl">
          <div className="p-2 rounded-lg bg-[#001f54]/10">
            <Icon name="PieChart" size={20} className="text-[#001f54]" />
          </div>
          Распределение лидов
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
              className={`transition-all duration-300 ${filterType === 'all' 
                ? 'bg-[#001f54] hover:bg-[#002b6b] text-white shadow-lg' 
                : 'bg-white hover:bg-[#001f54]/5 text-[#001f54] border-[#001f54]/20'
              }`}
            >
              Все лиды
            </Button>
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

        {/* Круговая диаграмма */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Диаграмма */}
          <div className="h-80 md:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={window.innerWidth < 768 ? 80 : 120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => {
                    if (filterType === 'all' && props.payload.contacts !== undefined) {
                      return [
                        `Всего: ${value}, Контактов: ${props.payload.contacts}, Подходов: ${props.payload.approaches}`,
                        name
                      ];
                    }
                    return [value, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Легенда с подробной статистикой */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-[#001f54] mb-4">
              {filterType === 'all' ? 'Все лиды' : filterType === 'contacts' ? 'Контакты' : 'Подходы'}
            </h3>
            {pieData.map((item, index) => (
              <div 
                key={item.name}
                className="flex items-center justify-between p-3 rounded-lg border-2 border-[#001f54]/10 bg-white hover:bg-[#001f54]/5 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium text-[#001f54]">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[#001f54]">{item.value}</div>
                  {filterType === 'all' && (
                    <div className="text-xs text-gray-600">
                      <span className="text-green-600 font-medium">{item.contacts}</span> / 
                      <span className="text-orange-600 font-medium ml-1">{item.approaches}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Итого */}
            <div className="pt-3 mt-3 border-t-2 border-[#001f54]/20">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#001f54]/10">
                <span className="font-bold text-[#001f54]">Итого:</span>
                <span className="text-xl font-bold text-[#001f54]">
                  {pieData.reduce((sum, item) => sum + item.value, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}