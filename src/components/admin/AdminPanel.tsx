import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import UsersTab from './UsersTab';
import StatsTab from './StatsTab';

export default function AdminPanel() {
  const { logout, user } = useAuth();
  const [adminName, setAdminName] = useState('');
  const [loadingName, setLoadingName] = useState(true);

  useEffect(() => {
    const getAdminName = async () => {
      try {
        // Получаем IP пользователя
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        const userIp = ipData.ip;

        // ВРЕМЕННО: показываем IP в консоли для отладки
        console.log('🔍 Ваш IP адрес:', userIp);
        alert(`Ваш IP: ${userIp}`);

        // Проверяем IP и устанавливаем имя
        if (userIp === '188.163.86.214') {
          setAdminName('Максим Корельский');
        } else {
          setAdminName(`Виктор Кобиляцкий (IP: ${userIp})`);
        }
      } catch (error) {
        console.error('Error getting IP:', error);
        setAdminName(user?.name || 'Администратор');
      } finally {
        setLoadingName(false);
      }
    };

    if (user?.is_admin) {
      getAdminName();
    }
  }, [user]);

  const downloadCSV = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch('https://functions.poehali.dev/8e6ffbcb-a1f9-453e-9404-fde81533bff7', {
        method: 'GET',
        headers: {
          'X-Session-Token': sessionToken || '',
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contacts_export_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
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
          <div className="text-center mb-4">
            <span className="text-[#001f54]/70 text-sm font-medium">
              {loadingName ? 'Загрузка...' : `Привет, ${adminName}`}
            </span>
          </div>
          <Button 
            onClick={downloadCSV}
            className="w-full bg-white hover:bg-[#001f54]/5 text-[#001f54] border-2 border-[#001f54] h-12 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            <Icon name="Download" size={16} className="mr-2" />
            Скачать контакты
          </Button>
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
              onClick={downloadCSV}
              className="bg-white hover:bg-[#001f54]/5 text-[#001f54] border-2 border-[#001f54] shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              <Icon name="Download" size={16} className="mr-2" />
              Скачать контакты
            </Button>
            <span className="text-[#001f54]/70 text-lg font-medium">
              {loadingName ? 'Загрузка...' : `Привет, ${adminName}`}
            </span>
            <Button 
              onClick={logout} 
              className="bg-[#001f54] hover:bg-[#002b6b] text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              <Icon name="LogOut" size={16} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-50 border border-gray-200 h-12 md:h-14">
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
          </TabsList>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>

          <TabsContent value="stats">
            <StatsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}