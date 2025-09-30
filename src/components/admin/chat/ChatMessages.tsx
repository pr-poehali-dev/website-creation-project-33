import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { formatMoscowTime } from '@/utils/timeFormat';
import { Message, UserChat } from './types';

interface ChatMessagesProps {
  messages: Message[];
  selectedUser: UserChat;
  isLoading: boolean;
  scrollRef: React.RefObject<HTMLDivElement>;
}

export default function ChatMessages({ messages, selectedUser, isLoading, scrollRef }: ChatMessagesProps) {
  return (
    <ScrollArea className="flex-1 p-4 md:p-6">
      {isLoading && messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <Icon name="Loader2" size={24} className="animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p className="text-sm">Нет сообщений</p>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.is_from_admin ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] md:max-w-[80%] rounded-lg px-3 py-2 md:px-4 md:py-2 ${
                  msg.is_from_admin
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {!msg.is_from_admin && (
                  <p className="text-xs font-semibold mb-1 text-blue-600">
                    {selectedUser.name}
                  </p>
                )}
                {msg.media_type === 'audio' && msg.media_url && (
                  <audio controls className="max-w-full mb-2" preload="metadata">
                    <source src={msg.media_url} type="audio/mp4" />
                    <source src={msg.media_url} type="audio/webm" />
                    <source src={msg.media_url} type="audio/ogg" />
                    Ваш браузер не поддерживает воспроизведение аудио
                  </audio>
                )}
                {msg.media_type === 'image' && msg.media_url && (
                  <img 
                    src={msg.media_url} 
                    alt="Изображение" 
                    className="max-w-full rounded mb-2 cursor-pointer"
                    onClick={() => window.open(msg.media_url, '_blank')}
                  />
                )}
                {msg.media_type === 'video' && msg.media_url && (
                  <video controls className="max-w-full rounded mb-2">
                    <source src={msg.media_url} type="video/mp4" />
                  </video>
                )}
                {msg.message && <p className="text-sm md:text-sm whitespace-pre-wrap break-words">{msg.message}</p>}
                <p
                  className={`text-[10px] md:text-xs mt-1 ${
                    msg.is_from_admin ? 'text-white/70' : 'text-gray-500'
                  }`}
                >
                  {formatMoscowTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      )}
    </ScrollArea>
  );
}