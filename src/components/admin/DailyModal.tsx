import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { UserStats } from './types';
import { formatMoscowDate } from '@/utils/date';

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
  const [expandedUser, setExpandedUser] = React.useState<string | null>(null);
  const [comments, setComments] = React.useState<Record<string, string>>({});
  const [savingComment, setSavingComment] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (selectedDate) {
      fetchComments();
    }
  }, [selectedDate]);

  const fetchComments = async () => {
    try {
      const response = await fetch(
        `https://functions.poehali.dev/1b7f0423-384e-417f-8aea-767e5a1c32b2?work_date=${selectedDate}`
      );
      const data = await response.json();
      setComments(data.comments || {});
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const saveComment = async (userName: string, comment: string) => {
    setSavingComment(userName);
    try {
      const response = await fetch(
        'https://functions.poehali.dev/1b7f0423-384e-417f-8aea-767e5a1c32b2',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_name: userName,
            work_date: selectedDate,
            location_comment: comment
          })
        }
      );
      
      if (response.ok) {
        setComments(prev => ({ ...prev, [userName]: comment }));
      }
    } catch (error) {
      console.error('Error saving comment:', error);
    } finally {
      setSavingComment(null);
    }
  };

  if (!selectedDate) {
    return null;
  }

  const getTypeColor = (type: string) => {
    return type === 'контакт' ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50';
  };

  const getTypeIcon = (type: string) => {
    return type === 'контакт' ? 'Phone' : 'Users';
  };

  const toggleUser = (userName: string) => {
    setExpandedUser(expandedUser === userName ? null : userName);
  };

  const getUserLeads = (userName: string) => {
    return detailedLeads.filter(lead => lead.user_name === userName);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-xl md:text-2xl font-bold text-black truncate">
                Статистика по пользователям
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm md:text-base">
                {formatMoscowDate(selectedDate)}
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-100 flex-shrink-0"
            >
              <Icon name="X" size={16} />
            </Button>
          </div>
        </div>
        
        <div className="p-3 sm:p-4 md:p-6 overflow-y-auto">
          {dailyLoading ? (
            <div className="text-center text-gray-600 flex items-center justify-center gap-3 py-8">
              <Icon name="Loader2" size={20} className="animate-spin sm:w-6 sm:h-6" />
              <span className="text-sm sm:text-base">Загрузка статистики...</span>
            </div>
          ) : dailyUserStats.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              <div className="space-y-3 sm:space-y-4">
                <div className="text-sm sm:text-base md:text-lg font-bold text-[#001f54] mb-2 sm:mb-3">Сводка по пользователям</div>
                {dailyUserStats.map((user, index) => {
                  const userLeads = getUserLeads(user.name);
                  const isExpanded = expandedUser === user.name;
                  
                  return (
                    <div 
                      key={user.email} 
                      className="border-2 border-[#001f54]/10 rounded-xl bg-white shadow-sm overflow-hidden"
                    >
                      <div 
                        onClick={() => toggleUser(user.name)}
                        className="p-3 md:p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                            <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#001f54]/10 text-[#001f54] font-bold text-xs md:text-sm flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-[#001f54] text-xs sm:text-sm md:text-base truncate">{user.name}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                            <div className="flex gap-2 md:gap-3 text-xs">
                              <div className="text-center">
                                <div className="text-sm md:text-base font-bold text-green-600">{user.contacts}</div>
                                <div className="text-[10px] md:text-xs text-gray-500">контакты</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm md:text-base font-bold text-orange-600">{user.approaches}</div>
                                <div className="text-[10px] md:text-xs text-gray-500">подходы</div>
                              </div>
                            </div>
                            <Icon 
                              name={isExpanded ? "ChevronUp" : "ChevronDown"} 
                              size={18} 
                              className="text-[#001f54] md:w-5 md:h-5 flex-shrink-0"
                            />
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 md:pb-4 pt-0 space-y-2 sm:space-y-3">
                          <div className="border-t border-gray-200 pt-2 sm:pt-3">
                            <div className="text-xs sm:text-sm font-semibold text-[#001f54] mb-2">Место работы</div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="text"
                                placeholder=""
                                value={comments[user.name] || ''}
                                onChange={(e) => setComments(prev => ({ ...prev, [user.name]: e.target.value }))}
                                onBlur={(e) => saveComment(user.name, e.target.value)}
                                className="flex-1 text-xs sm:text-sm"
                                disabled={savingComment === user.name}
                              />
                              {savingComment === user.name && (
                                <Icon name="Loader2" size={16} className="animate-spin text-[#001f54] flex-shrink-0" />
                              )}
                              {!savingComment && comments[user.name] && (
                                <Icon name="MapPin" size={16} className="text-green-600 flex-shrink-0" />
                              )}
                            </div>
                          </div>

                          {user.organizations && user.organizations.length > 0 && (
                            <div className="border-t border-gray-200 pt-2 sm:pt-3">
                              <div className="text-xs sm:text-sm font-semibold text-[#001f54] mb-2">Статистика по организациям</div>
                              <div className="space-y-2">
                                {user.organizations.map((org) => (
                                  <div key={org.name} className="bg-gray-50 rounded-lg p-2 sm:p-3">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="font-medium text-[#001f54] text-xs sm:text-sm truncate flex-1">
                                        {org.name}
                                      </div>
                                      <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                                        <div className="text-center">
                                          <div className="text-xs sm:text-sm font-bold text-green-600">{org.contacts}</div>
                                          <div className="text-[9px] sm:text-[10px] text-gray-500">контакты</div>
                                        </div>
                                        <div className="text-center">
                                          <div className="text-xs sm:text-sm font-bold text-orange-600">{org.approaches}</div>
                                          <div className="text-[9px] sm:text-[10px] text-gray-500">подходы</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {userLeads.length > 0 && (
                        <div>
                          <div className="border-t border-gray-200 pt-2 sm:pt-3">
                            <div className="text-xs sm:text-sm font-semibold text-[#001f54] mb-2">Детали по лидам</div>
                            <div className="space-y-1.5 sm:space-y-2">
                              {userLeads.map((lead, idx) => (
                                <div 
                                  key={idx}
                                  className="border border-gray-200 rounded-lg p-2 sm:p-3 bg-gray-50"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                      <Icon 
                                        name={getTypeIcon(lead.lead_type)} 
                                        size={14} 
                                        className={`mt-0.5 flex-shrink-0 sm:w-4 sm:h-4 ${lead.lead_type === 'контакт' ? 'text-green-600' : 'text-orange-600'}`}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                          <Badge className={`text-[10px] sm:text-xs ${getTypeColor(lead.lead_type)}`}>
                                            {lead.lead_type}
                                          </Badge>
                                          <Badge className="text-[10px] sm:text-xs bg-[#001f54]/10 text-[#001f54] truncate max-w-[150px]">
                                            <Icon name="Building2" size={8} className="mr-0.5 sm:mr-1 sm:w-[10px] sm:h-[10px] flex-shrink-0" />
                                            <span className="truncate">{lead.organization}</span>
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
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
                        </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
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