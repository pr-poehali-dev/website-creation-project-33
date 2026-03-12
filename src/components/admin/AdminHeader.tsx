import React from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface AdminHeaderProps {
  onLogout: () => void;
  onOpenGoogleSheets: () => void;
  onGoHome?: () => void;
  showHomeButton?: boolean;
}

export default function AdminHeader({ onLogout, onOpenGoogleSheets, onGoHome, showHomeButton = false }: AdminHeaderProps) {
  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden mb-6 p-4 rounded-xl relative overflow-hidden shadow-xl" style={{background: 'linear-gradient(135deg, #0f1f3d 0%, #1a3a6b 50%, #0d2d5a 100%)'}}>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, #86efac 0%, transparent 50%)'}} />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white drop-shadow-lg leading-tight tracking-wide">ИМПЕРИЯ</span>
            <span className="text-xs text-white/80 drop-shadow leading-tight">рекламное агентство</span>
          </div>
          <div className="flex gap-1">
            {showHomeButton && onGoHome && (
              <Button
                onClick={onGoHome}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-pink-300/60 px-2 py-1.5 h-8"
                size="sm"
                variant="outline"
              >
                <Icon name="Home" size={14} className="text-white" />
              </Button>
            )}
            <Button
              onClick={onOpenGoogleSheets}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-pink-300/60 px-2 py-1.5 h-8"
              size="sm"
              variant="outline"
            >
              <Icon name="Sheet" size={14} className="text-white" />
            </Button>
            <Button
              onClick={onLogout}
              className="bg-red-600/40 hover:bg-red-600/60 backdrop-blur-sm text-white border-2 border-pink-300/60 px-2 py-1.5 h-8"
              size="sm"
            >
              <Icon name="LogOut" size={14} className="text-white" />
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex justify-center items-center mb-8 p-10 rounded-2xl relative overflow-hidden shadow-xl min-h-[120px]" style={{background: 'linear-gradient(135deg, #0f1f3d 0%, #1a3a6b 50%, #0d2d5a 100%)'}}>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, #86efac 0%, transparent 50%), radial-gradient(circle at 80% 20%, #6ee7b7 0%, transparent 40%)'}} />
        <div className="flex flex-col absolute left-6 z-10">
          <span className="text-5xl font-bold text-white drop-shadow-2xl tracking-widest leading-tight">ИМПЕРИЯ</span>
          <span className="text-base text-white/85 drop-shadow leading-tight tracking-wide">рекламное агентство</span>
        </div>
        <div className="flex items-center gap-3 absolute right-6 z-10">
          {showHomeButton && onGoHome && (
            <Button
              onClick={onGoHome}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-pink-300/60 shadow-xl px-3"
              variant="outline"
              size="sm"
            >
              <Icon name="Home" size={18} className="text-white" />
            </Button>
          )}
          <Button
            onClick={onOpenGoogleSheets}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-pink-300/60 shadow-xl font-semibold"
            variant="outline"
          >
            <Icon name="Sheet" size={16} className="mr-2 text-white" />
            <span className="text-white">Google Таблицы</span>
          </Button>
          <Button
            onClick={onLogout}
            className="bg-red-600/40 hover:bg-red-600/60 backdrop-blur-sm text-white border-2 border-pink-300/60 shadow-xl px-3"
            size="sm"
          >
            <Icon name="LogOut" size={18} className="text-white" />
          </Button>
        </div>
      </div>
    </>
  );
}