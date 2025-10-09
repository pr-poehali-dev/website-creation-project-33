import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { User } from './types';

interface UsersMapProps {
  users: User[];
}

export default function UsersMap({ users }: UsersMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const usersWithLocation = users.filter(
    (user) => user.latitude !== null && user.longitude !== null && user.latitude !== undefined && user.longitude !== undefined
  );

  console.log('Total users:', users.length);
  console.log('Users with location:', usersWithLocation.length);
  console.log('Users data:', users.map(u => ({ name: u.name, lat: u.latitude, lon: u.longitude })));

  useEffect(() => {
    if (!mapRef.current || usersWithLocation.length === 0) return;

    const loadYandexMap = () => {
      if (typeof window.ymaps === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://api-maps.yandex.ru/2.1/?apikey=&lang=ru_RU';
        script.async = true;
        script.onload = initMap;
        document.head.appendChild(script);
      } else {
        initMap();
      }
    };

    const initMap = () => {
      window.ymaps.ready(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.destroy();
        }

        const centerLat =
          usersWithLocation.reduce((sum, u) => sum + (u.latitude || 0), 0) /
          usersWithLocation.length;
        const centerLon =
          usersWithLocation.reduce((sum, u) => sum + (u.longitude || 0), 0) /
          usersWithLocation.length;

        mapInstanceRef.current = new window.ymaps.Map(mapRef.current, {
          center: [centerLat, centerLon],
          zoom: usersWithLocation.length === 1 ? 10 : 5,
          controls: ['zoomControl', 'fullscreenControl'],
        });

        usersWithLocation.forEach((user) => {
          if (user.latitude && user.longitude) {
            const placemark = new window.ymaps.Placemark(
              [user.latitude, user.longitude],
              {
                balloonContent: `
                  <div style="padding: 10px;">
                    <strong style="font-size: 14px; color: #001f54;">${user.name}</strong>
                    <p style="margin: 5px 0; color: #666; font-size: 12px;">${user.email}</p>
                    <p style="margin: 5px 0; color: #666; font-size: 12px;">Лидов: ${user.lead_count}</p>
                  </div>
                `,
              },
              {
                preset: 'islands#blueCircleDotIcon',
                iconColor: user.is_online ? '#22c55e' : '#6b7280',
              }
            );
            mapInstanceRef.current.geoObjects.add(placemark);
          }
        });
      });
    };

    loadYandexMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [usersWithLocation]);

  if (usersWithLocation.length === 0) {
    return (
      <Card className="border-[#001f54]/20 shadow-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-[#001f54]">
            <div className="p-2 rounded-lg bg-[#001f54]/10">
              <Icon name="MapPin" size={18} className="text-[#001f54]" />
            </div>
            Карта пользователей
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <Icon name="MapOff" size={48} className="mx-auto mb-3 text-gray-300" />
            <p>Нет данных о местоположении пользователей</p>
            <p className="text-sm mt-2">
              Геолокация запрашивается при входе в систему
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#001f54]/20 shadow-xl bg-white slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-[#001f54]">
          <span className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#001f54]/10">
              <Icon name="MapPin" size={18} className="text-[#001f54]" />
            </div>
            Карта пользователей ({usersWithLocation.length})
          </span>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Онлайн</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-gray-600">Офлайн</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={mapRef}
          className="w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden border border-gray-200"
        />
      </CardContent>
    </Card>
  );
}