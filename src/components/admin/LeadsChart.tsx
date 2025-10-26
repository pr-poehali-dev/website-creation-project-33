import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartDataPoint, UserStats } from './types';
import { toMoscowTime } from '@/utils/date';

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
  const [showTotal, setShowTotal] = React.useState(true);
  const [timeRange, setTimeRange] = React.useState<'week' | 'twoWeeks' | 'month' | 'year' | 'all'>('week');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  if (chartData.length === 0) {
    return null;
  }

  const getFilteredChartData = () => {
    if (timeRange === 'all') {
      return chartData;
    }

    const now = new Date();
    const daysToSubtract = {
      week: 7,
      twoWeeks: 14,
      month: 30,
      year: 365,
    }[timeRange];

    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - daysToSubtract);

    return chartData.filter(item => new Date(toMoscowTime(item.date)) >= cutoffDate);
  };

  const filteredChartData = getFilteredChartData();

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

  const filteredUsers = userStats.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserSelect = (userName: string) => {
    toggleUser(userName);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const USER_COLORS = [
    '#7C93C3',
    '#9EB384',
    '#C8A2C8',
    '#D4A574',
    '#9DC5C3',
    '#C48B9F',
    '#A7B8A8',
    '#B89D9D',
    '#8EACCD'
  ];
  
  const userColorMap = userStats.reduce((acc, user, index) => {
    acc[user.name] = USER_COLORS[index % USER_COLORS.length];
    return acc;
  }, {} as Record<string, string>);

  return (
    <Card className="bg-white border-gray-200 rounded-2xl slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="flex items-center gap-2 md:gap-3 text-gray-900 text-lg md:text-xl">
          <div className="p-1.5 md:p-2 rounded-lg bg-gray-100">
            <Icon name="TrendingUp" size={18} className="text-gray-900 md:w-5 md:h-5" />
          </div>
          График лидов
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 md:mb-6 space-y-3 md:space-y-4">
          <div className="flex flex-wrap gap-1.5 md:gap-2 items-center">
            <Button
              onClick={() => onFilterTypeChange('contacts')}
              variant={filterType === 'contacts' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${filterType === 'contacts'
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                : 'bg-gray-100 hover:bg-gray-100 text-green-400 border-green-400/30'
              }`}
            >
              Контакты
            </Button>
            <Button
              onClick={() => onFilterTypeChange('approaches')}
              variant={filterType === 'approaches' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${filterType === 'approaches'
                ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg'
                : 'bg-gray-100 hover:bg-gray-100 text-orange-400 border-orange-400/30'
              }`}
            >
              Подходы
            </Button>
            <div className="h-4 md:h-6 w-px bg-gray-300 mx-0.5 md:mx-1" />
            <Button
              onClick={() => setShowTotal(!showTotal)}
              variant={showTotal ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${showTotal
                ? 'bg-[#001f54] hover:bg-[#002b6b] text-white shadow-lg'
                : 'bg-gray-100 hover:bg-gray-100 text-gray-900 border-gray-200'
              }`}
            >
              <Icon name={showTotal ? "Eye" : "EyeOff"} size={12} className="mr-1 md:w-[14px] md:h-[14px]" />
              <span className="hidden sm:inline">Общая линия</span>
              <span className="sm:hidden">Общая</span>
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5 md:gap-2 items-center">
            <span className="text-xs md:text-sm text-gray-600 font-medium">Период:</span>
            <Button
              onClick={() => setTimeRange('week')}
              variant={timeRange === 'week' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${timeRange === 'week'
                ? 'bg-[#001f54] hover:bg-[#002b6b] text-white shadow-lg'
                : 'bg-gray-100 hover:bg-gray-100 text-gray-900 border-gray-200'
              }`}
            >
              7д
            </Button>
            <Button
              onClick={() => setTimeRange('twoWeeks')}
              variant={timeRange === 'twoWeeks' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${timeRange === 'twoWeeks'
                ? 'bg-[#001f54] hover:bg-[#002b6b] text-white shadow-lg'
                : 'bg-gray-100 hover:bg-gray-100 text-gray-900 border-gray-200'
              }`}
            >
              14д
            </Button>
            <Button
              onClick={() => setTimeRange('month')}
              variant={timeRange === 'month' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${timeRange === 'month'
                ? 'bg-[#001f54] hover:bg-[#002b6b] text-white shadow-lg'
                : 'bg-gray-100 hover:bg-gray-100 text-gray-900 border-gray-200'
              }`}
            >
              30д
            </Button>
            <Button
              onClick={() => setTimeRange('year')}
              variant={timeRange === 'year' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${timeRange === 'year'
                ? 'bg-[#001f54] hover:bg-[#002b6b] text-white shadow-lg'
                : 'bg-gray-100 hover:bg-gray-100 text-gray-900 border-gray-200'
              }`}
            >
              Год
            </Button>
            <Button
              onClick={() => setTimeRange('all')}
              variant={timeRange === 'all' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${timeRange === 'all'
                ? 'bg-[#001f54] hover:bg-[#002b6b] text-white shadow-lg'
                : 'bg-gray-100 hover:bg-gray-100 text-gray-900 border-gray-200'
              }`}
            >
              Всё
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm text-gray-600 font-medium whitespace-nowrap">Пользователи:</span>
              <Button
                onClick={toggleAllUsers}
                variant="outline"
                size="sm"
                className="glass-button bg-gray-100 hover:bg-gray-100 text-gray-900 border-gray-200 transition-all duration-300 text-xs md:text-sm h-8 md:h-9"
              >
                {selectedUsers.length === userStats.length ? 'Снять все' : 'Выбрать все'}
              </Button>
            </div>
            
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Поиск промоутера..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="pl-9 pr-9 bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-gray-300 focus:ring-gray-200 h-9 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setIsDropdownOpen(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600"
                  >
                    <Icon name="X" size={14} />
                  </button>
                )}
              </div>

              {isDropdownOpen && searchQuery && filteredUsers.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredUsers.map(user => (
                    <button
                      key={user.name}
                      onClick={() => handleUserSelect(user.name)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                        selectedUsers.includes(user.name) ? 'bg-gray-50' : ''
                      }`}
                    >
                      <span className="text-gray-900">{user.name}</span>
                      {selectedUsers.includes(user.name) && (
                        <Icon name="Check" size={14} className="text-green-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedUsers.map(userName => {
                  const user = userStats.find(u => u.name === userName);
                  if (!user) return null;
                  return (
                    <button
                      key={userName}
                      onClick={() => toggleUser(userName)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors border"
                      style={{ borderColor: userColorMap[userName] }}
                    >
                      <span>{userName}</span>
                      <Icon name="X" size={12} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="h-64 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={filteredChartData} 
              margin={{ 
                top: 10, 
                right: 10, 
                left: 0, 
                bottom: 60 
              }}
              className="md:!ml-5"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fill: '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={60}
                className="md:text-xs"
                tickFormatter={(date) => 
                  new Date(date).toLocaleDateString('ru-RU', { 
                    day: 'numeric', 
                    month: 'short' 
                  })
                }
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                className="md:text-xs"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
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
                  if (item.name === 'Контакты' || item.name === 'Подходы') {
                    return -1;
                  }
                  return 0;
                }}
              />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '20px',
                  fontSize: '14px'
                }}
                iconType="circle"
                formatter={(value) => <span style={{ color: '#000', fontWeight: '500' }}>{value}</span>}
              />
              
              {showTotal && filterType === 'contacts' && (
                <Line 
                  type="monotone"
                  dataKey="contacts" 
                  stroke="#16a34a" 
                  strokeWidth={3}
                  dot={{ fill: '#16a34a', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Все контакты"
                  connectNulls={true}
                />
              )}
              
              {showTotal && filterType === 'approaches' && (
                <Line 
                  type="monotone"
                  dataKey="approaches" 
                  stroke="#ea580c" 
                  strokeWidth={3}
                  dot={{ fill: '#ea580c', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Все подходы"
                  connectNulls={true}
                />
              )}

              {selectedUsers.length > 0 && selectedUsers.map((userName) => {
                const dataKey = filterType === 'contacts'
                  ? `${userName}_contacts`
                  : `${userName}_approaches`;
                
                return (
                  <Line
                    key={dataKey}
                    type="monotone"
                    dataKey={dataKey}
                    stroke={userColorMap[userName]}
                    strokeWidth={2}
                    dot={{ fill: userColorMap[userName], r: 3 }}
                    activeDot={{ r: 5 }}
                    name={userName}
                    connectNulls={true}
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