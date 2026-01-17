import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const SESSION_CHECK_URL = 'https://functions.poehali.dev/d4f30ed2-6b6b-4e8a-a691-2c364dd41e43';
const LAST_CHECK_KEY = 'last_session_check';

export function useSessionValidator() {
  const { logout, user } = useAuth();
  const isCheckingRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    const shouldCheckSession = (): boolean => {
      const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
      const now = new Date();
      
      // Если проверка ещё не была сегодня
      if (!lastCheck) return true;
      
      const lastCheckDate = new Date(lastCheck);
      const isSameDay = 
        lastCheckDate.getDate() === now.getDate() &&
        lastCheckDate.getMonth() === now.getMonth() &&
        lastCheckDate.getFullYear() === now.getFullYear();
      
      // Проверяем раз в день после 23:59
      return !isSameDay;
    };

    const scheduleNextCheck = () => {
      const now = new Date();
      const moscow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
      
      // Следующая проверка в 23:59 МСК
      const nextCheck = new Date(moscow);
      nextCheck.setHours(23, 59, 0, 0);
      
      // Если уже прошло 23:59, проверяем завтра
      if (moscow >= nextCheck) {
        nextCheck.setDate(nextCheck.getDate() + 1);
      }
      
      const msUntilCheck = nextCheck.getTime() - moscow.getTime();
      
      setTimeout(() => {
        validateSession();
      }, msUntilCheck);
    };

    const validateSession = async () => {
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;

      const token = localStorage.getItem('session_token');
      if (!token) {
        logout();
        isCheckingRef.current = false;
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
        } else {
          // Обновляем время последней проверки
          localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
          scheduleNextCheck();
        }
      } catch (error) {
        console.error('Session validation error:', error);
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Проверяем сессию при первом клике после входа/перезагрузки
    const handleFirstClick = () => {
      if (shouldCheckSession()) {
        validateSession();
      }
      // Удаляем слушатель после первой проверки
      document.removeEventListener('click', handleFirstClick, { capture: true });
    };

    // Добавляем слушатель на первый клик с capture:true для приоритета
    document.addEventListener('click', handleFirstClick, { capture: true });

    // Планируем следующую проверку в 23:59 МСК
    scheduleNextCheck();

    return () => {
      document.removeEventListener('click', handleFirstClick, { capture: true });
    };
  }, [user, logout]);
}