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
import MonthComparisonBadge from './MonthComparisonBadge';
import AccountingTab from './AccountingTab';
import AccountingStats from './AccountingStats';
import TodayWorkersCounter from './TodayWorkersCounter';
import ClientsTab from './ClientsTab';


interface AdminMetroTilesProps {
  unreadCount: number;
  sessionToken: string;
}

type TileView = 'tiles' | 'requests' | 'accounting' | 'stats' | 'chat' | 'analytics' | 'clients';
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

export default function AdminMetroTiles({ unreadCount, sessionToken }: AdminMetroTilesProps) {
  const [currentView, setCurrentView] = useState<TileView>('tiles');
  const [statsSubView, setStatsSubView] = useState<StatsSubView>('rating');

  const navigationItems = [
    { view: 'requests' as TileView, icon: 'UserCheck', label: 'Заявки' },
    { view: 'accounting' as TileView, icon: 'Calculator', label: 'Бух.учет' },
    { view: 'stats' as TileView, icon: 'TrendingUp', label: 'Статистика' },
    { view: 'chat' as TileView, icon: 'MessageSquare', label: 'Чат', badge: unreadCount },
    { view: 'clients' as TileView, icon: 'Users', label: 'Заказчики' },
    { view: 'analytics' as TileView, icon: 'Calendar', label: 'График' },
  ];

  // Навигация для всех разделов кроме главного
  const renderWithSidebar = (content: React.ReactNode) => (
    <div className="space-y-4">
      {/* Горизонтальная навигация на мобильных, вертикальная на десктопе */}
      <div className="flex md:hidden gap-1.5 justify-between items-center">
        <button
          onClick={() => setCurrentView('tiles')}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <Icon name="Home" size={20} />
        </button>
        {navigationItems.map((item) => (
          <NavButton
            key={item.view}
            icon={item.icon}
            label={item.label}
            active={currentView === item.view}
            onClick={() => setCurrentView(item.view)}
            badge={item.badge}
          />
        ))}
      </div>
      
      {/* Десктоп версия с боковой навигацией */}
      <div className="hidden md:flex gap-4">
        <div className="flex flex-col gap-3 sticky top-4 h-fit">
          {navigationItems.map((item) => (
            <NavButton
              key={item.view}
              icon={item.icon}
              label={item.label}
              active={currentView === item.view}
              onClick={() => setCurrentView(item.view)}
              badge={item.badge}
            />
          ))}
        </div>
        <div className="flex-1 min-w-0">
          {content}
        </div>
      </div>
      
      {/* Контент на мобильных */}
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
      <AccountingTab enabled={true} />
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
            Пользователи
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



  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mt-8">
      <div
        onClick={() => setCurrentView('requests')}
        className="cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 p-6 rounded-2xl relative overflow-hidden group order-1 bg-gradient-to-br from-blue-600 to-blue-800 shadow-xl hover:shadow-2xl border border-blue-500/30"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-400/30 w-fit mb-2 md:mb-3">
            <Icon name="UserCheck" size={20} className="text-white md:w-6 md:h-6" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Заявки</h2>
          <p className="text-blue-100 text-xs md:text-sm">Новые заявки и время работы</p>
        </div>
      </div>

      <div
        onClick={() => setCurrentView('accounting')}
        className="cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 p-6 rounded-2xl relative overflow-hidden group order-2 bg-gradient-to-br from-yellow-500 to-orange-600 shadow-xl hover:shadow-2xl border border-yellow-400/30"
      >
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-yellow-300/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="p-2 rounded-xl bg-yellow-400/20 border border-yellow-300/30 w-fit mb-2 md:mb-3">
            <Icon name="Calculator" size={20} className="text-white md:w-6 md:h-6" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Бух.учет</h2>
          <p className="text-yellow-100 text-xs md:text-sm mb-2 md:mb-3">Финансовый учет и отчетность</p>
          <div className="mt-auto pt-2 md:pt-4">
            <AccountingStats sessionToken={sessionToken} />
          </div>
        </div>
      </div>

      <div
        onClick={() => setCurrentView('stats')}
        className="cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 p-6 rounded-2xl relative overflow-hidden group order-3 bg-gradient-to-br from-green-600 to-emerald-700 shadow-xl hover:shadow-2xl border border-green-500/30"
      >
        <div className="absolute top-0 left-0 w-32 h-32 bg-green-400/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="p-2 rounded-xl bg-green-500/20 border border-green-400/30 w-fit mb-2 md:mb-3">
            <Icon name="BarChart3" size={20} className="text-white md:w-6 md:h-6" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Статистика</h2>
          <p className="text-green-100 text-xs md:text-sm mb-2 md:mb-3">Пользователи, рейтинг, организации</p>
          <div className="mt-auto pt-2 md:pt-4 flex flex-wrap gap-1.5 md:gap-2">
            <MonthComparisonBadge sessionToken={sessionToken} />
            <TodayContactsCounter sessionToken={sessionToken} />
          </div>
        </div>
      </div>

      <div
        onClick={() => setCurrentView('chat')}
        className="cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 p-6 rounded-2xl relative overflow-hidden group order-4 bg-gradient-to-br from-orange-500 to-red-600 shadow-xl hover:shadow-2xl border border-orange-400/30"
      >
        {unreadCount > 0 && (
          <div className="absolute top-2 right-2 md:top-3 md:right-3 z-20">
            <div className="bg-red-500 text-white px-2 py-1 md:px-2.5 md:py-1 rounded-full text-xs font-bold shadow-lg border border-red-300/50">
              {unreadCount}
            </div>
          </div>
        )}
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-300/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="p-2 rounded-xl bg-orange-400/20 border border-orange-300/30 w-fit mb-2 md:mb-3">
            <Icon name="MessageCircle" size={20} className="text-white md:w-6 md:h-6" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Чат</h2>
          <p className="text-orange-100 text-xs md:text-sm">Общение с промоутерами</p>
        </div>
      </div>

      <div
        onClick={() => setCurrentView('clients')}
        className="cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 p-6 rounded-2xl relative overflow-hidden group order-5 bg-gradient-to-br from-purple-600 to-indigo-700 shadow-xl hover:shadow-2xl border border-purple-500/30"
      >
        <div className="absolute top-0 left-0 w-40 h-40 bg-purple-400/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-400/30 w-fit mb-2 md:mb-3">
            <Icon name="Building2" size={20} className="text-white md:w-6 md:h-6" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Заказчики</h2>
          <p className="text-purple-100 text-xs md:text-sm">Планирование выходов к организациям</p>
        </div>
      </div>

      <div
        onClick={() => setCurrentView('analytics')}
        className="cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 p-6 rounded-2xl relative overflow-hidden group order-6 bg-gradient-to-br from-indigo-600 to-violet-700 shadow-xl hover:shadow-2xl border border-indigo-500/30"
      >
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 w-fit mb-2 md:mb-3">
            <Icon name="TrendingUp" size={20} className="text-white md:w-6 md:h-6" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-1">График</h2>
          <p className="text-indigo-100 text-xs md:text-sm mb-2 md:mb-3">Расписание смен</p>
          <div className="mt-auto pt-2 md:pt-4">
            <TodayWorkersCounter sessionToken={sessionToken} />
          </div>
        </div>
      </div>
    </div>
  );
}