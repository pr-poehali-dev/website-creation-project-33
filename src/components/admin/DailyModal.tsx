import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { UserStats } from './types';

interface DetailedLead {
  user_name: string;
  lead_type: string;
  organization: string;
  created_at: string;
}

interface DailyModalProps {
  selectedDate: string | null;
  dailyUserStats: UserStats[];
  detailedLeads: DetailedLead[];
  dailyLoading: boolean;
  onClose: () => void;
}

export default function DailyModal({ 
  selectedDate, 
  dailyUserStats,
  detailedLeads = [],
  dailyLoading, 
  onClose 
}: DailyModalProps) {
  if (!selectedDate) {
    return null;
  }

  const getTypeColor = (type: string) => {
    return type === 'контакт' ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50';
  };

  const getTypeIcon = (type: string) => {
    return type === 'контакт' ? 'Phone' : 'Users';
  };

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
              <div className="space-y-4">
                <div className="text-lg font-bold text-[#001f54] mb-3">Сводка по пользователям</div>
                {dailyUserStats.map((user, index) => (
                  <div 
                    key={user.email} 
                    className="border-2 border-[#001f54]/10 rounded-xl p-3 md:p-4 bg-white shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#001f54]/10 text-[#001f54] font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-[#001f54] text-sm md:text-base">{user.name}</div>
                          <div className="text-xs md:text-sm text-gray-600">{user.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
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

                {detailedLeads.length > 0 && (
                  <div className="mt-6">
                    <div className="text-lg font-bold text-[#001f54] mb-3">Детали по лидам</div>
                    <div className="space-y-2">
                      {detailedLeads.map((lead, idx) => (
                        <div 
                          key={idx}
                          className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              <Icon 
                                name={getTypeIcon(lead.lead_type)} 
                                size={16} 
                                className={`mt-0.5 ${lead.lead_type === 'контакт' ? 'text-green-600' : 'text-orange-600'}`}
                              />
                              <div className="flex-1">
                                <div className="font-medium text-[#001f54] text-sm">{lead.user_name}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={`text-xs ${getTypeColor(lead.lead_type)}`}>
                                    {lead.lead_type}
                                  </Badge>
                                  <Badge className="text-xs bg-[#001f54]/10 text-[#001f54]">
                                    <Icon name="Building2" size={10} className="mr-1" />
                                    {lead.organization}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 whitespace-nowrap">
                              {new Date(lead.created_at).toLocaleTimeString('ru-RU', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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