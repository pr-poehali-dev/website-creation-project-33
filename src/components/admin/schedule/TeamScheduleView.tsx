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

      {weekDays.map(day => {
        const hasAnyWorkers = day.slots.some(slot => getUsersWorkingOnSlot(day.date, slot.time).length > 0);
        if (!hasAnyWorkers) return null;

        return (
          <Card key={day.date} className="bg-white border-2 border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="mb-3">
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
                </div>
              </div>

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

              {dayStats.length > 0 && (() => {
                const stats = dayStats.find(s => s.date === day.date);
                if (stats && stats.expected > 0) {
                  return (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 font-medium">Прогноз на день:</span>
                        <span className="font-bold text-blue-600">
                          Ожидается {stats.expected} / Факт {stats.actual}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}