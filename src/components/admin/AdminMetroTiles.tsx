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
  home,
}: { 
  icon: string; 
  label: string; 
  active: boolean; 
  onClick: () => void; 
  badge?: number;
  view: string;
  sidebar?: boolean;
  home?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`relative flex flex-col items-center gap-1 transition-all duration-200 group
      ${home ? 'px-5 py-2.5' : 'px-3.5 py-2.5'}
    `}
  >
    {active && !home && (
      <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#001f54]" />
    )}
    <div className="relative flex items-center justify-center">
      <Icon
        name={icon}
        size={home ? 22 : 20}
        className={`transition-colors duration-200 ${
          active
            ? home ? 'text-white' : 'text-[#001f54]'
            : home ? 'text-white/80' : 'text-gray-400 group-hover:text-gray-600'
        }`}
      />
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5 animate-pulse">
          {badge}
        </span>
      )}
    </div>
    <span className={`text-[10px] font-medium leading-none transition-colors duration-200 ${
      active
        ? home ? 'text-white font-semibold' : 'text-[#001f54] font-semibold'
        : home ? 'text-white/70' : 'text-gray-400 group-hover:text-gray-600'
    }`}>{label}</span>
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

  const otherItems = navigationItems.filter(i => i.view !== 'tiles');
  const homeItem = navigationItems.find(i => i.view === 'tiles')!;

  const MobileBottomNav = () => (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto group flex items-center">

        {/* Левая группа — появляется при наведении */}
        <div className="flex items-center
          w-0 overflow-hidden opacity-0 translate-x-4
          group-hover:w-auto group-hover:opacity-100 group-hover:translate-x-0
          transition-all duration-300 ease-out">
          <div className="flex items-center bg-white/90 backdrop-blur-md shadow-xl rounded-2xl border border-gray-100 mr-2">
            {otherItems.slice(0, 5).map((item) => (
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
        </div>

        {/* Кнопка Домой — всегда видна */}
        <div className="flex-shrink-0 bg-[#001f54] shadow-2xl rounded-2xl">
          <NavButton
            view={homeItem.view}
            icon={homeItem.icon}
            label={homeItem.label}
            active={currentView === homeItem.view}
            onClick={() => handleViewChange(homeItem.view)}
            home={true}
          />
        </div>

        {/* Правая группа — появляется при наведении */}
        <div className="flex items-center
          w-0 overflow-hidden opacity-0 -translate-x-4
          group-hover:w-auto group-hover:opacity-100 group-hover:translate-x-0
          transition-all duration-300 ease-out">
          <div className="flex items-center bg-white/90 backdrop-blur-md shadow-xl rounded-2xl border border-gray-100 ml-2">
            {otherItems.slice(5).map((item) => (
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
        </div>

      </div>
    </div>
  );

  const renderWithSidebar = (content: React.ReactNode) => (
    <div className="pb-24">
      <div className="pt-4">
        {content}
      </div>
      <MobileBottomNav />
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

  return renderWithSidebar(
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      <div className="divide-y divide-gray-100">

        {/* Заявки */}
        <button onClick={() => handleViewChange('requests')} className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-all duration-200 group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors flex-shrink-0">
              <Icon name="UserCheck" size={20} className="text-blue-500" />
            </div>
            <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">Заявки</div>
          </div>
          <Icon name="ChevronRight" size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
        </button>

        {/* Штрафы */}
        <button onClick={() => handleViewChange('fines')} className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-all duration-200 group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors flex-shrink-0">
              <Icon name="AlertTriangle" size={20} className="text-blue-500" />
            </div>
            <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">Штрафы</div>
          </div>
          <Icon name="ChevronRight" size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
        </button>

        {/* Задачи */}
        <button onClick={() => handleViewChange('tasks')} className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-all duration-200 group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors flex-shrink-0">
              <Icon name="ClipboardList" size={20} className="text-blue-500" />
            </div>
            <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">Задачи</div>
          </div>
          <Icon name="ChevronRight" size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
        </button>

        {/* Бух.учет */}
        <button onClick={() => handleViewChange('accounting')} className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-all duration-200 group">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors flex-shrink-0">
              <Icon name="Calculator" size={20} className="text-blue-500" />
            </div>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors flex-shrink-0">Бух.учет</div>
              <div className="hidden md:flex flex-nowrap gap-1.5 min-w-0"><AccountingStats sessionToken={sessionToken} /></div>
              <div className="flex md:hidden flex-nowrap gap-1.5 min-w-0"><AccountingStats sessionToken={sessionToken} compact /></div>
            </div>
          </div>
          <Icon name="ChevronRight" size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0" />
        </button>

        {/* Статистика */}
        <button onClick={() => handleViewChange('stats')} className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-all duration-200 group">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors flex-shrink-0">
              <Icon name="BarChart3" size={20} className="text-blue-500" />
            </div>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors flex-shrink-0">Статистика</div>
              <div className="hidden md:flex flex-nowrap gap-1.5 min-w-0">
                <MonthComparisonBadge sessionToken={sessionToken} />
                <TodayContactsCounter sessionToken={sessionToken} />
                <TodayApproachesCounter sessionToken={sessionToken} />
              </div>
              <div className="flex md:hidden flex-nowrap gap-1.5 min-w-0"><TodayContactsCounter sessionToken={sessionToken} /></div>
            </div>
          </div>
          <Icon name="ChevronRight" size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0" />
        </button>

        {/* Чат */}
        <button onClick={() => handleViewChange('chat')} className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-all duration-200 group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors flex-shrink-0 relative">
              <Icon name="MessageCircle" size={20} className="text-blue-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">Чат</div>
          </div>
          <Icon name="ChevronRight" size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
        </button>

        {/* Заказчики */}
        <button onClick={() => handleViewChange('clients')} className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-all duration-200 group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors flex-shrink-0">
              <Icon name="Building2" size={20} className="text-blue-500" />
            </div>
            <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">Заказчики</div>
          </div>
          <Icon name="ChevronRight" size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
        </button>

        {/* График */}
        <button onClick={() => handleViewChange('analytics')} className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-all duration-200 group">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors flex-shrink-0">
              <Icon name="TrendingUp" size={20} className="text-blue-500" />
            </div>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors flex-shrink-0">График</div>
              <div className="flex flex-nowrap gap-1.5 min-w-0"><TodayWorkersCounter sessionToken={sessionToken} /></div>
            </div>
          </div>
          <Icon name="ChevronRight" size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0" />
        </button>

        {/* Телеграм бот */}
        <button onClick={() => handleViewChange('telegram')} className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-all duration-200 group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors flex-shrink-0">
              <Icon name="Bot" size={20} className="text-blue-500" />
            </div>
            <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">Телеграм бот</div>
          </div>
          <Icon name="ChevronRight" size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
        </button>

      </div>
    </div>
  );
}