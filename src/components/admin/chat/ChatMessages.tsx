import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { formatMoscowTime } from '@/utils/timeFormat';
import { Message, UserChat } from './types';
import AnimatedMessage from '../../../components/chat/AnimatedMessage';
import { useRef, useState, useEffect } from 'react';

const CHAT_URL = 'https://functions.poehali.dev/cad0f9c1-a7f9-476f-b300-29e671bbaa2c';

interface ChatMessagesProps {
  messages: Message[];
  selectedUser: UserChat;
  isLoading: boolean;
  userTyping: boolean;
  scrollRef: React.RefObject<HTMLDivElement>;
  currentAdminId?: number;
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

  return moscow.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: moscow.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function getMoscowDayKey(dateStr: string): string {
  const date = new Date(dateStr);
  const moscow = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  return `${moscow.getFullYear()}-${moscow.getMonth()}-${moscow.getDate()}`;
}

function AudioPlayer({ src, isOwn, sentAt, isRead }: { src: string; isOwn: boolean; sentAt: string; isRead: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number>(0);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  const fmt = (s: number) => {
    if (!isFinite(s) || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  const tick = () => {
    const a = audioRef.current;
    if (!a) return;
    const pct = a.duration > 0 ? (a.currentTime / a.duration) * 100 : 0;
    if (progressRef.current) progressRef.current.style.width = `${pct}%`;
    if (timeRef.current) timeRef.current.textContent = fmt(a.currentTime);
    rafRef.current = requestAnimationFrame(tick);
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { a.play(); } else { a.pause(); }
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => { setPlaying(true); rafRef.current = requestAnimationFrame(tick); };
    const onPause = () => { setPlaying(false); cancelAnimationFrame(rafRef.current); };
    const onEnded = () => {
      setPlaying(false);
      cancelAnimationFrame(rafRef.current);
      if (progressRef.current) progressRef.current.style.width = '0%';
      if (timeRef.current) timeRef.current.textContent = fmt(a.duration);
    };
    const onMeta = () => setDuration(a.duration || 0);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onEnded);
    a.addEventListener('loadedmetadata', onMeta);
    return () => {
      cancelAnimationFrame(rafRef.current);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('loadedmetadata', onMeta);
    };
  }, []);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * a.duration;
  };

  return (
    <div className="flex items-center gap-2.5 min-w-[180px]">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        onClick={toggle}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          isOwn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-[#001f54] hover:bg-[#001f54]/80 text-white'
        }`}
      >
        <Icon name={playing ? 'Pause' : 'Play'} size={16} />
      </button>
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div
          className={`relative h-2 rounded-full cursor-pointer overflow-hidden ${isOwn ? 'bg-white/20' : 'bg-gray-200'}`}
          onClick={seek}
        >
          <div
            ref={progressRef}
            className={`absolute left-0 top-0 h-full rounded-full ${isOwn ? 'bg-white/80' : 'bg-[#001f54]'}`}
            style={{ width: '0%' }}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span ref={timeRef} className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
            {fmt(duration)}
          </span>
          <span className={`text-[10px] flex items-center gap-0.5 ${isOwn ? 'text-white/40' : 'text-gray-400'}`}>
            {sentAt}
            {isOwn && (
              <span className={isRead ? 'text-blue-300' : ''}>{isRead ? ' ✓✓' : ' ✓'}</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ChatMessages({ messages, selectedUser, isLoading, userTyping, scrollRef, currentAdminId, onMessageDeleted }: ChatMessagesProps) {
  const [menu, setMenu] = useState<{ x: number; y: number; msgId: number; isOwn: boolean } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [menu]);

  const openMenu = (clientX: number, clientY: number, msgId: number, isOwn: boolean) => {
    setMenu({ x: clientX, y: clientY, msgId, isOwn });
  };

  const makeTouchHandlers = (msgId: number, isOwn: boolean) => ({
    onTouchStart: (e: React.TouchEvent) => {
      const touch = e.touches[0];
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
      longPressRef.current = setTimeout(() => {
        if (touchStartPos.current) openMenu(touch.clientX, touch.clientY, msgId, isOwn);
      }, 500);
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (!touchStartPos.current || !longPressRef.current) return;
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartPos.current.x);
      const dy = Math.abs(touch.clientY - touchStartPos.current.y);
      if (dx > 8 || dy > 8) { clearTimeout(longPressRef.current); longPressRef.current = null; }
    },
    onTouchEnd: () => {
      if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
      touchStartPos.current = null;
    },
    onTouchCancel: () => {
      if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
      touchStartPos.current = null;
    },
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      openMenu(e.clientX, e.clientY, msgId, isOwn);
    },
  });

  const deleteMsg = async (scope: 'self' | 'all') => {
    if (!menu || !currentAdminId) return;
    const { msgId } = menu;
    setMenu(null);
    await fetch(`${CHAT_URL}?message_id=${msgId}&scope=${scope}`, {
      method: 'DELETE',
      headers: { 'X-User-Id': String(currentAdminId) },
    });
    onMessageDeleted?.(msgId);
  };

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
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-0.5">
        {messages.map((msg) => {
          const isOwn = msg.is_from_admin;
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

              <div className={`flex items-end gap-2 mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                {!isOwn && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#001f54] to-[#003a8c] flex items-center justify-center flex-shrink-0 mb-0.5 shadow-sm">
                    {selectedUser.id === -1 && msg.user_avatar ? (
                      <img src={msg.user_avatar} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-white">
                        {selectedUser.id === -1 ? (msg.user_name?.[0]?.toUpperCase() || 'П') : 'П'}
                      </span>
                    )}
                  </div>
                )}

                <div className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                  {selectedUser.id === -1 && !isOwn && (
                    <span className="text-[11px] font-semibold text-[#001f54]/70 mb-1 px-1">
                      {msg.user_name || selectedUser.name}
                    </span>
                  )}

                  <div
                    className={`relative px-3 py-2.5 select-none ${
                      isOwn
                        ? 'bg-[#001f54] text-white rounded-2xl rounded-br-sm shadow-sm'
                        : 'bg-[#e8edf5] text-gray-900 rounded-2xl rounded-bl-sm'
                    }`}
                    {...makeTouchHandlers(msg.id, isOwn)}
                  >
                    {msg.media_url && msg.media_type === 'audio' && (
                      <AudioPlayer src={msg.media_url} isOwn={isOwn} sentAt={formatMoscowTime(msg.created_at)} isRead={msg.is_read} />
                    )}

                    {msg.media_url && msg.media_type === 'image' && (
                      <div className={msg.message ? 'mb-2' : ''}>
                        <img
                          src={msg.media_url}
                          alt="Изображение"
                          className="max-w-full rounded-xl max-h-52 object-cover cursor-pointer"
                          onClick={() => window.open(msg.media_url!, '_blank')}
                        />
                      </div>
                    )}

                    {msg.media_url && msg.media_type === 'video' && (
                      <div className={msg.message ? 'mb-2' : ''}>
                        <video src={msg.media_url} controls className="max-w-full rounded-xl max-h-52" />
                      </div>
                    )}

                    {msg.message && (
                      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        <AnimatedMessage text={msg.message} />
                        <span className="inline-flex items-center gap-0.5 ml-1.5 align-bottom translate-y-[1px]">
                          <span className={`text-[10px] ${isOwn ? 'text-white/40' : 'text-gray-400'}`}>
                            {formatMoscowTime(msg.created_at)}
                          </span>
                          {isOwn && (
                            <span className={`text-[10px] leading-none ${msg.is_read ? 'text-blue-300' : 'text-white/40'}`}>
                              {msg.is_read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {!msg.message && msg.media_type !== 'audio' && (
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        <span className={`text-[10px] ${isOwn ? 'text-white/40' : 'text-gray-400'}`}>
                          {formatMoscowTime(msg.created_at)}
                        </span>
                        {isOwn && (
                          <span className={`text-[10px] leading-none ${msg.is_read ? 'text-blue-300' : 'text-white/40'}`}>
                            {msg.is_read ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {isOwn && <div className="w-7 flex-shrink-0" />}
              </div>
            </div>
          );
        })}

        {userTyping && (
          <div className="flex items-end gap-2 mb-1 justify-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#001f54] to-[#003a8c] flex items-center justify-center flex-shrink-0 mb-0.5 shadow-sm">
              <span className="text-[10px] font-bold text-white">П</span>
            </div>
            <div className="bg-[#e8edf5] rounded-2xl rounded-bl-sm px-3 py-2.5">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Context menu */}
      {menu && (
        <div
          ref={menuRef}
          className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden min-w-[190px]"
          style={{
            left: Math.min(Math.max(menu.x - 95, 8), window.innerWidth - 206),
            top: menu.y + 120 > window.innerHeight ? menu.y - 110 : menu.y + 8,
          }}
        >
          <button
            onClick={() => deleteMsg('self')}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            <Icon name="EyeOff" size={16} className="text-gray-400" />
            Удалить у себя
          </button>
          {menu.isOwn && (
            <button
              onClick={() => deleteMsg('all')}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors text-left border-t border-gray-100"
            >
              <Icon name="Trash2" size={16} className="text-red-400" />
              Удалить у всех
            </button>
          )}
        </div>
      )}
    </ScrollArea>
  );
}