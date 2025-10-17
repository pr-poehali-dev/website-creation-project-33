import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

interface VideoRecorderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  type: 'start' | 'end';
  organizationId: number;
}

export default function VideoRecorder({ open, onOpenChange, onSuccess, type, organizationId }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [open]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
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
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp8,opus'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      await sendVideo(blob);
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

  const sendVideo = async (videoBlob: Blob) => {
    setIsSending(true);

    try {
      const sessionToken = localStorage.getItem('session_token');
      if (!sessionToken) {
        throw new Error('No session token');
      }

      const reader = new FileReader();
      reader.readAsDataURL(videoBlob);
      
      reader.onloadend = async () => {
        try {
          const base64data = reader.result as string;
          const base64Video = base64data.split(',')[1];

          console.log('Sending video, size:', videoBlob.size, 'bytes');

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000);

          const response = await fetch('https://functions.poehali.dev/dc2bdef3-60dd-4177-a0fd-bb7173e55897', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Session-Token': sessionToken,
            },
            body: JSON.stringify({
              video: base64Video,
              organization_id: organizationId,
              type: type
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to send video');
          }

          toast({
            title: 'Успешно',
            description: type === 'start' ? 'Видео начала смены отправлено' : 'Видео окончания смены отправлено',
          });

          onSuccess();
          onOpenChange(false);
        } catch (err) {
          console.error('Error in reader.onloadend:', err);
          throw err;
        } finally {
          setIsSending(false);
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
    } catch (error) {
      console.error('Error sending video:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить видео',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === 'start' ? 'Подтверждение начала смены' : 'Подтверждение окончания смены'}
          </DialogTitle>
          <DialogDescription>
            Запишите короткое видео (до 6 секунд) для подтверждения
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {isRecording && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-full animate-pulse">
                <div className="w-3 h-3 bg-white rounded-full" />
                <span className="font-bold">{recordingTime}s / 6s</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!isRecording && !isSending && (
              <>
                <Button
                  onClick={startRecording}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  <Icon name="Video" size={18} className="mr-2" />
                  Начать запись
                </Button>
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Отмена
                </Button>
              </>
            )}

            {isRecording && (
              <Button
                onClick={stopRecording}
                className="w-full bg-gray-700 hover:bg-gray-800 text-white"
              >
                <Icon name="Square" size={18} className="mr-2" />
                Остановить запись
              </Button>
            )}

            {isSending && (
              <Button disabled className="w-full">
                <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                Отправка...
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}