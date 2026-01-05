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
  selectedOrganizations: number[];
  onOrganizationsChange: (orgIds: number[]) => void;
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
  onOpenAddShift,
  selectedOrganizations,
  onOrganizationsChange
}: ChartFiltersProps) {
  const [organizations, setOrganizations] = React.useState<Array<{id: number, name: string}>>([]);
  const [orgSearchQuery, setOrgSearchQuery] = React.useState('');
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = React.useState(false);
  const orgDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const response = await fetch('https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214?action=get_organizations', {
          headers: {
            'X-Session-Token': localStorage.getItem('session_token') || '',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setOrganizations(data.organizations || []);
        }
      } catch (error) {
        console.error('Error loading organizations:', error);
      }
    };
    loadOrganizations();
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(event.target as Node)) {
        setIsOrgDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredUsers = userStats.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(orgSearchQuery.toLowerCase())
  );

  const handleUserSelect = (userName: string) => {
    toggleUser(userName);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const toggleOrganization = (orgId: number) => {
    const isSelected = selectedOrganizations.includes(orgId);
    if (isSelected) {
      onOrganizationsChange(selectedOrganizations.filter(id => id !== orgId));
    } else {
      onOrganizationsChange([...selectedOrganizations, orgId]);
    }
  };

  const toggleAllOrganizations = () => {
    if (selectedOrganizations.length === organizations.length) {
      onOrganizationsChange([]);
    } else {
      onOrganizationsChange(organizations.map(org => org.id));
    }
  };

  const handleOrgSelect = (orgId: number) => {
    toggleOrganization(orgId);
    setOrgSearchQuery('');
    setIsOrgDropdownOpen(false);
  };

  return (
    <div className="mb-4 md:mb-6 space-y-3 md:space-y-4">
      <div className="flex flex-wrap gap-1.5 md:gap-2 items-center">
        <Button
          onClick={() => setShowTotal(!showTotal)}
          variant={showTotal ? 'default' : 'outline'}
          size="sm"
          className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 ${showTotal
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
        <span className="text-xs md:text-sm text-slate-300 font-medium whitespace-nowrap">Группировка:</span>
        <Button
          onClick={() => setGroupBy('day')}
          variant={groupBy === 'day' ? 'default' : 'outline'}
          size="sm"
          className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 ${groupBy === 'day'
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
          className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 ${groupBy === 'week'
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
          className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 ${groupBy === 'month'
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
          className={`transition-all duration-300 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 ${groupBy === 'year'
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
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs md:text-sm text-slate-300 font-medium whitespace-nowrap">Организации:</span>
          <Button
            onClick={toggleAllOrganizations}
            variant="outline"
            size="sm"
            className="glass-button bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700 transition-all duration-300 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
          >
            {selectedOrganizations.length === organizations.length ? 'Снять все' : 'Выбрать все'}
          </Button>
        </div>
        
        <div className="relative" ref={orgDropdownRef}>
          <div className="relative">
            <Icon name="Building2" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Поиск организации..."
              value={orgSearchQuery}
              onChange={(e) => {
                setOrgSearchQuery(e.target.value);
                setIsOrgDropdownOpen(true);
              }}
              onFocus={() => setIsOrgDropdownOpen(true)}
              className="pl-9 pr-9 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-slate-600 focus:ring-slate-600 h-9 text-sm"
            />
            {orgSearchQuery && (
              <button
                onClick={() => {
                  setOrgSearchQuery('');
                  setIsOrgDropdownOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                <Icon name="X" size={14} />
              </button>
            )}
          </div>

          {isOrgDropdownOpen && orgSearchQuery && filteredOrganizations.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredOrganizations.map(org => (
                <button
                  key={org.id}
                  onClick={() => handleOrgSelect(org.id)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-700 transition-colors flex items-center justify-between ${
                    selectedOrganizations.includes(org.id) ? 'bg-slate-700' : ''
                  }`}
                >
                  <span className="text-slate-100">{org.name}</span>
                  {selectedOrganizations.includes(org.id) && (
                    <Icon name="Check" size={14} className="text-green-400" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedOrganizations.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedOrganizations.map(orgId => {
              const org = organizations.find(o => o.id === orgId);
              if (!org) return null;
              return (
                <button
                  key={orgId}
                  onClick={() => toggleOrganization(orgId)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-purple-600/20 text-purple-200 hover:bg-purple-600/30 border border-purple-600/40 transition-all duration-200"
                >
                  <Icon name="Building2" size={12} />
                  <span>{org.name}</span>
                  <Icon name="X" size={12} className="hover:text-white" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs md:text-sm text-slate-300 font-medium whitespace-nowrap">Промоутеры:</span>
          <Button
            onClick={toggleAllUsers}
            variant="outline"
            size="sm"
            className="glass-button bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700 transition-all duration-300 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
          >
            {selectedUsers.length === userStats.length ? 'Снять все' : 'Выбрать все'}
          </Button>
          {onOpenAddShift && (
            <Button
              onClick={onOpenAddShift}
              variant="outline"
              size="sm"
              className="glass-button bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-700 transition-all duration-300 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
            >
              <Icon name="CalendarPlus" size={14} className="mr-1 md:mr-1.5" />
              <span className="hidden sm:inline">Добавить смену</span>
              <span className="sm:hidden">Смена</span>
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