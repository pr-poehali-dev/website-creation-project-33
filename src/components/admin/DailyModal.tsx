import React from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { UserStats } from './types';

interface DailyModalProps {
  selectedDate: string | null;
  dailyUserStats: UserStats[];
  dailyLoading: boolean;
  onClose: () => void;
}

export default function DailyModal({ 
  selectedDate, 
  dailyUserStats, 
  dailyLoading, 
  onClose 
}: DailyModalProps) {
  if (!selectedDate) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-black">
                Статистика по пользователям
              </h3>
              <p className="text-gray-600 text-sm md:text-base">
                {new Date(selectedDate).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <Icon name="X" size={16} />
            </Button>
          </div>
        </div>
        
        <div className="p-4 md:p-6 overflow-y-auto">
          {dailyLoading ? (
            <div className="text-center text-gray-600 flex items-center justify-center gap-3 py-8">
              <Icon name="Loader2" size={24} className="animate-spin" />
              Загрузка статистики...
            </div>
          ) : dailyUserStats.length > 0 ? (
            <div className="space-y-3">
              {dailyUserStats.map((user, index) => (
                <div 
                  key={user.email} 
                  className="border border-gray-100 rounded-xl p-3 md:p-4 bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-black text-sm md:text-base">{user.name}</div>
                        <div className="text-xs md:text-sm text-gray-600">{user.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg md:text-xl font-bold text-black mb-1">{user.lead_count}</div>
                      <div className="text-xs text-gray-500 mb-2">всего лидов</div>
                      <div className="flex justify-end gap-3 text-xs">
                        <div className="text-center">
                          <div className="text-sm font-bold text-green-600">{user.contacts}</div>
                          <div className="text-gray-500">контакты</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-bold text-orange-600">{user.approaches}</div>
                          <div className="text-gray-500">подходы</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-600 py-8">
              <Icon name="Users" size={32} className="mx-auto mb-3 opacity-60" />
              <div className="text-lg font-medium">Нет данных</div>
              <div className="text-sm">В этот день лиды не отправлялись</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}