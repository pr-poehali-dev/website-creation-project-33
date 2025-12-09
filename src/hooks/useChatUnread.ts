import { useAuth } from '@/contexts/AuthContext';
import { useChatMessages } from './useAdminData';

export function useChatUnread() {
  const { user } = useAuth();
  const { data } = useChatMessages(user?.id.toString() || null);
  
  if (!user || !data) return 0;
  
  if (user.is_admin) {
    const users = data.users || [];
    const personalUnread = users.reduce(
      (sum: number, userChat: any) => sum + (userChat.unread_count || 0),
      0
    );
    const groupUnread = data.group_unread_count || 0;
    return personalUnread + groupUnread;
  } else {
    const messages = data.messages || [];
    const personalUnread = messages.filter(
      (msg: any) => msg.is_from_admin && !msg.is_read
    ).length;
    
    // Для пользователя нужно дополнительно проверить групповые непрочитанные
    // Это будет загружаться отдельно в ChatTabs
    return personalUnread;
  }
}