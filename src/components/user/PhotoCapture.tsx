import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setCameraReady(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
      setStream(mediaStream);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось получить доступ к камере', variant: 'destructive' });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
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
    setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.9));
    stopCamera();
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
      if (!userId) throw new Error('Не найден ID пользователя');

      const response = await fetch('https://functions.poehali.dev/b2eda591-8c66-4dff-95c4-c345ac48703f', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({
          photo_data: capturedPhoto.split(',')[1],
          photo_type: type,
          organization_id: organizationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Ошибка отправки' }));
        if (response.status === 409 && errorData.error === 'active_shift_exists') {
          setIsSending(false);
          setCapturedPhoto(null);
          onOpenChange(false);
          toast({ title: 'Смена уже открыта', description: 'Закройте текущую смену перед началом новой.', variant: 'destructive' });
          return;
        }
        throw new Error(errorData.error || 'Не удалось отправить фото');
      }

      const resultData = await response.json();
      setIsSending(false);
      setCapturedPhoto(null);
      if (type === 'end' && resultData.contacts_today !== undefined) {
        onSuccess(resultData.contacts_today);
      } else {
        onSuccess();
      }
      onOpenChange(false);
    } catch (err) {
      setIsSending(false);
      toast({ title: 'Ошибка', description: err instanceof Error ? err.message : 'Не удалось отправить фото', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (open && !capturedPhoto) startCamera();
    else if (!open) { stopCamera(); setCapturedPhoto(null); }
    return () => stopCamera();
  }, [open]);

  if (!open) return null;

  const isStart = type === 'start';

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col animate-fade-in" style={{ height: '100dvh', top: 0, left: 0, right: 0, bottom: 0 }}>

      {/* Шапка */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-safe-top">
        <div className="flex items-center justify-between pt-4 pb-3">
          <button
            onClick={() => onOpenChange(false)}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
          >
            <Icon name="X" size={20} />
          </button>

          <div className="text-center">
            <p className="text-white font-semibold text-sm">{isStart ? 'Начало смены' : 'Окончание смены'}</p>
            <p className="text-white/60 text-xs mt-0.5">
              {capturedPhoto ? 'Проверьте фото' : 'Сфотографируйте рабочую точку'}
            </p>
          </div>

          <div className="w-10" />
        </div>
      </div>

      {/* Камера / Фото */}
      <div className="flex-1 relative overflow-hidden">
        {!capturedPhoto ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Рамка-прицел */}
            {cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/70 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/70 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/70 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/70 rounded-br-lg" />
                </div>
              </div>
            )}
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon name="Loader2" size={40} className="text-white/50 animate-spin" />
              </div>
            )}
          </>
        ) : (
          <img src={capturedPhoto} alt="Фото" className="w-full h-full object-cover" />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Нижняя панель */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-10 pt-6 bg-gradient-to-t from-black/80 to-transparent">
        {!capturedPhoto ? (
          <div className="flex items-center justify-center">
            <button
              onClick={takePhoto}
              disabled={!cameraReady}
              className="w-20 h-20 rounded-full bg-white disabled:bg-white/40 flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
            >
              <div className="w-16 h-16 rounded-full border-2 border-black/10 bg-white flex items-center justify-center">
                <Icon name="Camera" size={28} className="text-[#001f54]" />
              </div>
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            <button
              onClick={retakePhoto}
              disabled={isSending}
              className="flex-1 h-14 rounded-2xl bg-white/15 backdrop-blur border border-white/20 text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Icon name="RotateCcw" size={18} />
              Переснять
            </button>
            <button
              onClick={sendPhoto}
              disabled={isSending}
              className="flex-1 h-14 rounded-2xl bg-white text-[#001f54] font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60 shadow-lg"
            >
              {isSending ? (
                <><Icon name="Loader2" size={18} className="animate-spin" />Отправка...</>
              ) : (
                <><Icon name="Check" size={18} />Отправить</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}