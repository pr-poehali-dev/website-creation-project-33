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

  // Сортируем пользователей в зависимости от выбранного типа
  const sortedUsers = [...userStats].sort((a, b) => {
    if (rankingType === 'contacts') {
      return b.contacts - a.contacts;
    } else {
      return b.approaches - a.approaches;
    }
  });

  const getRankingTitle = () => {
    if (rankingType === 'contacts') return 'по контактам';
    return 'по подходам';
  };

  return (
    <Card className="border-[#001f54]/20 shadow-xl bg-white slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-[#001f54] text-xl">
          <div className="p-2 rounded-lg bg-[#001f54]/10">
            <Icon name="Trophy" size={20} className="text-[#001f54]" />
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
              : 'bg-white hover:bg-green-50 text-green-600 border-green-200'
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
              : 'bg-white hover:bg-orange-50 text-orange-600 border-orange-200'
            }`}
          >
            <Icon name="Users" size={14} className="mr-1.5" />
            Подходы
          </Button>
        </div>

        <div className="space-y-4">
          {sortedUsers.map((user, index) => {
            const isTop3 = index < 3;
            const medalColors = ['from-[#001f54] to-[#002b6b]', 'from-gray-400 to-gray-600', 'from-gray-600 to-gray-800'];
            
            return (
              <div 
                key={user.email} 
                className={`border-2 rounded-xl p-3 md:p-4 transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02] ${
                  user.duplicates > 0 
                    ? 'border-red-500 bg-red-50 hover:bg-red-100' 
                    : 'border-[#001f54]/10 bg-white hover:bg-[#001f54]/5'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                    <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full ${
                      isTop3 
                        ? `bg-gradient-to-br ${medalColors[index]} text-white font-bold text-sm md:text-base shadow-lg`
                        : 'bg-gray-200 text-gray-700 font-bold text-sm'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-black text-sm md:text-base truncate">{user.name}</div>
                      <div className="text-xs md:text-sm text-gray-600 truncate">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="flex justify-end gap-1.5 md:gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-xs md:text-sm font-bold text-green-600">{user.contacts}</div>
                        <div className="text-[10px] md:text-xs text-gray-500 whitespace-nowrap">контакт</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs md:text-sm font-bold text-orange-600">{user.approaches}</div>
                        <div className="text-[10px] md:text-xs text-gray-500 whitespace-nowrap">подход</div>
                      </div>
                      {user.duplicates > 0 && (
                        <div className="text-center">
                          <div className="text-xs md:text-sm font-bold text-amber-600">{user.duplicates}</div>
                          <div className="text-[10px] md:text-xs text-gray-500 whitespace-nowrap">дубль</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}