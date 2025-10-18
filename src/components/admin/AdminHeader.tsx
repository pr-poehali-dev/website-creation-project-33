import React from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface AdminHeaderProps {
  onLogout: () => void;
  onOpenGoogleSheets: () => void;
  onResetApproaches: () => void;
  onResetOrganizations: () => void;
  resetting: boolean;
}

export default function AdminHeader({ onLogout, onOpenGoogleSheets, onResetApproaches, onResetOrganizations, resetting }: AdminHeaderProps) {
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
              onClick={onResetApproaches}
              disabled={resetting}
              className="admin-button px-3 py-2"
              size="sm"
              variant="outline"
            >
              {resetting ? (
                <Icon name="Loader2" size={16} className="text-slate-600 animate-spin" />
              ) : (
                <Icon name="RotateCcw" size={16} className="text-red-600" />
              )}
            </Button>
            <Button 
              onClick={onResetOrganizations}
              disabled={resetting}
              className="admin-button px-3 py-2"
              size="sm"
              variant="outline"
            >
              <Icon name="Building2" size={16} className="text-orange-600" />
            </Button>
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
            onClick={onResetApproaches}
            disabled={resetting}
            className="admin-button"
            variant="outline"
          >
            {resetting ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 text-slate-600 animate-spin" />
                <span className="text-slate-700">Обнуление...</span>
              </>
            ) : (
              <>
                <Icon name="RotateCcw" size={16} className="mr-2 text-red-600" />
                <span className="text-slate-700">Обнулить подходы</span>
              </>
            )}
          </Button>
          <Button 
            onClick={onResetOrganizations}
            disabled={resetting}
            className="admin-button"
            variant="outline"
          >
            <Icon name="Building2" size={16} className="mr-2 text-orange-600" />
            <span className="text-slate-700">Сбросить организации</span>
          </Button>
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