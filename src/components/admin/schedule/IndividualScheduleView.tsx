import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  schedules,
  selectedUser,
  setSelectedUser,
  weekDays,
  confirmRemoveSlot,
  deletingSlot
}: IndividualScheduleViewProps) {
  const selectedUserData = schedules.find(s => s.user_id === selectedUser);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <Select
          value={selectedUser?.toString() || ''}
          onValueChange={(val) => setSelectedUser(parseInt(val))}
        >
          <SelectTrigger className="w-full md:w-64 bg-white border-gray-300 text-gray-900">
            <SelectValue placeholder="Выберите промоутера" />
          </SelectTrigger>
          <SelectContent>
            {schedules.map(user => {
              const isMaxim = isMaximKorelsky(user.first_name, user.last_name);
              return (
                <SelectItem key={user.user_id} value={user.user_id.toString()}>
                  {user.first_name} {user.last_name}{isMaxim && ' 👑'}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {selectedUserData && (
          <Badge className="bg-blue-600 text-white text-sm md:text-lg px-3 md:px-4 py-1 md:py-2">
            {getTotalShifts(selectedUserData.schedule)} смен
          </Badge>
        )}
      </div>

      {selectedUserData && (
        <div className="space-y-3">
          {weekDays.map(day => {
            const daySchedule = getUserScheduleForDay(selectedUserData.schedule, day.date);
            const hasActiveSlots = day.slots.some(slot => daySchedule[slot.time]);
            if (!hasActiveSlots) return null;
            const isMaxim = isMaximKorelsky(selectedUserData.first_name, selectedUserData.last_name);

            return (
              <Card key={day.date} className="bg-white border-2 border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg ${day.isWeekend ? 'bg-orange-500' : 'bg-blue-600'} text-white flex flex-col items-center justify-center font-bold`}>
                        <span className="text-xs">{day.dayName}</span>
                        <span className="text-lg">{new Date(day.date).getDate()}.10</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {day.dayNameFull}
                        </p>
                        <p className="text-xs text-gray-600">{day.date}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {day.slots.map(slot => {
                        if (!daySchedule[slot.time]) return null;

                        return (
                          <div key={slot.time} className="relative group">
                            <Badge className={`${isMaxim ? 'bg-purple-600' : 'bg-green-600'} pr-7`}>
                              <Icon name="Clock" size={14} className="mr-1" />
                              {slot.label}
                            </Badge>
                            <button
                              onClick={() => confirmRemoveSlot(selectedUserData.user_id, `${selectedUserData.first_name} ${selectedUserData.last_name}`, day.date, slot.time, slot.label)}
                              disabled={deletingSlot?.userId === selectedUserData.user_id && deletingSlot?.date === day.date && deletingSlot?.slot === slot.time}
                              className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-red-200 disabled:opacity-50"
                              title="Удалить смену"
                            >
                              {deletingSlot?.userId === selectedUserData.user_id && deletingSlot?.date === day.date && deletingSlot?.slot === slot.time ? (
                                <Icon name="Loader2" size={12} className="animate-spin" />
                              ) : (
                                <Icon name="X" size={12} />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}