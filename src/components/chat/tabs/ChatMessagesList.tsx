import Icon from '@/components/ui/icon';
import ChatMessage from './ChatMessage';

interface Message {
  id: number;
  user_id: number;
  message: string;
  media_type?: 'audio' | 'image' | 'video' | null;
  media_url?: string | null;
  is_from_admin: boolean;
  is_read: boolean;
  created_at: string;
  user_name?: string;
}

interface ChatMessagesListProps {
  messages: Message[];
  scrollRef: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
  isGroup: boolean;
  currentUserId?: number;
  onMessageDeleted?: (msgId: number) => void;
}

function getMoscowDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const moscow = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));

  const isToday =
    moscow.getDate() === now.getDate() &&
    moscow.getMonth() === now.getMonth() &&
    moscow.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    moscow.getDate() === yesterday.getDate() &&
    moscow.getMonth() === yesterday.getMonth() &&
    moscow.getFullYear() === yesterday.getFullYear();

  if (isToday) return 'Сегодня';
  if (isYesterday) return 'Вчера';

  return moscow.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: moscow.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function getMoscowDayKey(dateStr: string): string {
  const date = new Date(dateStr);
  const moscow = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  return `${moscow.getFullYear()}-${moscow.getMonth()}-${moscow.getDate()}`;
}

export default function ChatMessagesList({
  messages,
  scrollRef,
  isLoading,
  isGroup,
  currentUserId,
  onMessageDeleted,
}: ChatMessagesListProps) {
  if (isLoading && messages.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <Icon name="Loader2" className="animate-spin" size={24} />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Icon name="MessageCircle" size={32} className="opacity-20 mb-2" />
        <span className="text-sm">Сообщений пока нет</span>
      </div>
    );
  }

  let lastDayKey = '';

  return (
    <>
      {messages.map((msg) => {
        const dayKey = getMoscowDayKey(msg.created_at);
        const showDateSep = dayKey !== lastDayKey;
        lastDayKey = dayKey;

        return (
          <div key={msg.id}>
            {showDateSep && (
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[11px] text-gray-400 font-medium px-2 bg-white rounded-full border border-gray-100 py-0.5">
                  {getMoscowDateLabel(msg.created_at)}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
            )}
            <ChatMessage
              msg={msg}
              currentUserId={currentUserId}
              isGroup={isGroup}
              onDeleted={onMessageDeleted}
            />
          </div>
        );
      })}
      <div ref={scrollRef} />
    </>
  );
}