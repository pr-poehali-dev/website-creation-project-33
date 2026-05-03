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
import SeniorsTab from './SeniorsTab';
import TasksTab from './TasksTab';
import FinesTab from './FinesTab';


interface AdminMetroTilesProps {
  unreadCount: number;
  sessionToken: string;
  currentView: TileView;
  onViewChange: (view: TileView) => void;
}

type TileView = 'tiles' | 'requests' | 'fines' | 'tasks' | 'accounting' | 'stats' | 'chat' | 'analytics' | 'clients' | 'telegram';
type StatsSubView = 'users' | 'rating' | 'organizations' | 'seniors';

const NavButton = ({ 
  icon, 
  label, 
  active, 
  onClick, 
  badge,
}: { 
  icon: string; 
  label: string; 
  active: boolean; 
  onClick: () => void; 
  badge?: number;
  view: string;
}) => (
  <button
    onClick={onClick}
    className="relative flex flex-col items-center gap-1 flex-1 py-2 px-1 transition-all duration-200 group"
  >
    <div className="relative flex items-center justify-center w-10 h-10">
      <Icon name={icon} size={20} className={`transition-colors duration-200 ${active ? 'text-[#001f54] nav-active-icon' : 'text-gray-400 group-hover:text-gray-600'}`} />
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 animate-pulse">
          {badge}
        </span>
      )}
    </div>
    <span className={`text-[10px] font-medium leading-none transition-colors duration-200 ${
      active ? 'text-[#001f54] font-semibold' : 'text-gray-400 group-hover:text-gray-600'
    }`}>{label}</span>
    {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#001f54] rounded-full" />}
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
    { view: 'fines' as TileView, icon: 'AlertTriangle', label: 'Штрафы' },
    { view: 'tasks' as TileView, icon: 'ClipboardList', label: 'Задачи' },
    { view: 'accounting' as TileView, icon: 'Calculator', label: 'Бух.учет' },
    { view: 'stats' as TileView, icon: 'BarChart3', label: 'Статистика' },
    { view: 'chat' as TileView, icon: 'MessageCircle', label: 'Чат', badge: unreadCount },
    { view: 'clients' as TileView, icon: 'Building2', label: 'Заказчики' },
    { view: 'analytics' as TileView, icon: 'TrendingUp', label: 'График' },
    { view: 'telegram' as TileView, icon: 'Bot', label: 'Телеграм бот' },
  ];

  const BottomNav = () => (
    <div className="hidden md:block fixed bottom-0 left-0 right-0 z-50 opacity-30 hover:opacity-100 transition-opacity duration-500 ease-in-out">
      <div className="max-w-2xl mx-auto px-2 flex items-center">
        {navigationItems.map((item) => (
          <NavButton
            key={item.view}
            view={item.view}
            icon={item.icon}
            label={item.label}
            active={currentView === item.view}
            onClick={() => handleViewChange(item.view)}
            badge={item.badge}
          />
        ))}
      </div>
      <div className="h-safe-area-inset-bottom" />
    </div>
  );

  const renderWithSidebar = (content: React.ReactNode) => (
    <div className="pb-24">
      <div className="pt-4">
        {content}
      </div>
      <BottomNav />
    </div>
  );

  if (currentView === 'tasks') {
    return renderWithSidebar(
      <TasksTab />
    );
  }

  if (currentView === 'requests') {
    return renderWithSidebar(
      <div className="space-y-4">
        <PendingUsers sessionToken={sessionToken} />
        <AllUsersWorkTime sessionToken={sessionToken} />
      </div>
    );
  }

  if (currentView === 'fines') {
    return renderWithSidebar(<FinesTab />);
  }

  if (currentView === 'accounting') {
    return renderWithSidebar(
      <div className="space-y-4">
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
          <button
            onClick={() => setStatsSubView('seniors')}
            className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-xl transition-all text-xs md:text-sm font-medium whitespace-nowrap ${
              statsSubView === 'seniors' 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg border-0' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Старшие
          </button>
        </div>

        {statsSubView === 'users' && <UsersTab enabled={true} />}
        {statsSubView === 'rating' && <StatsTab enabled={true} />}
        {statsSubView === 'organizations' && <OrganizationsTab enabled={true} />}
        {statsSubView === 'seniors' && <SeniorsTab />}
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
      <ScheduleAnalyticsTab onGoHome={() => handleViewChange('tiles')} />
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

  const tileItems = [
    {
      view: 'requests' as TileView,
      icon: 'UserCheck',
      label: 'Заявки',
      color: 'text-blue-500',
      bg: 'bg-blue-50',
      hoverBg: 'hover:bg-blue-50',
      accent: 'group-hover:text-blue-600',
    },
    {
      view: 'fines' as TileView,
      icon: 'AlertTriangle',
      label: 'Штрафы',
      color: 'text-red-500',
      bg: 'bg-red-50',
      hoverBg: 'hover:bg-red-50',
      accent: 'group-hover:text-red-600',
    },
    {
      view: 'tasks' as TileView,
      icon: 'ClipboardList',
      label: 'Задачи',
      color: 'text-cyan-500',
      bg: 'bg-cyan-50',
      hoverBg: 'hover:bg-cyan-50',
      accent: 'group-hover:text-cyan-600',
    },
    {
      view: 'accounting' as TileView,
      icon: 'Calculator',
      label: 'Бух.учет',
      color: 'text-violet-500',
      bg: 'bg-violet-50',
      hoverBg: 'hover:bg-violet-50',
      accent: 'group-hover:text-violet-600',
      extra: (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          <AccountingStats sessionToken={sessionToken} compact />
        </div>
      ),
    },
    {
      view: 'stats' as TileView,
      icon: 'BarChart3',
      label: 'Статистика',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      hoverBg: 'hover:bg-emerald-50',
      accent: 'group-hover:text-emerald-600',
      extra: (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          <MonthComparisonBadge sessionToken={sessionToken} />
          <TodayContactsCounter sessionToken={sessionToken} />
          <TodayApproachesCounter sessionToken={sessionToken} />
        </div>
      ),
    },
    {
      view: 'chat' as TileView,
      icon: 'MessageCircle',
      label: 'Чат',
      color: 'text-sky-500',
      bg: 'bg-sky-50',
      hoverBg: 'hover:bg-sky-50',
      accent: 'group-hover:text-sky-600',
      badge: unreadCount,
    },
    {
      view: 'clients' as TileView,
      icon: 'Building2',
      label: 'Заказчики',
      color: 'text-indigo-500',
      bg: 'bg-indigo-50',
      hoverBg: 'hover:bg-indigo-50',
      accent: 'group-hover:text-indigo-600',
    },
    {
      view: 'analytics' as TileView,
      icon: 'TrendingUp',
      label: 'График',
      color: 'text-teal-500',
      bg: 'bg-teal-50',
      hoverBg: 'hover:bg-teal-50',
      accent: 'group-hover:text-teal-600',
      extra: (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          <TodayWorkersCounter sessionToken={sessionToken} />
        </div>
      ),
    },
    {
      view: 'telegram' as TileView,
      icon: 'Bot',
      label: 'Телеграм бот',
      color: 'text-blue-400',
      bg: 'bg-blue-50',
      hoverBg: 'hover:bg-blue-50',
      accent: 'group-hover:text-blue-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {tileItems.map((item) => (
        <button
          key={item.view}
          onClick={() => handleViewChange(item.view)}
          className={`group relative bg-white border border-gray-100 rounded-2xl p-4 text-left shadow-sm hover:shadow-md ${item.hoverBg} transition-all duration-200 active:scale-[0.98]`}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0 relative`}>
                <Icon name={item.icon} size={22} className={item.color} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <Icon name="ChevronRight" size={16} className="text-gray-300 group-hover:text-gray-400 mt-1 transition-colors" />
            </div>
            <div>
              <div className={`font-semibold text-gray-800 ${item.accent} transition-colors text-sm md:text-base`}>
                {item.label}
              </div>
              {item.extra && item.extra}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}