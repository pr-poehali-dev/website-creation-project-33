import React from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { UserStats } from '../types';

interface OrganizationDetailModalProps {
  organizationName: string;
  selectedDate: string;
  dailyUserStats: UserStats[];
  onClose: () => void;
}

export default function OrganizationDetailModal({
  organizationName,
  selectedDate,
  dailyUserStats,
  onClose
}: OrganizationDetailModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" 
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl border-2 border-slate-700" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-slate-100 truncate">
                {organizationName}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Промоутеры за {new Intl.DateTimeFormat('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  timeZone: 'Europe/Moscow'
                }).format(new Date(selectedDate))}
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-slate-700 text-slate-300 flex-shrink-0"
            >
              <Icon name="X" size={16} />
            </Button>
          </div>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="space-y-2">
            {dailyUserStats
              .filter(user => 
                user.organizations?.some(org => org.name === organizationName)
              )
              .map((user, index) => {
                const orgData = user.organizations?.find(org => org.name === organizationName);
                if (!orgData) return null;
                
                return (
                  <div key={user.email} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 border-2 border-cyan-500/30 flex items-center justify-center">
                          <span className="text-cyan-400 font-bold text-sm">{index + 1}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-slate-100 text-sm truncate">
                            {user.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 flex-shrink-0">
                        <div className="text-center">
                          <div className="text-sm font-bold text-green-400">{orgData.contacts}</div>
                          <div className="text-[10px] text-slate-400">контакты</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-bold text-orange-400">{orgData.approaches}</div>
                          <div className="text-[10px] text-slate-400">подходы</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
