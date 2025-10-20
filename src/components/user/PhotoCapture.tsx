import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface PhotoCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (contactsCount?: number) => void;
  type: 'start' | 'end';
  organizationId: number;
}

export default function PhotoCapture({ open, onOpenChange, onSuccess, type, organizationId }: PhotoCaptureProps) {
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setStream(mediaStream);
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
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(photoDataUrl);
    
    stopCamera();
    
    toast({
      title: 'Готово',
      description: 'Фото сделано. Теперь отправьте его.',
    });
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const sendPhoto = async () => {
    if (!capturedPhoto) return;
    
    setIsSending(true);

    try {
      const userId = user?.id?.toString();
      if (!userId) {
        throw new Error('Не найден ID пользователя');
      }

      const base64Photo = capturedPhoto.split(',')[1];

      const response = await fetch('https://functions.poehali.dev/b2eda591-8c66-4dff-95c4-c345ac48703f', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({
          photo_data: base64Photo,
          photo_type: type,
          organization_id: organizationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Ошибка отправки' }));
        throw new Error(errorData.error || 'Не удалось отправить фото');
      }

      const resultData = await response.json();

      toast({
        title: 'Успешно',
        description: type === 'start' ? 'Фото начала смены отправлено' : 'Фото окончания смены отправлено',
      });

      setIsSending(false);
      setCapturedPhoto(null);
      
      if (type === 'end' && resultData.contacts_today !== undefined) {
        onSuccess(resultData.contacts_today);
      } else {
        onSuccess();
      }
      
      onOpenChange(false);
    } catch (err) {
      console.error('Error sending photo:', err);
      setIsSending(false);
      toast({
        title: 'Ошибка',
        description: err instanceof Error ? err.message : 'Не удалось отправить фото',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (open && !capturedPhoto) {
      startCamera();
    } else if (!open) {
      stopCamera();
      setCapturedPhoto(null);
    }

    return () => {
      stopCamera();
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
            {capturedPhoto ? 'Проверьте фото и отправьте' : 'Сделайте фото с вашей точки'}
          </p>

          <div className="relative w-full aspect-[4/3] mx-auto bg-black rounded-lg overflow-hidden">
            {!capturedPhoto ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={capturedPhoto}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            )}
            
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="flex gap-3 justify-center">
            {!capturedPhoto ? (
              <Button
                size="lg"
                onClick={takePhoto}
                disabled={!stream}
                className="gap-2"
              >
                <Icon name="Camera" size={20} />
                Сделать фото
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  disabled={isSending}
                  className="gap-2"
                >
                  <Icon name="RotateCcw" size={20} />
                  Переснять
                </Button>
                <Button
                  onClick={sendPhoto}
                  disabled={isSending}
                  className="gap-2"
                >
                  {isSending ? (
                    <>
                      <Icon name="Loader2" size={20} className="animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Icon name="Send" size={20} />
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