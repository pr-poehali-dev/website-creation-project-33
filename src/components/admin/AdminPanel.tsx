import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import Logo from '@/components/ui/logo';
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Logo size="lg" className="justify-center" />
          </div>
          <Card className="border-border shadow-lg bg-card">
            <CardHeader className="text-center">
              <CardTitle className="flex flex-col items-center gap-4 text-foreground text-xl">
                <div className="p-3 rounded-full bg-destructive/10">
                  <Icon name="ShieldX" size={24} className="text-destructive" />
                </div>
                Доступ запрещен
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground text-base">У вас нет прав администратора для доступа к этой панели</p>
              <Button 
                onClick={logout} 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11"
              >
                <Icon name="LogOut" size={18} className="mr-2" />
                Выйти из системы
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Мобильная версия заголовка */}
        <div className="md:hidden mb-6">
          <div className="flex items-center justify-between mb-4">
            <Logo size="sm" showText={false} />
            <Button 
              onClick={logout} 
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border px-3 py-2"
              variant="ghost"
              size="sm"
            >
              <Icon name="LogOut" size={16} />
            </Button>
          </div>
          <div className="text-center mb-4">
            <h1 className="text-lg font-bold text-foreground">Панель администратора</h1>
            <p className="text-muted-foreground text-sm">Добро пожаловать, {user.name}</p>
          </div>
          <Button 
            onClick={downloadCSV}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12"
          >
            <Icon name="Download" size={16} className="mr-2" />
            Экспорт контактов
          </Button>
        </div>

        {/* Десктопная версия заголовка */}
        <div className="hidden md:flex justify-between items-center mb-8">
          <Logo size="lg" />
          <div className="flex items-center gap-4">
            <Button 
              onClick={downloadCSV}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
            >
              <Icon name="Download" size={16} className="mr-2" />
              Экспорт контактов
            </Button>
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">Администратор</p>
            </div>
            <Button 
              onClick={logout} 
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border"
              variant="outline"
            >
              <Icon name="LogOut" size={16} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-muted border border-border h-12 md:h-14">
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-2 text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200 font-medium"
            >
              <Icon name="Users" size={16} />
              <span className="hidden sm:inline">Пользователи</span>
              <span className="sm:hidden">Польз.</span>
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="flex items-center gap-2 text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200 font-medium"
            >
              <Icon name="BarChart3" size={16} />
              Аналитика
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