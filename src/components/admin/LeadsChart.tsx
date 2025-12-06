import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartDataPoint, UserStats, ADMIN_API } from './types';
import { toMoscowTime } from '@/utils/date';
import PeriodDetailModal from './PeriodDetailModal';

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
  const [groupBy, setGroupBy] = React.useState<'day' | 'week' | 'month' | 'year'>('day');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [selectedPeriod, setSelectedPeriod] = React.useState<{period: string, displayLabel: string} | null>(null);
  const [periodLeads, setPeriodLeads] = React.useState<any[]>([]);
  const [loadingPeriod, setLoadingPeriod] = React.useState(false);
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

  const getWeekKey = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
  };

  const getMonthKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const getYearKey = (date: Date) => {
    return `${date.getFullYear()}`;
  };

  const getWeekLabel = (weekKey: string) => {
    const [year, week] = weekKey.split('-W');
    const jan4 = new Date(parseInt(year), 0, 4);
    const monday = new Date(jan4);
    monday.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1 + (parseInt(week) - 1) * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return `${String(monday.getDate()).padStart(2, '0')}.${String(monday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}.${String(sunday.getMonth() + 1).padStart(2, '0')}`;
  };

  const getMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const getFilteredChartData = () => {
    if (groupBy === 'day') {
      return chartData;
    }

    const grouped: Record<string, any> = {};
    
    chartData.forEach(item => {
      const date = new Date(toMoscowTime(item.date));
      let key: string;
      
      if (groupBy === 'week') {
        key = getWeekKey(date);
      } else if (groupBy === 'month') {
        key = getMonthKey(date);
      } else {
        key = getYearKey(date);
      }

      if (!grouped[key]) {
        const userFields: Record<string, number> = {};
        userStats.forEach(u => {
          userFields[`${u.name}_contacts`] = 0;
          userFields[`${u.name}_approaches`] = 0;
        });
        
        grouped[key] = {
          date: key,
          displayDate: groupBy === 'week' ? getWeekLabel(key) : groupBy === 'month' ? getMonthLabel(key) : key,
          total: 0,
          contacts: 0,
          approaches: 0,
          ...userFields
        };
      }

      grouped[key].total += item.total || 0;
      grouped[key].contacts += item.contacts || 0;
      grouped[key].approaches += item.approaches || 0;
      
      userStats.forEach(user => {
        const contactsKey = `${user.name}_contacts`;
        const approachesKey = `${user.name}_approaches`;
        
        if (item[contactsKey] !== undefined) {
          grouped[key][contactsKey] += item[contactsKey];
        }
        if (item[approachesKey] !== undefined) {
          grouped[key][approachesKey] += item[approachesKey];
        }
      });
    });

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  };

  const filteredChartData = getFilteredChartData();

  const fetchPeriodDetails = async (period: string, displayLabel: string) => {
    console.log('fetchPeriodDetails called:', period, displayLabel);
    setLoadingPeriod(true);
    setSelectedPeriod({ period, displayLabel });
    setPeriodLeads([]);

    try {
      const sessionToken = localStorage.getItem('session_token');
      
      let dates: string[] = [];
      
      if (groupBy === 'day') {
        dates = [period];
      } else if (groupBy === 'week') {
        const [year, week] = period.split('-W');
        const jan4 = new Date(parseInt(year), 0, 4);
        const monday = new Date(jan4);
        monday.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1 + (parseInt(week) - 1) * 7);
        
        for (let i = 0; i < 7; i++) {
          const day = new Date(monday);
          day.setDate(monday.getDate() + i);
          dates.push(day.toISOString().split('T')[0]);
        }
      } else if (groupBy === 'month') {
        const [year, month] = period.split('-');
        const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
          dates.push(`${year}-${month}-${String(day).padStart(2, '0')}`);
        }
      } else if (groupBy === 'year') {
        const year = parseInt(period);
        for (let month = 1; month <= 12; month++) {
          const daysInMonth = new Date(year, month, 0).getDate();
          for (let day = 1; day <= daysInMonth; day++) {
            dates.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
          }
        }
      }

      const allLeads: any[] = [];
      
      for (const date of dates) {
        const response = await fetch(`${ADMIN_API}?action=daily_user_stats&date=${date}`, {
          headers: {
            'X-Session-Token': sessionToken || '',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.detailed_leads && data.detailed_leads.length > 0) {
            allLeads.push(...data.detailed_leads);
          }
        }
      }
      
      setPeriodLeads(allLeads);
    } catch (error) {
      console.error('Error fetching period details:', error);
    } finally {
      setLoadingPeriod(false);
    }
  };

  const handleChartClick = (data: any, event?: any) => {
    console.log('handleChartClick called with:', data);
    let payload = null;
    
    if (data && data.payload) {
      payload = data.payload;
    } else if (data && data.activePayload && data.activePayload[0]) {
      payload = data.activePayload[0].payload;
    }
    
    console.log('Extracted payload:', payload);
    
    if (payload && payload.date) {
      const period = payload.date;
      const displayLabel = payload.displayDate || new Date(period).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      console.log('Calling fetchPeriodDetails with:', period, displayLabel);
      fetchPeriodDetails(period, displayLabel);
    } else {
      console.log('No valid payload or date found');
    }
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload, fill, r, stroke, strokeWidth } = props;
    
    return (
      <g
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation();
          console.log('Dot clicked!', payload);
          handleChartClick({ payload });
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          console.log('Pointer down on dot!', payload);
          handleChartClick({ payload });
        }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r || 4}
          fill={fill || '#22d3ee'}
          stroke={stroke || '#0f172a'}
          strokeWidth={strokeWidth || 2}
        />
        <circle
          cx={cx}
          cy={cy}
          r={(r || 4) + 8}
          fill="transparent"
          stroke="none"
        />
      </g>
    );
  };

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
    <Card className="bg-slate-900 border-slate-700 rounded-2xl slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="flex items-center gap-2 md:gap-3 text-slate-100 text-lg md:text-xl">
          <div className="p-1.5 md:p-2 rounded-lg bg-slate-800">
            <Icon name="TrendingUp" size={18} className="text-cyan-400 md:w-5 md:h-5" />
          </div>
          График лидов
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 md:mb-6 space-y-3 md:space-y-4">
          <div className="flex flex-wrap gap-1.5 md:gap-2 items-center">
            <Button
              onClick={() => setShowTotal(!showTotal)}
              variant={showTotal ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${showTotal
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Icon name={showTotal ? "Eye" : "EyeOff"} size={12} className="mr-1 md:w-[14px] md:h-[14px]" />
              <span className="hidden sm:inline">Общая линия</span>
              <span className="sm:hidden">Общая</span>
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5 md:gap-2 items-center">
            <span className="text-xs md:text-sm text-slate-300 font-medium">Группировка:</span>
            <Button
              onClick={() => setGroupBy('day')}
              variant={groupBy === 'day' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${groupBy === 'day'
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Icon name="Calendar" size={12} className="mr-1 md:w-[14px] md:h-[14px]" />
              <span className="hidden sm:inline">По дням</span>
              <span className="sm:hidden">Дни</span>
            </Button>
            <Button
              onClick={() => setGroupBy('week')}
              variant={groupBy === 'week' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${groupBy === 'week'
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Icon name="CalendarRange" size={12} className="mr-1 md:w-[14px] md:h-[14px]" />
              <span className="hidden sm:inline">По неделям</span>
              <span className="sm:hidden">Нед</span>
            </Button>
            <Button
              onClick={() => setGroupBy('month')}
              variant={groupBy === 'month' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${groupBy === 'month'
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Icon name="CalendarDays" size={12} className="mr-1 md:w-[14px] md:h-[14px]" />
              <span className="hidden sm:inline">По месяцам</span>
              <span className="sm:hidden">Мес</span>
            </Button>
            <Button
              onClick={() => setGroupBy('year')}
              variant={groupBy === 'year' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 ${groupBy === 'year'
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Icon name="CalendarClock" size={12} className="mr-1 md:w-[14px] md:h-[14px]" />
              <span className="hidden sm:inline">По годам</span>
              <span className="sm:hidden">Годы</span>
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm text-slate-300 font-medium whitespace-nowrap">Пользователи:</span>
              <Button
                onClick={toggleAllUsers}
                variant="outline"
                size="sm"
                className="glass-button bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700 transition-all duration-300 text-xs md:text-sm h-8 md:h-9"
              >
                {selectedUsers.length === userStats.length ? 'Снять все' : 'Выбрать все'}
              </Button>
            </div>
            
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Поиск промоутера..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="pl-9 pr-9 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-slate-600 focus:ring-slate-600 h-9 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setIsDropdownOpen(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    <Icon name="X" size={14} />
                  </button>
                )}
              </div>

              {isDropdownOpen && searchQuery && filteredUsers.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredUsers.map(user => (
                    <button
                      key={user.name}
                      onClick={() => handleUserSelect(user.name)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-700 transition-colors flex items-center justify-between ${
                        selectedUsers.includes(user.name) ? 'bg-slate-700' : ''
                      }`}
                    >
                      <span className="text-slate-100">{user.name}</span>
                      {selectedUsers.includes(user.name) && (
                        <Icon name="Check" size={14} className="text-green-400" />
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
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-100 hover:bg-slate-700 transition-colors border"
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

        <div className="h-64 md:h-96 rounded-lg overflow-hidden p-4" style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={filteredChartData} 
              margin={{ 
                top: 20, 
                right: 20, 
                left: 10, 
                bottom: 60 
              }}
              className="md:!ml-5"
              onClick={(data) => {
                console.log('ComposedChart onClick:', data);
                if (data && data.activePayload && data.activePayload[0]) {
                  handleChartClick(data);
                }
              }}
            >
              <defs>
                {/* Градиенты для линий */}
                <linearGradient id="greenLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="orangeLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                
                {/* Градиенты для заливки площади */}
                <linearGradient id="greenAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#1e40af" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="orangeAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#1e40af" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#334155" strokeOpacity={0.25} vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                angle={-45}
                textAnchor="end"
                height={60}
                stroke="#475569"
                axisLine={{ stroke: '#475569', strokeWidth: 1 }}
                tickLine={false}
                className="md:text-xs"
                tickFormatter={(value) => {
                  if (groupBy === 'day') {
                    return new Date(value).toLocaleDateString('ru-RU', { 
                      day: 'numeric', 
                      month: 'short' 
                    });
                  }
                  const item = filteredChartData.find((d: any) => d.date === value);
                  return item?.displayDate || value;
                }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                stroke="#475569"
                axisLine={{ stroke: '#475569', strokeWidth: 1 }}
                tickLine={false}
                className="md:text-xs"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.98)',
                  border: '2px solid rgba(34, 211, 238, 0.3)',
                  backdropFilter: 'blur(16px)',
                  color: '#e2e8f0',
                  borderRadius: '16px',
                  padding: '16px',
                  boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.6), 0 0 20px rgba(34, 211, 238, 0.2)',
                  cursor: 'pointer',
                  pointerEvents: 'auto'
                }}
                cursor={{ stroke: '#22d3ee', strokeWidth: 2, strokeDasharray: '5 5' }}
                wrapperStyle={{ pointerEvents: 'auto' }}
                labelFormatter={(value) => {
                  if (groupBy === 'day') {
                    return new Date(value).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    });
                  }
                  const item = filteredChartData.find((d: any) => d.date === value);
                  return item?.displayDate || value;
                }}
                itemSorter={(item) => {
                  if (item.name === 'Контакты' || item.name === 'Подходы') {
                    return -1;
                  }
                  return 0;
                }}
                formatter={(value, name, props) => {
                  if (name === 'contacts' || name === 'approaches') {
                    return null;
                  }
                  return [value, name];
                }}
              />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '20px',
                  fontSize: '13px'
                }}
                iconType="circle"
                formatter={(value) => <span style={{ color: '#94a3b8', fontWeight: '600' }}>{value}</span>}
              />
              
              {showTotal && filterType === 'contacts' && (
                <Area
                  type="monotone"
                  dataKey="contacts"
                  fill="url(#greenAreaGradient)"
                  strokeWidth={0}
                  legendType="none"
                />
              )}
              
              {showTotal && filterType === 'approaches' && (
                <Area
                  type="monotone"
                  dataKey="approaches"
                  fill="url(#orangeAreaGradient)"
                  strokeWidth={0}
                  legendType="none"
                />
              )}
              
              {showTotal && filterType === 'contacts' && (
                <Line 
                  type="monotone"
                  dataKey="contacts" 
                  stroke="url(#greenLineGradient)" 
                  strokeWidth={4}
                  dot={<CustomDot fill="#22d3ee" r={4} />}
                  activeDot={{ r: 7, fill: 'white', stroke: '#22d3ee', strokeWidth: 3 }}
                  name="Все контакты"
                  connectNulls={true}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              
              {showTotal && filterType === 'approaches' && (
                <Line 
                  type="monotone"
                  dataKey="approaches" 
                  stroke="url(#orangeLineGradient)" 
                  strokeWidth={4}
                  dot={<CustomDot fill="#22d3ee" r={4} />}
                  activeDot={{ r: 7, fill: 'white', stroke: '#22d3ee', strokeWidth: 3 }}
                  name="Все подходы"
                  connectNulls={true}
                  strokeLinecap="round"
                  strokeLinejoin="round"
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
                    strokeWidth={3}
                    dot={<CustomDot fill={userColorMap[userName]} r={5} stroke="#0f172a" strokeWidth={2} />}
                    activeDot={{ r: 7, fill: userColorMap[userName], stroke: '#22d3ee', strokeWidth: 2 }}
                    name={userName}
                    connectNulls={true}
                  />
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>

      <PeriodDetailModal
        isOpen={!!selectedPeriod}
        onClose={() => setSelectedPeriod(null)}
        period={selectedPeriod?.period || ''}
        displayLabel={selectedPeriod?.displayLabel || ''}
        detailedLeads={periodLeads}
        loading={loadingPeriod}
      />
    </Card>
  );
}