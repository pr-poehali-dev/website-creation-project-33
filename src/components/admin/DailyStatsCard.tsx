import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { DailyStats } from './types';
import { formatMoscowTime } from '@/utils/timeFormat';

interface DailyStatsCardProps {
  dailyStats: DailyStats[];
  onDayClick: (date: string, count: number) => void;
}

export default function DailyStatsCard({ dailyStats, onDayClick }: DailyStatsCardProps) {
  const [showAll, setShowAll] = useState(false);
  
  if (dailyStats.length === 0) {
    return null;
  }

  const visibleStats = showAll ? dailyStats : dailyStats.slice(0, 4);
  const hasMore = dailyStats.length > 4;

  return (
    <Card className="bg-gray-800 border-gray-700 rounded-2xl slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="flex items-center gap-2 md:gap-3 text-white text-lg md:text-xl">
          <div className="p-1.5 md:p-2 rounded-lg bg-white/5">
            <Icon name="Calendar" size={18} className="text-white md:w-5 md:h-5" />
          </div>
          Статистика за последние дни
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 md:space-y-3">
          {visibleStats.map((day) => (
            <div 
              key={day.date}
              onClick={() => day.count > 0 && onDayClick(day.date, day.count)}
              className={`
                border-2 border-white/10 rounded-xl p-3 md:p-4 transition-all duration-300 bg-white/5 shadow-sm
                ${day.count > 0 
                  ? 'hover:bg-white/10 hover:shadow-lg cursor-pointer hover:border-white/30 hover:scale-[1.02]' 
                  : 'opacity-60'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-white text-sm md:text-base">
                  {new Intl.DateTimeFormat('ru-RU', {
                    timeZone: 'Europe/Moscow',
                    day: 'numeric',
                    month: 'short',
                  }).format(new Date(day.date))}
                </span>
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="text-right">
                    <div className="text-base md:text-lg font-bold text-green-600 mb-0.5 md:mb-1">{day.contacts}</div>
                    <div className="text-[10px] md:text-xs text-white/50">контакты</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base md:text-lg font-bold text-orange-600 mb-0.5 md:mb-1">{day.approaches}</div>
                    <div className="text-[10px] md:text-xs text-white/50">подходы</div>
                  </div>
                  {day.count > 0 && (
                    <Icon name="ChevronRight" size={14} className="text-white/40 ml-0 md:ml-1 md:w-4 md:h-4" />
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="glass-button w-full py-3 px-4 text-sm font-medium text-white hover:bg-white/10 border-2 border-white/10 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:border-white/30 hover:shadow-md"
            >
              <span>{showAll ? 'Скрыть' : `Показать ещё ${dailyStats.length - 4}`}</span>
              <Icon 
                name={showAll ? "ChevronUp" : "ChevronDown"} 
                size={16} 
                className="transition-transform duration-300" 
              />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}