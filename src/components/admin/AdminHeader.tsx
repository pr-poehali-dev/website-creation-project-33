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

      <div className="hidden md:flex justify-between items-center mb-8 bg-gray-900 border border-yellow-500/50 p-6 rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://cdn.poehali.dev/files/SL-070821-44170-88-scaled-1.jpg" 
            alt="" 
            className="w-full h-full object-cover object-left"
          />
        </div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 relative z-10 drop-shadow-lg">
          <div className="p-3 rounded bg-red-600 border-2 border-yellow-400">
            <Icon name="Sparkles" size={32} className="text-white" />
          </div>
          С Новым Годом!
        </h1>
        <div className="flex items-center gap-3 relative z-10">
          <Button 
            onClick={onOpenGoogleSheets}
            className="bg-white/95 hover:bg-white text-gray-700 border border-gray-300 shadow-lg"
            variant="outline"
          >
            <Icon name="Sheet" size={16} className="mr-2 text-gray-700" />
            <span className="text-gray-700">Google Таблицы</span>
          </Button>
          <Button 
            onClick={onLogout} 
            className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
          >
            <Icon name="LogOut" size={16} className="mr-2" />
            Выйти
          </Button>
        </div>
      </div>
    </>
  );
}