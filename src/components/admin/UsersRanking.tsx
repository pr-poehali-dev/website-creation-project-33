import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { UserStats } from './types';

interface UsersRankingProps {
  userStats: UserStats[];
}

type RankingType = 'contacts' | 'shifts' | 'avg_per_shift';

interface OrgStats {
  organization_name: string;
  contacts: number;
  shifts: number;
  avg_per_shift: number;
}

interface ShiftDetail {
  organization_name: string;
  date: string;
  contacts: number;
}

export default function UsersRanking({ userStats }: UsersRankingProps) {
  const [rankingType, setRankingType] = useState<RankingType>('contacts');
  const [showAllContacts, setShowAllContacts] = useState(false);
  const [showAllShifts, setShowAllShifts] = useState(false);
  const [showAllAvg, setShowAllAvg] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUserEmail, setExpandedUserEmail] = useState<string | null>(null);
  const [userOrgStats, setUserOrgStats] = useState<Record<string, OrgStats[]>>({});
  const [userShifts, setUserShifts] = useState<Record<string, ShiftDetail[]>>({});

  // Фильтруем пользователей по поисковому запросу и по количеству смен
  const filteredUsers = userStats.filter(user => {
    // Если выбран рейтинг по среднему за смену, показываем только тех, кто отработал более 3 смен
    if (rankingType === 'avg_per_shift' && (user.shifts_count || 0) <= 3) {
      return false;
    }
    
    // Фильтр по поисковому запросу
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  // Сортируем отфильтрованных пользователей в зависимости от выбранного типа
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (rankingType === 'contacts') {
      return b.contacts - a.contacts;
    } else if (rankingType === 'shifts') {
      return (b.shifts_count || 0) - (a.shifts_count || 0);
    } else {
      return (b.avg_per_shift || 0) - (a.avg_per_shift || 0);
    }
  });

  // Определяем, показывать все или только первые 4
  const displayUsers = (() => {
    if (rankingType === 'contacts') {
      return showAllContacts ? sortedUsers : sortedUsers.slice(0, 4);
    } else if (rankingType === 'shifts') {
      return showAllShifts ? sortedUsers : sortedUsers.slice(0, 4);
    } else {
      return showAllAvg ? sortedUsers : sortedUsers.slice(0, 4);
    }
  })();

  const hasMore = sortedUsers.length > 4;
  const isExpanded = (() => {
    if (rankingType === 'contacts') return showAllContacts;
    if (rankingType === 'shifts') return showAllShifts;
    return showAllAvg;
  })();

  const toggleExpand = () => {
    if (rankingType === 'contacts') {
      setShowAllContacts(!showAllContacts);
    } else if (rankingType === 'shifts') {
      setShowAllShifts(!showAllShifts);
    } else {
      setShowAllAvg(!showAllAvg);
    }
  };

  const getRankingTitle = () => {
    if (rankingType === 'contacts') return 'по контактам';
    if (rankingType === 'shifts') return 'по сменам';
    return 'по среднему за смену';
  };

  const fetchUserOrgStats = async (email: string) => {
    if (userOrgStats[email]) {
      return;
    }

    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch('https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken || ''
        },
        body: JSON.stringify({
          action: 'get_user_org_stats',
          email: email
        })
      });

      const data = await response.json();
      if (data.success && data.org_stats) {
        setUserOrgStats(prev => ({
          ...prev,
          [email]: data.org_stats
        }));
      }
    } catch (error) {
      console.error('Error fetching user org stats:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить статистику по организациям',
        variant: 'destructive'
      });
    }
  };

  const fetchUserShifts = async (email: string) => {
    if (userShifts[email]) {
      return;
    }

    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch('https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken || ''
        },
        body: JSON.stringify({
          action: 'get_user_shifts',
          email: email
        })
      });

      const data = await response.json();
      if (data.success && data.shifts) {
        setUserShifts(prev => ({
          ...prev,
          [email]: data.shifts
        }));
      }
    } catch (error) {
      console.error('Error fetching user shifts:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить список смен',
        variant: 'destructive'
      });
    }
  };

  const handleUserClick = async (email: string) => {
    if (rankingType !== 'avg_per_shift' && rankingType !== 'shifts') return;
    
    if (expandedUserEmail === email) {
      setExpandedUserEmail(null);
    } else {
      setExpandedUserEmail(email);
      if (rankingType === 'avg_per_shift') {
        await fetchUserOrgStats(email);
      } else if (rankingType === 'shifts') {
        await fetchUserShifts(email);
      }
    }
  };

  return (
    <Card className="bg-white border-gray-200 rounded-2xl slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
          <div className="p-2 rounded-lg bg-gray-100">
            <Icon name="Trophy" size={20} className="text-gray-900" />
          </div>
          Рейтинг пользователей ({getRankingTitle()})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Поиск по промоутеру */}
        <div className="mb-4">
          <div className="relative">
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Поиск по имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Кнопки выбора типа рейтинга */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            onClick={() => setRankingType('contacts')}
            variant={rankingType === 'contacts' ? 'default' : 'outline'}
            size="sm"
            className={`transition-all duration-300 ${rankingType === 'contacts'
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
              : 'bg-gray-100 hover:bg-gray-100 text-green-400 border-green-400/30'
            }`}
          >
            <Icon name="UserCheck" size={14} className="mr-1.5" />
            Контакты
          </Button>
          <Button
            onClick={() => setRankingType('shifts')}
            variant={rankingType === 'shifts' ? 'default' : 'outline'}
            size="sm"
            className={`transition-all duration-300 ${rankingType === 'shifts'
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
              : 'bg-gray-100 hover:bg-gray-100 text-blue-400 border-blue-400/30'
            }`}
          >
            <Icon name="Calendar" size={14} className="mr-1.5" />
            Смены
          </Button>
          <Button
            onClick={() => setRankingType('avg_per_shift')}
            variant={rankingType === 'avg_per_shift' ? 'default' : 'outline'}
            size="sm"
            className={`transition-all duration-300 ${rankingType === 'avg_per_shift'
              ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg'
              : 'bg-gray-100 hover:bg-gray-100 text-purple-400 border-purple-400/30'
            }`}
          >
            <Icon name="TrendingUp" size={14} className="mr-1.5" />
            Средний
          </Button>
        </div>

        <div className="space-y-4">
          {displayUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Icon name="Search" size={32} className="mx-auto mb-2 opacity-50" />
              <div className="text-sm">Промоутеры не найдены</div>
            </div>
          ) : (
            displayUsers.map((user, index) => {
            const isTop3 = index < 3;
            const medals = ['🥇', '🥈', '🥉'];
            
            const isExpanded = expandedUserEmail === user.email;
            const orgStats = userOrgStats[user.email] || [];
            
            return (
              <div 
                key={user.email} 
                className={`border-2 rounded-xl transition-all duration-300 shadow-md hover:shadow-xl ${
                  user.duplicates > 0 
                    ? 'border-red-500/50 bg-red-50' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div 
                  className={`p-3 md:p-4 flex items-center justify-between gap-2 ${
                    (rankingType === 'avg_per_shift' || rankingType === 'shifts') ? 'cursor-pointer hover:bg-gray-50' : ''
                  }`}
                  onClick={() => handleUserClick(user.email)}
                >
                  <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                    <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 md:w-14 md:h-14 text-2xl md:text-3xl">
                      {isTop3 ? medals[index] : (
                        <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 text-gray-600 font-bold text-sm">
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-black text-base md:text-lg truncate">
                        {user.name || 'Без имени'}
                      </div>
                      <div className="text-xs md:text-sm text-gray-600 truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="flex justify-end gap-1.5 md:gap-2 text-xs">
                      {rankingType === 'contacts' && (
                        <div className="text-center">
                          <div className="text-xs md:text-sm font-bold text-green-600">К: {user.contacts}</div>
                          <div className="text-[10px] md:text-xs text-gray-600 whitespace-nowrap">контакт</div>
                        </div>
                      )}
                      {rankingType === 'shifts' && (
                        <>
                          <div className="text-center">
                            <div className="text-xs md:text-sm font-bold text-blue-600">{user.shifts_count || 0}</div>
                            <div className="text-[10px] md:text-xs text-gray-600 whitespace-nowrap">смен</div>
                          </div>
                          <Icon 
                            name={isExpanded ? "ChevronUp" : "ChevronDown"} 
                            size={16} 
                            className="text-gray-400 ml-2"
                          />
                        </>
                      )}
                      {rankingType === 'avg_per_shift' && (
                        <>
                          <div className="text-center">
                            <div className="text-xs md:text-sm font-bold text-purple-600">~{user.avg_per_shift || 0}</div>
                            <div className="text-[10px] md:text-xs text-gray-600 whitespace-nowrap">за см</div>
                          </div>
                          <Icon 
                            name={isExpanded ? "ChevronUp" : "ChevronDown"} 
                            size={16} 
                            className="text-gray-400 ml-2"
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Детализация по организациям (для avg_per_shift) */}
                {rankingType === 'avg_per_shift' && isExpanded && (
                  <div className="border-t border-gray-200 mt-3 pt-3 px-3 md:px-4 pb-3">
                    <div className="text-xs font-semibold text-gray-600 mb-2">Статистика по организациям:</div>
                    {orgStats.length === 0 ? (
                      <div className="text-xs text-gray-500 italic">Загрузка...</div>
                    ) : (
                      <>
                        <div className="space-y-2 mb-3">
                          {orgStats.map((org) => (
                            <div 
                              key={org.organization_name} 
                              className="flex items-center justify-between bg-gray-50 rounded-lg p-2 text-xs"
                            >
                              <div className="font-medium text-gray-700 truncate flex-1 mr-2">
                                {org.organization_name}
                              </div>
                              <div className="flex items-center gap-3 text-[10px] md:text-xs flex-shrink-0">
                                <div className="text-center">
                                  <div className="font-bold text-green-600">{org.contacts}</div>
                                  <div className="text-gray-500">К</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-bold text-blue-600">{org.shifts}</div>
                                  <div className="text-gray-500">См</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-bold text-purple-600">~{org.avg_per_shift}</div>
                                  <div className="text-gray-500">Ср</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Итоговая статистика */}
                        <div className="border-t border-gray-300 pt-2 mt-2">
                          <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 text-xs font-semibold">
                            <div className="text-gray-800">Итого:</div>
                            <div className="flex items-center gap-3 text-xs">
                              <div className="text-center">
                                <div className="font-bold text-green-600">
                                  {orgStats.reduce((sum, org) => sum + org.contacts, 0)}
                                </div>
                                <div className="text-gray-600">К</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-blue-600">
                                  {orgStats.reduce((sum, org) => sum + org.shifts, 0)}
                                </div>
                                <div className="text-gray-600">См</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-purple-600">
                                  ~{(() => {
                                    const totalContacts = orgStats.reduce((sum, org) => sum + org.contacts, 0);
                                    const totalShifts = orgStats.reduce((sum, org) => sum + org.shifts, 0);
                                    return totalShifts > 0 ? (totalContacts / totalShifts).toFixed(1) : '0';
                                  })()}
                                </div>
                                <div className="text-gray-600">Ср</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {/* Детализация по сменам (для shifts) */}
                {rankingType === 'shifts' && isExpanded && (
                  <div className="border-t border-gray-200 mt-3 pt-3 px-3 md:px-4 pb-3">
                    <div className="text-xs font-semibold text-gray-600 mb-2">Все смены:</div>
                    {!userShifts[user.email] ? (
                      <div className="text-xs text-gray-500 italic">Загрузка...</div>
                    ) : userShifts[user.email].length === 0 ? (
                      <div className="text-xs text-gray-500 italic">Нет смен</div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {userShifts[user.email].map((shift, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center justify-between bg-gray-50 rounded-lg p-2 text-xs"
                          >
                            <div className="flex-1 min-w-0 mr-2">
                              <div className="font-medium text-gray-700 truncate">
                                {shift.organization_name}
                              </div>
                              <div className="text-gray-500 text-[10px]">
                                {new Date(shift.date).toLocaleDateString('ru-RU', { 
                                  day: '2-digit', 
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                            <div className="text-center flex-shrink-0">
                              <div className="font-bold text-green-600">{shift.contacts}</div>
                              <div className="text-gray-500 text-[10px]">К</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
          )}
        </div>

        {/* Кнопка Показать еще / Свернуть */}
        {hasMore && (
          <div className="mt-4 flex justify-center">
            <Button
              onClick={toggleExpand}
              variant="outline"
              size="sm"
              className="glass-button bg-gray-100 hover:bg-gray-100 text-gray-900 border-gray-200 transition-all duration-300"
            >
              {isExpanded ? (
                <>
                  <Icon name="ChevronUp" size={16} className="mr-1.5" />
                  Свернуть
                </>
              ) : (
                <>
                  <Icon name="ChevronDown" size={16} className="mr-1.5" />
                  Показать еще ({sortedUsers.length - 4})
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}