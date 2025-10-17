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
    if (open) {
      startCamera();
    } else {
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
          <DialogTitle>
            {type === 'start' ? 'Подтверждение начала смены' : 'Подтверждение окончания смены'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Запишите короткое видео (до 6 секунд) для подтверждения
          </p>

          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {!recordedVideo ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {isRecording && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-sm font-medium">{recordingTime}s / 6s</span>
                  </div>
                )}
              </>
            ) : (
              <video
                src={videoUrl || undefined}
                controls
                className="w-full h-full object-cover"
              />
            )}
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