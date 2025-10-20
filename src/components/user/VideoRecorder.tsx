import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface VideoRecorderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (contactsCount?: number) => void;
  type: 'start' | 'end';
  organizationId: number;
}

export default function VideoRecorder({ open, onOpenChange, onSuccess, type, organizationId }: VideoRecorderProps) {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [recordedMimeType, setRecordedMimeType] = useState<string>('video/mp4');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      streamRef.current = stream;
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast({
        title: 'Ошибка',
        description: 'Не удалось получить доступ к камере',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    const mimeTypes = [
      'video/mp4',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    
    let selectedMimeType = '';
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        break;
      }
    }

    if (!selectedMimeType) {
      toast({
        title: 'Ошибка',
        description: 'Запись видео не поддерживается на этом устройстве',
        variant: 'destructive',
      });
      return;
    }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: selectedMimeType,
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setRecordedVideo(e.data);
          setRecordedMimeType(e.data.type || selectedMimeType);
          const url = URL.createObjectURL(e.data);
          setVideoUrl(url);
          toast({
            title: 'Готово',
            description: 'Видео записано. Теперь отправьте его.',
          });
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 6) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      toast({
        title: 'Ошибка',
        description: 'Не удалось начать запись',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const sendVideo = async () => {
    if (!recordedVideo) return;
    
    setIsSending(true);

    try {
      const userId = user?.id?.toString();
      if (!userId) {
        throw new Error('Не найден ID пользователя');
      }

      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          const base64data = reader.result as string;
          const base64Video = base64data.split(',')[1];

          const response = await fetch('https://functions.poehali.dev/b2eda591-8c66-4dff-95c4-c345ac48703f', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Id': userId,
            },
            body: JSON.stringify({
              video_data: base64Video,
              video_type: type,
              organization_id: organizationId,
              mime_type: recordedMimeType,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Ошибка отправки' }));
            throw new Error(errorData.error || 'Не удалось отправить видео');
          }

          const resultData = await response.json();

          toast({
            title: 'Успешно',
            description: type === 'start' ? 'Видео начала смены отправлено' : 'Видео окончания смены отправлено',
          });

          setIsSending(false);
          setRecordedVideo(null);
          if (videoUrl) {
            URL.revokeObjectURL(videoUrl);
            setVideoUrl(null);
          }
          
          if (type === 'end' && resultData.contacts_today !== undefined) {
            onSuccess(resultData.contacts_today);
          } else {
            onSuccess();
          }
          
          onOpenChange(false);
        } catch (err) {
          console.error('Error sending video:', err);
          setIsSending(false);
          toast({
            title: 'Ошибка',
            description: err instanceof Error ? err.message : 'Не удалось отправить видео',
            variant: 'destructive',
          });
        }
      };

      reader.onerror = () => {
        setIsSending(false);
        toast({
          title: 'Ошибка',
          description: 'Не удалось прочитать видео',
          variant: 'destructive',
        });
      };

      reader.readAsDataURL(recordedVideo);
    } catch (err) {
      console.error('Error:', err);
      setIsSending(false);
      toast({
        title: 'Ошибка',
        description: err instanceof Error ? err.message : 'Не удалось отправить видео',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    console.log('🎥 VideoRecorder open changed:', open);
    if (open) {
      console.log('🎥 Starting camera...');
      startCamera();
    } else {
      console.log('🎥 Stopping camera...');
      stopCamera();
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
      }
      setRecordedVideo(null);
    }

    return () => {
      stopCamera();
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {type === 'start' ? 'Начало смены' : 'Окончание смены'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Запишите короткое видео (до 6 секунд)
          </p>

          <div className="relative w-72 h-72 mx-auto">
            {/* Instagram-style progress ring */}
            {isRecording && (
              <svg className="absolute inset-0 w-full h-full -rotate-90" style={{ zIndex: 10 }}>
                <circle
                  cx="144"
                  cy="144"
                  r="140"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                />
                <circle
                  cx="144"
                  cy="144"
                  r="140"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 140}`}
                  strokeDashoffset={`${2 * Math.PI * 140 * (1 - recordingTime / 6)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
            )}
            
            {/* Video container with Instagram-style border */}
            <div className={`absolute inset-4 rounded-full overflow-hidden bg-black shadow-2xl ${isRecording ? 'ring-4 ring-white' : ''}`}>
              {!recordedVideo ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-110"
                  />
                  {isRecording && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-sm font-bold">{recordingTime}s</span>
                    </div>
                  )}
                </>
              ) : (
                <video
                  src={videoUrl || undefined}
                  loop
                  autoPlay
                  muted
                  className="w-full h-full object-cover scale-110"
                />
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {!recordedVideo ? (
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isSending}
                className="flex-1"
                variant={isRecording ? 'destructive' : 'default'}
              >
                {isRecording ? (
                  <>
                    <Icon name="X" className="mr-2 h-4 w-4" />
                    Остановить
                  </>
                ) : (
                  <>
                    <Icon name="Camera" className="mr-2 h-4 w-4" />
                    Начать запись
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => {
                    setRecordedVideo(null);
                    if (videoUrl) {
                      URL.revokeObjectURL(videoUrl);
                      setVideoUrl(null);
                    }
                    startCamera();
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={isSending}
                >
                  <Icon name="Video" className="mr-2 h-4 w-4" />
                  Записать заново
                </Button>
                <Button
                  onClick={sendVideo}
                  className="flex-1"
                  disabled={isSending}
                >
                  {isSending ? (
                    'Отправка...'
                  ) : (
                    <>
                      <Icon name="Send" className="mr-2 h-4 w-4" />
                      Отправить
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}