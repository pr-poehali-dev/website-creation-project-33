import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { UserStats } from './types';

interface UsersRankingProps {
  userStats: UserStats[];
}

type RankingType = 'contacts' | 'approaches';

export default function UsersRanking({ userStats }: UsersRankingProps) {
  const [rankingType, setRankingType] = useState<RankingType>('contacts');
  const [showAllContacts, setShowAllContacts] = useState(false);
  const [showAllApproaches, setShowAllApproaches] = useState(false);

  // Сортируем пользователей в зависимости от выбранного типа
  const sortedUsers = [...userStats].sort((a, b) => {
    if (rankingType === 'contacts') {
      return b.contacts - a.contacts;
    } else {
      return b.approaches - a.approaches;
    }
  });

  // Определяем, показывать все или только первые 4
  const displayUsers = (() => {
    if (rankingType === 'contacts') {
      return showAllContacts ? sortedUsers : sortedUsers.slice(0, 4);
    } else {
      return showAllApproaches ? sortedUsers : sortedUsers.slice(0, 4);
    }
  })();

  const hasMore = sortedUsers.length > 4;
  const isExpanded = rankingType === 'contacts' ? showAllContacts : showAllApproaches;

  const toggleExpand = () => {
    if (rankingType === 'contacts') {
      setShowAllContacts(!showAllContacts);
    } else {
      setShowAllApproaches(!showAllApproaches);
    }
  };

  const getRankingTitle = () => {
    if (rankingType === 'contacts') return 'по контактам';
    return 'по подходам';
  };

  return (
    <Card className="glass-panel border-white/10 rounded-2xl slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-white text-xl">
          <div className="p-2 rounded-lg bg-white/5">
            <Icon name="Trophy" size={20} className="text-white" />
          </div>
          Рейтинг пользователей ({getRankingTitle()})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Кнопки выбора типа рейтинга */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            onClick={() => setRankingType('contacts')}
            variant={rankingType === 'contacts' ? 'default' : 'outline'}
            size="sm"
            className={`transition-all duration-300 ${rankingType === 'contacts'
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
              : 'bg-white/5 hover:bg-white/10 text-green-400 border-green-400/30'
            }`}
          >
            <Icon name="UserCheck" size={14} className="mr-1.5" />
            Контакты
          </Button>
          <Button
            onClick={() => setRankingType('approaches')}
            variant={rankingType === 'approaches' ? 'default' : 'outline'}
            size="sm"
            className={`transition-all duration-300 ${rankingType === 'approaches'
              ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg'
              : 'bg-white/5 hover:bg-white/10 text-orange-400 border-orange-400/30'
            }`}
          >
            <Icon name="Users" size={14} className="mr-1.5" />
            Подходы
          </Button>
        </div>

        <div className="space-y-4">
          {displayUsers.map((user, index) => {
            const isTop3 = index < 3;
            const medalColors = ['from-[#001f54] to-[#002b6b]', 'from-gray-400 to-gray-600', 'from-gray-600 to-gray-800'];
            
            return (
              <div 
                key={user.email} 
                className={`border-2 rounded-xl p-3 md:p-4 transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02] ${
                  user.duplicates > 0 
                    ? 'border-red-500/50 bg-red-500/10 hover:bg-red-500/20' 
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                    <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full ${
                      isTop3 
                        ? `bg-gradient-to-br ${medalColors[index]} text-white font-bold text-sm md:text-base shadow-lg`
                        : 'bg-white/10 text-white/70 font-bold text-sm'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-white text-sm md:text-base truncate">{user.name}</div>
                      <div className="text-xs md:text-sm text-white/60 truncate">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="flex justify-end gap-1.5 md:gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-xs md:text-sm font-bold text-green-600">{user.contacts}</div>
                        <div className="text-[10px] md:text-xs text-white/50 whitespace-nowrap">контакт</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs md:text-sm font-bold text-orange-600">{user.approaches}</div>
                        <div className="text-[10px] md:text-xs text-white/50 whitespace-nowrap">подход</div>
                      </div>
                      {user.duplicates > 0 && (
                        <div className="text-center">
                          <div className="text-xs md:text-sm font-bold text-amber-600">{user.duplicates}</div>
                          <div className="text-[10px] md:text-xs text-white/50 whitespace-nowrap">дубль</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Кнопка Показать еще / Свернуть */}
        {hasMore && (
          <div className="mt-4 flex justify-center">
            <Button
              onClick={toggleExpand}
              variant="outline"
              size="sm"
              className="glass-button bg-white/5 hover:bg-white/10 text-white border-white/10 transition-all duration-300"
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