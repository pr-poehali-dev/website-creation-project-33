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

const VAPID_KEY = 'BG6Ttkt-fQpV58ujGgbAgbelZZdBnVjelhL5pfMcRBCXNepszkFPcPSgQ20AqVrf8WTYYHR7M_QOw9YrLH5SE';
const PUSH_SUBSCRIBE_URL = 'https://functions.poehali.dev/0742cff3-bd80-4025-9b3e-029d5d82c960';

export function usePushNotifications(userId: number | null) {
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!userId || subscribedRef.current) return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    const setup = async () => {
      try {
        const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
        const messaging = getMessaging(app);

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        await navigator.serviceWorker.ready;

        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (!token) return;

        const stored = localStorage.getItem('fcm_token');
        if (stored === token) {
          subscribedRef.current = true;
          return;
        }

        await fetch(PUSH_SUBSCRIBE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': String(userId),
          },
          body: JSON.stringify({
            token,
            device_info: navigator.userAgent,
          }),
        });

        localStorage.setItem('fcm_token', token);
        subscribedRef.current = true;

        onMessage(messaging, (payload) => {
          const { title, body } = payload.notification || {};
          if (title && Notification.permission === 'granted') {
            new Notification(title, { body: body || '', icon: '/favicon.ico' });
          }
        });
      } catch (err) {
        console.error('[Push] setup error:', err);
      }
    };

    setup();
  }, [userId]);
}