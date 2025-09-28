import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface AudioPlayerProps {
  audioData: string;
  className?: string;
}

// Определяем iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Определяем Safari
const isSafari = () => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

export default function AudioPlayer({ audioData, className = '' }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [canPlay, setCanPlay] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let createdUrl: string | null = null;
    
    const createAudioUrl = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const binaryData = atob(audioData);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        
        // Для iOS/Safari используем более совместимые форматы
        let mimeTypes: string[];
        if (isIOS() || isSafari()) {
          // На iOS Safari лучше всего работает с AAC/MP4
          mimeTypes = ['audio/mp4', 'audio/aac', 'audio/mpeg', 'audio/wav', 'audio/webm'];
        } else {
          mimeTypes = ['audio/webm', 'audio/webm;codecs=opus', 'audio/ogg', 'audio/mp4', 'audio/wav'];
        }
        
        // Создаем blob с первым поддерживаемым типом
        const blob = new Blob([bytes], { type: mimeTypes[0] });
        createdUrl = URL.createObjectURL(blob);
        setAudioUrl(createdUrl);
        
      } catch (err) {
        console.error('Error creating audio URL:', err);
        setError('Ошибка загрузки аудио');
        setIsLoading(false);
      }
    };
    
    createAudioUrl();
    
    return () => {
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [audioData]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    
    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    
    const handleLoadStart = () => {
      setIsLoading(true);
      setCanPlay(false);
    };
    
    const handleCanPlay = () => {
      setIsLoading(false);
      setCanPlay(true);
      setError(null);
      
      // Для iOS нужно дождаться полной загрузки
      if (isIOS() && audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    
    const handleLoadedData = () => {
      setIsLoading(false);
      setCanPlay(true);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    
    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setError('Формат аудио не поддерживается');
      setIsLoading(false);
      setIsPlaying(false);
      setCanPlay(false);
    };

    const handleProgress = () => {
      // Помогает с загрузкой на iOS
      if (audio.buffered.length > 0) {
        setCanPlay(true);
      }
    };

    // Добавляем все необходимые слушатели
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('progress', handleProgress);

    // Принудительно загружаем аудио
    audio.load();

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('progress', handleProgress);
    };
  }, [audioUrl]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !canPlay) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        // Для iOS Safari нужна особая обработка
        if (isIOS()) {
          // Сначала загружаем аудио
          if (audio.readyState < 2) {
            audio.load();
            // Ждем загрузки
            await new Promise((resolve) => {
              const onCanPlay = () => {
                audio.removeEventListener('canplay', onCanPlay);
                resolve(void 0);
              };
              audio.addEventListener('canplay', onCanPlay);
            });
          }
        }
        
        // Воспроизводим
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
        } else {
          setIsPlaying(true);
        }
      }
    } catch (err) {
      console.error('Play error:', err);
      setError('Не удается воспроизвести аудио');
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
    if (!audio || !canPlay) return;

    const newTime = parseFloat(e.target.value);
    try {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    } catch (err) {
      console.error('Seek error:', err);
    }
  };

  // Функция для скачивания аудио как fallback для iOS
  const downloadAudio = () => {
    try {
      const binaryData = atob(audioData);
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audio_${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Если ошибка и это iOS, показываем кнопку скачивания
  if (error) {
    return (
      <div className={`border border-gray-200 bg-gray-50 rounded-lg p-2 md:p-3 ${className}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-gray-600 flex-1">
            <Icon name="AlertCircle" size={16} />
            <span className="text-xs md:text-sm">{error}</span>
          </div>
          {(isIOS() || isSafari()) && (
            <Button
              onClick={downloadAudio}
              size="sm"
              className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 h-7 flex-shrink-0"
            >
              <Icon name="Download" size={12} className="mr-1" />
              <span className="text-xs">Скачать</span>
            </Button>
          )}
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
          preload="auto"
          playsInline
          controls={false}
          crossOrigin="anonymous"
        />
      )}
      
      <div className="flex items-center gap-2 md:gap-3">
        <Button
          onClick={togglePlay}
          size="sm"
          disabled={isLoading || !canPlay}
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
            disabled={!canPlay || !duration}
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
          {(isIOS() || isSafari()) && (
            <Button
              onClick={downloadAudio}
              size="sm"
              className="bg-gray-600 hover:bg-gray-700 text-white w-6 h-6 md:w-7 md:h-7 p-0 rounded"
              title="Скачать аудио"
            >
              <Icon name="Download" size={10} className="md:w-3 md:h-3" />
            </Button>
          )}
          <Icon name="Volume2" size={12} className="text-gray-600 md:w-[14px] md:h-[14px]" />
        </div>
      </div>
    </div>
  );
}