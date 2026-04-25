import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToPush } from '@/hooks/usePushNotifications';

const PUSH_SEND_URL = 'https://functions.poehali.dev/180d47b5-051e-4c3c-9861-3025f7d82986';

interface NotificationsModalProps {
  onClose: () => void;
}

type SendStatus = 'idle' | 'sending' | 'sent' | 'error';

export default function NotificationsModal({ onClose }: NotificationsModalProps) {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [enableError, setEnableError] = useState('');
  const [enableStep, setEnableStep] = useState('');
  const [fcmToken, setFcmToken] = useState('');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle');
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('fcm_token');
    const hasPermission = 'Notification' in window && Notification.permission === 'granted';
    if (token && hasPermission) {
      setIsSubscribed(true);
      setFcmToken(token);
    }
  }, []);

  const handleEnable = async () => {
    if (!user) return;
    setEnabling(true);
    setEnableError('');
    setEnableStep('Запрашиваю разрешение...');

    const result = await subscribeToPush(user.id);

    if (result.ok) {
      setIsSubscribed(true);
      setFcmToken(result.token);
      setEnableStep('');
    } else {
      setEnableStep('');
      setEnableError(`[${result.step}] ${result.detail}`);
    }
    setEnabling(false);
  };

  const sendNotification = async () => {
    if (!title.trim() || !user) return;
    setSendStatus('sending');
    setSendError('');
    try {
      const res = await fetch(PUSH_SEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': String(user.id) },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSendStatus('sent');
        setTitle('');
        setBody('');
        setTimeout(() => setSendStatus('idle'), 2500);
      } else {
        setSendError(data.error || `Ошибка ${res.status}`);
        setSendStatus('error');
      }
    } catch (e: unknown) {
      setSendError(e instanceof Error ? e.message : String(e));
      setSendStatus('error');
    }
  };

  const supported = 'serviceWorker' in navigator && 'Notification' in window;

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

        <div className="p-4 space-y-3">
          {!supported ? (
            <div className="text-sm text-red-500 text-center py-4">
              Браузер не поддерживает push-уведомления
            </div>
          ) : (
            <>
              <div className={`flex items-center gap-3 p-3 rounded-xl ${isSubscribed ? 'bg-green-50' : 'bg-gray-50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSubscribed ? 'bg-green-100' : 'bg-gray-200'}`}>
                  <Icon name={isSubscribed ? 'BellRing' : 'BellOff'} size={15} className={isSubscribed ? 'text-green-600' : 'text-gray-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">
                    {isSubscribed ? 'Уведомления включены' : 'Уведомления выключены'}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {isSubscribed
                      ? `Токен: ${fcmToken.slice(0, 20)}...`
                      : enabling ? enableStep : 'Нажмите «Включить»'}
                  </div>
                </div>
                {!isSubscribed && (
                  <button
                    onClick={handleEnable}
                    disabled={enabling}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium bg-[#001f54] hover:bg-[#002a70] text-white disabled:opacity-50 transition-colors shrink-0 flex items-center gap-1"
                  >
                    {enabling && <Icon name="Loader2" size={12} className="animate-spin" />}
                    {enabling ? 'Подключаю...' : 'Включить'}
                  </button>
                )}
              </div>

              {enableError && (
                <div className="text-xs text-red-600 bg-red-50 rounded-xl p-3 break-words">
                  <div className="font-medium mb-1">Ошибка подключения:</div>
                  {enableError}
                </div>
              )}

              {isSubscribed && (
                <div className="space-y-3 pt-1">
                  <div className="text-sm font-medium text-gray-700">Отправить всем промоутерам</div>
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
                    disabled={!title.trim() || sendStatus === 'sending' || sendStatus === 'sent'}
                    className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      sendStatus === 'sent'
                        ? 'bg-green-500 text-white'
                        : 'bg-[#001f54] hover:bg-[#002a70] text-white disabled:opacity-40'
                    }`}
                  >
                    {sendStatus === 'sending' && <Icon name="Loader2" size={14} className="animate-spin" />}
                    {sendStatus === 'sending' ? 'Отправляю...' : sendStatus === 'sent' ? '✓ Отправлено' : 'Отправить всем'}
                  </button>
                  {sendError && (
                    <div className="text-xs text-red-600 bg-red-50 rounded-xl p-3 break-words">{sendError}</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
