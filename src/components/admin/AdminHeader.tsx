import React from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

interface AdminHeaderProps {
  onLogout: () => void;
  onOpenGoogleSheets: () => void;
  onResetApproaches: () => void;
  resetting: boolean;
  onCleanupOrphanedComments?: () => void;
  cleaningComments?: boolean;
  navigationItems?: Array<{
    view: string;
    icon: string;
    label: string;
    badge?: number;
    active: boolean;
    onClick: () => void;
  }>;
}

export default function AdminHeader({ onLogout, onOpenGoogleSheets, onResetApproaches, resetting, onCleanupOrphanedComments, cleaningComments, navigationItems }: AdminHeaderProps) {
  return (
    <>
      <div className="md:hidden mb-6 bg-gray-50 border border-gray-200 p-4 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://cdn.poehali.dev/files/logo-empire-promo.png" 
              alt="Империя Промо" 
              className="h-10 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
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
        
        {navigationItems && navigationItems.length > 0 && (
          <div className="flex gap-1.5 justify-between">
            {navigationItems.map((item) => (
              <button
                key={item.view}
                onClick={item.onClick}
                className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 flex-shrink-0 ${
                  item.active
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50 scale-110'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:scale-105'
                }`}
                title={item.label}
              >
                <Icon name={item.icon} size={20} className={`transition-transform duration-300 ${item.active ? 'scale-110' : ''}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 min-w-[20px] h-5 animate-pulse">
                    {item.badge}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="hidden md:flex justify-between items-center mb-8 bg-gray-50 border border-gray-200 p-6 rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="p-3 rounded bg-blue-600">
            <Icon name="Shield" size={32} className="text-white" />
          </div>
          Панель администратора
        </h1>
        <div className="flex items-center gap-3">
          {onCleanupOrphanedComments && (
            <Button 
              onClick={onCleanupOrphanedComments}
              disabled={cleaningComments}
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              variant="outline"
            >
              {cleaningComments ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  <span>Очистка...</span>
                </>
              ) : (
                <>
                  <Icon name="Trash2" size={16} className="mr-2" />
                  <span>Очистить мусор</span>
                </>
              )}
            </Button>
          )}
          <Button 
            onClick={onResetApproaches}
            disabled={resetting}
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
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