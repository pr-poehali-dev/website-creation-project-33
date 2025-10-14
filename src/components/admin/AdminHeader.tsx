import React from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface AdminHeaderProps {
  onLogout: () => void;
  onOpenGoogleSheets: () => void;
}

export default function AdminHeader({ onLogout, onOpenGoogleSheets }: AdminHeaderProps) {
  return (
    <>
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
              onClick={onOpenGoogleSheets}
              className="glass-button text-white px-3 py-2 border-0"
              size="sm"
            >
              <Icon name="Sheet" size={16} />
            </Button>
            <Button 
              onClick={onLogout} 
              className="glass-button text-white px-3 py-2 border-0"
              size="sm"
            >
              <Icon name="LogOut" size={16} />
            </Button>
          </div>
        </div>
      </div>

      <div className="hidden md:flex justify-between items-center mb-8 slide-up glass-panel rounded-3xl p-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <div className="p-3 rounded-xl bg-white/10">
            <Icon name="Shield" size={32} className="text-white" />
          </div>
          Панель администратора
        </h1>
        <div className="flex items-center gap-4">
          <Button 
            onClick={onOpenGoogleSheets}
            className="glass-button text-white border-0"
          >
            <Icon name="Sheet" size={16} className="mr-2" />
            Google Таблицы
          </Button>
          <Button 
            onClick={onLogout} 
            className="glass-button text-white border-0"
          >
            <Icon name="LogOut" size={16} className="mr-2" />
            Выйти
          </Button>
        </div>
      </div>
    </>
  );
}
