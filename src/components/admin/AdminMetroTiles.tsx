import React, { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import PendingUsers from './PendingUsers';
import AllUsersWorkTime from './AllUsersWorkTime';
import UsersTab from './UsersTab';
import StatsTab from './StatsTab';
import OrganizationsTab from './OrganizationsTab';
import AdminChatTab from './AdminChatTab';

interface AdminMetroTilesProps {
  unreadCount: number;
  sessionToken: string;
}

type TileView = 'tiles' | 'requests' | 'stats' | 'chat' | 'analytics';
type StatsSubView = 'users' | 'rating' | 'organizations';

export default function AdminMetroTiles({ unreadCount, sessionToken }: AdminMetroTilesProps) {
  const [currentView, setCurrentView] = useState<TileView>('tiles');
  const [statsSubView, setStatsSubView] = useState<StatsSubView>('users');

  if (currentView === 'requests') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setCurrentView('tiles')}
          className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors mb-4"
        >
          <Icon name="ArrowLeft" size={20} />
          <span className="text-lg">Назад к плиткам</span>
        </button>
        <PendingUsers sessionToken={sessionToken} />
        <AllUsersWorkTime sessionToken={sessionToken} />
      </div>
    );
  }

  if (currentView === 'stats') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setCurrentView('tiles')}
          className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors mb-4"
        >
          <Icon name="ArrowLeft" size={20} />
          <span className="text-lg">Назад к плиткам</span>
        </button>
        
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setStatsSubView('users')}
            className={`px-4 py-2 rounded transition-colors ${
              statsSubView === 'users' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Пользователи
          </button>
          <button
            onClick={() => setStatsSubView('rating')}
            className={`px-4 py-2 rounded transition-colors ${
              statsSubView === 'rating' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Рейтинг
          </button>
          <button
            onClick={() => setStatsSubView('organizations')}
            className={`px-4 py-2 rounded transition-colors ${
              statsSubView === 'organizations' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
    return (
      <div className="space-y-4">
        <button
          onClick={() => setCurrentView('tiles')}
          className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors mb-4"
        >
          <Icon name="ArrowLeft" size={20} />
          <span className="text-lg">Назад к плиткам</span>
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
          className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors mb-4"
        >
          <Icon name="ArrowLeft" size={20} />
          <span className="text-lg">Назад к плиткам</span>
        </button>
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <Icon name="BarChart3" size={64} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-2xl font-bold text-white mb-2">График</h2>
          <p className="text-gray-400">Раздел в разработке</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6 mt-8">
      <div
        onClick={() => setCurrentView('requests')}
        className="metro-tile bg-blue-600 hover:bg-blue-700 cursor-pointer transition-all duration-200 active:scale-95 p-6 md:p-8 rounded-none relative overflow-hidden group"
      >
        <div className="relative z-10">
          <Icon name="UserCheck" size={48} className="text-white mb-4 md:mb-6" />
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Заявки</h2>
          <p className="text-blue-100 text-sm md:text-base">Новые заявки и время работы</p>
        </div>
        <div className="absolute bottom-0 right-0 opacity-10 group-hover:opacity-20 transition-opacity">
          <Icon name="UserCheck" size={120} className="text-white" />
        </div>
      </div>

      <div
        onClick={() => setCurrentView('stats')}
        className="metro-tile bg-green-600 hover:bg-green-700 cursor-pointer transition-all duration-200 active:scale-95 p-6 md:p-8 rounded-none relative overflow-hidden group"
      >
        <div className="relative z-10">
          <Icon name="BarChart3" size={48} className="text-white mb-4 md:mb-6" />
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Статистика</h2>
          <p className="text-green-100 text-sm md:text-base">Пользователи, рейтинг, организации</p>
        </div>
        <div className="absolute bottom-0 right-0 opacity-10 group-hover:opacity-20 transition-opacity">
          <Icon name="BarChart3" size={120} className="text-white" />
        </div>
      </div>

      <div
        onClick={() => setCurrentView('chat')}
        className="metro-tile bg-orange-600 hover:bg-orange-700 cursor-pointer transition-all duration-200 active:scale-95 p-6 md:p-8 rounded-none relative overflow-hidden group"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <Icon name="MessageCircle" size={48} className="text-white" />
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white text-lg px-3 py-1">
                {unreadCount}
              </Badge>
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Чат</h2>
          <p className="text-orange-100 text-sm md:text-base">Общение с промоутерами</p>
        </div>
        <div className="absolute bottom-0 right-0 opacity-10 group-hover:opacity-20 transition-opacity">
          <Icon name="MessageCircle" size={120} className="text-white" />
        </div>
      </div>

      <div
        onClick={() => setCurrentView('analytics')}
        className="metro-tile bg-purple-600 hover:bg-purple-700 cursor-pointer transition-all duration-200 active:scale-95 p-6 md:p-8 rounded-none relative overflow-hidden group"
      >
        <div className="relative z-10">
          <Icon name="TrendingUp" size={48} className="text-white mb-4 md:mb-6" />
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">График</h2>
          <p className="text-purple-100 text-sm md:text-base">В разработке</p>
        </div>
        <div className="absolute bottom-0 right-0 opacity-10 group-hover:opacity-20 transition-opacity">
          <Icon name="TrendingUp" size={120} className="text-white" />
        </div>
      </div>
    </div>
  );
}
