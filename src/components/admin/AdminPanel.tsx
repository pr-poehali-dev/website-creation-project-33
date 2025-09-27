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
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-purple-900 to-pink-900">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse"></div>
        </div>
        
        <div className="relative z-10 max-w-md">
          <Card className="glass-effect border-red-400/30 shadow-2xl slide-up">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-3 text-red-400 text-2xl">
                <div className="p-3 rounded-full bg-red-500/20 pulse-glow">
                  <Icon name="ShieldX" size={32} />
                </div>
                Доступ запрещен
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-white/80 mb-6 text-lg">У вас нет прав администратора</p>
              <Button 
                onClick={logout} 
                className="glow-button w-full text-white font-semibold py-3"
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
    <div className="min-h-screen relative overflow-hidden p-4">
      {/* Анимированный фон */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse"></div>
      </div>
      
      {/* Плавающие световые элементы */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 float-animation"></div>
      <div className="absolute top-40 right-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 float-animation" style={{animationDelay: '2s'}}></div>
      <div className="absolute -bottom-8 left-40 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 float-animation" style={{animationDelay: '4s'}}></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-8 slide-up">
          <h1 className="text-4xl font-bold gradient-text flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 pulse-glow">
              <Icon name="Shield" size={36} className="text-white" />
            </div>
            Панель администратора
          </h1>
          <div className="flex items-center gap-4">
            <Button 
              onClick={downloadCSV}
              className="glass-effect border-white/20 text-white hover:bg-white/10 transition-all duration-300"
              variant="ghost"
            >
              <Icon name="Download" size={16} className="mr-2" />
              Скачать CSV
            </Button>
            <span className="text-white/80 text-lg">Добро пожаловать, {user.name}</span>
            <Button 
              onClick={logout} 
              className="glass-effect border-white/20 text-white hover:bg-white/10 transition-all duration-300"
              variant="ghost"
            >
              <Icon name="LogOut" size={16} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6 fade-in">
          <TabsList className="grid w-full grid-cols-2 glass-effect border-white/20 bg-white/5 h-14">
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-2 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white transition-all duration-300"
            >
              <Icon name="Users" size={18} />
              Пользователи
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="flex items-center gap-2 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white transition-all duration-300"
            >
              <Icon name="BarChart3" size={18} />
              Рейтинг
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="slide-up">
            <UsersTab />
          </TabsContent>

          <TabsContent value="stats" className="slide-up">
            <StatsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}