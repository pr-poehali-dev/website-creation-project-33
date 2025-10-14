import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChatUnread } from '@/hooks/useChatUnread';
import AdminAccessDenied from './AdminAccessDenied';
import AdminPanelStyles from './AdminPanelStyles';
import AdminHeader from './AdminHeader';
import AdminTabs from './AdminTabs';

export default function AdminPanel() {
  const { logout, user } = useAuth();
  const unreadCount = useChatUnread();

  const openGoogleSheets = () => {
    const sheetId = 'https://docs.google.com/spreadsheets/d/1fH4lgqreRPBoHQadU8Srw7L3bPgT5xa3zyz2idfpptM/edit';
    window.open(sheetId, '_blank');
  };

  if (!user?.is_admin) {
    return <AdminAccessDenied onLogout={logout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <AdminPanelStyles />
      
      <div className="max-w-7xl mx-auto">
        <AdminHeader onLogout={logout} onOpenGoogleSheets={openGoogleSheets} />
        <AdminTabs 
          unreadCount={unreadCount} 
          sessionToken={localStorage.getItem('session_token') || ''} 
        />
      </div>
    </div>
  );
}