import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';

const TARGET_WORDS = ['здравствуйте', 'дети'];

type Status = 'idle' | 'listening' | 'processing' | 'success' | 'fail';

interface SpeechRecognitionEvent { results: SpeechRecognitionResultList; resultIndex?: number; }
interface SpeechRecognitionErrorEvent { error: string; }
interface SpeechRecognitionInstance {
  lang: string; interimResults: boolean; maxAlternatives: number; continuous: boolean;
  start: () => void; stop: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionAlternative { transcript: string; }

interface GreetingCheckProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function GreetingCheck({ onSuccess, onCancel }: GreetingCheckProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const statusRef = useRef<Status>('idle');

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => {
    start();
    return () => { recognitionRef.current?.stop(); };
  }, []);

  const hasSpeechRecognition = () => !!(
    (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  );

  const start = () => {
    if (!hasSpeechRecognition()) {
      setErrorMsg('Браузер не поддерживает распознавание речи.');
      setStatus('fail');
      return;
    }

    const SpeechRecognitionCtor =
      (window as Window & { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as Window & { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

    setTranscript(''); setErrorMsg(''); setStatus('listening');

    const recognition = new SpeechRecognitionCtor!();
    recognitionRef.current = recognition;
    recognition.lang = 'ru-RU';
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.continuous = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Проверяем все результаты — и промежуточные, и финальные
      for (let i = event.resultIndex ?? 0; i < event.results.length; i++) {
        const result = event.results[i];
        const alts = Array.from(result);
        const texts = alts.map((r) => (r as SpeechRecognitionAlternative).transcript.toLowerCase().trim());
        const matched = texts.some((t) => TARGET_WORDS.some((w) => t.includes(w)));
        if (matched) {
          recognition.stop();
          onSuccess();
          return;
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        setErrorMsg('Нет доступа к микрофону.');
        setStatus('fail');
      }
      // no-speech и прочие — перезапускаем автоматически
    };

    recognition.onend = () => {
      // Если ещё слушаем (не успех, не ошибка доступа) — перезапускаем новый экземпляр
      if (statusRef.current === 'listening') {
        setTimeout(() => start(), 100);
      }
    };

    recognition.start();
  };

  const reset = () => {
    recognitionRef.current?.stop();
    setTranscript(''); setErrorMsg('');
    setStatus('idle');
    setTimeout(() => start(), 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl mx-4 p-8 flex flex-col items-center gap-6 max-w-sm w-full shadow-2xl">

        {/* Заголовок */}
        {status !== 'success' && (
          <h2 className="text-xl font-bold text-gray-800 text-center">Поздоровайтесь с клиентом</h2>
        )}

        {/* processing */}
        {status === 'processing' && (
          <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center">
            <Icon name="Loader2" size={40} className="text-blue-500 animate-spin" />
          </div>
        )}

        {/* success — зелёная галочка с анимацией */}
        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 py-4 animate-success-pop">
            <div className="w-28 h-28 rounded-full bg-green-500 flex items-center justify-center shadow-xl shadow-green-200">
              <Icon name="Check" size={56} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-green-600">Отлично!</p>
          </div>
        )}

        {/* fail */}
        {status === 'fail' && (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
              <Icon name="X" size={40} className="text-red-500" />
            </div>
            <div className="text-center">
              <p className="font-bold text-red-600">Не распознано</p>
              {transcript && <p className="text-gray-400 text-xs mt-1">Услышали: «{transcript}»</p>}
              {errorMsg && <p className="text-gray-500 text-xs mt-1">{errorMsg}</p>}
            </div>
            <button
              onClick={reset}
              className="w-full py-3 rounded-2xl bg-blue-600 text-white font-semibold text-lg active:scale-95 transition-transform"
            >
              Попробовать снова
            </button>
          </div>
        )}

        {/* Отмена */}
        {status !== 'success' && (
          <button onClick={onCancel} className="text-gray-400 text-sm hover:text-gray-600 transition-colors">
            Отмена
          </button>
        )}
      </div>

      <style>{`
        @keyframes ping-slow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
          50% { box-shadow: 0 0 0 20px rgba(59,130,246,0); }
        }
        .animate-ping-slow { animation: ping-slow 1.2s ease-in-out infinite; }

        @keyframes success-pop {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-success-pop { animation: success-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>
    </div>
  );
}