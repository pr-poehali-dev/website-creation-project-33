import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface AdminAccessDeniedProps {
  onLogout: () => void;
}

export default function AdminAccessDenied({ onLogout }: AdminAccessDeniedProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full slide-up">
        <Card className="bg-white border-2 border-gray-200 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="flex flex-col md:flex-row items-center justify-center gap-3 text-gray-900 text-xl md:text-2xl">
              <div className="p-2 md:p-3 rounded-full bg-red-50 shadow-lg">
                <Icon name="ShieldX" size={24} className="text-red-500 md:w-8 md:h-8" />
              </div>
              Доступ запрещен
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6 text-base md:text-lg">У вас нет прав администратора</p>
            <Button 
              onClick={onLogout} 
              className="w-full bg-red-500 hover:bg-red-600 text-white h-12 md:h-auto border border-red-200 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
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