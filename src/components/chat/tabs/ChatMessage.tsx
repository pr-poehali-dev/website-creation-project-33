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
  const isOwn = msg.user_id === currentUserId;
  const senderName = msg.is_from_admin ? 'Администратор' : (msg.user_name || 'Промоутер');

  return (
    <div className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>

      {/* Avatar for incoming */}
      {!isOwn && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#001f54] to-[#003a8c] flex items-center justify-center flex-shrink-0 mb-0.5">
          <span className="text-[10px] font-bold text-white">
            {msg.is_from_admin ? 'А' : (msg.user_name?.[0]?.toUpperCase() || 'П')}
          </span>
        </div>
      )}

      <div className={`flex flex-col max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}>

        {/* Sender name in group */}
        {isGroup && !isOwn && (
          <span className="text-[11px] font-semibold text-[#001f54]/70 mb-1 px-1">
            {senderName}
          </span>
        )}

        <div
          className={`relative px-3.5 py-2.5 shadow-sm ${
            isOwn
              ? 'bg-[#001f54] text-white rounded-2xl rounded-br-sm'
              : 'bg-white text-gray-900 rounded-2xl rounded-bl-sm border border-gray-100'
          }`}
        >
          {/* Media */}
          {msg.media_url && (
            <div className="mb-2">
              {msg.media_type === 'image' && (
                <img
                  src={msg.media_url}
                  alt="Изображение"
                  className="max-w-full rounded-xl max-h-48 object-cover"
                />
              )}
              {msg.media_type === 'video' && (
                <video src={msg.media_url} controls className="max-w-full rounded-xl max-h-48" />
              )}
              {msg.media_type === 'audio' && (
                <audio src={msg.media_url} controls className="w-full min-w-[180px]" />
              )}
            </div>
          )}

          {/* Text */}
          {msg.message && (
            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              <AnimatedMessage text={msg.message} />
            </div>
          )}

          {/* Time + read status */}
          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-[10px] ${isOwn ? 'text-white/50' : 'text-gray-400'}`}>
              {formatMoscowTime(msg.created_at)}
            </span>
            {isOwn && (
              <span className={`text-[10px] ${msg.is_read ? 'text-blue-300' : 'text-white/40'}`}>
                {msg.is_read ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Spacer for own messages avatar alignment */}
      {isOwn && <div className="w-7 flex-shrink-0" />}
    </div>
  );
}
