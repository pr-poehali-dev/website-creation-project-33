import React, { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import PendingUsers from './PendingUsers';
import AllUsersWorkTime from './AllUsersWorkTime';
import UsersTab from './UsersTab';
import StatsTab from './StatsTab';
import OrganizationsTab from './OrganizationsTab';
import AdminChatTab from './AdminChatTab';
import ScheduleAnalyticsTab from './ScheduleAnalyticsTab';
import TodayContactsCounter from './TodayContactsCounter';
import TodayApproachesCounter from './TodayApproachesCounter';
import MonthComparisonBadge from './MonthComparisonBadge';
import AccountingTab from './AccountingTab';
import AccountingStats from './AccountingStats';
import TodayWorkersCounter from './TodayWorkersCounter';
import ClientsTab from './ClientsTab';
import TelegramBotTab from './TelegramBotTab';


interface AdminMetroTilesProps {
  unreadCount: number;
  sessionToken: string;
  currentView: TileView;
  onViewChange: (view: TileView) => void;
}

type TileView = 'tiles' | 'requests' | 'accounting' | 'stats' | 'chat' | 'analytics' | 'clients' | 'telegram';
type StatsSubView = 'users' | 'rating' | 'organizations';

const NavButton = ({ 
  icon, 
  label, 
  active, 
  onClick, 
  badge 
}: { 
  icon: string; 
  label: string; 
  active: boolean; 
  onClick: () => void; 
  badge?: number;
}) => (
  <button
    onClick={onClick}
    className={`relative group flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-xl transition-all duration-300 flex-shrink-0 ${
      active 
        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50 scale-110 rotate-0' 
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:scale-105 hover:-rotate-3'
    }`}
    title={label}
  >
    <Icon name={icon} size={20} className={`md:w-6 md:h-6 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-12'}`} />
    {badge !== undefined && badge > 0 && (
      <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 min-w-[20px] h-5 animate-pulse">
        {badge}
      </Badge>
    )}
  </button>
);

export default function AdminMetroTiles({ unreadCount, sessionToken, currentView, onViewChange }: AdminMetroTilesProps) {
  const [statsSubView, setStatsSubView] = useState<StatsSubView>('rating');

  const handleViewChange = (view: TileView) => {
    onViewChange(view);
  };

  const navigationItems = [
    { view: 'tiles' as TileView, icon: 'Home', label: 'Домой' },
    { view: 'requests' as TileView, icon: 'UserCheck', label: 'Заявки' },
    { view: 'accounting' as TileView, icon: 'Calculator', label: 'Бух.учет' },
    { view: 'stats' as TileView, icon: 'TrendingUp', label: 'Статистика' },
    { view: 'chat' as TileView, icon: 'MessageSquare', label: 'Чат', badge: unreadCount },
    { view: 'clients' as TileView, icon: 'Users', label: 'Заказчики' },
    { view: 'analytics' as TileView, icon: 'Calendar', label: 'График' },
  ];

  // Навигация только для десктопа
  const renderWithSidebar = (content: React.ReactNode) => (
    <div className="space-y-4">
      {/* Десктоп версия с боковой навигацией */}
      <div className="hidden md:flex gap-4">
        <div className="flex flex-col gap-3 sticky top-4 h-fit">
          {navigationItems.map((item) => (
            <NavButton
              key={item.view}
              icon={item.icon}
              label={item.label}
              active={currentView === item.view}
              onClick={() => handleViewChange(item.view)}
              badge={item.badge}
            />
          ))}
        </div>
        <div className="flex-1 min-w-0">
          {content}
        </div>
      </div>
      
      {/* Контент на мобильных без навигации */}
      <div className="md:hidden">
        {content}
      </div>
    </div>
  );

  if (currentView === 'requests') {
    return renderWithSidebar(
      <div className="space-y-4">
        <PendingUsers sessionToken={sessionToken} />
        <AllUsersWorkTime sessionToken={sessionToken} />
      </div>
    );
  }

  if (currentView === 'accounting') {
    return renderWithSidebar(
      <div className="space-y-4">
        <div className="md:hidden bg-yellow-50 border-2 border-yellow-300 p-3 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium">
            Раздел загружается... Это может занять несколько секунд на мобильных устройствах.
          </p>
        </div>
        <AccountingTab enabled={true} />
      </div>
    );
  }

  if (currentView === 'stats') {
    return renderWithSidebar(
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setStatsSubView('rating')}
            className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-xl transition-all text-xs md:text-sm font-medium whitespace-nowrap ${
              statsSubView === 'rating' 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg border-0' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Рейтинг
          </button>
          <button
            onClick={() => setStatsSubView('users')}
            className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-xl transition-all text-xs md:text-sm font-medium whitespace-nowrap ${
              statsSubView === 'users' 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg border-0' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Промоутеры
          </button>
          <button
            onClick={() => setStatsSubView('organizations')}
            className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-xl transition-all text-xs md:text-sm font-medium whitespace-nowrap ${
              statsSubView === 'organizations' 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg border-0' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Организации
          </button>
        </div>

        {statsSubView === 'users' && <UsersTab enabled={true} />}
        {statsSubView === 'rating' && <StatsTab enabled={true} />}
        {statsSubView === 'organizations' && <OrganizationsTab enabled={true} />}
      </div>
    );
  }

  if (currentView === 'chat') {
    return renderWithSidebar(
      <AdminChatTab />
    );
  }

  if (currentView === 'analytics') {
    return renderWithSidebar(
      <ScheduleAnalyticsTab />
    );
  }

  if (currentView === 'clients') {
    return renderWithSidebar(
      <ClientsTab sessionToken={sessionToken} />
    );
  }

  if (currentView === 'telegram') {
    return renderWithSidebar(
      <TelegramBotTab />
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      <div className="divide-y divide-gray-100">

        {/* Заявки */}
        <button
          onClick={() => handleViewChange('requests')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 hover:border-l-4 hover:border-l-blue-400 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors flex-shrink-0">
              <Icon name="UserCheck" size={20} className="text-blue-500" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">Заявки</div>
            </div>
          </div>
          <Icon name="ChevronRight" size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0" />
        </button>

        {/* Бух.учет */}
        <button
          onClick={() => handleViewChange('accounting')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 hover:border-l-4 hover:border-l-blue-400 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors flex-shrink-0">
              <Icon name="Calculator" size={20} className="text-blue-500" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">Бух.учет</div>
              <div className="mt-1 flex flex-nowrap gap-1.5">
                <AccountingStats sessionToken={sessionToken} />
              </div>
            </div>
          </div>
          <Icon name="ChevronRight" size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0 ml-2" />
        </button>

        {/* Статистика */}
        <button
          onClick={() => handleViewChange('stats')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 hover:border-l-4 hover:border-l-blue-400 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors flex-shrink-0">
              <Icon name="BarChart3" size={20} className="text-blue-500" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">Статистика</div>
              <div className="mt-1 flex flex-nowrap gap-1.5">
                <MonthComparisonBadge sessionToken={sessionToken} />
                <TodayContactsCounter sessionToken={sessionToken} />
                <TodayApproachesCounter sessionToken={sessionToken} />
              </div>
            </div>
          </div>
          <Icon name="ChevronRight" size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0 ml-2" />
        </button>

        {/* Чат */}
        <button
          onClick={() => handleViewChange('chat')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 hover:border-l-4 hover:border-l-blue-400 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors flex-shrink-0 relative">
              <Icon name="MessageCircle" size={20} className="text-blue-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">Чат</div>
            </div>
          </div>
          <Icon name="ChevronRight" size={16} className="text-gray-300 group-hover:text-orange-400 transition-colors flex-shrink-0" />
        </button>

        {/* Заказчики */}
        <button
          onClick={() => handleViewChange('clients')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 hover:border-l-4 hover:border-l-blue-400 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors flex-shrink-0">
              <Icon name="Building2" size={20} className="text-blue-500" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">Заказчики</div>
            </div>
          </div>
          <Icon name="ChevronRight" size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0" />
        </button>

        {/* График */}
        <button
          onClick={() => handleViewChange('analytics')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 hover:border-l-4 hover:border-l-blue-400 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors flex-shrink-0">
              <Icon name="TrendingUp" size={20} className="text-blue-500" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">График</div>
              <div className="mt-1 flex flex-nowrap gap-1.5">
                <TodayWorkersCounter sessionToken={sessionToken} />
              </div>
            </div>
          </div>
          <Icon name="ChevronRight" size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0 ml-2" />
        </button>

        {/* Телеграм бот */}
        <button
          onClick={() => handleViewChange('telegram')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 hover:border-l-4 hover:border-l-blue-400 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors flex-shrink-0">
              <Icon name="Bot" size={20} className="text-blue-500" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">Телеграм бот</div>
            </div>
          </div>
          <Icon name="ChevronRight" size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0" />
        </button>

      </div>
    </div>
  );
}