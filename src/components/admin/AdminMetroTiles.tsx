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
      <Icon name={icon} size={20} className={`transition-all duration-200 ${active ? 'text-[#001f54] scale-110' : 'text-gray-400 group-hover:text-gray-600'}`} />
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
    <div className="fixed bottom-0 left-0 right-0 z-50">
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
        </button>

        {/* Штрафы */}
        <button
          onClick={() => handleViewChange('fines')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-red-50 hover:border-l-4 hover:border-l-red-400 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors flex-shrink-0">
              <Icon name="AlertTriangle" size={20} className="text-red-500" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-800 group-hover:text-red-700 transition-colors">Штрафы</div>
            </div>
          </div>
        </button>

        {/* Задачи */}
        <button
          onClick={() => handleViewChange('tasks')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-cyan-50 hover:border-l-4 hover:border-l-cyan-400 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 group-hover:bg-cyan-100 flex items-center justify-center transition-colors flex-shrink-0">
              <Icon name="ClipboardList" size={20} className="text-cyan-500" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-800 group-hover:text-cyan-700 transition-colors">Задачи</div>
            </div>
          </div>
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
              <div className="flex items-center gap-3 min-w-0">
                <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors flex-shrink-0">Бух.учет</div>
                <div className="hidden md:flex flex-nowrap gap-1.5 min-w-0">
                  <AccountingStats sessionToken={sessionToken} />
                </div>
                <div className="flex md:hidden flex-nowrap gap-1.5 min-w-0">
                  <AccountingStats sessionToken={sessionToken} compact />
                </div>
              </div>
            </div>
          </div>
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
              <div className="flex items-center gap-3 min-w-0">
                <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors flex-shrink-0">Статистика</div>
                <div className="hidden md:flex flex-nowrap gap-1.5 min-w-0">
                  <MonthComparisonBadge sessionToken={sessionToken} />
                  <TodayContactsCounter sessionToken={sessionToken} />
                  <TodayApproachesCounter sessionToken={sessionToken} />
                </div>
                <div className="flex md:hidden flex-nowrap gap-1.5 min-w-0">
                  <TodayContactsCounter sessionToken={sessionToken} />
                </div>
              </div>
            </div>
          </div>
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
              <div className="flex items-center gap-3 min-w-0">
                <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors flex-shrink-0">График</div>
                <div className="flex flex-nowrap gap-1.5 min-w-0">
                  <TodayWorkersCounter sessionToken={sessionToken} />
                </div>
              </div>
            </div>
          </div>
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
        </button>

      </div>
    </div>
  );
}