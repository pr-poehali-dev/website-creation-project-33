import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { DailyStats } from './types';

interface DailyStatsCardProps {
  dailyStats: DailyStats[];
  onDayClick: (date: string, count: number) => void;
}

export default function DailyStatsCard({ dailyStats, onDayClick }: DailyStatsCardProps) {
  if (dailyStats.length === 0) {
    return null;
  }

  return (
    <Card className="border-border shadow-lg bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-foreground text-xl">
          <div className="p-2 rounded-lg bg-muted">
            <Icon name="Calendar" size={20} className="text-muted-foreground" />
          </div>
          Статистика за последние дни
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dailyStats.map((day) => (
            <div 
              key={day.date}
              onClick={() => day.count > 0 && onDayClick(day.date, day.count)}
              className={`
                border border-border rounded-xl p-4 transition-all duration-300 bg-card shadow-sm
                ${day.count > 0 
                  ? 'hover:bg-muted hover:shadow-md cursor-pointer hover:border-border' 
                  : 'opacity-60'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground text-sm md:text-base">
                  {new Date(day.date).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-lg font-bold ${day.count > 0 ? 'text-foreground' : 'text-muted-foreground'} mb-1`}>
                      {day.count}
                    </div>
                    <div className="text-xs text-muted-foreground">всего</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600 mb-1">{day.contacts}</div>
                    <div className="text-xs text-muted-foreground">контакты</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-orange-600 mb-1">{day.approaches}</div>
                    <div className="text-xs text-muted-foreground">подходы</div>
                  </div>
                  {day.count > 0 && (
                    <Icon name="ChevronRight" size={16} className="text-muted-foreground ml-1" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}