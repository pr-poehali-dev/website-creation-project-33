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
  const [comments, setComments] = React.useState<Record<string, {location?: string, flyers?: string}>>({});
  const [savingComment, setSavingComment] = React.useState<string | null>(null);
  const [leadsModalUser, setLeadsModalUser] = React.useState<string | null>(null);

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

  const saveComment = async (userName: string, field: 'location' | 'flyers', value: string) => {
    setSavingComment(userName);
    
    const currentData = comments[userName] || {};
    const updatedData = {
      location_comment: field === 'location' ? value : (currentData.location || ''),
      flyers_comment: field === 'flyers' ? value : (currentData.flyers || '')
    };
    
    try {
      const response = await fetch(
        'https://functions.poehali.dev/1b7f0423-384e-417f-8aea-767e5a1c32b2',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_name: userName,
            work_date: selectedDate,
            ...updatedData
          })
        }
      );
      
      if (response.ok) {
        setComments(prev => ({ 
          ...prev, 
          [userName]: {
            location: updatedData.location_comment,
            flyers: updatedData.flyers_comment
          }
        }));
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
    return type === 'контакт' ? 'text-green-400 bg-green-500/20 border-green-500/30' : 'text-orange-400 bg-orange-500/20 border-orange-500/30';
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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-slate-900 rounded-t-2xl sm:rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border-2 border-slate-700">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-xl md:text-2xl font-bold text-slate-100 truncate">
                Статистика за {new Intl.DateTimeFormat('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  timeZone: 'Europe/Moscow'
                }).format(new Date(selectedDate))}
              </h3>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-slate-700 text-slate-300 flex-shrink-0"
            >
              <Icon name="X" size={16} />
            </Button>
          </div>
        </div>
        
        <div className="p-3 sm:p-4 md:p-6 overflow-y-auto">
          {dailyLoading ? (
            <div className="text-center text-slate-300 flex items-center justify-center gap-3 py-8">
              <Icon name="Loader2" size={20} className="animate-spin sm:w-6 sm:h-6 text-cyan-400" />
              <span className="text-sm sm:text-base">Загрузка статистики...</span>
            </div>
          ) : dailyUserStats.length > 0 ? (
            <div className="space-y-4 sm:space-y-5">
              {(() => {
                const orgStats: Record<string, { contacts: number; total: number }> = {};
                
                dailyUserStats.forEach(user => {
                  if (user.organizations) {
                    user.organizations.forEach(org => {
                      if (!orgStats[org.name]) {
                        orgStats[org.name] = { contacts: 0, total: 0 };
                      }
                      orgStats[org.name].contacts += org.contacts;
                      orgStats[org.name].total += org.total;
                    });
                  }
                });

                const orgList = Object.entries(orgStats)
                  .map(([name, stats]) => ({ name, ...stats }))
                  .sort((a, b) => b.total - a.total);

                return orgList.length > 0 ? (
                  <div className="bg-slate-800/50 rounded-xl p-3 sm:p-4 border-2 border-slate-700">
                    <div className="text-sm sm:text-base md:text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
                      <Icon name="Building2" size={20} className="text-cyan-400" />
                      Статистика по организациям
                    </div>
                    <div className="space-y-2">
                      {orgList.map((org) => (
                        <div key={org.name} className="bg-slate-900 border border-slate-700 rounded-lg p-2 sm:p-3 shadow-sm">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium text-slate-100 text-xs sm:text-sm truncate flex-1">
                              {org.name}
                            </div>
                            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                              <div className="text-center">
                                <div className="text-xs sm:text-sm font-bold text-green-400">{org.contacts}</div>
                                <div className="text-[9px] sm:text-[10px] text-slate-400">контакты</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              <div className="space-y-3 sm:space-y-4">
                <div className="text-sm sm:text-base md:text-lg font-bold text-slate-100 mb-2 sm:mb-3 flex items-center gap-2">
                  <Icon name="Users" size={20} className="text-cyan-400" />
                  Сводка по промоутерам
                </div>
                {dailyUserStats.map((user, index) => {
                  const userLeads = getUserLeads(user.name);
                  const isExpanded = expandedUser === user.name;
                  
                  return (
                    <div 
                      key={user.email} 
                      className="border-2 border-slate-700 rounded-xl bg-slate-800/50 shadow-sm overflow-hidden"
                    >
                      <div 
                        onClick={() => toggleUser(user.name)}
                        className="p-3 md:p-4 cursor-pointer hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                            <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs md:text-sm flex-shrink-0 border border-cyan-500/30">
                              {index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-slate-100 text-xs sm:text-sm md:text-base truncate">{user.name}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                            <div className="flex gap-2 md:gap-3 text-xs">
                              <div className="text-center">
                                <div className="text-sm md:text-base font-bold text-green-400">{user.contacts}</div>
                                <div className="text-[10px] md:text-xs text-slate-400">контакты</div>
                              </div>
                            </div>
                            <Icon 
                              name={isExpanded ? "ChevronUp" : "ChevronDown"} 
                              size={18} 
                              className="text-slate-400 md:w-5 md:h-5 flex-shrink-0"
                            />
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 md:pb-4 pt-0 space-y-2 sm:space-y-3">
                          <div className="border-t border-slate-700 pt-2 sm:pt-3 space-y-2">
                            <div>
                              <div className="text-xs sm:text-sm font-semibold text-slate-100 mb-2">Место работы</div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="text"
                                  placeholder="Место работы"
                                  value={comments[user.name]?.location || ''}
                                  onChange={(e) => setComments(prev => ({ 
                                    ...prev, 
                                    [user.name]: { 
                                      ...prev[user.name], 
                                      location: e.target.value 
                                    }
                                  }))}
                                  onBlur={(e) => saveComment(user.name, 'location', e.target.value)}
                                  className="flex-1 text-xs sm:text-sm bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500"
                                  disabled={savingComment === user.name}
                                />
                                {savingComment === user.name && (
                                  <Icon name="Loader2" size={16} className="animate-spin text-cyan-400 flex-shrink-0" />
                                )}
                                {!savingComment && comments[user.name]?.location && (
                                  <Icon name="MapPin" size={16} className="text-green-400 flex-shrink-0" />
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-xs sm:text-sm font-semibold text-slate-100 mb-2">Листовки</div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="text"
                                  placeholder="Листовки"
                                  value={comments[user.name]?.flyers || ''}
                                  onChange={(e) => setComments(prev => ({ 
                                    ...prev, 
                                    [user.name]: { 
                                      ...prev[user.name], 
                                      flyers: e.target.value 
                                    }
                                  }))}
                                  onBlur={(e) => saveComment(user.name, 'flyers', e.target.value)}
                                  className="flex-1 text-xs sm:text-sm bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500"
                                  disabled={savingComment === user.name}
                                />
                                {savingComment === user.name && (
                                  <Icon name="Loader2" size={16} className="animate-spin text-cyan-400 flex-shrink-0" />
                                )}
                                {!savingComment && comments[user.name]?.flyers && (
                                  <Icon name="FileText" size={16} className="text-cyan-400 flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          </div>

                          {user.organizations && user.organizations.length > 0 && (
                            <div className="border-t border-slate-700 pt-2 sm:pt-3">
                              <div className="text-xs sm:text-sm font-semibold text-slate-100 mb-2">Статистика по организациям</div>
                              <div className="space-y-2">
                                {user.organizations.map((org) => (
                                  <div key={org.name} className="bg-slate-900 border border-slate-700 rounded-lg p-2 sm:p-3">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="font-medium text-slate-100 text-xs sm:text-sm truncate flex-1">
                                        {org.name}
                                      </div>
                                      <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                                        <div className="text-center">
                                          <div className="text-xs sm:text-sm font-bold text-green-400">{org.contacts}</div>
                                          <div className="text-[9px] sm:text-[10px] text-slate-400">контакты</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {userLeads.length > 0 && (
                        <div className="border-t border-slate-700 pt-2 sm:pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs sm:text-sm font-semibold text-slate-100">Детали по лидам</div>
                            <Button
                              onClick={() => setLeadsModalUser(user.name)}
                              size="sm"
                              className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs h-7 px-2"
                            >
                              <Icon name="Maximize2" size={12} className="mr-1" />
                              Развернуть
                            </Button>
                          </div>
                          <div className="text-xs text-slate-400">
                            Всего лидов: {userLeads.length}
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
            <div className="text-center text-slate-300 py-8">
              <Icon name="Users" size={32} className="mx-auto mb-3 opacity-60 text-slate-500" />
              <div className="text-lg font-medium">Нет данных</div>
              <div className="text-sm">В этот день лиды не отправлялись</div>
            </div>
          )}
        </div>
      </div>

      {leadsModalUser && (
        <div 
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
          onClick={() => setLeadsModalUser(null)}
        >
          <div 
            className="bg-slate-900 rounded-xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl border-2 border-cyan-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-slate-800 border-b-2 border-cyan-500/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Icon name="List" size={24} className="text-cyan-400" />
                  <div>
                    <h3 className="text-xl font-bold text-slate-100">
                      Детали по лидам
                    </h3>
                    <p className="text-sm text-slate-400">
                      {leadsModalUser} • {getUserLeads(leadsModalUser).length} {getUserLeads(leadsModalUser).length === 1 ? 'лид' : getUserLeads(leadsModalUser).length < 5 ? 'лида' : 'лидов'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setLeadsModalUser(null)}
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 hover:bg-slate-700 text-slate-300"
                >
                  <Icon name="X" size={20} />
                </Button>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(85vh-100px)] scrollbar-thin scrollbar-track-slate-700 scrollbar-thumb-cyan-600 hover:scrollbar-thumb-cyan-500">
              <div className="space-y-2">
                {getUserLeads(leadsModalUser).map((lead, idx) => (
                  <div 
                    key={idx}
                    className="border-2 border-slate-700 rounded-lg p-3 bg-slate-800/50 hover:bg-slate-800 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                            <Icon 
                              name={getTypeIcon(lead.lead_type)} 
                              size={16} 
                              className={lead.lead_type === 'контакт' ? 'text-green-400' : 'text-orange-400'}
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Badge className={`text-xs border ${getTypeColor(lead.lead_type)}`}>
                              {lead.lead_type}
                            </Badge>
                            <Badge className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              <Icon name="Building2" size={12} className="mr-1 flex-shrink-0" />
                              <span>{lead.organization}</span>
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-400">
                            {new Date(lead.created_at).toLocaleString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: 'numeric',
                              month: 'long'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="text-lg font-bold text-cyan-400">
                          #{idx + 1}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}