import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { DaySchedule, UserSchedule, DeleteSlotState, DayStats } from './types';
import { isMaximKorelsky } from './utils';

interface TeamScheduleViewProps {
  weekDays: DaySchedule[];
  schedules: UserSchedule[];
  getUsersWorkingOnSlot: (date: string, slotTime: string) => UserSchedule[];
  confirmRemoveSlot: (userId: number, userName: string, date: string, slotTime: string, slotLabel: string) => void;
  deletingSlot: DeleteSlotState | null;
  dayStats: DayStats[];
}

export default function TeamScheduleView({
  weekDays,
  schedules,
  getUsersWorkingOnSlot,
  confirmRemoveSlot,
  deletingSlot,
  dayStats
}: TeamScheduleViewProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const toggleDay = (date: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const daysWithWorkers = weekDays.filter(day => 
    day.slots.some(slot => getUsersWorkingOnSlot(day.date, slot.time).length > 0)
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {weekDays.map(day => (
          <div key={day.date} className={`p-2 md:p-3 rounded-lg text-center border-2 ${day.isWeekend ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className={`text-[10px] md:text-xs font-semibold mb-1 ${day.isWeekend ? 'text-orange-600' : 'text-blue-600'}`}>
              {day.dayName}
            </div>
            <div className="text-xs md:text-lg font-bold text-gray-900">
              {new Date(day.date).getDate()}.10
            </div>
          </div>
        ))}
      </div>

      {daysWithWorkers.map((day, index) => {
        const isExpanded = expandedDays.has(day.date);
        const isFirstDay = index === 0;
        const stats = dayStats.find(s => s.date === day.date);

        return (
          <Card key={day.date} className="bg-white border-2 border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div 
                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -m-4 p-4 rounded-lg transition-colors"
                onClick={() => !isFirstDay && toggleDay(day.date)}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-lg ${day.isWeekend ? 'bg-orange-500' : 'bg-blue-600'} text-white flex flex-col items-center justify-center font-bold text-xs`}>
                    <span>{day.dayName}</span>
                    <span className="text-sm">{new Date(day.date).getDate()}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {day.isWeekend ? 'Выходной' : 'Рабочий день'}
                    </p>
                    <p className="text-xs text-gray-500">{day.date}</p>
                  </div>
                  {stats && stats.expected > 0 && (
                    <span className="text-xs text-gray-600 ml-2 bg-gray-100 px-2 py-1 rounded">
                      {stats.expected} / {stats.actual}
                    </span>
                  )}
                </div>
                {!isFirstDay && (
                  <Icon 
                    name={isExpanded ? "ChevronUp" : "ChevronDown"} 
                    size={20} 
                    className="text-gray-400"
                  />
                )}
              </div>

              {(isFirstDay || isExpanded) && (
                <div className="mt-3 pt-3 border-t border-gray-200">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                {day.slots.map(slot => {
                  const workers = getUsersWorkingOnSlot(day.date, slot.time);
                  if (workers.length === 0) return null;
                  const hasMaxim = workers.some(w => isMaximKorelsky(w.first_name, w.last_name));

                  return (
                    <div key={slot.time} className={`${hasMaxim ? 'bg-purple-50 border-2 border-purple-300' : 'bg-green-50 border-2 border-green-300'} p-2 md:p-3 rounded-lg`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs md:text-sm font-semibold ${hasMaxim ? 'text-purple-700' : 'text-green-700'}`}>
                          <Icon name="Clock" size={12} className={`${hasMaxim ? 'text-purple-600' : 'text-green-600'} inline mr-1 md:w-[14px] md:h-[14px]`} />
                          {slot.label}
                        </span>
                        <Badge className={`text-xs ${hasMaxim ? 'bg-purple-600' : 'bg-green-600'}`}>
                          {workers.length}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {workers.map(worker => {
                          const isMaxim = isMaximKorelsky(worker.first_name, worker.last_name);
                          const avgContacts = worker.avg_contacts_per_day || 0;
                          return (
                            <div key={worker.user_id} className="flex items-center justify-between group">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] md:text-xs text-gray-700">
                                  • {worker.first_name} {worker.last_name}{isMaxim && ' 👑'}
                                </span>
                                {avgContacts > 0 && (
                                  <span className="text-[9px] md:text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                    ~{avgContacts.toFixed(1)}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => confirmRemoveSlot(worker.user_id, `${worker.first_name} ${worker.last_name}`, day.date, slot.time, slot.label)}
                                disabled={deletingSlot?.userId === worker.user_id && deletingSlot?.date === day.date && deletingSlot?.slot === slot.time}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 disabled:opacity-50"
                                title="Удалить смену"
                              >
                                {deletingSlot?.userId === worker.user_id && deletingSlot?.date === day.date && deletingSlot?.slot === slot.time ? (
                                  <Icon name="Loader2" size={14} className="animate-spin" />
                                ) : (
                                  <Icon name="X" size={14} />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {stats && stats.expected > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 font-medium">Прогноз на день:</span>
                    <span className="font-bold text-blue-600">
                      Ожидается {stats.expected} / Факт {stats.actual}
                    </span>
                  </div>
                </div>
              )}
              </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {dayStats.length > 0 && (() => {
        const totalExpected = dayStats.reduce((sum, stat) => sum + stat.expected, 0);
        const totalActual = dayStats.reduce((sum, stat) => sum + stat.actual, 0);
        
        if (totalExpected > 0) {
          return (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 shadow-md">
              <CardContent className="p-3 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon name="TrendingUp" size={20} className="text-white md:w-6 md:h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm md:text-lg font-bold text-gray-900">Итого за неделю</h3>
                      <p className="text-xs md:text-sm text-gray-600">Общий прогноз и результат</p>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <div className="text-lg md:text-2xl font-bold text-blue-600">
                      Ожидается {totalExpected} / Факт {totalActual}
                    </div>
                    {totalActual > 0 && (
                      <div className="text-xs md:text-sm text-gray-600 mt-1">
                        Выполнение: {Math.round((totalActual / totalExpected) * 100)}%
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        }
        return null;
      })()}
    </div>
  );
}