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
}

export default function ChatMessagesList({ 
  messages, 
  scrollRef, 
  isLoading, 
  isGroup,
  currentUserId 
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
      <div className="text-center text-gray-500 py-8">
        Сообщений пока нет
      </div>
    );
  }

  return (
    <>
      {messages.map((msg) => (
        <ChatMessage 
          key={msg.id} 
          msg={msg} 
          currentUserId={currentUserId} 
          isGroup={isGroup} 
        />
      ))}
      <div ref={scrollRef} />
    </>
  );
}
