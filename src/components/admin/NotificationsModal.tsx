import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

const VAPID_PUBLIC_KEY = 'BG6Ttkt-fQpV58ujGgbAgbelZZdBnVjelhL5pfMcRBCXNepszkFPcPSgQ...20AqVrf8WTYYHR7M_QOw9YrLH5SE';
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCQNZuXt4IrVe5PADZ9tW-u0c_jZ1kitqw',
  authDomain: 'imperia-promo.firebaseapp.com',
  projectId: 'imperia-promo',
  storageBucket: 'imperia-promo.firebasestorage.app',
  messagingSenderId: '71242293605',
  appId: '1:71242293605:web:00010f9ccf89330ac0c18c',
};

interface NotificationsModalProps {
  onClose: () => void;
}

type Status = 'idle' | 'loading' | 'subscribed' | 'error' | 'sending' | 'sent';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export default function NotificationsModal({ onClose }: NotificationsModalProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    setIsSubscribed(!!sub);
  };

  const subscribe = async () => {
    setStatus('loading');
    setError('');
    try {
      if (!('serviceWorker' in navigator)) throw new Error('Service Worker не поддерживается');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Разрешение на уведомления отклонено');

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      localStorage.setItem('push_subscription', JSON.stringify(sub));
      setIsSubscribed(true);
      setStatus('subscribed');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка подписки');
      setStatus('error');
    }
  };

  const unsubscribe = async () => {
    setStatus('loading');
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    localStorage.removeItem('push_subscription');
    setIsSubscribed(false);
    setStatus('idle');
  };

  const sendNotification = async () => {
    if (!title.trim()) return;
    setStatus('sending');
    setError('');
    try {
      await new Promise(r => setTimeout(r, 800));
      setStatus('sent');
      setTitle('');
      setBody('');
      setTimeout(() => setStatus('subscribed'), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка отправки');
      setStatus('error');
    }
  };

  const supported = 'serviceWorker' in navigator && 'PushManager' in window;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Icon name="Bell" size={18} className="text-gray-700" />
            <span className="font-semibold text-gray-800">Push-уведомления</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <Icon name="X" size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!supported ? (
            <div className="text-sm text-red-500 text-center py-4">
              Ваш браузер не поддерживает push-уведомления
            </div>
          ) : (
            <>
              <div className={`flex items-center gap-3 p-3 rounded-xl ${isSubscribed ? 'bg-green-50' : 'bg-gray-50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSubscribed ? 'bg-green-100' : 'bg-gray-200'}`}>
                  <Icon name={isSubscribed ? 'BellRing' : 'BellOff'} size={15} className={isSubscribed ? 'text-green-600' : 'text-gray-500'} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">
                    {isSubscribed ? 'Уведомления включены' : 'Уведомления выключены'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {isSubscribed ? 'Этот браузер получит уведомления' : 'Нажмите, чтобы подписаться'}
                  </div>
                </div>
                <button
                  onClick={isSubscribed ? unsubscribe : subscribe}
                  disabled={status === 'loading'}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    isSubscribed
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      : 'bg-[#001f54] hover:bg-[#002a70] text-white'
                  }`}
                >
                  {status === 'loading' ? '...' : isSubscribed ? 'Отключить' : 'Включить'}
                </button>
              </div>

              {isSubscribed && (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-700">Отправить уведомление</div>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Заголовок"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#001f54]/20"
                  />
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="Текст сообщения (необязательно)"
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#001f54]/20 resize-none"
                  />
                  <button
                    onClick={sendNotification}
                    disabled={!title.trim() || status === 'sending' || status === 'sent'}
                    className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      status === 'sent'
                        ? 'bg-green-500 text-white'
                        : 'bg-[#001f54] hover:bg-[#002a70] text-white disabled:opacity-40'
                    }`}
                  >
                    {status === 'sending' ? 'Отправляю...' : status === 'sent' ? '✓ Отправлено' : 'Отправить'}
                  </button>
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2 text-center">
                    Отправка будет доступна после подключения Service Account
                  </p>
                </div>
              )}

              {error && (
                <div className="text-xs text-red-500 bg-red-50 rounded-xl p-3">{error}</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
