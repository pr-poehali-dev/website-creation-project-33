import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { DailyStats } from './types';
import { formatMoscowTime } from '@/utils/timeFormat';

interface DailyStatsCardProps {
  dailyStats: DailyStats[];
  onDayClick: (date: string, count: number) => void;
}

interface GroupedStats {
  month: string;
  monthLabel: string;
  days: DailyStats[];
}

export default function DailyStatsCard({ dailyStats, onDayClick }: DailyStatsCardProps) {
  const [showAll, setShowAll] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  
  if (dailyStats.length === 0) {
    return null;
  }

  const groupedByMonth: GroupedStats[] = dailyStats.reduce((acc, day) => {
    const date = new Date(day.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Moscow',
      month: 'long',
      year: 'numeric'
    }).format(date);

    let group = acc.find(g => g.month === monthKey);
    if (!group) {
      group = { month: monthKey, monthLabel, days: [] };
      acc.push(group);
    }
    group.days.push(day);
    return acc;
  }, [] as GroupedStats[]);

  const visibleGroups = showAll ? groupedByMonth : groupedByMonth.slice(0, 1);
  const hasMore = groupedByMonth.length > 1;

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey);
      } else {
        newSet.add(monthKey);
      }
      return newSet;
    });
  };

  return (
    <Card className="bg-slate-900 border-slate-700 rounded-2xl slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="flex items-center gap-2 md:gap-3 text-slate-100 text-lg md:text-xl">
          <div className="p-1.5 md:p-2 rounded-lg bg-slate-800">
            <Icon name="Calendar" size={18} className="text-cyan-400 md:w-5 md:h-5" />
          </div>
          Статистика за последние дни
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 md:space-y-5">
          {visibleGroups.map((group) => {
            const isExpanded = expandedMonths.has(group.month);
            const totalContacts = group.days.reduce((sum, day) => sum + day.contacts, 0);
            const totalApproaches = group.days.reduce((sum, day) => sum + day.approaches, 0);
            
            return (
              <div key={group.month} className="space-y-2">
                <button
                  onClick={() => toggleMonth(group.month)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 transition-all duration-200 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <Icon 
                      name={isExpanded ? "ChevronDown" : "ChevronRight"} 
                      size={16} 
                      className="text-slate-400 transition-transform duration-200"
                    />
                    <div className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-wide">
                      {group.monthLabel}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="text-right">
                      <div className="text-sm md:text-base font-bold text-green-400">{totalContacts}</div>
                      <div className="text-[9px] md:text-[10px] text-slate-400">контакты</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm md:text-base font-bold text-orange-400">{totalApproaches}</div>
                      <div className="text-[9px] md:text-[10px] text-slate-400">подходы</div>
                    </div>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="space-y-2 md:space-y-3">
                    {group.days.map((day) => (
                  <div 
                    key={day.date}
                    onClick={() => day.count > 0 && onDayClick(day.date, day.count)}
                    className={`
                      border-2 border-slate-700 rounded-xl p-3 md:p-4 transition-all duration-300 bg-slate-800/50 shadow-sm
                      ${day.count > 0 
                        ? 'hover:bg-slate-700/50 hover:shadow-lg cursor-pointer hover:border-slate-600 hover:scale-[1.02]' 
                        : 'opacity-60'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-100 text-sm md:text-base">
                        {new Intl.DateTimeFormat('ru-RU', {
                          timeZone: 'Europe/Moscow',
                          day: 'numeric',
                          month: 'short',
                        }).format(new Date(day.date))}
                      </span>
                      <div className="flex items-center gap-2 md:gap-4">
                        <div className="text-right">
                          <div className="text-base md:text-lg font-bold text-green-400 mb-0.5 md:mb-1">{day.contacts}</div>
                          <div className="text-[10px] md:text-xs text-slate-400">контакты</div>
                        </div>
                        <div className="text-right">
                          <div className="text-base md:text-lg font-bold text-orange-400 mb-0.5 md:mb-1">{day.approaches}</div>
                          <div className="text-[10px] md:text-xs text-slate-400">подходы</div>
                        </div>
                        {day.count > 0 && (
                          <Icon name="ChevronRight" size={14} className="text-slate-500 ml-0 md:ml-1 md:w-4 md:h-4" />
                        )}
                      </div>
                    </div>
                  </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="glass-button w-full py-3 px-4 text-sm font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:border-slate-600 hover:shadow-md"
            >
              <span>{showAll ? 'Скрыть' : `Показать ещё ${groupedByMonth.length - 1} ${groupedByMonth.length - 1 === 1 ? 'месяц' : 'месяца'}`}</span>
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