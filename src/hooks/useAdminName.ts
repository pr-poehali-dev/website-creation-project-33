import { useState, useEffect } from 'react';

export function useAdminName() {
  const [adminName, setAdminName] = useState('');
  const [loadingName, setLoadingName] = useState(true);

  useEffect(() => {
    const getAdminName = async () => {
      let userIp = 'unknown';
      
      try {
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipResponse.json();
          userIp = ipData.ip;
        } catch (e1) {
          console.log('Первый API недоступен, пробуем второй...');
          try {
            const ipResponse2 = await fetch('https://api.db-ip.com/v2/free/self');
            const ipData2 = await ipResponse2.json();
            userIp = ipData2.ipAddress;
          } catch (e2) {
            console.log('Второй API недоступен, пробуем третий...');
            const ipResponse3 = await fetch('https://ipapi.co/json/');
            const ipData3 = await ipResponse3.json();
            userIp = ipData3.ip;
          }
        }

        const maksimIPs = ['46.22.51.175'];

        console.log('=== IP DEBUG ===');
        console.log('Текущий IP:', userIp);
        console.log('IP Максима:', maksimIPs);
        console.log('Совпадение:', maksimIPs.includes(userIp));

        if (userIp === 'unknown') {
          setAdminName('Администратор');
        } else if (maksimIPs.includes(userIp)) {
          setAdminName('Максим Корельский');
        } else {
          setAdminName('Виктор Кобиляцкий');
        }
      } catch (error) {
        console.error('Error getting IP:', error);
        setAdminName('Администратор');
      } finally {
        setLoadingName(false);
      }
    };

    getAdminName();
  }, []);

  return { adminName, loadingName };
}
