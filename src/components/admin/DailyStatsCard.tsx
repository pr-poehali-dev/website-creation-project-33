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
    <Card className="border-gray-200 shadow-lg bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-black text-xl">
          <div className="p-2 rounded-lg bg-gray-100">
            <Icon name="Calendar" size={20} className="text-gray-600" />
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
                border border-gray-100 rounded-xl p-4 transition-all duration-300 bg-white shadow-sm
                ${day.count > 0 
                  ? 'hover:bg-gray-50 hover:shadow-md cursor-pointer hover:border-gray-200' 
                  : 'opacity-60'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-black text-sm md:text-base">
                  {new Date(day.date).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-lg font-bold ${day.count > 0 ? 'text-black' : 'text-gray-400'} mb-1`}>
                      {day.count}
                    </div>
                    <div className="text-xs text-gray-500">всего</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600 mb-1">{day.contacts}</div>
                    <div className="text-xs text-gray-500">контакты</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-orange-600 mb-1">{day.approaches}</div>
                    <div className="text-xs text-gray-500">подходы</div>
                  </div>
                  {day.count > 0 && (
                    <Icon name="ChevronRight" size={16} className="text-gray-400 ml-1" />
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