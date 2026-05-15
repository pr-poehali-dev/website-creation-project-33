import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChatUnread } from '@/hooks/useChatUnread';
import AdminAccessDenied from './AdminAccessDenied';
import AdminHeader from './AdminHeader';
import AdminMetroTiles from './AdminMetroTiles';

type TileView = 'tiles' | 'requests' | 'fines' | 'tasks' | 'accounting' | 'stats' | 'chat' | 'analytics' | 'clients' | 'telegram' | 'assistant';

export default function AdminPanel() {
  const { logout, user } = useAuth();
  const unreadCount = useChatUnread();
  const [currentView, setCurrentView] = useState<TileView>('tiles');
  
  const openGoogleSheets = () => {
    const sheetId = 'https://docs.google.com/spreadsheets/d/1fH4lgqreRPBoHQadU8Srw7L3bPgT5xa3zyz2idfpptM/edit';
    window.open(sheetId, '_blank');
  };

  const goHome = () => {
    setCurrentView('tiles');
  };

  if (!user?.is_admin) {
    return <AdminAccessDenied onLogout={logout} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 md:px-6">
        {currentView !== 'analytics' && (
          <AdminHeader 
            onLogout={logout} 
            onOpenGoogleSheets={openGoogleSheets}
            onGoHome={goHome}
            showHomeButton={currentView !== 'tiles'}
          />
        )}
      </div>
      <div className={`w-full ${currentView === 'accounting' ? '' : 'px-4 md:px-6'}`}>
        <AdminMetroTiles 
          unreadCount={unreadCount} 
          sessionToken={localStorage.getItem('session_token') || ''}
          currentView={currentView}
          onViewChange={setCurrentView}
        />
      </div>
    </div>
  );
}