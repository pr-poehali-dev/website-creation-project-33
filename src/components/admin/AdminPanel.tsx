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
import OrganizationsTab from './OrganizationsTab';

export default function AdminPanel() {
  const { logout, user } = useAuth();
  const unreadCount = useChatUnread();
  const [adminName, setAdminName] = useState('');
  const [loadingName, setLoadingName] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);

  const openGoogleSheets = () => {
    const sheetId = 'https://docs.google.com/spreadsheets/d/1fH4lgqreRPBoHQadU8Srw7L3bPgT5xa3zyz2idfpptM/edit';
    window.open(sheetId, '_blank');
  };

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



  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#1a2f4f] to-[#0f1e36] flex items-center justify-center p-4">
        <style>{`
          .glass-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          }
        `}</style>
        <div className="max-w-md w-full slide-up">
          <Card className="glass-card border-white/10 shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="flex flex-col md:flex-row items-center justify-center gap-3 text-white text-xl md:text-2xl">
                <div className="p-2 md:p-3 rounded-full bg-red-500/20 shadow-lg">
                  <Icon name="ShieldX" size={24} className="text-red-400 md:w-8 md:h-8" />
                </div>
                Доступ запрещен
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-white/70 mb-6 text-base md:text-lg">У вас нет прав администратора</p>
              <Button 
                onClick={logout} 
                className="w-full glass-button bg-white/10 hover:bg-white/20 text-white h-12 md:h-auto border border-white/20 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
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
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#1a2f4f] to-[#0f1e36] p-4 md:p-6 relative overflow-hidden">
      <style>{`
        /* iOS 18 Spring Animations */
        @keyframes glass-float {
          0%, 100% { 
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
          25% { 
            transform: translate(20px, -15px) rotate(2deg) scale(1.05);
          }
          50% { 
            transform: translate(-10px, 10px) rotate(-1.5deg) scale(0.98);
          }
          75% { 
            transform: translate(-15px, -8px) rotate(1deg) scale(1.02);
          }
        }
        
        @keyframes ios-spring-in {
          0% {
            opacity: 0;
            transform: scale(0.85) translateY(20px);
          }
          50% {
            transform: scale(1.02) translateY(-5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes ios-bounce {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-8px) scale(1.02);
          }
        }
        
        @keyframes shimmer {
          0% { 
            background-position: -1000px 0;
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
          100% { 
            background-position: 1000px 0;
            opacity: 0.5;
          }
        }
        
        @keyframes glow-pulse {
          0%, 100% {
            box-shadow: 
              0 8px 32px 0 rgba(31, 38, 135, 0.37),
              inset 0 0 40px rgba(255, 255, 255, 0.05),
              0 0 20px rgba(255, 255, 255, 0.1);
          }
          50% {
            box-shadow: 
              0 12px 40px 0 rgba(31, 38, 135, 0.5),
              inset 0 0 60px rgba(255, 255, 255, 0.08),
              0 0 30px rgba(255, 255, 255, 0.2);
          }
        }
        
        @keyframes liquid-morph {
          0%, 100% {
            border-radius: 20px;
          }
          25% {
            border-radius: 25px 20px 25px 20px;
          }
          50% {
            border-radius: 20px 25px 20px 25px;
          }
          75% {
            border-radius: 25px 20px 25px 20px;
          }
        }
        
        .glass-panel {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.37),
            inset 0 0 40px rgba(255, 255, 255, 0.05);
          transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          animation: ios-spring-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .glass-panel:hover {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transform: translateY(-4px) scale(1.01);
          box-shadow: 
            0 16px 48px 0 rgba(31, 38, 135, 0.6),
            inset 0 0 60px rgba(255, 255, 255, 0.08),
            0 0 40px rgba(255, 255, 255, 0.15);
          animation: glow-pulse 2s ease-in-out infinite;
        }
        
        .glass-panel:active {
          transform: translateY(-2px) scale(0.99);
          transition: all 0.1s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .glass-button {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }
        
        .glass-button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        
        .glass-button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-3px) scale(1.05);
          box-shadow: 
            0 12px 24px rgba(0, 0, 0, 0.3),
            0 0 20px rgba(255, 255, 255, 0.2);
        }
        
        .glass-button:hover::before {
          width: 300px;
          height: 300px;
        }
        
        .glass-button:active {
          transform: translateY(-1px) scale(0.98);
          transition: all 0.1s ease;
        }
        
        .floating-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.4;
          animation: glass-float 20s infinite ease-in-out;
          will-change: transform;
        }
        
        /* iOS 18 Touch Feedback */
        @media (hover: none) and (pointer: coarse) {
          .glass-panel:active {
            transform: scale(0.97);
            transition: transform 0.1s ease;
          }
          
          .glass-button:active {
            transform: scale(0.95);
            background: rgba(255, 255, 255, 0.25);
          }
          
          * {
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
          }
        }
        
        /* Smooth scrolling iOS style */
        * {
          -webkit-overflow-scrolling: touch;
        }
        
        /* iOS spring bounce on scroll */
        @supports (-webkit-overflow-scrolling: touch) {
          body {
            overscroll-behavior-y: none;
          }
        }
      `}</style>
      
      {/* Floating orbs for atmosphere */}
      <div className="floating-orb w-96 h-96 bg-blue-500 top-0 left-0" style={{ animationDelay: '0s' }} />
      <div className="floating-orb w-80 h-80 bg-purple-500 bottom-0 right-0" style={{ animationDelay: '5s' }} />
      <div className="floating-orb w-64 h-64 bg-cyan-500 top-1/2 left-1/2" style={{ animationDelay: '10s' }} />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Мобильная версия заголовка */}
        <div className="md:hidden mb-6 slide-up glass-panel rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="p-2 rounded-lg bg-white/10">
                <Icon name="Shield" size={20} className="text-white" />
              </div>
              Админ-панель
            </h1>
            <div className="flex gap-2">
              <Button 
                onClick={openGoogleSheets}
                className="glass-button text-white px-3 py-2 border-0"
                size="sm"
              >
                <Icon name="Sheet" size={16} />
              </Button>
              <Button 
                onClick={logout} 
                className="glass-button text-white px-3 py-2 border-0"
                size="sm"
              >
                <Icon name="LogOut" size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Десктопная версия заголовка */}
        <div className="hidden md:flex justify-between items-center mb-8 slide-up glass-panel rounded-3xl p-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white/10">
              <Icon name="Shield" size={32} className="text-white" />
            </div>
            Панель администратора
          </h1>
          <div className="flex items-center gap-4">
            <Button 
              onClick={openGoogleSheets}
              className="glass-button text-white border-0"
            >
              <Icon name="Sheet" size={16} className="mr-2" />
              Google Таблицы
            </Button>
            <Button 
              onClick={logout} 
              className="glass-button text-white border-0"
            >
              <Icon name="LogOut" size={16} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>

        <Tabs defaultValue="pending" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-5 glass-panel h-12 md:h-14 rounded-2xl border-0">
            <TabsTrigger 
              value="pending" 
              className="flex items-center gap-1 md:gap-2 text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-xs md:text-base rounded-xl"
            >
              <Icon name="UserCheck" size={14} className="md:w-[18px] md:h-[18px]" />
              <span className="hidden sm:inline">Заявки</span>
              <span className="sm:hidden">Заяв.</span>
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-1 md:gap-2 text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-xs md:text-base rounded-xl"
            >
              <Icon name="Users" size={14} className="md:w-[18px] md:h-[18px]" />
              <span className="hidden sm:inline">Пользователи</span>
              <span className="sm:hidden">Польз.</span>
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="flex items-center gap-1 md:gap-2 text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-xs md:text-base rounded-xl"
            >
              <Icon name="BarChart3" size={14} className="md:w-[18px] md:h-[18px]" />
              <span className="hidden sm:inline">Рейтинг</span>
              <span className="sm:hidden">Рейт.</span>
            </TabsTrigger>
            <TabsTrigger 
              value="organizations" 
              className="flex items-center gap-1 md:gap-2 text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-xs md:text-base rounded-xl"
            >
              <Icon name="Building2" size={14} className="md:w-[18px] md:h-[18px]" />
              <span className="hidden sm:inline">Организации</span>
              <span className="sm:hidden">Орг.</span>
            </TabsTrigger>
            <TabsTrigger 
              value="chat" 
              className="flex items-center gap-1 md:gap-2 text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-xs md:text-base relative rounded-xl"
            >
              <Icon name="MessageCircle" size={14} className="md:w-[18px] md:h-[18px]" />
              <span className="hidden sm:inline">Чат</span>
              <span className="sm:hidden">Чат</span>
              {unreadCount > 0 && (
                <Badge className="ml-1 h-5 min-w-[20px] flex items-center justify-center bg-red-500 hover:bg-red-500 text-white text-xs px-1 rounded-full">
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

          <TabsContent value="organizations">
            <OrganizationsTab />
          </TabsContent>

          <TabsContent value="chat">
            <AdminChatTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}