import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { useChatUnread } from '@/hooks/useChatUnread';
import UsersTab from './UsersTab';
import StatsTab from './StatsTab';
import PendingUsers from './PendingUsers';
import AdminChatTab from './AdminChatTab';

export default function AdminPanel() {
  const { logout, user } = useAuth();
  const unreadCount = useChatUnread();
  const [adminName, setAdminName] = useState('');
  const [loadingName, setLoadingName] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const getAdminName = async () => {
      let userIp = 'unknown';
      
      try {
        // Пробуем несколько API для получения IP (с fallback)
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

        // Массив IP адресов Максима
        const maksimIPs = ['46.22.51.175'];

        console.log('=== IP DEBUG ===');
        console.log('Текущий IP:', userIp);
        console.log('IP Максима:', maksimIPs);
        console.log('Совпадение:', maksimIPs.includes(userIp));

        // Проверяем IP и устанавливаем имя
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

    if (user?.is_admin) {
      getAdminName();
    }
  }, [user]);

  // Скрываем приветствие через 1.5 секунды
  useEffect(() => {
    if (!loadingName && showWelcome) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loadingName, showWelcome]);

  const downloadCSV = async (todayOnly = false) => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      const url = todayOnly 
        ? 'https://functions.poehali.dev/8e6ffbcb-a1f9-453e-9404-fde81533bff7?today=true'
        : 'https://functions.poehali.dev/8e6ffbcb-a1f9-453e-9404-fde81533bff7';
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Session-Token': sessionToken || '',
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        const fileName = todayOnly 
          ? `contacts_today_${new Date().toISOString().slice(0,10)}.csv`
          : `contacts_all_${new Date().toISOString().slice(0,10)}.csv`;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      } else {
        alert('Ошибка при скачивании CSV файла');
      }
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Ошибка при скачивании CSV файла');
    }
  };

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#001f54] via-[#002b6b] to-[#001f54] flex items-center justify-center p-4">
        <div className="max-w-md w-full slide-up">
          <Card className="border-[#001f54]/20 shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="flex flex-col md:flex-row items-center justify-center gap-3 text-[#001f54] text-xl md:text-2xl">
                <div className="p-2 md:p-3 rounded-full bg-red-50 shadow-lg">
                  <Icon name="ShieldX" size={24} className="text-red-600 md:w-8 md:h-8" />
                </div>
                Доступ запрещен
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6 text-base md:text-lg">У вас нет прав администратора</p>
              <Button 
                onClick={logout} 
                className="w-full bg-[#001f54] hover:bg-[#002b6b] text-white h-12 md:h-auto shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                <Icon name="LogOut" size={18} className="mr-2 md:w-5 md:h-5" />
                Выйти
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Экран приветствия
  if (showWelcome && !loadingName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#001f54] via-[#002b6b] to-[#001f54] flex items-center justify-center p-4">
        <style>{`
          @keyframes fadeInScale {
            0% {
              opacity: 0;
              transform: scale(0.9);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes fadeInUp {
            0% {
              opacity: 0;
              transform: translateY(10px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-logo {
            animation: fadeInScale 0.3s ease-out forwards;
          }
          .animate-text {
            animation: fadeInUp 0.3s ease-out 0.1s forwards;
            opacity: 0;
          }
        `}</style>
        
        <div className="text-center">
          {/* Логотип */}
          <div className="mb-8 animate-logo">
            <div className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full bg-white border-4 border-white overflow-hidden flex items-center justify-center p-6 shadow-2xl">
              <img 
                src="https://cdn.poehali.dev/files/fa6288f0-0ab3-43ad-8f04-3db3d36eeddf.jpeg" 
                alt="IMPERIA PROMO"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Приветствие */}
          <div className="space-y-3 animate-text">
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Привет, {adminName}
            </h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7fa] to-[#e8eef5] p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Мобильная версия заголовка */}
        <div className="md:hidden mb-6 slide-up">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-[#001f54] flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#001f54]/10">
                <Icon name="Shield" size={20} className="text-[#001f54]" />
              </div>
              Админ-панель
            </h1>
            <Button 
              onClick={logout} 
              className="bg-[#001f54] hover:bg-[#002b6b] text-white px-3 py-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
              size="sm"
            >
              <Icon name="LogOut" size={16} />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => downloadCSV(false)}
              className="flex-1 bg-white hover:bg-[#001f54]/5 text-[#001f54] border-2 border-[#001f54] h-12 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              <Icon name="Download" size={16} className="mr-2" />
              Общая CSV
            </Button>
            <Button 
              onClick={() => downloadCSV(true)}
              className="flex-1 bg-[#001f54] hover:bg-[#002b6b] text-white border-2 border-[#001f54] h-12 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              <Icon name="Calendar" size={16} className="mr-2" />
              Сегодня CSV
            </Button>
          </div>
        </div>

        {/* Десктопная версия заголовка */}
        <div className="hidden md:flex justify-between items-center mb-8 slide-up">
          <h1 className="text-3xl font-bold text-[#001f54] flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#001f54]/10 shadow-lg">
              <Icon name="Shield" size={32} className="text-[#001f54]" />
            </div>
            Панель администратора
          </h1>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => downloadCSV(false)}
              className="bg-white hover:bg-[#001f54]/5 text-[#001f54] border-2 border-[#001f54] shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              <Icon name="Download" size={16} className="mr-2" />
              Общая CSV
            </Button>
            <Button 
              onClick={() => downloadCSV(true)}
              className="bg-[#001f54] hover:bg-[#002b6b] text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              <Icon name="Calendar" size={16} className="mr-2" />
              Сегодня CSV
            </Button>
            <Button 
              onClick={logout} 
              className="bg-[#001f54] hover:bg-[#002b6b] text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              <Icon name="LogOut" size={16} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>

        <Tabs defaultValue="pending" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-50 border border-gray-200 h-12 md:h-14">
            <TabsTrigger 
              value="pending" 
              className="flex items-center gap-1 md:gap-2 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-300 text-sm md:text-base"
            >
              <Icon name="UserCheck" size={16} className="md:w-[18px] md:h-[18px]" />
              <span className="hidden sm:inline">Заявки</span>
              <span className="sm:hidden">Заяв.</span>
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-1 md:gap-2 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-300 text-sm md:text-base"
            >
              <Icon name="Users" size={16} className="md:w-[18px] md:h-[18px]" />
              <span className="hidden sm:inline">Пользователи</span>
              <span className="sm:hidden">Польз.</span>
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="flex items-center gap-1 md:gap-2 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-300 text-sm md:text-base"
            >
              <Icon name="BarChart3" size={16} className="md:w-[18px] md:h-[18px]" />
              Рейтинг
            </TabsTrigger>
            <TabsTrigger 
              value="chat" 
              className="flex items-center gap-1 md:gap-2 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-300 text-sm md:text-base relative"
            >
              <Icon name="MessageCircle" size={16} className="md:w-[18px] md:h-[18px]" />
              <span className="hidden sm:inline">Чат</span>
              <span className="sm:hidden">Чат</span>
              {unreadCount > 0 && (
                <Badge className="ml-1 h-5 min-w-[20px] flex items-center justify-center bg-red-500 hover:bg-red-500 text-white text-xs px-1">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <PendingUsers sessionToken={localStorage.getItem('session_token') || ''} />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>

          <TabsContent value="stats">
            <StatsTab />
          </TabsContent>

          <TabsContent value="chat">
            <AdminChatTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}