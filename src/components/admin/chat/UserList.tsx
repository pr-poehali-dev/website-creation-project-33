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
    <Card className="md:col-span-1 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon name="Users" size={20} />
          Диалоги ({users.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-300px)] md:h-[calc(100vh-300px)]">
          {users.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Icon name="MessageCircle" size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Нет активных диалогов</p>
            </div>
          ) : (
            <div>
              {users.map((userChat) => (
                <button
                  key={userChat.id}
                  onClick={() => onSelectUser(userChat)}
                  className={`w-full p-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors border-b ${
                    selectedUser?.id === userChat.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{userChat.name}</p>
                      <p className="text-xs text-gray-500 truncate">{userChat.email}</p>
                      {userChat.last_message_time ? (
                        <p className="text-xs text-gray-400 mt-1">
                          {formatChatListTime(userChat.last_message_time)}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1 italic">
                          Нет сообщений
                        </p>
                      )}
                    </div>
                    {userChat.unread_count > 0 && (
                      <Badge className="ml-2 bg-red-500 hover:bg-red-600 shrink-0">
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