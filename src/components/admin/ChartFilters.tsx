import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { UserStats } from './types';

interface ChartFiltersProps {
  showTotal: boolean;
  setShowTotal: (show: boolean) => void;
  groupBy: 'day' | 'week' | 'month' | 'year';
  setGroupBy: (groupBy: 'day' | 'week' | 'month' | 'year') => void;
  timeRange: string;
  setTimeRange: (range: string) => void;
  selectedUsers: string[];
  userStats: UserStats[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
  toggleUser: (userName: string) => void;
  toggleAllUsers: () => void;
  userColorMap: Record<string, string>;
  onOpenAddShift?: () => void;
}

export default function ChartFilters({
  showTotal,
  setShowTotal,
  groupBy,
  setGroupBy,
  timeRange,
  setTimeRange,
  selectedUsers,
  userStats,
  searchQuery,
  setSearchQuery,
  isDropdownOpen,
  setIsDropdownOpen,
  dropdownRef,
  toggleUser,
  toggleAllUsers,
  userColorMap,
  onOpenAddShift
}: ChartFiltersProps) {
  const filteredUsers = userStats.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserSelect = (userName: string) => {
    toggleUser(userName);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  return (
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
          {onOpenAddShift && (
            <Button
              onClick={onOpenAddShift}
              variant="outline"
              size="sm"
              className="glass-button bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-700 transition-all duration-300 text-xs md:text-sm h-8 md:h-9"
            >
              <Icon name="CalendarPlus" size={14} className="mr-1.5" />
              Добавить смену
            </Button>
          )}
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

        <div className="space-y-2 pt-2 border-t border-slate-700">
          <span className="text-xs md:text-sm text-slate-300 font-medium block">Период отображения:</span>
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            <Button
              onClick={() => setTimeRange('7d')}
              variant={timeRange === '7d' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs h-8 ${timeRange === '7d'
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              7 дней
            </Button>
            <Button
              onClick={() => setTimeRange('14d')}
              variant={timeRange === '14d' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs h-8 ${timeRange === '14d'
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              14 дней
            </Button>
            <Button
              onClick={() => setTimeRange('30d')}
              variant={timeRange === '30d' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs h-8 ${timeRange === '30d'
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              30 дней
            </Button>
            <Button
              onClick={() => setTimeRange('90d')}
              variant={timeRange === '90d' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs h-8 ${timeRange === '90d'
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              90 дней
            </Button>
            <Button
              onClick={() => setTimeRange('6m')}
              variant={timeRange === '6m' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs h-8 ${timeRange === '6m'
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              6 месяцев
            </Button>
            <Button
              onClick={() => setTimeRange('1y')}
              variant={timeRange === '1y' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs h-8 ${timeRange === '1y'
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              1 год
            </Button>
            <Button
              onClick={() => setTimeRange('all')}
              variant={timeRange === 'all' ? 'default' : 'outline'}
              size="sm"
              className={`transition-all duration-300 text-xs h-8 ${timeRange === 'all'
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              Всё время
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}