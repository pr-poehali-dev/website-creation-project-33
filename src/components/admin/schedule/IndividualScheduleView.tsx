import Icon from '@/components/ui/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DaySchedule, UserSchedule, DeleteSlotState } from './types';
import { getUserScheduleForDay, getTotalShifts, isMaximKorelsky } from './utils';

interface IndividualScheduleViewProps {
  schedules: UserSchedule[];
  selectedUser: number | null;
  setSelectedUser: (userId: number) => void;
  weekDays: DaySchedule[];
  confirmRemoveSlot: (userId: number, userName: string, date: string, slotTime: string, slotLabel: string) => void;
  deletingSlot: DeleteSlotState | null;
}

export default function IndividualScheduleView({
  schedules, selectedUser, setSelectedUser,
  weekDays, confirmRemoveSlot, deletingSlot,
}: IndividualScheduleViewProps) {
  const selectedUserData = schedules.find(s => s.user_id === selectedUser);
  const isMaxim = selectedUserData ? isMaximKorelsky(selectedUserData.first_name, selectedUserData.last_name) : false;
  const totalShifts = selectedUserData ? getTotalShifts(selectedUserData.schedule) : 0;

  return (
    <div className="space-y-4">
      {/* Worker selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select
          value={selectedUser?.toString() || ''}
          onValueChange={(val) => setSelectedUser(parseInt(val))}
        >
          <SelectTrigger className="flex-1 md:w-64 md:flex-none h-10 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm focus:border-blue-300">
            <SelectValue placeholder="Выберите промоутера" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 shadow-lg">
            {schedules.map(user => {
              const isM = isMaximKorelsky(user.first_name, user.last_name);
              return (
                <SelectItem
                  key={user.user_id}
                  value={user.user_id.toString()}
                  className="text-gray-700 focus:bg-gray-50 text-sm"
                >
                  {user.first_name} {user.last_name}{isM && ' 👑'}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {selectedUserData && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold flex-shrink-0 ${
              isMaxim ? 'bg-purple-50 text-purple-600 border border-purple-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}>
              <Icon name="CalendarDays" size={14} />
              {totalShifts} {totalShifts === 1 ? 'смена' : totalShifts < 5 ? 'смены' : 'смен'}
            </div>
            {selectedUserData.submitted_at ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 flex-shrink-0">
                <Icon name="CheckCircle" size={13} />
                {new Date(selectedUserData.submitted_at).toLocaleString('ru-RU', {
                  day: '2-digit', month: '2-digit',
                  hour: '2-digit', minute: '2-digit',
                  timeZone: 'Europe/Moscow'
                })}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-gray-400 bg-gray-50 border border-gray-200 flex-shrink-0">
                <Icon name="Clock" size={13} />
                Не сохранён
              </div>
            )}
          </div>
        )}
      </div>

      {/* Days list */}
      {selectedUserData && (
        <div className="space-y-2">
          {weekDays.map(day => {
            const daySchedule = getUserScheduleForDay(selectedUserData.schedule, day.date);
            const activeSlots = day.slots.filter(slot => daySchedule[slot.time]);
            if (activeSlots.length === 0) return null;

            const dayNum = new Date(day.date).getDate();
            const month = (new Date(day.date).getMonth() + 1).toString().padStart(2, '0');

            return (
              <div
                key={day.date}
                className={`flex items-center gap-3 px-3 py-3 rounded-2xl border transition-all ${
                  day.isWeekend ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100 shadow-sm'
                }`}
              >
                {/* Day badge */}
                <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold flex-shrink-0 ${
                  day.isWeekend
                    ? 'bg-orange-400 text-white'
                    : isMaxim
                      ? 'bg-purple-500 text-white'
                      : 'bg-blue-500 text-white'
                }`}>
                  <span className="text-[8px] uppercase tracking-wider opacity-80">{day.dayName}</span>
                  <span className="text-sm leading-none">
                    {dayNum}<span className="text-[8px] font-normal opacity-70">.{month}</span>
                  </span>
                </div>

                {/* Day info + slots */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-700 text-sm leading-tight">{day.dayNameFull}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {activeSlots.map(slot => {
                      const isDeleting = deletingSlot?.userId === selectedUserData.user_id
                        && deletingSlot?.date === day.date
                        && deletingSlot?.slot === slot.time;

                      return (
                        <div key={slot.time} className="relative group flex items-center">
                          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                            isMaxim
                              ? 'bg-purple-50 text-purple-600 border-purple-200'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          }`}>
                            <Icon name="Clock" size={11} />
                            <span className="whitespace-nowrap">{slot.label}</span>
                            <button
                              onClick={() => confirmRemoveSlot(
                                selectedUserData.user_id,
                                `${selectedUserData.first_name} ${selectedUserData.last_name}`,
                                day.date, slot.time, slot.label
                              )}
                              disabled={isDeleting}
                              className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all disabled:opacity-50"
                              title="Удалить смену"
                            >
                              {isDeleting
                                ? <Icon name="Loader2" size={10} className="animate-spin text-red-400" />
                                : <Icon name="X" size={10} className="text-red-400" />
                              }
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!selectedUserData && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-300">
          <Icon name="UserSearch" size={40} className="mb-3" />
          <p className="text-sm text-gray-400">Выберите промоутера</p>
        </div>
      )}
    </div>
  );
}
