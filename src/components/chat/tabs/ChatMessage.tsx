import { useState, useRef, useEffect } from 'react';
import { formatMoscowTime } from '@/utils/timeFormat';
import AnimatedMessage from '../AnimatedMessage';
import Icon from '@/components/ui/icon';

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

function AudioPlayer({ src, isOwn }: { src: string; isOwn: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); } else { a.play(); }
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => { setPlaying(false); setCurrentTime(0); };
    const onTime = () => setCurrentTime(a.currentTime);
    const onMeta = () => setDuration(a.duration || 0);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onEnded);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    return () => {
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
    };
  }, []);

  const fmt = (s: number) => {
    if (!isFinite(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    a.currentTime = ratio * duration;
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
        {/* Waveform / progress bar */}
        <div
          className={`relative h-2 rounded-full cursor-pointer overflow-hidden ${
            isOwn ? 'bg-white/20' : 'bg-gray-200'
          }`}
          onClick={seek}
        >
          <div
            className={`absolute left-0 top-0 h-full rounded-full transition-all ${
              isOwn ? 'bg-white/80' : 'bg-[#001f54]'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Time */}
        <span className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
          {playing || currentTime > 0 ? fmt(currentTime) : fmt(duration)}
        </span>
      </div>
    </div>
  );
}

export default function ChatMessage({ msg, currentUserId, isGroup }: ChatMessageProps) {
  const isOwn = msg.user_id === currentUserId;
  const senderName = msg.is_from_admin ? 'Администратор' : (msg.user_name || 'Промоутер');

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
          className={`relative shadow-sm ${
            isOwn
              ? 'bg-[#001f54] text-white rounded-2xl rounded-br-sm'
              : 'bg-white text-gray-900 rounded-2xl rounded-bl-sm border border-gray-100'
          } ${msg.media_type === 'audio' ? 'px-3 py-2.5' : 'px-3.5 py-2.5'}`}
        >
          {/* Audio */}
          {msg.media_url && msg.media_type === 'audio' && (
            <AudioPlayer src={msg.media_url} isOwn={isOwn} />
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

          {/* Text */}
          {msg.message && (
            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              <AnimatedMessage text={msg.message} />
            </div>
          )}

          {/* Time + read */}
          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-[10px] ${isOwn ? 'text-white/40' : 'text-gray-400'}`}>
              {formatMoscowTime(msg.created_at)}
            </span>
            {isOwn && (
              <span className={`text-[11px] leading-none ${msg.is_read ? 'text-blue-300' : 'text-white/40'}`}>
                {msg.is_read ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>

      {isOwn && <div className="w-7 flex-shrink-0" />}
    </div>
  );
}
