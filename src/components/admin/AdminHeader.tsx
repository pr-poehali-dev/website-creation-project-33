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
      <div className="md:hidden mb-6 admin-card p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500">
              <Icon name="Shield" size={20} className="text-white" />
            </div>
            Админ-панель
          </h1>
          <div className="flex gap-2">
            <Button 
              onClick={onOpenGoogleSheets}
              className="admin-button px-3 py-2"
              size="sm"
              variant="outline"
            >
              <Icon name="Sheet" size={16} className="text-slate-600" />
            </Button>
            <Button 
              onClick={onLogout} 
              className="admin-button px-3 py-2"
              size="sm"
              variant="outline"
            >
              <Icon name="LogOut" size={16} className="text-slate-600" />
            </Button>
          </div>
        </div>
      </div>

      <div className="hidden md:flex justify-between items-center mb-8 admin-card p-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-500">
            <Icon name="Shield" size={32} className="text-white" />
          </div>
          Панель администратора
        </h1>
        <div className="flex items-center gap-3">
          <Button 
            onClick={onOpenGoogleSheets}
            className="admin-button"
            variant="outline"
          >
            <Icon name="Sheet" size={16} className="mr-2 text-slate-600" />
            <span className="text-slate-700">Google Таблицы</span>
          </Button>
          <Button 
            onClick={onLogout} 
            className="admin-button-primary"
          >
            <Icon name="LogOut" size={16} className="mr-2" />
            Выйти
          </Button>
        </div>
      </div>
    </>
  );
}