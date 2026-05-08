import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';

const TARGET_WORD = 'здравствуйте';

type Status = 'idle' | 'listening' | 'processing' | 'fail';

interface SpeechRecognitionEvent { results: SpeechRecognitionResultList; }
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
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    recognition.continuous = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const alts = Array.from(event.results[0]);
      const results = alts.map((r) => (r as SpeechRecognitionAlternative).transcript.toLowerCase().trim());
      setTranscript(results[0] || '');
      const matched = results.some((r) => r.includes(TARGET_WORD));
      if (matched) {
        onSuccess();
      } else {
        setStatus('fail');
      }
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

  const reset = () => {
    recognitionRef.current?.stop();
    setStatus('idle'); setTranscript(''); setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl mx-4 p-8 flex flex-col items-center gap-6 max-w-sm w-full shadow-2xl">

        {/* Заголовок */}
        <div className="text-center">
          <p className="text-gray-500 text-sm">Шаг 1 из 2</p>
          <h2 className="text-xl font-bold text-gray-800 mt-1">Поздоровайтесь с клиентом</h2>
          <p className="text-gray-400 text-sm mt-1">Произнесите громко и чётко</p>
        </div>

        {/* Слово */}
        <div className="text-4xl font-bold tracking-wide text-blue-600">
          Здравствуйте
        </div>

        {/* Кнопка / состояние */}
        {status === 'idle' && (
          <button
            onClick={start}
            className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 active:scale-95 transition-transform"
          >
            <Icon name="Mic" size={40} className="text-white" />
          </button>
        )}

        {status === 'listening' && (
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-300 animate-ping-slow"
            >
              <Icon name="Mic" size={40} className="text-white" />
            </div>
            <p className="text-blue-600 font-medium animate-pulse text-sm">Слушаю...</p>
          </div>
        )}

        {status === 'processing' && (
          <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center">
            <Icon name="Loader2" size={40} className="text-blue-500 animate-spin" />
          </div>
        )}

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

        {/* Кнопка отмены */}
        {status !== 'fail' && (
          <button
            onClick={onCancel}
            className="text-gray-400 text-sm hover:text-gray-600 transition-colors"
          >
            Отмена
          </button>
        )}

        {status === 'fail' && (
          <button
            onClick={onCancel}
            className="text-gray-400 text-sm hover:text-gray-600 transition-colors"
          >
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
      `}</style>
    </div>
  );
}
