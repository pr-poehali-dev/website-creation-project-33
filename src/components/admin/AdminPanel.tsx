import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChatUnread } from '@/hooks/useChatUnread';
import { toast } from '@/hooks/use-toast';
import AdminAccessDenied from './AdminAccessDenied';
import AdminPanelStyles from './AdminPanelStyles';
import AdminHeader from './AdminHeader';
import AdminTabs from './AdminTabs';

export default function AdminPanel() {
  const { logout, user } = useAuth();
  const unreadCount = useChatUnread();
  const [resetting, setResetting] = useState(false);

  const openGoogleSheets = () => {
    const sheetId = 'https://docs.google.com/spreadsheets/d/1fH4lgqreRPBoHQadU8Srw7L3bPgT5xa3zyz2idfpptM/edit';
    window.open(sheetId, '_blank');
  };

  const resetApproaches = async () => {
    if (!confirm('Вы уверены, что хотите обнулить все подходы? Это действие нельзя отменить.')) {
      return;
    }

    setResetting(true);
    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch('https://functions.poehali.dev/cc09c22c-37d7-4e93-8483-4c6412048b89', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken || ''
        }
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Успешно!',
          description: data.message
        });
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обнулить подходы',
        variant: 'destructive'
      });
    } finally {
      setResetting(false);
    }
  };

  const resetSelectedOrganizations = async () => {
    if (!confirm('Вы уверены? Все промоутеры должны будут заново выбрать организацию сегодня.')) {
      return;
    }

    setResetting(true);
    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch('https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken || ''
        },
        body: JSON.stringify({ action: 'reset_selected_organizations' })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Готово!',
          description: `Сброшено выбранных организаций: ${data.count}`
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сбросить организации',
        variant: 'destructive'
      });
    } finally {
      setResetting(false);
    }
  };

  if (!user?.is_admin) {
    return <AdminAccessDenied onLogout={logout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <AdminPanelStyles />
      
      <div className="max-w-7xl mx-auto">
        <AdminHeader 
          onLogout={logout} 
          onOpenGoogleSheets={openGoogleSheets} 
          onResetApproaches={resetApproaches} 
          onResetOrganizations={resetSelectedOrganizations}
          resetting={resetting} 
        />
        <AdminTabs 
          unreadCount={unreadCount} 
          sessionToken={localStorage.getItem('session_token') || ''} 
        />
      </div>
    </div>
  );
}