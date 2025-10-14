import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { formatChatListTime } from '@/utils/timeFormat';
import { UserChat } from './types';

interface UserListProps {
  users: UserChat[];
  selectedUser: UserChat | null;
  onSelectUser: (user: UserChat) => void;
}

export default function UserList({ users, selectedUser, onSelectUser }: UserListProps) {
  return (
    <Card className="glass-panel border-white/10 rounded-2xl md:col-span-1 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm md:text-base text-white">
          <Icon name="Users" size={18} className="md:w-5 md:h-5" />
          Диалоги ({users.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-300px)] md:h-[calc(100vh-300px)]">
          {users.length === 0 ? (
            <div className="p-4 md:p-6 text-center text-white/70">
              <Icon name="MessageCircle" size={28} className="mx-auto mb-2 opacity-50 md:w-8 md:h-8" />
              <p className="text-xs md:text-sm">Нет активных диалогов</p>
            </div>
          ) : (
            <div>
              {users.map((userChat) => (
                <button
                  key={userChat.id}
                  onClick={() => onSelectUser(userChat)}
                  className={`w-full p-3 md:p-4 text-left hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/10 ${
                    selectedUser?.id === userChat.id ? 'bg-white/10 border-l-4 border-l-white/50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 md:gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs md:text-sm truncate text-white">{userChat.name}</p>
                      <p className="text-[10px] md:text-xs text-white/50 truncate">{userChat.email}</p>
                      {userChat.last_message_time ? (
                        <p className="text-[10px] md:text-xs text-white/40 mt-1">
                          {formatChatListTime(userChat.last_message_time)}
                        </p>
                      ) : (
                        <p className="text-[10px] md:text-xs text-white/40 mt-1 italic">
                          Нет сообщений
                        </p>
                      )}
                    </div>
                    {userChat.unread_count > 0 && (
                      <Badge className="ml-2 bg-red-500 hover:bg-red-600 shrink-0 text-xs h-5 min-w-[20px] px-1.5">
                        {userChat.unread_count}
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}