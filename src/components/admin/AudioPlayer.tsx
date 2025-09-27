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
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
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

  const audioUrl = `data:audio/webm;base64,${audioData}`;

  return (
    <div className={`border border-blue-200 bg-blue-50 rounded-lg p-3 ${className}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="flex items-center gap-3">
        <Button
          onClick={togglePlay}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-10 h-10 p-0 shadow-sm"
        >
          {isPlaying ? (
            <Icon name="Pause" size={16} />
          ) : (
            <Icon name="Play" size={16} />
          )}
        </Button>

        <div className="flex-1 flex items-center gap-2">
          <span className="text-blue-700 text-xs min-w-[35px] font-medium">
            {formatTime(currentTime)}
          </span>
          
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #2563eb 0%, #2563eb ${(currentTime / duration) * 100}%, #bfdbfe ${(currentTime / duration) * 100}%, #bfdbfe 100%)`
            }}
          />
          
          <span className="text-blue-700 text-xs min-w-[35px] font-medium">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Icon name="Volume2" size={14} className="text-blue-600" />
        </div>
      </div>
    </div>
  );
}