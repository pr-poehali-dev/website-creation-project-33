import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const CHAT_API_URL = 'https://functions.poehali.dev/cad0f9c1-a7f9-476f-b300-29e671bbaa2c';

export function useChatUnread() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || user.is_admin) return;

    const checkUnread = async () => {
      try {
        const response = await fetch(CHAT_API_URL, {
          method: 'GET',
          headers: {
            'X-User-Id': user.id.toString(),
          },
        });

        if (response.ok) {
          const data = await response.json();
          const messages = data.messages || [];
          const unread = messages.filter(
            (msg: any) => msg.is_from_admin && !msg.is_read
          ).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error('Check unread error:', error);
      }
    };

    checkUnread();
    const interval = setInterval(checkUnread, 5000);
    return () => clearInterval(interval);
  }, [user]);

  return unreadCount;
}