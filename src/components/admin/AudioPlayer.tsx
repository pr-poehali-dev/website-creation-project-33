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

// Определяем формат аудио по первым байтам (magic numbers)
const detectAudioFormat = (base64Data: string) => {
  try {
    const binaryString = atob(base64Data.substring(0, 100)); // Читаем первые байты
    const bytes = [];
    for (let i = 0; i < Math.min(20, binaryString.length); i++) {
      bytes.push(binaryString.charCodeAt(i));
    }

    // WebM: начинается с 0x1A 0x45 0xDF 0xA3
    if (bytes.length >= 4 && bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) {
      return 'audio/webm';
    }
    
    // MP4/M4A: содержит 'ftyp' на позиции 4-7
    if (bytes.length >= 8 && 
        bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
      return 'audio/mp4';
    }
    
    // MP3: начинается с 'ID3' или 0xFF (синхронизация)
    if ((bytes.length >= 3 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
        (bytes.length >= 1 && bytes[0] === 0xFF)) {
      return 'audio/mpeg';
    }
    
    // WAV: начинается с 'RIFF'
    if (bytes.length >= 4 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
      return 'audio/wav';
    }
    
    // OGG: начинается с 'OggS'
    if (bytes.length >= 4 && bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
      return 'audio/ogg';
    }
    
    // По умолчанию - WebM (большинство записей с десктопа)
    return 'audio/webm';
  } catch (err) {
    console.error('Error detecting audio format:', err);
    return 'audio/webm';
  }
};

export default function AudioPlayer({ audioData, className = '' }: AudioPlayerProps) {
  const [showNativeControls, setShowNativeControls] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    try {
      // Определяем формат аудио по magic numbers
      const audioFormat = detectAudioFormat(audioData);
      console.log('Detected audio format:', audioFormat);
      
      // Всегда показываем нативные контролы - самый совместимый способ
      setShowNativeControls(true);
      
      if (isIOS() || isSafari()) {
        // Для iOS/Safari используем data URL с правильным MIME типом
        const dataUrl = `data:${audioFormat};base64,${audioData}`;
        setAudioUrl(dataUrl);
      } else {
        // Для других браузеров используем blob URL с определенным форматом
        const binaryData = atob(audioData);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { type: audioFormat });
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
      const audioFormat = detectAudioFormat(audioData);
      const binaryData = atob(audioData);
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }
      
      // Определяем расширение файла по формату
      const extensions: Record<string, string> = {
        'audio/webm': '.webm',
        'audio/mp4': '.m4a',
        'audio/mpeg': '.mp3',
        'audio/wav': '.wav',
        'audio/ogg': '.ogg'
      };
      
      const extension = extensions[audioFormat] || '.webm';
      
      const blob = new Blob([bytes], { type: audioFormat });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audio_${Date.now()}${extension}`;
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

  // Показываем нативные HTML5 контролы - универсальный подход
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
              playsInline
              className="w-full h-8 md:h-10"
              style={{
                background: 'transparent',
                borderRadius: '4px'
              }}
              onError={(e) => {
                console.error('Audio playback error:', e);
                setError('Не удается воспроизвести аудио');
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