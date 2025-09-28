import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface AudioPlayerProps {
  audioData: string;
  className?: string;
}

export default function AudioPlayer({ audioData, className = '' }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Создаем blob URL для лучшей совместимости с мобильными устройствами
    try {
      const binaryData = atob(audioData);
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }
      
      // Пробуем разные MIME типы для лучшей совместимости
      const mimeTypes = ['audio/webm', 'audio/webm;codecs=opus', 'audio/ogg', 'audio/mp4', 'audio/wav'];
      let createdUrl: string | null = null;
      
      for (const mimeType of mimeTypes) {
        const blob = new Blob([bytes], { type: mimeType });
        createdUrl = URL.createObjectURL(blob);
        setAudioUrl(createdUrl);
        break;
      }
      
      return () => {
        if (createdUrl) {
          URL.revokeObjectURL(createdUrl);
        }
      };
    } catch (err) {
      setError('Ошибка загрузки аудио');
    }
  }, [audioData]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => setIsPlaying(false);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };
    const handleError = () => {
      setError('Не удается воспроизвести аудио');
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || isLoading) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        // Для iOS необходимо вызывать play() в результате пользовательского действия
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
        }
      }
    } catch (err) {
      setError('Ошибка воспроизведения');
      setIsPlaying(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  if (error) {
    return (
      <div className={`border border-gray-200 bg-gray-50 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-2 text-gray-600">
          <Icon name="AlertCircle" size={16} />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 bg-gray-50 rounded-lg p-2 md:p-3 ${className}`}>
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          preload="metadata"
          playsInline // Важно для iOS
          controls={false} // Скрываем нативные контролы
        />
      )}
      
      <div className="flex items-center gap-2 md:gap-3">
        <Button
          onClick={togglePlay}
          size="sm"
          disabled={isLoading || !audioUrl}
          className="bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-full w-8 h-8 md:w-10 md:h-10 p-0 shadow-sm flex-shrink-0"
        >
          {isLoading ? (
            <Icon name="Loader2" size={14} className="animate-spin md:w-4 md:h-4" />
          ) : isPlaying ? (
            <Icon name="Pause" size={14} className="md:w-4 md:h-4" />
          ) : (
            <Icon name="Play" size={14} className="md:w-4 md:h-4" />
          )}
        </Button>

        <div className="flex-1 flex items-center gap-1 md:gap-2 min-w-0">
          <span className="text-gray-700 text-xs font-medium flex-shrink-0 w-8 md:w-9">
            {formatTime(currentTime)}
          </span>
          
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            disabled={!duration}
            className="flex-1 h-2 md:h-1.5 bg-gray-200 rounded-lg cursor-pointer touch-manipulation"
            style={{
              background: duration > 0 
                ? `linear-gradient(to right, #000000 0%, #000000 ${(currentTime / duration) * 100}%, #d1d5db ${(currentTime / duration) * 100}%, #d1d5db 100%)`
                : '#d1d5db',
              WebkitAppearance: 'none',
              MozAppearance: 'none'
            }}
          />
          
          <span className="text-gray-700 text-xs font-medium flex-shrink-0 w-8 md:w-9">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Icon name="Volume2" size={12} className="text-gray-600 md:w-[14px] md:h-[14px]" />
        </div>
      </div>
    </div>
  );
}