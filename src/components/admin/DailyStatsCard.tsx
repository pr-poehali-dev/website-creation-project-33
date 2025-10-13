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
    <Card className="border-[#001f54]/20 shadow-xl bg-white slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-[#001f54] text-xl">
          <div className="p-2 rounded-lg bg-[#001f54]/10">
            <Icon name="Calendar" size={20} className="text-[#001f54]" />
          </div>
          Статистика за последние дни
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {visibleStats.map((day) => (
            <div 
              key={day.date}
              onClick={() => day.count > 0 && onDayClick(day.date, day.count)}
              className={`
                border-2 border-[#001f54]/10 rounded-xl p-4 transition-all duration-300 bg-white shadow-sm
                ${day.count > 0 
                  ? 'hover:bg-[#001f54]/5 hover:shadow-lg cursor-pointer hover:border-[#001f54]/30 hover:scale-[1.02]' 
                  : 'opacity-60'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#001f54] text-sm md:text-base">
                  {new Intl.DateTimeFormat('ru-RU', {
                    timeZone: 'Europe/Moscow',
                    day: 'numeric',
                    month: 'short',
                  }).format(new Date(day.date))}
                </span>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600 mb-1">{day.contacts}</div>
                    <div className="text-xs text-gray-500">контакты</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-600 mb-1">{day.approaches}</div>
                    <div className="text-xs text-gray-500">подходы</div>
                  </div>
                  {day.count > 0 && (
                    <Icon name="ChevronRight" size={16} className="text-gray-400 ml-1" />
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-3 px-4 text-sm font-medium text-[#001f54] hover:bg-[#001f54]/5 border-2 border-[#001f54]/20 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:border-[#001f54]/40 hover:shadow-md"
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