import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { UserStats } from './types';

interface UsersRankingProps {
  userStats: UserStats[];
}

export default function UsersRanking({ userStats }: UsersRankingProps) {
  // Сортируем пользователей по количеству контактов (по убыванию)
  const sortedUsers = [...userStats].sort((a, b) => b.contacts - a.contacts);

  return (
    <Card className="border-[#001f54]/20 shadow-xl bg-white slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-[#001f54] text-xl">
          <div className="p-2 rounded-lg bg-[#001f54]/10">
            <Icon name="Trophy" size={20} className="text-[#001f54]" />
          </div>
          Рейтинг пользователей (по контактам)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedUsers.map((user, index) => {
            const isTop3 = index < 3;
            const medalColors = ['from-[#001f54] to-[#002b6b]', 'from-gray-400 to-gray-600', 'from-gray-600 to-gray-800'];
            
            return (
              <div 
                key={user.email} 
                className="border-2 border-[#001f54]/10 rounded-xl p-3 md:p-4 hover:bg-[#001f54]/5 transition-all duration-300 bg-white shadow-md hover:shadow-xl hover:scale-[1.02]"
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
                    <div className="text-base md:text-xl font-bold text-black mb-1">{user.lead_count}</div>
                    <div className="text-[10px] md:text-xs text-gray-500 mb-1 md:mb-2 whitespace-nowrap">всего лидов</div>
                    <div className="flex justify-end gap-2 md:gap-3 text-xs">
                      <div className="text-center">
                        <div className="text-xs md:text-sm font-bold text-green-600">{user.contacts}</div>
                        <div className="text-[10px] md:text-xs text-gray-500 whitespace-nowrap">контакт</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs md:text-sm font-bold text-orange-600">{user.approaches}</div>
                        <div className="text-[10px] md:text-xs text-gray-500 whitespace-nowrap">подход</div>
                      </div>
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