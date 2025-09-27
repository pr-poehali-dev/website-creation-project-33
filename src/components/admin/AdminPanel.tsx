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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-3 text-blue-900 text-2xl">
                <div className="p-3 rounded-full bg-blue-100">
                  <Icon name="ShieldX" size={32} className="text-blue-600" />
                </div>
                Доступ запрещен
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-blue-600 mb-6 text-lg">У вас нет прав администратора</p>
              <Button 
                onClick={logout} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Icon name="LogOut" size={20} className="mr-2" />
                Выйти
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-100">
              <Icon name="Shield" size={32} className="text-blue-600" />
            </div>
            Панель администратора
          </h1>
          <div className="flex items-center gap-4">
            <Button 
              onClick={downloadCSV}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200"
              variant="ghost"
            >
              <Icon name="Download" size={16} className="mr-2" />
              Скачать CSV
            </Button>
            <span className="text-blue-600 text-lg">Добро пожаловать, {user.name}</span>
            <Button 
              onClick={logout} 
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200"
              variant="ghost"
            >
              <Icon name="LogOut" size={16} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-blue-50 border border-blue-200 h-14">
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-2 text-blue-600 data-[state=active]:bg-white data-[state=active]:text-blue-900 data-[state=active]:shadow-sm transition-all duration-300"
            >
              <Icon name="Users" size={18} />
              Пользователи
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="flex items-center gap-2 text-blue-600 data-[state=active]:bg-white data-[state=active]:text-blue-900 data-[state=active]:shadow-sm transition-all duration-300"
            >
              <Icon name="BarChart3" size={18} />
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