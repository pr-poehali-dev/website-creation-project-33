import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const SESSION_CHECK_URL = 'https://functions.poehali.dev/d4f30ed2-6b6b-4e8a-a691-2c364dd41e43';

export function useSessionValidator() {
  const { logout, user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const validateSession = async () => {
      const token = localStorage.getItem('session_token');
      if (!token) {
        logout();
        return;
      }

      try {
        const response = await fetch(SESSION_CHECK_URL, {
          method: 'GET',
          headers: {
            'X-Session-Token': token,
          },
        });

        if (!response.ok) {
          console.warn('Session invalid, logging out');
          logout();
        }
      } catch (error) {
        console.error('Session validation error:', error);
      }
    };

    // Проверяем сессию при любом клике на странице
    const handleUserActivity = () => {
      validateSession();
    };

    // Добавляем слушатели на клики и нажатия клавиш
    document.addEventListener('click', handleUserActivity);
    document.addEventListener('keydown', handleUserActivity);

    return () => {
      document.removeEventListener('click', handleUserActivity);
      document.removeEventListener('keydown', handleUserActivity);
    };
  }, [user, logout]);
}
