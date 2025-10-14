import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChatUnread } from '@/hooks/useChatUnread';
import { useAdminName } from '@/hooks/useAdminName';
import AdminAccessDenied from './AdminAccessDenied';
import AdminWelcome from './AdminWelcome';
import AdminPanelStyles from './AdminPanelStyles';
import AdminHeader from './AdminHeader';
import AdminTabs from './AdminTabs';
import FloatingOrbs from './FloatingOrbs';

export default function AdminPanel() {
  const { logout, user } = useAuth();
  const unreadCount = useChatUnread();
  const { adminName, loadingName } = useAdminName();
  const [showWelcome, setShowWelcome] = useState(true);

  const openGoogleSheets = () => {
    const sheetId = 'https://docs.google.com/spreadsheets/d/1fH4lgqreRPBoHQadU8Srw7L3bPgT5xa3zyz2idfpptM/edit';
    window.open(sheetId, '_blank');
  };

  useEffect(() => {
    if (!loadingName && showWelcome) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loadingName, showWelcome]);

  if (!user?.is_admin) {
    return <AdminAccessDenied onLogout={logout} />;
  }

  if (showWelcome && !loadingName) {
    return <AdminWelcome adminName={adminName} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#1a2f4f] to-[#0f1e36] p-4 md:p-6 relative overflow-hidden">
      <AdminPanelStyles />
      <FloatingOrbs />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <AdminHeader onLogout={logout} onOpenGoogleSheets={openGoogleSheets} />
        <AdminTabs 
          unreadCount={unreadCount} 
          sessionToken={localStorage.getItem('session_token') || ''} 
        />
      </div>
    </div>
  );
}
