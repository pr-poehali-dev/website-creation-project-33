import React from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useTheme } from '@/contexts/ThemeContext';

interface AdminHeaderProps {
  onLogout: () => void;
  onOpenGoogleSheets: () => void;
  onResetApproaches: () => void;
  resetting: boolean;
}

export default function AdminHeader({ onLogout, onOpenGoogleSheets, onResetApproaches, resetting }: AdminHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <>
      <div className={`md:hidden mb-6 p-4 rounded-lg border transition-colors ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <h1 className={`text-xl font-bold flex items-center gap-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            <div className="p-2 rounded-lg bg-blue-600">
              <Icon name="Shield" size={20} className="text-white" />
            </div>
            Админ-панель
          </h1>
          <div className="flex gap-2">
            <Button 
              onClick={toggleTheme}
              className={`px-3 py-2 border transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
              }`}
              size="sm"
              variant="outline"
              title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
            >
              <Icon name={theme === 'light' ? 'Moon' : 'Sun'} size={16} />
            </Button>
            <Button 
              onClick={onResetApproaches}
              disabled={resetting}
              className={`px-3 py-2 border transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
              }`}
              size="sm"
              variant="outline"
            >
              {resetting ? (
                <Icon name="Loader2" size={16} className="animate-spin" />
              ) : (
                <Icon name="RotateCcw" size={16} />
              )}
            </Button>
            <Button 
              onClick={onOpenGoogleSheets}
              className={`px-3 py-2 border transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
              }`}
              size="sm"
              variant="outline"
            >
              <Icon name="Sheet" size={16} />
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

      <div className={`hidden md:flex justify-between items-center mb-8 p-6 rounded-lg border transition-colors ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-gray-50 border-gray-200'
      }`}>
        <h1 className={`text-3xl font-bold flex items-center gap-3 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          <div className="p-3 rounded bg-blue-600">
            <Icon name="Shield" size={32} className="text-white" />
          </div>
          Панель администратора
        </h1>
        <div className="flex items-center gap-3">
          <Button 
            onClick={toggleTheme}
            className={`border transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
            }`}
            variant="outline"
            title={theme === 'light' ? 'Переключить на тёмную тему' : 'Переключить на светлую тему'}
          >
            <Icon name={theme === 'light' ? 'Moon' : 'Sun'} size={16} className="mr-2" />
            <span>{theme === 'light' ? 'Тёмная' : 'Светлая'}</span>
          </Button>
          <Button 
            onClick={onResetApproaches}
            disabled={resetting}
            className={`border transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
            }`}
            variant="outline"
          >
            {resetting ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                <span>Обнуление...</span>
              </>
            ) : (
              <>
                <Icon name="RotateCcw" size={16} className="mr-2" />
                <span>Обнулить подходы</span>
              </>
            )}
          </Button>
          <Button 
            onClick={onOpenGoogleSheets}
            className={`border transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
            }`}
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