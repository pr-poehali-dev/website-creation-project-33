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
    <div className="bg-white rounded-2xl border border-gray-100 md:col-span-1 h-full shadow-sm flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <Icon name="Users" size={18} className="text-[#001f54]" />
        <span className="text-sm font-semibold text-gray-800">Диалоги ({users.length})</span>
      </div>

      <ScrollArea className="flex-1">
        {users.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <Icon name="MessageCircle" size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Нет активных диалогов</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {users.map((userChat) => (
              <button
                key={userChat.id}
                onClick={() => onSelectUser(userChat)}
                className={`w-full p-3 md:p-4 text-left transition-colors ${
                  selectedUser?.id === userChat.id
                    ? 'bg-[#001f54]/5 border-l-2 border-l-[#001f54]'
                    : 'hover:bg-gray-50 border-l-2 border-l-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  <UserAvatar
                    name={userChat.name}
                    avatarUrl={userChat.avatar_url}
                    size={40}
                    className="mt-0.5 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate text-gray-800">{userChat.name}</p>
                        <p className="text-xs text-gray-400 truncate">{userChat.email}</p>
                        {userChat.last_message_time ? (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {formatChatListTime(userChat.last_message_time)}
                          </p>
                        ) : userChat.id !== -1 ? (
                          <p className="text-[11px] text-gray-400 mt-0.5 italic">Нет сообщений</p>
                        ) : null}
                      </div>
                      {userChat.unread_count > 0 && (
                        <Badge className="ml-1 bg-red-500 hover:bg-red-600 shrink-0 text-xs h-5 min-w-[20px] px-1.5">
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
    </div>
  );
}
