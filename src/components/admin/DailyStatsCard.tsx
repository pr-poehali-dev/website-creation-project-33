import React, { useState } from 'react';
import Icon from '@/components/ui/icon';
import { DailyStats } from './types';

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

  if (dailyStats.length === 0) return null;

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
      if (newSet.has(monthKey)) newSet.delete(monthKey);
      else newSet.add(monthKey);
      return newSet;
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
          <Icon name="Calendar" size={18} className="text-blue-500" />
        </div>
        <h2 className="font-semibold text-gray-800 text-base">Статистика за последние дни</h2>
      </div>

      <div className="p-5 space-y-3">
        {visibleGroups.map((group) => {
          const isExpanded = expandedMonths.has(group.month);
          const totalContacts = group.days.reduce((sum, day) => sum + day.contacts, 0);

          return (
            <div key={group.month}>
              <button
                onClick={() => toggleMonth(group.month)}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Icon
                    name={isExpanded ? 'ChevronDown' : 'ChevronRight'}
                    size={15}
                    className="text-gray-400"
                  />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {group.monthLabel}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-emerald-500">{totalContacts}</span>
                  <span className="text-xs text-gray-400">контакты</span>
                </div>
              </button>

              {isExpanded && (
                <div className="mt-1 space-y-1.5">
                  {group.days.map((day) => (
                    <div
                      key={day.date}
                      onClick={() => day.count > 0 && onDayClick(day.date, day.count)}
                      className={`
                        rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between transition-all
                        ${day.count > 0 ? 'hover:bg-gray-50 hover:border-gray-200 cursor-pointer' : 'opacity-50'}
                      `}
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {new Intl.DateTimeFormat('ru-RU', {
                          timeZone: 'Europe/Moscow',
                          day: 'numeric',
                          month: 'short',
                        }).format(new Date(day.date))}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-sm font-bold text-emerald-500">{day.contacts}</div>
                          <div className="text-[10px] text-gray-400">контакты</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-bold text-orange-400">{day.approaches}</div>
                          <div className="text-[10px] text-gray-400">подходы</div>
                        </div>
                        {day.approaches > 0 && (
                          <span className="text-xs text-gray-400 font-medium w-8 text-right">
                            {Math.round((day.contacts / day.approaches) * 100)}%
                          </span>
                        )}
                        {day.count > 0 && (
                          <Icon name="ChevronRight" size={14} className="text-gray-300" />
                        )}
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
            className="w-full py-2.5 px-4 text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-gray-100"
          >
            <span>{showAll ? 'Скрыть' : `Показать ещё ${groupedByMonth.length - 1} ${groupedByMonth.length - 1 === 1 ? 'месяц' : 'месяца'}`}</span>
            <Icon name={showAll ? 'ChevronUp' : 'ChevronDown'} size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
