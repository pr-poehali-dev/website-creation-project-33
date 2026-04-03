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

interface Accessory {
  id: string;
  emoji: string;
  label: string;
  anchor: 'forehead' | 'nose' | 'chin' | 'face';
  offsetY: number;
  scale: number;
}

const ACCESSORIES: Accessory[] = [
  { id: 'none',   emoji: '✕',  label: 'Без',       anchor: 'face',     offsetY: 0,     scale: 0    },
  { id: 'crown',  emoji: '👑',  label: 'Корона',    anchor: 'forehead', offsetY: -0.55, scale: 0.9  },
  { id: 'hat',    emoji: '🎩',  label: 'Цилиндр',   anchor: 'forehead', offsetY: -0.65, scale: 1.0  },
  { id: 'cowboy', emoji: '🤠',  label: 'Ковбой',    anchor: 'forehead', offsetY: -0.55, scale: 1.1  },
  { id: 'santa',  emoji: '🎅',  label: 'Мороз',     anchor: 'forehead', offsetY: -0.5,  scale: 1.0  },
  { id: 'party',  emoji: '🎉',  label: 'Праздник',  anchor: 'forehead', offsetY: -0.5,  scale: 0.8  },
  { id: 'horns',  emoji: '😈',  label: 'Рожки',     anchor: 'forehead', offsetY: -0.55, scale: 0.9  },
  { id: 'cool',   emoji: '😎',  label: 'Очки',      anchor: 'nose',     offsetY: -0.1,  scale: 0.9  },
  { id: 'beard',  emoji: '🧔',  label: 'Борода',    anchor: 'chin',     offsetY: 0.2,   scale: 0.9  },
  { id: 'alien',  emoji: '👽',  label: 'Пришелец',  anchor: 'face',     offsetY: 0,     scale: 1.1  },
  { id: 'clown',  emoji: '🤡',  label: 'Клоун',     anchor: 'face',     offsetY: 0,     scale: 1.1  },
  { id: 'ghost',  emoji: '👻',  label: 'Призрак',   anchor: 'face',     offsetY: 0,     scale: 1.2  },
  { id: 'robot',  emoji: '🤖',  label: 'Робот',     anchor: 'face',     offsetY: 0,     scale: 1.1  },
];

// Индексы ключевых точек MediaPipe Face Mesh
const IDX_FOREHEAD   = 10;
const IDX_NOSE_TIP   = 1;
const IDX_LEFT_EYE   = 33;
const IDX_RIGHT_EYE  = 263;
const IDX_CHIN       = 152;
const IDX_LEFT_CHEEK = 234;
const IDX_RIGHT_CHEEK= 454;

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window { FaceMesh: any; }
}

