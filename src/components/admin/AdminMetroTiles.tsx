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

export default function AdminMetroTiles({ unreadCount, sessionToken }: AdminMetroTilesProps) {
  const [currentView, setCurrentView] = useState<TileView>('tiles');
  const [statsSubView, setStatsSubView] = useState<StatsSubView>('rating');

  if (currentView === 'requests') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setCurrentView('tiles')}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg mb-4 w-full md:w-auto"
        >
          <Icon name="ArrowLeft" size={20} />
          <span className="text-base md:text-lg font-medium">Назад</span>
        </button>
        <PendingUsers sessionToken={sessionToken} />
        <AllUsersWorkTime sessionToken={sessionToken} />
      </div>
    );
  }

  if (currentView === 'accounting') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setCurrentView('tiles')}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg mb-4 w-full md:w-auto"
        >
          <Icon name="ArrowLeft" size={20} />
          <span className="text-base md:text-lg font-medium">Назад</span>
        </button>
        <AccountingTab enabled={true} />
      </div>
    );
  }

  if (currentView === 'stats') {
    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-2 mb-6">
          <button
            onClick={() => setCurrentView('tiles')}
            className="flex items-center justify-center md:justify-start gap-2 px-4 py-2 rounded-xl transition-all text-sm font-medium bg-slate-800/50 text-slate-300 border border-slate-600 hover:bg-slate-700/50 w-full md:w-auto"
          >
            <Icon name="ArrowLeft" size={16} />
            <span>Назад</span>
          </button>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatsSubView('rating')}
              className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-xl transition-all text-xs md:text-sm font-medium whitespace-nowrap ${
                statsSubView === 'rating' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg border-0' 
                  : 'bg-slate-800/50 text-slate-300 border border-slate-600 hover:bg-slate-700/50'
              }`}
            >
              Рейтинг
            </button>
            <button
              onClick={() => setStatsSubView('users')}
              className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-xl transition-all text-xs md:text-sm font-medium whitespace-nowrap ${
                statsSubView === 'users' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg border-0' 
                  : 'bg-slate-800/50 text-slate-300 border border-slate-600 hover:bg-slate-700/50'
              }`}
            >
              Пользователи
            </button>
            <button
              onClick={() => setStatsSubView('organizations')}
              className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-xl transition-all text-xs md:text-sm font-medium whitespace-nowrap ${
                statsSubView === 'organizations' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg border-0' 
                  : 'bg-slate-800/50 text-slate-300 border border-slate-600 hover:bg-slate-700/50'
              }`}
            >
              Организации
            </button>
          </div>
        </div>

        {statsSubView === 'users' && <UsersTab enabled={true} />}
        {statsSubView === 'rating' && <StatsTab enabled={true} />}
        {statsSubView === 'organizations' && <OrganizationsTab enabled={true} />}
      </div>
    );
  }

  if (currentView === 'chat') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setCurrentView('tiles')}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg mb-4 w-full md:w-auto"
        >
          <Icon name="ArrowLeft" size={20} />
          <span className="text-base md:text-lg font-medium">Назад</span>
        </button>
        <AdminChatTab />
      </div>
    );
  }

  if (currentView === 'analytics') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setCurrentView('tiles')}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg mb-4 w-full md:w-auto"
        >
          <Icon name="ArrowLeft" size={20} />
          <span className="text-base md:text-lg font-medium">Назад</span>
        </button>
        <ScheduleAnalyticsTab />
      </div>
    );
  }

  if (currentView === 'clients') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setCurrentView('tiles')}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg mb-4 w-full md:w-auto"
        >
          <Icon name="ArrowLeft" size={20} />
          <span className="text-base md:text-lg font-medium">Назад</span>
        </button>
        <ClientsTab sessionToken={sessionToken} />
      </div>
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