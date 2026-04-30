import React from 'react';
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

const GROUP_TABS = [
  { key: 'day', icon: 'Calendar', short: 'Дни', long: 'По дням' },
  { key: 'week', icon: 'CalendarRange', short: 'Нед', long: 'По неделям' },
  { key: 'month', icon: 'CalendarDays', short: 'Мес', long: 'По месяцам' },
  { key: 'year', icon: 'CalendarClock', short: 'Годы', long: 'По годам' },
] as const;

const TIME_RANGES = [
  { key: '7d', label: '7 дней' },
  { key: '14d', label: '14 дней' },
  { key: '30d', label: '30 дней' },
  { key: '90d', label: '90 дней' },
  { key: '6m', label: '6 месяцев' },
  { key: '1y', label: '1 год' },
  { key: 'all', label: 'Всё время' },
];

export default function ChartFilters({
  showTotal, setShowTotal,
  groupBy, setGroupBy,
  timeRange, setTimeRange,
  selectedUsers, userStats,
  searchQuery, setSearchQuery,
  isDropdownOpen, setIsDropdownOpen,
  dropdownRef, toggleUser, toggleAllUsers,
  userColorMap, onOpenAddShift,
  selectedOrganizations, onOrganizationsChange,
}: ChartFiltersProps) {
  const [organizations, setOrganizations] = React.useState<Array<{ id: number; name: string }>>([]);
  const [orgSearchQuery, setOrgSearchQuery] = React.useState('');
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = React.useState(false);
  const orgDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    fetch('https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214?action=get_organizations', {
      headers: { 'X-Session-Token': localStorage.getItem('session_token') || '' },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => data && setOrganizations(data.organizations || []))
      .catch(console.error);
  }, []);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(e.target as Node))
        setIsOrgDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredUsers = userStats.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredOrgs = organizations.filter(o => o.name.toLowerCase().includes(orgSearchQuery.toLowerCase()));

  const toggleOrg = (id: number) => {
    onOrganizationsChange(
      selectedOrganizations.includes(id)
        ? selectedOrganizations.filter(x => x !== id)
        : [...selectedOrganizations, id]
    );
  };

  const btn = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
      active ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`;

  return (
    <div className="space-y-4 mb-4">
      {/* Общая линия */}
      <button onClick={() => setShowTotal(!showTotal)} className={btn(showTotal)}>
        <Icon name={showTotal ? 'Eye' : 'EyeOff'} size={12} className="inline mr-1" />
        Общая
      </button>

      {/* Группировка */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-xs text-gray-500 font-medium">Группировка:</span>
        {GROUP_TABS.map(tab => (
          <button key={tab.key} onClick={() => setGroupBy(tab.key)} className={btn(groupBy === tab.key)}>
            <Icon name={tab.icon} size={12} className="inline mr-1" />
            <span className="hidden sm:inline">{tab.long}</span>
            <span className="sm:hidden">{tab.short}</span>
          </button>
        ))}
      </div>

      {/* Организации */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 font-medium">Организации:</span>
          <button
            onClick={() => onOrganizationsChange(
              selectedOrganizations.length === organizations.length ? [] : organizations.map(o => o.id)
            )}
            className={btn(false)}
          >
            {selectedOrganizations.length === organizations.length ? 'Снять все' : 'Выбрать все'}
          </button>
        </div>
        <div className="relative" ref={orgDropdownRef}>
          <Icon name="Building2" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Поиск организации..."
            value={orgSearchQuery}
            onChange={e => { setOrgSearchQuery(e.target.value); setIsOrgDropdownOpen(true); }}
            onFocus={() => setIsOrgDropdownOpen(true)}
            className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-blue-300 focus:bg-white transition-colors"
          />
          {orgSearchQuery && (
            <button onClick={() => { setOrgSearchQuery(''); setIsOrgDropdownOpen(false); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <Icon name="X" size={13} />
            </button>
          )}
          {isOrgDropdownOpen && orgSearchQuery && filteredOrgs.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {filteredOrgs.map(org => (
                <button key={org.id} onClick={() => { toggleOrg(org.id); setOrgSearchQuery(''); setIsOrgDropdownOpen(false); }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${selectedOrganizations.includes(org.id) ? 'bg-blue-50' : ''}`}>
                  <span className="text-gray-700">{org.name}</span>
                  {selectedOrganizations.includes(org.id) && <Icon name="Check" size={13} className="text-blue-500" />}
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedOrganizations.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedOrganizations.map(id => {
              const org = organizations.find(o => o.id === id);
              if (!org) return null;
              return (
                <button key={id} onClick={() => toggleOrg(id)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 transition-colors">
                  <Icon name="Building2" size={11} />
                  <span>{org.name}</span>
                  <Icon name="X" size={11} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Промоутеры */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 font-medium">Промоутеры:</span>
          <button onClick={toggleAllUsers} className={btn(false)}>
            {selectedUsers.length === userStats.length ? 'Снять все' : 'Выбрать все'}
          </button>
          {onOpenAddShift && (
            <button onClick={onOpenAddShift} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors">
              <Icon name="CalendarPlus" size={12} />
              <span className="hidden sm:inline">Добавить смену</span>
              <span className="sm:hidden">Смена</span>
            </button>
          )}
        </div>
        <div className="relative" ref={dropdownRef}>
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Поиск промоутера..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
            onFocus={() => setIsDropdownOpen(true)}
            className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-blue-300 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setIsDropdownOpen(false); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <Icon name="X" size={13} />
            </button>
          )}
          {isDropdownOpen && searchQuery && filteredUsers.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {filteredUsers.map(user => (
                <button key={user.name} onClick={() => { toggleUser(user.name); setSearchQuery(''); setIsDropdownOpen(false); }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${selectedUsers.includes(user.name) ? 'bg-blue-50' : ''}`}>
                  <span className="text-gray-700">{user.name}</span>
                  {selectedUsers.includes(user.name) && <Icon name="Check" size={13} className="text-blue-500" />}
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedUsers.map(name => {
              const user = userStats.find(u => u.name === name);
              if (!user) return null;
              return (
                <button key={name} onClick={() => toggleUser(name)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-white border hover:bg-gray-50 transition-colors text-gray-700"
                  style={{ borderColor: userColorMap[name] }}>
                  <span>{name}</span>
                  <Icon name="X" size={11} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Период */}
      <div className="space-y-2 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500 font-medium block">Период отображения:</span>
        <div className="flex flex-wrap gap-1.5">
          {TIME_RANGES.map(r => (
            <button key={r.key} onClick={() => setTimeRange(r.key)} className={btn(timeRange === r.key)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
