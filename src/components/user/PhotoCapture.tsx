import { useState, useRef, useEffect, useCallback } from 'react';
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

interface Sticker {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
}

const ACCESSORIES = [
  { id: 'none', emoji: '🚫', label: 'Без фильтра' },
  { id: 'cowboy', emoji: '🤠', label: 'Ковбой' },
  { id: 'party', emoji: '🥳', label: 'Праздник' },
  { id: 'alien', emoji: '👽', label: 'Пришелец' },
  { id: 'clown', emoji: '🤡', label: 'Клоун' },
  { id: 'cool', emoji: '😎', label: 'Крутой' },
  { id: 'devil', emoji: '😈', label: 'Чертёнок' },
  { id: 'robot', emoji: '🤖', label: 'Робот' },
  { id: 'ghost', emoji: '👻', label: 'Привидение' },
  { id: 'crown', emoji: '👑', label: 'Корона' },
  { id: 'hat', emoji: '🎩', label: 'Цилиндр' },
  { id: 'santa', emoji: '🎅', label: 'Дед Мороз' },
];

export default function PhotoCapture({ open, onOpenChange, onSuccess, type, organizationId }: PhotoCaptureProps) {
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [selectedAccessory, setSelectedAccessory] = useState<string>('none');
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);

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
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  };

  // Добавить стикер по центру при выборе
  const handleSelectAccessory = (id: string) => {
    setSelectedAccessory(id);
    if (id === 'none') { setStickers([]); return; }
    const acc = ACCESSORIES.find(a => a.id === id);
    if (!acc) return;
    const container = viewRef.current;
    const cx = container ? container.clientWidth / 2 : 150;
    const cy = container ? container.clientHeight / 2 - 60 : 200;
    setStickers(prev => {
      const existing = prev.find(s => s.id === id);
      if (existing) return prev;
      return [...prev, { id, emoji: acc.emoji, x: cx, y: cy, size: 80 }];
    });
  };

  // Touch drag
  const onTouchStart = useCallback((e: React.TouchEvent, id: string) => {
    e.stopPropagation();
    const touch = e.touches[0];
    const sticker = stickers.find(s => s.id === id);
    if (!sticker) return;
    setDragging({ id, startX: touch.clientX, startY: touch.clientY, origX: sticker.x, origY: sticker.y });
  }, [stickers]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragging.startX;
    const dy = touch.clientY - dragging.startY;
    setStickers(prev => prev.map(s => s.id === dragging.id ? { ...s, x: dragging.origX + dx, y: dragging.origY + dy } : s));
  }, [dragging]);

  const onTouchEnd = useCallback(() => setDragging(null), []);

  // Mouse drag (desktop)
  const onMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const sticker = stickers.find(s => s.id === id);
    if (!sticker) return;
    setDragging({ id, startX: e.clientX, startY: e.clientY, origX: sticker.x, origY: sticker.y });
  }, [stickers]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - dragging.startX;
      const dy = e.clientY - dragging.startY;
      setStickers(prev => prev.map(s => s.id === dragging.id ? { ...s, x: dragging.origX + dx, y: dragging.origY + dy } : s));
    };
    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging]);

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !viewRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const container = viewRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Зеркалим (selfie)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    // Рисуем стикеры
    const scaleX = canvas.width / container.clientWidth;
    const scaleY = canvas.height / container.clientHeight;
    stickers.forEach(s => {
      const fontSize = s.size * Math.min(scaleX, scaleY);
      ctx.font = `${fontSize}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.emoji, s.x * scaleX, s.y * scaleY);
    });

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
      setStickers([]);
      setSelectedAccessory('none');
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
    else if (!open) { stopCamera(); setCapturedPhoto(null); setStickers([]); setSelectedAccessory('none'); }
    return () => stopCamera();
  }, [open]);

  if (!open) return null;

  const isStart = type === 'start';

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in">

      {/* Шапка */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onOpenChange(false)}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
          >
            <Icon name="X" size={20} />
          </button>
          <div className="text-center">
            <p className="text-white font-semibold text-sm">{isStart ? 'Начало смены' : 'Окончание смены'}</p>
            <p className="text-white/60 text-xs mt-0.5">
              {capturedPhoto ? 'Проверьте фото' : 'Выбери аксессуар и снимай'}
            </p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Камера / Фото + стикеры */}
      <div
        ref={viewRef}
        className="flex-1 relative overflow-hidden"
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {!capturedPhoto ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon name="Loader2" size={40} className="text-white/50 animate-spin" />
              </div>
            )}
          </>
        ) : (
          <img src={capturedPhoto} alt="Фото" className="w-full h-full object-cover" />
        )}

        {/* Стикеры поверх камеры (только до съёмки) */}
        {!capturedPhoto && stickers.map(s => (
          <div
            key={s.id}
            onTouchStart={(e) => onTouchStart(e, s.id)}
            onMouseDown={(e) => onMouseDown(e, s.id)}
            className="absolute select-none cursor-grab active:cursor-grabbing"
            style={{
              left: s.x - s.size / 2,
              top: s.y - s.size / 2,
              fontSize: s.size,
              lineHeight: 1,
              touchAction: 'none',
              userSelect: 'none',
            }}
          >
            {s.emoji}
          </div>
        ))}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Панель аксессуаров + кнопки */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-8">

        {/* Выбор аксессуаров (только до съёмки) */}
        {!capturedPhoto && cameraReady && (
          <div className="px-4 mb-4">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {ACCESSORIES.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => handleSelectAccessory(acc.id)}
                  className={`flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all ${
                    selectedAccessory === acc.id
                      ? 'bg-white/30 ring-2 ring-white scale-110'
                      : 'bg-white/10 active:scale-95'
                  }`}
                >
                  <span className="text-2xl">{acc.emoji}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="px-6 pb-10">
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
      </div>
    </div>
  );
}
