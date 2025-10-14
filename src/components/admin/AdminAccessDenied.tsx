import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface AdminAccessDeniedProps {
  onLogout: () => void;
}

export default function AdminAccessDenied({ onLogout }: AdminAccessDeniedProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#1a2f4f] to-[#0f1e36] flex items-center justify-center p-4">
      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        }
      `}</style>
      <div className="max-w-md w-full slide-up">
        <Card className="glass-card border-white/10 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="flex flex-col md:flex-row items-center justify-center gap-3 text-white text-xl md:text-2xl">
              <div className="p-2 md:p-3 rounded-full bg-red-500/20 shadow-lg">
                <Icon name="ShieldX" size={24} className="text-red-400 md:w-8 md:h-8" />
              </div>
              Доступ запрещен
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-white/70 mb-6 text-base md:text-lg">У вас нет прав администратора</p>
            <Button 
              onClick={onLogout} 
              className="w-full glass-button bg-white/10 hover:bg-white/20 text-white h-12 md:h-auto border border-white/20 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              <Icon name="LogOut" size={18} className="mr-2 md:w-5 md:h-5" />
              Выйти
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
