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
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Icon name="ShieldX" size={24} />
              Доступ запрещен
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">У вас нет прав администратора</p>
            <Button onClick={logout} variant="outline">
              Выйти
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Icon name="Shield" size={32} />
            Панель администратора
          </h1>
          <div className="flex items-center gap-4">
            <Button 
              onClick={downloadCSV}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Icon name="Download" size={16} />
              Скачать CSV
            </Button>
            <span className="text-gray-600">Добро пожаловать, {user.name}</span>
            <Button onClick={logout} variant="outline">
              <Icon name="LogOut" size={16} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Icon name="Users" size={16} />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <Icon name="BarChart3" size={16} />
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