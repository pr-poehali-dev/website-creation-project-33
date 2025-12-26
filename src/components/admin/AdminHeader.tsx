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
      <div className="md:hidden mb-6 bg-gray-50 border border-gray-200 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-600">
              <Icon name="Shield" size={20} className="text-white" />
            </div>
            Админ-панель
          </h1>
          <div className="flex gap-2">
            <Button 
              onClick={onOpenGoogleSheets}
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-3 py-2"
              size="sm"
              variant="outline"
            >
              <Icon name="Sheet" size={16} className="text-gray-700" />
            </Button>
            <Button 
              onClick={onLogout} 
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2"
              size="sm"
            >
              <Icon name="LogOut" size={16} className="text-white" />
            </Button>
          </div>
        </div>
      </div>

      <div className="hidden md:flex justify-between items-center mb-8 bg-gray-50 border border-gray-200 p-6 rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="p-3 rounded bg-blue-600">
            <Icon name="Shield" size={32} className="text-white" />
          </div>
          Панель администратора
        </h1>
        <div className="flex items-center gap-3">
          <Button 
            onClick={onOpenGoogleSheets}
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
            variant="outline"
          >
            <Icon name="Sheet" size={16} className="mr-2 text-gray-700" />
            <span className="text-gray-700">Google Таблицы</span>
          </Button>
          <Button 
            onClick={onLogout} 
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Icon name="LogOut" size={16} className="mr-2" />
            Выйти
          </Button>
        </div>
      </div>
    </>
  );
}