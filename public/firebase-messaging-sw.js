importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCQNZuXt4IrVe5PADZ9tW-u0c_jZ1kitqw',
  authDomain: 'imperia-promo.firebaseapp.com',
  projectId: 'imperia-promo',
  storageBucket: 'imperia-promo.firebasestorage.app',
  messagingSenderId: '71242293605',
  appId: '1:71242293605:web:00010f9ccf89330ac0c18c',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  var data = payload.data || {};
  var title = data.title || 'Империя Промо';
  var body = data.body || '';
  self.registration.showNotification(title, {
    body: body,
    icon: '/favicon.ico',
  });
});