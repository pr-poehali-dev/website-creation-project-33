import { useAuth } from '@/contexts/AuthContext';
import { useChatMessages } from './useAdminData';

export function useChatUnread() {
  const { user } = useAuth();
  const { data } = useChatMessages(user?.id.toString() || null);
  
  if (!user || !data) return 0;
  
  if (user.is_admin) {
    const users = data.users || [];
    return users.reduce(
      (sum: number, userChat: any) => sum + (userChat.unread_count || 0),
      0
    );
  } else {
    const messages = data.messages || [];
    return messages.filter(
      (msg: any) => msg.is_from_admin && !msg.is_read
    ).length;
  }
}