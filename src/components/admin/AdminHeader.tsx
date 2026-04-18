import React from 'react';
import Icon from '@/components/ui/icon';

interface AdminHeaderProps {
  onLogout: () => void;
  onOpenGoogleSheets: () => void;
  onGoHome?: () => void;
  showHomeButton?: boolean;
}

export default function AdminHeader({ onLogout, onOpenGoogleSheets, onGoHome, showHomeButton = false }: AdminHeaderProps) {
  return (
    <header className="mb-6 flex items-center justify-between px-1">
      <div>
        <div className="text-base font-bold text-[#001f54] tracking-wide leading-none">ИМПЕРИЯ ПРОМО</div>
        <div className="text-[11px] text-gray-400 leading-none mt-0.5">рекламное агентство</div>
      </div>

      <div className="flex items-center gap-1.5">
        {showHomeButton && onGoHome && (
          <button
            onClick={onGoHome}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <Icon name="Home" size={16} className="text-gray-600" />
          </button>
        )}
        <button
          onClick={onOpenGoogleSheets}
          className="h-9 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center gap-2 transition-colors"
        >
          <Icon name="Sheet" size={15} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-600 hidden sm:inline">Google Таблицы</span>
        </button>
        <button
          onClick={onLogout}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-red-50 flex items-center justify-center transition-colors group"
        >
          <Icon name="LogOut" size={16} className="text-gray-500 group-hover:text-red-500 transition-colors" />
        </button>
      </div>
    </header>
  );
}
