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
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Montserrat:wght@300;400&display=swap');`}</style>

      {/* Mobile Header */}
      <div className="md:hidden mb-6 rounded-2xl overflow-hidden shadow-lg" style={{background: 'linear-gradient(135deg, #0f1f3d 0%, #1a3a6b 50%, #0d2d5a 100%)'}}>
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
              <div style={{fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 20, color: '#fff', letterSpacing: '0.18em', lineHeight: 1}}>ИМПЕРИЯ</div>
              <div style={{fontFamily: 'Montserrat, sans-serif', fontWeight: 300, fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.2em', textTransform: 'uppercase', lineHeight: 1.6}}>рекламное агентство</div>
          </div>
          <div className="flex gap-1.5">
            {showHomeButton && onGoHome && (
              <button onClick={onGoHome} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/20" style={{background: 'rgba(255,255,255,0.1)'}}>
                <Icon name="Home" size={14} className="text-white/80" />
              </button>
            )}
            <button onClick={onOpenGoogleSheets} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/20" style={{background: 'rgba(255,255,255,0.1)'}}>
              <Icon name="Sheet" size={14} className="text-white/80" />
            </button>
            <button onClick={onLogout} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{background: 'rgba(239,68,68,0.25)'}}>
              <Icon name="LogOut" size={14} className="text-red-300" />
            </button>
          </div>
        </div>
        <div className="h-px mx-4" style={{background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)'}} />
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block mb-8 rounded-2xl overflow-hidden shadow-xl" style={{background: 'linear-gradient(135deg, #0f1f3d 0%, #1a3a6b 50%, #0d2d5a 100%)'}}>
        <div className="px-8 py-6 flex items-center justify-between">
          <div>
            <div style={{fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 38, color: '#fff', letterSpacing: '0.2em', lineHeight: 1}}>ИМПЕРИЯ</div>
            <div style={{fontFamily: 'Montserrat, sans-serif', fontWeight: 300, fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.28em', textTransform: 'uppercase', marginTop: 6}}>рекламное агентство</div>
          </div>
          <div className="flex items-center gap-2">
            {showHomeButton && onGoHome && (
              <button onClick={onGoHome} className="h-9 px-3 rounded-xl flex items-center gap-2 transition-all hover:bg-white/20" style={{background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)'}}>
                <Icon name="Home" size={15} className="text-white/80" />
              </button>
            )}
            <button onClick={onOpenGoogleSheets} className="h-9 px-4 rounded-xl flex items-center gap-2 transition-all hover:bg-white/20" style={{background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)'}}>
              <Icon name="Sheet" size={15} className="text-white/80" />
              <span style={{fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: 13, color: 'rgba(255,255,255,0.8)'}}>Google Таблицы</span>
            </button>
            <button onClick={onLogout} className="h-9 px-3 rounded-xl flex items-center gap-2 transition-all" style={{background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.25)'}}>
              <Icon name="LogOut" size={15} className="text-red-300" />
            </button>
          </div>
        </div>
        <div className="h-px mx-6" style={{background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)'}} />
      </div>
    </>
  );
}