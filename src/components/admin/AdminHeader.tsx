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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;700;900&display=swap');`}</style>

      {/* Mobile Header */}
      <div className="md:hidden mb-6 rounded-2xl overflow-hidden" style={{background: 'linear-gradient(135deg, #0a0f1e 0%, #111827 100%)'}}>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background: 'linear-gradient(135deg, #3b82f6, #6366f1)'}}>
              <span style={{fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 14, color: '#fff', letterSpacing: '-1px'}}>И</span>
            </div>
            <div>
              <div style={{fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 18, color: '#fff', letterSpacing: '0.08em', lineHeight: 1}}>ИМПЕРИЯ</div>
              <div style={{fontFamily: 'Montserrat, sans-serif', fontWeight: 300, fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.15em', textTransform: 'uppercase', lineHeight: 1.4}}>рекламное агентство</div>
            </div>
          </div>
          <div className="flex gap-1.5">
            {showHomeButton && onGoHome && (
              <button onClick={onGoHome} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{background: 'rgba(255,255,255,0.08)'}}>
                <Icon name="Home" size={14} className="text-white/70" />
              </button>
            )}
            <button onClick={onOpenGoogleSheets} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{background: 'rgba(255,255,255,0.08)'}}>
              <Icon name="Sheet" size={14} className="text-white/70" />
            </button>
            <button onClick={onLogout} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{background: 'rgba(239,68,68,0.2)'}}>
              <Icon name="LogOut" size={14} className="text-red-400" />
            </button>
          </div>
        </div>
        <div className="h-px mx-4" style={{background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)'}} />
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block mb-8 rounded-2xl overflow-hidden" style={{background: 'linear-gradient(135deg, #0a0f1e 0%, #111827 100%)'}}>
        <div className="px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{background: 'linear-gradient(135deg, #3b82f6, #6366f1)'}}>
              <span style={{fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 20, color: '#fff', letterSpacing: '-1px'}}>И</span>
            </div>
            <div>
              <div style={{fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 32, color: '#fff', letterSpacing: '0.1em', lineHeight: 1}}>ИМПЕРИЯ</div>
              <div style={{fontFamily: 'Montserrat, sans-serif', fontWeight: 300, fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.25em', textTransform: 'uppercase', marginTop: 4}}>рекламное агентство</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showHomeButton && onGoHome && (
              <button onClick={onGoHome} className="h-9 px-3 rounded-xl flex items-center gap-2 transition-all hover:opacity-80" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)'}}>
                <Icon name="Home" size={15} className="text-white/60" />
              </button>
            )}
            <button onClick={onOpenGoogleSheets} className="h-9 px-4 rounded-xl flex items-center gap-2 transition-all hover:opacity-80" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)'}}>
              <Icon name="Sheet" size={15} className="text-white/60" />
              <span style={{fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: 13, color: 'rgba(255,255,255,0.6)'}}>Google Таблицы</span>
            </button>
            <button onClick={onLogout} className="h-9 px-3 rounded-xl flex items-center gap-2 transition-all hover:opacity-80" style={{background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.2)'}}>
              <Icon name="LogOut" size={15} className="text-red-400" />
            </button>
          </div>
        </div>
        <div className="h-px mx-6" style={{background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), rgba(59,130,246,0.4), transparent)'}} />
      </div>
    </>
  );
}
