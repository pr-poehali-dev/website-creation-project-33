import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { formatChatListTime } from '@/utils/timeFormat';
import { UserChat } from './types';
import UserAvatar from '@/components/chat/UserAvatar';

interface UserListProps {
  users: UserChat[];
  selectedUser: UserChat | null;
  onSelectUser: (user: UserChat) => void;
}

export default function UserList({ users, selectedUser, onSelectUser }: UserListProps) {
  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 rounded-2xl md:col-span-1 h-full shadow-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm md:text-base text-slate-100">
          <Icon name="Users" size={18} className="md:w-5 md:h-5 text-cyan-400" />
          Диалоги ({users.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-300px)] md:h-[calc(100vh-300px)]">
          {users.length === 0 ? (
            <div className="p-4 md:p-6 text-center text-slate-400">
              <Icon name="MessageCircle" size={28} className="mx-auto mb-2 opacity-50 md:w-8 md:h-8" />
              <p className="text-xs md:text-sm">Нет активных диалогов</p>
            </div>
          ) : (
            <div>
              {users.map((userChat) => (
                <button
                  key={userChat.id}
                  onClick={() => onSelectUser(userChat)}
                  className={`w-full p-3 md:p-4 text-left hover:bg-slate-700/50 active:bg-slate-700/50 transition-colors border-b border-slate-700 ${
                    selectedUser?.id === userChat.id ? 'bg-slate-700/70 border-l-4 border-l-cyan-400' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <UserAvatar 
                      name={userChat.name} 
                      avatarUrl={userChat.avatar_url}
                      size={40}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs md:text-sm truncate text-slate-100">{userChat.name}</p>
                          <p className="text-[10px] md:text-xs text-slate-400 truncate">{userChat.email}</p>
                          {userChat.last_message_time ? (
                            <p className="text-[10px] md:text-xs text-slate-500 mt-1">
                              {formatChatListTime(userChat.last_message_time)}
                            </p>
                          ) : userChat.id !== -1 ? (
                            <p className="text-[10px] md:text-xs text-slate-500 mt-1 italic">
                              Нет сообщений
                            </p>
                          ) : null}
                        </div>
                        {userChat.unread_count > 0 && (
                          <Badge className="ml-2 bg-red-500 hover:bg-red-600 shrink-0 text-xs h-5 min-w-[20px] px-1.5">
                            {userChat.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
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