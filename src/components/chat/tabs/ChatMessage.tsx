import { formatMoscowTime } from '@/utils/timeFormat';
import AnimatedMessage from '../AnimatedMessage';

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

interface ChatMessageProps {
  msg: Message;
  currentUserId?: number;
  isGroup: boolean;
}

export default function ChatMessage({ msg, currentUserId, isGroup }: ChatMessageProps) {
  const isOwnMessage = msg.user_id === currentUserId;

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg p-3`}>
        {isGroup && !isOwnMessage && (
          <div className="text-xs font-semibold mb-1 opacity-70">
            {msg.is_from_admin ? 'Администратор' : msg.user_name}
          </div>
        )}
        
        {msg.media_url && (
          <div className="mb-2">
            {msg.media_type === 'image' && (
              <img src={msg.media_url} alt="Image" className="max-w-full rounded" />
            )}
            {msg.media_type === 'video' && (
              <video src={msg.media_url} controls className="max-w-full rounded" />
            )}
            {msg.media_type === 'audio' && (
              <audio src={msg.media_url} controls className="w-full" />
            )}
          </div>
        )}
        
        {msg.message && (
          <div className="whitespace-pre-wrap break-words">
            <AnimatedMessage text={msg.message} />
          </div>
        )}
        
        <div className={`flex items-center gap-2 text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
          <span>{formatMoscowTime(msg.created_at)}</span>
          {isOwnMessage && (
            <span className={`relative inline-flex items-center ${
              msg.is_read ? 'opacity-70' : 'opacity-50'
            }`}>
              {msg.is_read ? (
                <>
                  <span className="relative">✓</span>
                  <span className="absolute left-[3px]">✓</span>
                </>
              ) : (
                '✓'
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
