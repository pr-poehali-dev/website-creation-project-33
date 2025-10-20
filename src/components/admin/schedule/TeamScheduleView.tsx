import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  addSlot: (userId: number, date: string, slotTime: string) => Promise<void>;
  addingSlot: DeleteSlotState | null;
}

export default function TeamScheduleView({
  weekDays,
  schedules,
  getUsersWorkingOnSlot,
  confirmRemoveSlot,
  deletingSlot,
  dayStats,
  addSlot,
  addingSlot
}: TeamScheduleViewProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState<{date: string, slotTime: string, slotLabel: string} | null>(null);
  const [workComments, setWorkComments] = useState<Record<string, Record<string, string>>>({});
  const [savingComment, setSavingComment] = useState<string | null>(null);

  useEffect(() => {
    loadWorkComments();
  }, [weekDays]);

  const loadWorkComments = async () => {
    const comments: Record<string, Record<string, string>> = {};
    
    for (const day of weekDays) {
      try {
        const response = await fetch(
          `https://functions.poehali.dev/1b7f0423-384e-417f-8aea-767e5a1c32b2?work_date=${day.date}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.comments) {
            comments[day.date] = data.comments;
          }
        }
      } catch (error) {
        console.error('Error loading work comments:', error);
      }
    }
    
    setWorkComments(comments);
  };

  const saveComment = async (userName: string, date: string, comment: string) => {
    const key = `${userName}-${date}`;
    setSavingComment(key);
    try {
      const response = await fetch(
        'https://functions.poehali.dev/1b7f0423-384e-417f-8aea-767e5a1c32b2',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_name: userName,
            work_date: date,
            location_comment: comment
          })
        }
      );
      
      if (response.ok) {
        setWorkComments(prev => ({
          ...prev,
          [date]: {
            ...prev[date],
            [userName]: comment
          }
        }));
      }
    } catch (error) {
      console.error('Error saving comment:', error);
    } finally {
      setSavingComment(null);
    }
  };

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

      {daysWithWorkers.map((day) => {
        const isExpanded = expandedDays.has(day.date);
        const stats = dayStats.find(s => s.date === day.date);

        return (
          <Card key={day.date} className="bg-white border-2 border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div 
                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -m-4 p-4 rounded-lg transition-colors"
                onClick={() => toggleDay(day.date)}
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
                <Icon 
                  name={isExpanded ? "ChevronUp" : "ChevronDown"} 
                  size={20} 
                  className="text-gray-400"
                />
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-200">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                {day.slots.map(slot => {
                  const workers = getUsersWorkingOnSlot(day.date, slot.time);
                  const hasMaxim = workers.some(w => isMaximKorelsky(w.first_name, w.last_name));

                  return (
                    <div key={slot.time} className={`${hasMaxim ? 'bg-purple-50 border-2 border-purple-300' : 'bg-green-50 border-2 border-green-300'} p-2 md:p-3 rounded-lg`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs md:text-sm font-semibold ${hasMaxim ? 'text-purple-700' : 'text-green-700'}`}>
                          <Icon name="Clock" size={12} className={`${hasMaxim ? 'text-purple-600' : 'text-green-600'} inline mr-1 md:w-[14px] md:h-[14px]`} />
                          {slot.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${hasMaxim ? 'bg-purple-600' : 'bg-green-600'}`}>
                            {workers.length}
                          </Badge>
                          <button
                            onClick={() => setShowAddModal({date: day.date, slotTime: slot.time, slotLabel: slot.label})}
                            className="text-green-600 hover:text-green-700"
                            title="Добавить промоутера"
                          >
                            <Icon name="Plus" size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {workers.length === 0 ? (
                          <p className="text-xs text-gray-500 italic">Нет промоутеров</p>
                        ) : (
                          workers.map(worker => {
                            const isMaxim = isMaximKorelsky(worker.first_name, worker.last_name);
                            const avgContacts = worker.avg_contacts_per_day || 0;
                            const workerName = `${worker.first_name} ${worker.last_name}`;
                            const commentKey = `${workerName}-${day.date}`;
                            const currentComment = workComments[day.date]?.[workerName] || '';
                            
                            return (
                              <div key={worker.user_id} className="space-y-1">
                                <div className="flex items-center justify-between group">
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
                                    onClick={() => confirmRemoveSlot(worker.user_id, workerName, day.date, slot.time, slot.label)}
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
                                <div className="flex items-center gap-1 ml-2">
                                  <Input
                                    type="text"
                                    placeholder="Место работы (например: Бульвар Дмитрия Донского)"
                                    value={currentComment}
                                    onChange={(e) => {
                                      setWorkComments(prev => ({
                                        ...prev,
                                        [day.date]: {
                                          ...prev[day.date],
                                          [workerName]: e.target.value
                                        }
                                      }));
                                    }}
                                    onBlur={(e) => saveComment(workerName, day.date, e.target.value)}
                                    className="h-7 text-[10px] md:text-xs flex-1"
                                    disabled={savingComment === commentKey}
                                  />
                                  {savingComment === commentKey && (
                                    <Icon name="Loader2" size={12} className="animate-spin text-blue-600 flex-shrink-0" />
                                  )}
                                  {!savingComment && currentComment && (
                                    <Icon name="MapPin" size={12} className="text-green-600 flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
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

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Добавить промоутера</h3>
                <button onClick={() => setShowAddModal(null)} className="text-gray-400 hover:text-gray-600">
                  <Icon name="X" size={20} />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Слот: {showAddModal.slotLabel} • {new Date(showAddModal.date).getDate()}.10
              </p>
              <div className="space-y-2">
                {schedules.map(user => {
                  const alreadyAssigned = user.schedule[showAddModal.date]?.[showAddModal.slotTime];
                  const isAdding = addingSlot?.userId === user.user_id && addingSlot?.date === showAddModal.date && addingSlot?.slot === showAddModal.slotTime;
                  
                  return (
                    <button
                      key={user.user_id}
                      onClick={() => {
                        if (!alreadyAssigned) {
                          addSlot(user.user_id, showAddModal.date, showAddModal.slotTime);
                          setShowAddModal(null);
                        }
                      }}
                      disabled={alreadyAssigned || isAdding}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        alreadyAssigned 
                          ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50' 
                          : 'bg-white border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </span>
                        {isAdding ? (
                          <Icon name="Loader2" size={16} className="animate-spin text-blue-600" />
                        ) : alreadyAssigned ? (
                          <Badge className="bg-green-600 text-xs">Уже в смене</Badge>
                        ) : null}
                      </div>
                      {user.avg_contacts_per_day && user.avg_contacts_per_day > 0 && (
                        <span className="text-xs text-gray-500">
                          Средний показатель: ~{user.avg_contacts_per_day.toFixed(1)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}