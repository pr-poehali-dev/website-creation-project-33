import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';

const SPEECH_CHECK_URL = 'https://functions.poehali.dev/c38d89b3-5417-4e4a-83c4-1fd0cb7455cd';
const TARGET_WORD = 'здравствуйте';

type Status = 'idle' | 'listening' | 'fail' | 'sending' | 'sent';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

export default function SpeechTab() {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const statusRef = useRef<Status>('idle');

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const startListening = () => {
    const SpeechRecognitionCtor =
      (window as Window & { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as Window & { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setErrorMsg('Ваш браузер не поддерживает распознавание речи. Используйте Chrome.');
      setStatus('fail');
      return;
    }

    setTranscript('');
    setErrorMsg('');
    setStatus('listening');

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
      if (matched) {
        setStatus('sending');
        sendToTelegram();
      } else {
        setStatus('fail');
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        setErrorMsg('Ничего не услышали. Попробуйте ещё раз.');
      } else if (event.error === 'not-allowed') {
        setErrorMsg('Нет доступа к микрофону. Разрешите доступ в браузере.');
      } else {
        setErrorMsg(`Ошибка: ${event.error}`);
      }
      setStatus('fail');
    };

    recognition.onend = () => {
      if (statusRef.current === 'listening') {
        setStatus('fail');
      }
    };

    recognition.start();
  };

  const sendToTelegram = async () => {
    try {
      await fetch(SPEECH_CHECK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user?.id?.toString() || '',
        },
        body: JSON.stringify({}),
      });
    } catch (e) {
      console.error('Speech check send error:', e);
    } finally {
      setStatus('sent');
    }
  };

  const reset = () => {
    recognitionRef.current?.stop();
    setStatus('idle');
    setTranscript('');
    setErrorMsg('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 select-none">

      {status === 'idle' && (
        <div className="flex flex-col items-center gap-8">
          <p className="text-gray-500 text-sm">Нажмите кнопку и произнесите слово</p>

          <div
            className="w-36 h-36 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 active:scale-95 transition-transform cursor-pointer"
            onClick={startListening}
          >
            <Icon name="Mic" size={52} className="text-white" />
          </div>

          <div className="text-5xl font-bold tracking-wide text-gray-800">
            Здравствуйте
          </div>
        </div>
      )}

      {status === 'listening' && (
        <div className="flex flex-col items-center gap-8">
          <p className="text-blue-600 font-medium animate-pulse">Слушаю...</p>

          <div
            className="w-36 h-36 rounded-full bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-300 animate-ping-slow cursor-pointer"
            onClick={reset}
          >
            <Icon name="Mic" size={52} className="text-white" />
          </div>

          <div className="text-5xl font-bold tracking-wide text-blue-700">
            Здравствуйте
          </div>

          <p className="text-gray-400 text-xs">Нажмите на микрофон чтобы остановить</p>
        </div>
      )}

      {status === 'sending' && (
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <Icon name="Loader2" size={40} className="text-green-500 animate-spin" />
          </div>
          <p className="text-gray-600">Отправляю результат...</p>
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
          <button
            onClick={reset}
            className="mt-4 px-6 py-2.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
          >
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
            {transcript && (
              <p className="text-gray-400 mt-1 text-sm">Услышали: «{transcript}»</p>
            )}
            {errorMsg && (
              <p className="text-gray-500 mt-1 text-sm">{errorMsg}</p>
            )}
          </div>
          <button
            onClick={reset}
            className="mt-2 px-8 py-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium text-lg shadow-md"
          >
            Попробовать снова
          </button>
        </div>
      )}

      <style>{`
        @keyframes ping-slow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
          50% { box-shadow: 0 0 0 20px rgba(59,130,246,0); }
        }
        .animate-ping-slow {
          animation: ping-slow 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