export default function PhotoCapture({ open, onOpenChange, onSuccess, type, organizationId }: PhotoCaptureProps) {
  const { user } = useAuth();
  const [isSending, setIsSending]        = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [stream, setStream]              = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady]    = useState(false);
  const [selectedId, setSelectedId]      = useState('none');
  const [faceDetected, setFaceDetected]  = useState(false);
  const [modelLoading, setModelLoading]  = useState(false);

  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const overlayRef  = useRef<HTMLCanvasElement>(null);
  const faceMeshRef = useRef<any>(null);
  const rafRef      = useRef<number>(0);
  const landmarksRef = useRef<any[]>([]);

  /* ── Камера ─────────────────────────────────────────────── */
  const startCamera = async () => {
    setCameraReady(false);
    try {
      const ms = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = ms;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
      setStream(ms);
    } catch {
      toast({ title: 'Ошибка', description: 'Нет доступа к камере', variant: 'destructive' });
    }
  };

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
    landmarksRef.current = [];
  };

  /* ── MediaPipe FaceMesh ──────────────────────────────────── */
  const initFaceMesh = useCallback(async () => {
    if (faceMeshRef.current || !window.FaceMesh) return;
    setModelLoading(true);
    try {
      const fm = new window.FaceMesh({
        locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
      });
      fm.setOptions({ maxNumFaces: 1, refineLandmarks: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      fm.onResults((res: any) => {
        if (res.multiFaceLandmarks?.length > 0) {
          landmarksRef.current = res.multiFaceLandmarks[0];
          setFaceDetected(true);
        } else {
          landmarksRef.current = [];
          setFaceDetected(false);
        }
      });
      await fm.initialize();
      faceMeshRef.current = fm;
    } finally {
      setModelLoading(false);
    }
  }, []);

  /* ── Цикл отрисовки AR ───────────────────────────────────── */
  const drawLoop = useCallback(() => {
    const overlay = overlayRef.current;
    const video   = videoRef.current;
    if (!overlay || !video) return;

    overlay.width  = video.clientWidth;
    overlay.height = video.clientHeight;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    const acc = ACCESSORIES.find(a => a.id === selectedId);
    const lm  = landmarksRef.current;

    if (acc && acc.id !== 'none' && acc.scale > 0 && lm.length > 0) {
      const W = overlay.width;
      const H = overlay.height;
      // зеркалим X (видео уже зеркальное через CSS)
      const pt = (i: number) => ({ x: (1 - lm[i].x) * W, y: lm[i].y * H });

      const lEye      = pt(IDX_LEFT_EYE);
      const rEye      = pt(IDX_RIGHT_EYE);
      const faceW     = Math.abs(pt(IDX_LEFT_CHEEK).x - pt(IDX_RIGHT_CHEEK).x);
      const fontSize  = faceW * acc.scale;
      const angle     = Math.atan2(rEye.y - lEye.y, rEye.x - lEye.x);

      let anchor;
      switch (acc.anchor) {
        case 'forehead': anchor = pt(IDX_FOREHEAD);  break;
        case 'nose':     anchor = pt(IDX_NOSE_TIP);  break;
        case 'chin':     anchor = pt(IDX_CHIN);      break;
        default:         anchor = { x: (lEye.x + rEye.x) / 2, y: (lEye.y + rEye.y) / 2 };
      }

      ctx.save();
      ctx.translate(anchor.x, anchor.y + faceW * acc.offsetY);
      ctx.rotate(angle);
      ctx.font = `${fontSize}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(acc.emoji, 0, 0);
      ctx.restore();
    }

    if (faceMeshRef.current && video.readyState >= 2) {
      faceMeshRef.current.send({ image: video }).catch(() => {});
    }

    rafRef.current = requestAnimationFrame(drawLoop);
  }, [selectedId]);

  /* ── Запуск/остановка AR при смене фильтра ───────────────── */
  useEffect(() => {
    if (!cameraReady) return;
    if (selectedId !== 'none') {
      initFaceMesh().then(() => {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(drawLoop);
      });
    } else {
      cancelAnimationFrame(rafRef.current);
      setFaceDetected(false);
      const overlay = overlayRef.current;
      if (overlay) overlay.getContext('2d')?.clearRect(0, 0, overlay.width, overlay.height);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [cameraReady, selectedId, drawLoop]);

  /* ── Съёмка: видео + AR overlay → jpeg ──────────────────── */
  const takePhoto = () => {
    const video   = videoRef.current;
    const canvas  = canvasRef.current;
    const overlay = overlayRef.current;
    if (!video || !canvas) return;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Зеркало
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    // Аксессуар поверх
    if (overlay && selectedId !== 'none') {
      ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height);
    }

    setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.9));
    stopCamera();
  };

  const retakePhoto = () => { setCapturedPhoto(null); startCamera(); };

  /* ── Отправка ────────────────────────────────────────────── */
  const sendPhoto = async () => {
    if (!capturedPhoto) return;
    setIsSending(true);
    try {
      const userId = user?.id?.toString();
      if (!userId) throw new Error('Не найден ID пользователя');

      const res = await fetch('https://functions.poehali.dev/b2eda591-8c66-4dff-95c4-c345ac48703f', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ photo_data: capturedPhoto.split(',')[1], photo_type: type, organization_id: organizationId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Ошибка' }));
        if (res.status === 409 && err.error === 'active_shift_exists') {
          setIsSending(false); setCapturedPhoto(null); onOpenChange(false);
          toast({ title: 'Смена уже открыта', description: 'Закройте текущую смену.', variant: 'destructive' });
          return;
        }
        throw new Error(err.error || 'Не удалось отправить');
      }

      const data = await res.json();
      setIsSending(false); setCapturedPhoto(null); setSelectedId('none');
      if (type === 'end' && data.contacts_today !== undefined) onSuccess(data.contacts_today);
      else onSuccess();
      onOpenChange(false);
    } catch (err) {
      setIsSending(false);
      toast({ title: 'Ошибка', description: err instanceof Error ? err.message : 'Ошибка', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (open && !capturedPhoto) startCamera();
    else if (!open) { stopCamera(); setCapturedPhoto(null); setSelectedId('none'); setFaceDetected(false); }
    return () => stopCamera();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in">

      {/* Шапка */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4">
        <div className="flex items-center justify-between">
          <button onClick={() => onOpenChange(false)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white">
            <Icon name="X" size={20} />
          </button>
          <div className="text-center">
            <p className="text-white font-semibold text-sm">{type === 'start' ? 'Начало смены' : 'Окончание смены'}</p>
            <p className="text-white/60 text-xs mt-0.5">
              {capturedPhoto ? 'Проверьте фото'
                : modelLoading ? '⏳ Загрузка AR...'
                : selectedId !== 'none' ? (faceDetected ? '✦ Лицо обнаружено' : '○ Ищу лицо...')
                : 'Выбери фильтр и снимай'}
            </p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Видео + AR */}
      <div className="flex-1 relative overflow-hidden">
        {!capturedPhoto ? (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
            <canvas ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none" />
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon name="Loader2" size={40} className="text-white/50 animate-spin" />
              </div>
            )}
            {cameraReady && selectedId !== 'none' && (
              <div className={`absolute top-20 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium transition-all ${faceDetected ? 'bg-green-500/80 text-white' : 'bg-black/40 text-white/60'}`}>
                {faceDetected ? '● Лицо найдено' : '○ Ищу лицо...'}
              </div>
            )}
          </>
        ) : (
          <img src={capturedPhoto} alt="Фото" className="w-full h-full object-cover" />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Нижняя панель */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-8">

        {!capturedPhoto && cameraReady && (
          <div className="px-4 mb-5">
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
              {ACCESSORIES.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => setSelectedId(acc.id)}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 transition-all active:scale-95 ${selectedId === acc.id ? 'scale-110' : ''}`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${selectedId === acc.id ? 'bg-white/30 ring-2 ring-white' : 'bg-white/10'}`}>
                    {acc.emoji}
                  </div>
                  <span className="text-white/60 text-[10px]">{acc.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-6 pb-10">
          {!capturedPhoto ? (
            <div className="flex items-center justify-center">
              <button onClick={takePhoto} disabled={!cameraReady} className="w-20 h-20 rounded-full bg-white disabled:bg-white/40 flex items-center justify-center shadow-2xl active:scale-95 transition-transform">
                <div className="w-16 h-16 rounded-full border-2 border-black/10 bg-white flex items-center justify-center">
                  <Icon name="Camera" size={28} className="text-[#001f54]" />
                </div>
              </button>
            </div>
          ) : (
            <div className="flex gap-4">
              <button onClick={retakePhoto} disabled={isSending} className="flex-1 h-14 rounded-2xl bg-white/15 backdrop-blur border border-white/20 text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
                <Icon name="RotateCcw" size={18} />Переснять
              </button>
              <button onClick={sendPhoto} disabled={isSending} className="flex-1 h-14 rounded-2xl bg-white text-[#001f54] font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60 shadow-lg">
                {isSending
                  ? <><Icon name="Loader2" size={18} className="animate-spin" />Отправка...</>
                  : <><Icon name="Check" size={18} />Отправить</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}