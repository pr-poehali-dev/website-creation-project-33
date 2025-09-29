import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { UserStats } from './types';

interface UsersRankingProps {
  userStats: UserStats[];
}

export default function UsersRanking({ userStats }: UsersRankingProps) {
  return (
    <Card className="border-border shadow-sm bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-card-foreground text-xl">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon name="Trophy" size={20} className="text-primary" />
          </div>
          Рейтинг пользователей
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {userStats.map((user, index) => {
            const isTop3 = index < 3;
            const medalColors = ['from-black to-gray-800', 'from-gray-400 to-gray-600', 'from-gray-600 to-gray-800'];
            
            return (
              <div 
                key={user.email} 
                className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-all duration-200 bg-card shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full ${
                      isTop3 
                        ? `bg-gradient-to-br ${medalColors[index]} text-white font-bold text-sm md:text-base shadow-lg`
                        : 'bg-muted text-muted-foreground font-bold text-sm'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-foreground text-sm md:text-base">{user.name}</div>
                      <div className="text-xs md:text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg md:text-xl font-bold text-foreground mb-1">{user.lead_count}</div>
                    <div className="text-xs text-muted-foreground mb-2 font-medium">всего лидов</div>
                    <div className="flex justify-end gap-3 text-xs">
                      <div className="text-center">
                        <div className="text-sm font-bold text-green-700">{user.contacts}</div>
                        <div className="text-muted-foreground text-xs">контакты</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-orange-700">{user.approaches}</div>
                        <div className="text-muted-foreground text-xs">подходы</div>
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