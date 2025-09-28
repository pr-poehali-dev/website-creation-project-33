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
        a.download = `leads_export_${new Date().toISOString().slice(0,10)}.csv`;
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
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="flex flex-col md:flex-row items-center justify-center gap-3 text-black text-xl md:text-2xl">
                <div className="p-2 md:p-3 rounded-full bg-gray-100">
                  <Icon name="ShieldX" size={24} className="text-gray-600 md:w-8 md:h-8" />
                </div>
                Доступ запрещен
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6 text-base md:text-lg">У вас нет прав администратора</p>
              <Button 
                onClick={logout} 
                className="w-full bg-black hover:bg-gray-800 text-white h-12 md:h-auto"
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
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Мобильная версия заголовка */}
        <div className="md:hidden mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-black flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gray-100">
                <Icon name="Shield" size={20} className="text-gray-600" />
              </div>
              Админ-панель
            </h1>
            <Button 
              onClick={logout} 
              className="bg-gray-100 hover:bg-gray-200 text-black border border-gray-200 px-3 py-2"
              variant="ghost"
              size="sm"
            >
              <Icon name="LogOut" size={16} />
            </Button>
          </div>
          <div className="text-center mb-4">
            <span className="text-gray-600 text-sm">Добро пожаловать, {user.name}</span>
          </div>
          <Button 
            onClick={downloadCSV}
            className="w-full bg-gray-100 hover:bg-gray-200 text-black border border-gray-200 h-12"
            variant="ghost"
          >
            <Icon name="Download" size={16} className="mr-2" />
            Скачать CSV
          </Button>
        </div>

        {/* Десктопная версия заголовка */}
        <div className="hidden md:flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-black flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gray-100">
              <Icon name="Shield" size={32} className="text-gray-600" />
            </div>
            Панель администратора
          </h1>
          <div className="flex items-center gap-4">
            <Button 
              onClick={downloadCSV}
              className="bg-gray-100 hover:bg-gray-200 text-black border border-gray-200"
              variant="ghost"
            >
              <Icon name="Download" size={16} className="mr-2" />
              Скачать CSV
            </Button>
            <span className="text-gray-600 text-lg">Добро пожаловать, {user.name}</span>
            <Button 
              onClick={logout} 
              className="bg-gray-100 hover:bg-gray-200 text-black border border-gray-200"
              variant="ghost"
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