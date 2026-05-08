import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';

const SPEECH_CHECK_URL = 'https://functions.poehali.dev/c38d89b3-5417-4e4a-83c4-1fd0cb7455cd';
const SPEECH_RECOGNIZE_URL = 'https://functions.poehali.dev/003ad766-94cf-41d7-9e8f-a5543ebf3537';
const TARGET_WORD = 'здравствуйте';

type Status = 'idle' | 'listening' | 'recording' | 'processing' | 'fail' | 'sending' | 'sent';

interface SpeechRecognitionEvent { results: SpeechRecognitionResultList; }
interface SpeechRecognitionErrorEvent { error: string; }
interface SpeechRecognitionInstance {
  lang: string; interimResults: boolean; maxAlternatives: number; continuous: boolean;
  start: () => void; stop: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);
const isAndroid = () => /Android/i.test(navigator.userAgent);
const isMobile = () => isIOS() || isAndroid();

export default function SpeechTab() {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const statusRef = useRef<Status>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      mediaRecorderRef.current?.stop();
    };
  }, []);

  // ── ПК: Web Speech API ──────────────────────────────────────────────────────
  const startDesktop = () => {
    const SpeechRecognitionCtor =
      (window as Window & { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as Window & { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setErrorMsg('Браузер не поддерживает распознавание речи. Используйте Chrome.');
      setStatus('fail');
      return;
    }

    setTranscript(''); setErrorMsg(''); setStatus('listening');

    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;
    recognition.lang = 'ru-RU';
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    recognition.continuous = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const alts = Array.from(event.results[0]);
      const results = alts.map((r) => (r as SpeechRecognitionAlternative).transcript.toLowerCase().trim());
      setTranscript(results[0] || '');
      const matched = results.some((r) => r.includes(TARGET_WORD));
      if (matched) { setStatus('sending'); notifyBackend(true, results[0] || ''); }
      else { setStatus('fail'); notifyBackend(false, results[0] || ''); }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') setErrorMsg('Ничего не услышали. Попробуйте ещё раз.');
      else if (event.error === 'not-allowed') setErrorMsg('Нет доступа к микрофону.');
      else setErrorMsg(`Ошибка: ${event.error}`);
      setStatus('fail');
    };

    recognition.onend = () => {
      if (statusRef.current === 'listening') setStatus('fail');
    };

    recognition.start();
  };

  // ── Мобильные: MediaRecorder → Groq Whisper ─────────────────────────────────
  const startMobile = async () => {
    setTranscript(''); setErrorMsg('');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setErrorMsg('Нет доступа к микрофону. Разрешите доступ в браузере.');
      setStatus('fail');
      return;
    }

    // Подбираем поддерживаемый формат
    const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/mpeg']
      .find((t) => MediaRecorder.isTypeSupported(t)) || '';

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = recorder;
    audioChunksRef.current = [];

    recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setStatus('processing');
      const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
      await sendToWhisper(blob, mimeType || 'audio/webm');
    };

    setStatus('recording');
    recorder.start();

    // Автоматически останавливаем через 5 секунд
    setTimeout(() => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }, 5000);
  };

  const stopMobile = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const toBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  };

  const sendToWhisper = async (blob: Blob, mimeType: string) => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const b64 = toBase64(arrayBuffer);

      const res = await fetch(SPEECH_RECOGNIZE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user?.id?.toString() || '',
        },
        body: JSON.stringify({ audio: b64, mime_type: mimeType }),
      });

      const data = await res.json();
      const heard = data.transcript || '';
      setTranscript(heard);

      if (data.success) { setStatus('sent'); }
      else { setStatus('fail'); }
    } catch (e) {
      console.error('Whisper error:', e);
      setErrorMsg('Ошибка при отправке аудио.');
      setStatus('fail');
    }
  };

  // ── Уведомление для ПК (speech-check) ───────────────────────────────────────
  const notifyBackend = async (success: boolean, heard: string) => {
    try {
      await fetch(SPEECH_CHECK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': user?.id?.toString() || '' },
        body: JSON.stringify({ success, heard }),
      });
    } catch (e) { console.error('notify error:', e); }
    finally { if (success) setStatus('sent'); }
  };

  const hasSpeechRecognition = () => !!(
    (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  );

  // Android → MediaRecorder+Whisper; iOS/ПК → Web Speech API; если недоступен → MediaRecorder
  const handleStart = () => {
    if (isAndroid() || !hasSpeechRecognition()) { startMobile(); } else { startDesktop(); }
  };
  const handleStop = () => {
    if (isAndroid() || !hasSpeechRecognition()) { stopMobile(); } else { recognitionRef.current?.stop(); }
  };

  const reset = () => {
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    setStatus('idle'); setTranscript(''); setErrorMsg('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 select-none">

      {status === 'idle' && (
        <div className="flex flex-col items-center gap-8">
          <p className="text-gray-500 text-sm text-center">Нажмите кнопку и произнесите слово</p>
          <div
            className="w-36 h-36 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 active:scale-95 transition-transform cursor-pointer"
            onClick={handleStart}
          >
            <Icon name="Mic" size={52} className="text-white" />
          </div>
          <div className="text-5xl font-bold tracking-wide text-gray-800">Здравствуйте</div>
        </div>
      )}

      {(status === 'listening' || status === 'recording') && (
        <div className="flex flex-col items-center gap-8">
          <p className="text-blue-600 font-medium animate-pulse">
            {status === 'recording' ? 'Запись... (до 5 сек)' : 'Слушаю...'}
          </p>
          <div
            className="w-36 h-36 rounded-full bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-300 animate-ping-slow cursor-pointer"
            onClick={handleStop}
          >
            <Icon name="Mic" size={52} className="text-white" />
          </div>
          <div className="text-5xl font-bold tracking-wide text-blue-700">Здравствуйте</div>
          <p className="text-gray-400 text-xs">
            {status === 'recording' ? 'Нажмите чтобы остановить раньше' : 'Нажмите чтобы остановить'}
          </p>
        </div>
      )}

      {(status === 'processing' || status === 'sending') && (
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
            <Icon name="Loader2" size={40} className="text-blue-500 animate-spin" />
          </div>
          <p className="text-gray-600">Распознаю речь...</p>
        </div>
      )}

      {status === 'sent' && (
        <div className="flex flex-col items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-200">
            <Icon name="CheckCheck" size={48} className="text-white" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">Отлично!</p>
            <p className="text-gray-500 mt-1">Уведомление отправлено</p>
          </div>
          <button onClick={reset} className="mt-4 px-6 py-2.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium">
            Повторить
          </button>
        </div>
      )}

      {status === 'fail' && (
        <div className="flex flex-col items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
            <Icon name="X" size={48} className="text-red-500" />
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-red-600">Не распознано</p>
            {transcript && <p className="text-gray-400 mt-1 text-sm">Услышали: «{transcript}»</p>}
            {errorMsg && <p className="text-gray-500 mt-1 text-sm">{errorMsg}</p>}
          </div>
          <button onClick={reset} className="mt-2 px-8 py-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium text-lg shadow-md">
            Попробовать снова
          </button>
        </div>
      )}

      <style>{`
        @keyframes ping-slow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
          50% { box-shadow: 0 0 0 20px rgba(59,130,246,0); }
        }
        .animate-ping-slow { animation: ping-slow 1.2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}