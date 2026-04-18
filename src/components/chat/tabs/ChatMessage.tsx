import { useState, useRef, useEffect } from 'react';
import { formatMoscowTime } from '@/utils/timeFormat';
import AnimatedMessage from '../AnimatedMessage';
import Icon from '@/components/ui/icon';

const CHAT_URL = 'https://functions.poehali.dev/cad0f9c1-a7f9-476f-b300-29e671bbaa2c';

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
  onDeleted?: (msgId: number) => void;
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

  // Update progress bar and time directly via DOM — no re-renders, buttery smooth
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

      {/* Play/pause button */}
      <button
        onClick={toggle}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          isOwn
            ? 'bg-white/20 hover:bg-white/30 text-white'
            : 'bg-[#001f54] hover:bg-[#001f54]/80 text-white'
        }`}
      >
        <Icon name={playing ? 'Pause' : 'Play'} size={16} />
      </button>

      <div className="flex flex-col gap-1 flex-1 min-w-0">
        {/* Progress bar */}
        <div
          className={`relative h-2 rounded-full cursor-pointer overflow-hidden ${
            isOwn ? 'bg-white/20' : 'bg-gray-200'
          }`}
          onClick={seek}
        >
          <div
            ref={progressRef}
            className={`absolute left-0 top-0 h-full rounded-full ${
              isOwn ? 'bg-white/80' : 'bg-[#001f54]'
            }`}
            style={{ width: '0%' }}
          />
        </div>

        {/* Audio time + sent time inline */}
        <div className="flex items-center justify-between gap-2">
          <span ref={timeRef} className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
            {fmt(duration)}
          </span>
          <span className={`text-[10px] flex items-center gap-0.5 ${isOwn ? 'text-white/40' : 'text-gray-400'}`}>
            {sentAt}
            {isOwn && (
              <span className={isRead ? 'text-blue-300' : ''}>
                {isRead ? ' ✓✓' : ' ✓'}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ChatMessage({ msg, currentUserId, isGroup, onDeleted }: ChatMessageProps) {
  const isOwn = msg.user_id === currentUserId;
  const senderName = msg.is_from_admin ? 'Администратор' : (msg.user_name || 'Промоутер');
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

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

  const openMenu = (clientX: number, clientY: number) => {
    setMenu({ x: clientX, y: clientY });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    longPressRef.current = setTimeout(() => {
      if (touchStartPos.current) {
        openMenu(touch.clientX, touch.clientY);
      }
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current || !longPressRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);
    if (dx > 8 || dy > 8) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    touchStartPos.current = null;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openMenu(e.clientX, e.clientY);
  };

  const deleteMsg = async (scope: 'self' | 'all') => {
    setMenu(null);
    setDeleting(true);
    try {
      await fetch(`${CHAT_URL}?message_id=${msg.id}&scope=${scope}`, {
        method: 'DELETE',
        headers: { 'X-User-Id': String(currentUserId) },
      });
      onDeleted?.(msg.id);
    } finally {
      setDeleting(false);
    }
  };

  if (deleting) return null;

  return (
    <div className={`flex items-end gap-2 mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>

      {/* Avatar for incoming */}
      {!isOwn && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#001f54] to-[#003a8c] flex items-center justify-center flex-shrink-0 mb-0.5 shadow-sm">
          <span className="text-[10px] font-bold text-white">
            {msg.is_from_admin ? 'А' : (msg.user_name?.[0]?.toUpperCase() || 'П')}
          </span>
        </div>
      )}

      <div className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>

        {/* Sender name in group */}
        {isGroup && !isOwn && (
          <span className="text-[11px] font-semibold text-[#001f54]/70 mb-1 px-1">
            {senderName}
          </span>
        )}

        <div
          ref={bubbleRef}
          className={`relative px-3 py-2.5 select-none ${
            isOwn
              ? 'bg-[#001f54] text-white rounded-2xl rounded-br-sm shadow-sm'
              : 'bg-[#e8edf5] text-gray-900 rounded-2xl rounded-bl-sm'
          }`}
          onContextMenu={handleContextMenu}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          {/* Audio */}
          {msg.media_url && msg.media_type === 'audio' && (
            <AudioPlayer src={msg.media_url} isOwn={isOwn} sentAt={formatMoscowTime(msg.created_at)} isRead={msg.is_read} />
          )}

          {/* Image */}
          {msg.media_url && msg.media_type === 'image' && (
            <div className={msg.message ? 'mb-2' : ''}>
              <img
                src={msg.media_url}
                alt="Изображение"
                className="max-w-full rounded-xl max-h-52 object-cover"
              />
            </div>
          )}

          {/* Video */}
          {msg.media_url && msg.media_type === 'video' && (
            <div className={msg.message ? 'mb-2' : ''}>
              <video src={msg.media_url} controls className="max-w-full rounded-xl max-h-52" />
            </div>
          )}

          {/* Text + time inline */}
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

          {/* Time for media-only messages (not audio — it has its own time) */}
          {!msg.message && msg.media_type !== 'audio' && (
            <div className={`flex items-center gap-1 mt-1 justify-end`}>
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
          {isOwn && (
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
    </div>
  );
}