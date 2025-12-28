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

      <div className="hidden md:flex justify-center items-center mb-8 bg-teal-900 border-2 border-yellow-500/80 p-6 rounded-2xl relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://cdn.poehali.dev/files/SL-070821-44170-88-scaled-1.jpg" 
            alt="" 
            className="w-full h-full object-cover object-left"
          />
        </div>
        <h1 className="text-4xl font-bold text-white relative z-10 drop-shadow-2xl">
          С Новым Годом!
        </h1>
        <div className="flex items-center gap-3 absolute right-6 z-10">
          <Button 
            onClick={onOpenGoogleSheets}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-yellow-400/80 shadow-xl font-semibold"
            variant="outline"
          >
            <Icon name="Sheet" size={16} className="mr-2 text-white" />
            <span className="text-white">Google Таблицы</span>
          </Button>
          <Button 
            onClick={onLogout} 
            className="bg-red-600/40 hover:bg-red-600/60 backdrop-blur-sm text-white border-2 border-yellow-400/80 shadow-xl font-semibold"
          >
            <Icon name="LogOut" size={16} className="mr-2" />
            Выйти
          </Button>
        </div>
      </div>
    </>
  );
}