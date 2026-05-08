import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';

const TARGET_WORDS = [
  'здравствуйте', 'добрый день', 'добрый вечер',
  'дети', 'детям', 'дарим', 'дарит',
  'компьютер', 'компьютерная',
  'академия', 'школа',
  'бесплатное', 'бесплатный',
  'занятие', 'урок', 'мастер-класс',
  'айти', 'воркаут',
];

const TIMEOUT_SEC = 10;

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
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIMEOUT_SEC);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const statusRef = useRef<Status>('idle');
  const activeRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heardTextsRef = useRef<string[]>([]);

  useEffect(() => { statusRef.current = status; }, [status]);

  useEffect(() => {
    activeRef.current = true;
    start();
    startCountdown();
    return () => {
      activeRef.current = false;
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      if (timerRef.current) clearInterval(timerRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const startCountdown = () => {
    setTimeLeft(TIMEOUT_SEC);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timeoutRef.current = setTimeout(() => {
      if (activeRef.current) {
        recognitionRef.current?.stop();
        const allHeard = heardTextsRef.current.join(' | ') || '(тишина)';
        sendFailReport(allHeard);
        onSuccess();
      }
    }, TIMEOUT_SEC * 1000);
  };

  const sendFailReport = (heard: string) => {
    fetch('https://functions.poehali.dev/c38d89b3-5417-4e4a-83c4-1fd0cb7455cd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': user?.id?.toString() || '' },
      body: JSON.stringify({ success: false, heard, timeout: true }),
    }).catch(() => {});
  };

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
      for (let i = event.resultIndex ?? 0; i < event.results.length; i++) {
        const alts = Array.from(event.results[i]);
        const texts = alts.map((r) => (r as SpeechRecognitionAlternative).transcript.toLowerCase().trim());
        // Накапливаем финальные результаты для отчёта
        if (event.results[i].isFinal && texts[0]) {
          heardTextsRef.current.push(texts[0]);
        }
        const matched = texts.some((t) => TARGET_WORDS.some((w) => t.includes(w)));
        if (matched) {
          recognition.stop();
          if (timerRef.current) clearInterval(timerRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          if (activeRef.current) onSuccess();
          return;
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        setErrorMsg('Нет доступа к микрофону.');
        setStatus('fail');
      }
    };

    recognition.onend = () => {
      if (activeRef.current && statusRef.current === 'listening') {
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

  // Круговой таймер: 0..1 прогресс убывает
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / TIMEOUT_SEC;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white rounded-3xl mx-4 p-8 flex flex-col items-center gap-6 max-w-sm w-full shadow-2xl">

        {/* Круговой таймер — правый верхний угол */}
        {status !== 'success' && (
          <div className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
              <circle cx="24" cy="24" r={radius} fill="none" stroke="#fee2e2" strokeWidth="4" />
              <circle
                cx="24" cy="24" r={radius}
                fill="none"
                stroke="#ef4444"
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <span className="absolute text-sm font-bold text-red-500">{timeLeft}</span>
          </div>
        )}

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

        {/* success */}
        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 py-4">
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
          <button
            onClick={() => { activeRef.current = false; recognitionRef.current?.stop(); if (timerRef.current) clearInterval(timerRef.current); if (timeoutRef.current) clearTimeout(timeoutRef.current); onCancel(); }}
            className="text-gray-400 text-sm hover:text-gray-600 transition-colors"
          >
            Отмена
          </button>
        )}
      </div>
    </div>
  );
}