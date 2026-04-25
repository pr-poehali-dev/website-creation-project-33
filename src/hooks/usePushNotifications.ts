import { useEffect, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCQNZuXt4IrVe5PADZ9tW-u0c_jZ1kitqw',
  authDomain: 'imperia-promo.firebaseapp.com',
  projectId: 'imperia-promo',
  storageBucket: 'imperia-promo.firebasestorage.app',
  messagingSenderId: '71242293605',
  appId: '1:71242293605:web:00010f9ccf89330ac0c18c',
};

const VAPID_KEY = 'BG6Ttkt-fQpV58ujGgbAgbelZZdBnVjelhL5pfMcRBCXNepszkFPcPSgQWb20AqVrf8WTYYHR7M_Q0w9YrLH5SE';
const PUSH_SUBSCRIBE_URL = 'https://functions.poehali.dev/0742cff3-bd80-4025-9b3e-029d5d82c960';

export type PushResult =
  | { ok: true; token: string }
  | { ok: false; step: string; detail: string };

export async function subscribeToPush(userId: number, onStep?: (s: string) => void): Promise<PushResult> {
  const step = (s: string) => { console.log('[Push]', s); onStep?.(s); };

  if (!('Notification' in window))
    return { ok: false, step: 'browser', detail: 'Браузер не поддерживает уведомления' };
  if (!('serviceWorker' in navigator))
    return { ok: false, step: 'browser', detail: 'Service Worker не поддерживается' };

  step('Запрашиваю разрешение...');
  let permission: NotificationPermission;
  try {
    permission = await Notification.requestPermission();
  } catch (e) {
    return { ok: false, step: 'permission', detail: String(e) };
  }
  if (permission !== 'granted') {
    return {
      ok: false,
      step: 'permission',
      detail: `Разрешение: "${permission}". Разрешите уведомления через иконку замка в адресной строке браузера.`,
    };
  }

  step('Регистрирую Service Worker...');
  let sw: ServiceWorkerRegistration;
  try {
    sw = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    step(`SW зарегистрирован: ${sw.scope}`);
    // Ждём активации если нужно
    if (sw.installing || sw.waiting) {
      step('Жду активации SW...');
      await new Promise<void>((resolve) => {
        const target = sw.installing ?? sw.waiting!;
        target.addEventListener('statechange', function handler() {
          if (this.state === 'activated') { resolve(); }
        });
        setTimeout(resolve, 5000);
      });
    }
  } catch (e) {
    return { ok: false, step: 'sw', detail: `Ошибка регистрации SW: ${e}` };
  }

  step('Инициализирую Firebase...');
  let app;
  try {
    app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
  } catch (e) {
    return { ok: false, step: 'firebase_init', detail: String(e) };
  }

  let messaging;
  try {
    messaging = getMessaging(app);
  } catch (e) {
    return { ok: false, step: 'messaging', detail: String(e) };
  }

  step('Получаю FCM токен...');
  let token: string;
  try {
    const tokenPromise = getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: sw });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('getToken завис на 15 сек. Скорее всего неверный VAPID ключ или SW не зарегистрирован.')), 15000)
    );
    token = await Promise.race([tokenPromise, timeoutPromise]);
  } catch (e) {
    return { ok: false, step: 'fcm_token', detail: `${e}` };
  }
  if (!token)
    return { ok: false, step: 'fcm_token', detail: 'FCM вернул пустой токен' };

  try {
    const res = await fetch(PUSH_SUBSCRIBE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': String(userId) },
      body: JSON.stringify({ token, device_info: navigator.userAgent }),
    });
    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, step: 'save_token', detail: `Сервер вернул ${res.status}: ${txt}` };
    }
  } catch (e) {
    return { ok: false, step: 'save_token', detail: `Ошибка сохранения токена: ${e}` };
  }

  localStorage.setItem('fcm_token', token);

  onMessage(messaging, (payload) => {
    const { title, body } = payload.notification || {};
    if (title) new Notification(title, { body: body || '', icon: '/favicon.ico' });
  });

  return { ok: true, token };
}

export function usePushNotifications(userId: number | null) {
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!userId || subscribedRef.current) return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    if (Notification.permission !== 'granted') return;
    if (!localStorage.getItem('fcm_token')) return;
    subscribedRef.current = true;
    subscribeToPush(userId);
  }, [userId]);
}