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
  const [showNativeControls, setShowNativeControls] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    try {
      // Для iOS используем data URL, так как Safari имеет проблемы с blob URL для аудио
      if (isIOS() || isSafari()) {
        // Показываем нативные контролы для iOS
        setShowNativeControls(true);
        // Создаем data URL - более совместимо с iOS
        const dataUrl = `data:audio/webm;base64,${audioData}`;
        setAudioUrl(dataUrl);
      } else {
        // Для других браузеров используем blob URL (более эффективно)
        const binaryData = atob(audioData);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { type: 'audio/webm' });
        const blobUrl = URL.createObjectURL(blob);
        setAudioUrl(blobUrl);
        
        return () => {
          URL.revokeObjectURL(blobUrl);
        };
      }
    } catch (err) {
      console.error('Error creating audio URL:', err);
      setError('Ошибка загрузки аудио');
    }
  }, [audioData]);

  // Функция для скачивания аудио
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



  if (error) {
    return (
      <div className={`border border-gray-200 bg-gray-50 rounded-lg p-2 md:p-3 ${className}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-gray-600 flex-1">
            <Icon name="AlertCircle" size={16} />
            <span className="text-xs md:text-sm">Не удается воспроизвести аудио</span>
          </div>
          <Button
            onClick={downloadAudio}
            size="sm"
            className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 h-7 flex-shrink-0"
          >
            <Icon name="Download" size={12} className="mr-1" />
            <span className="text-xs">Скачать</span>
          </Button>
        </div>
      </div>
    );
  }

  // Для iOS показываем нативные HTML5 контролы - самый надежный способ
  if (showNativeControls && audioUrl) {
    return (
      <div className={`border border-gray-200 bg-gray-50 rounded-lg p-2 md:p-3 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <audio 
              ref={audioRef}
              src={audioUrl}
              controls
              preload="metadata"
              playsInline
              className="w-full h-8 md:h-10"
              style={{
                background: 'transparent',
                borderRadius: '4px'
              }}
            />
          </div>
          <Button
            onClick={downloadAudio}
            size="sm"
            className="bg-gray-600 hover:bg-gray-700 text-white w-8 h-8 p-0 rounded flex-shrink-0"
            title="Скачать аудио"
          >
            <Icon name="Download" size={12} />
          </Button>
        </div>
      </div>
    );
  }

  // Для других браузеров показываем кастомный плеер (пока убираем из-за сложности)
  return (
    <div className={`border border-gray-200 bg-gray-50 rounded-lg p-2 md:p-3 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          {audioUrl && (
            <audio 
              ref={audioRef}
              src={audioUrl}
              controls
              preload="metadata"
              className="w-full h-8 md:h-10"
              style={{
                background: 'transparent',
                borderRadius: '4px'
              }}
            />
          )}
        </div>
        <Button
          onClick={downloadAudio}
          size="sm"
          className="bg-gray-600 hover:bg-gray-700 text-white w-8 h-8 p-0 rounded flex-shrink-0"
          title="Скачать аудио"
        >
          <Icon name="Download" size={12} />
        </Button>
      </div>
    </div>
  );
}