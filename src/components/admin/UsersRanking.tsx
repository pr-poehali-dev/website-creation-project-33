import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { UserStats } from './types';

interface UsersRankingProps {
  userStats: UserStats[];
}

export default function UsersRanking({ userStats }: UsersRankingProps) {
  return (
    <Card className="border-[#001f54]/20 shadow-xl bg-white slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-[#001f54] text-xl">
          <div className="p-2 rounded-lg bg-[#001f54]/10">
            <Icon name="Trophy" size={20} className="text-[#001f54]" />
          </div>
          Рейтинг пользователей
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {userStats.map((user, index) => {
            const isTop3 = index < 3;
            const medalColors = ['from-[#001f54] to-[#002b6b]', 'from-gray-400 to-gray-600', 'from-gray-600 to-gray-800'];
            
            return (
              <div 
                key={user.email} 
                className="border-2 border-[#001f54]/10 rounded-xl p-4 hover:bg-[#001f54]/5 transition-all duration-300 bg-white shadow-md hover:shadow-xl hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full ${
                      isTop3 
                        ? `bg-gradient-to-br ${medalColors[index]} text-white font-bold text-sm md:text-base shadow-lg`
                        : 'bg-gray-200 text-gray-700 font-bold text-sm'
                    }`}>
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
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}