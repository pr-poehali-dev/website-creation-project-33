import Icon from '@/components/ui/icon';

interface TimeSlot {
  label: string;
  time: string;
  selected: boolean;
}

interface DaySchedule {
  date: string;
  dayName: string;
  dayNameFull: string;
  isWeekend: boolean;
  slots: TimeSlot[];
}

interface WorkShift {
  date: string;
  start_time: string;
  end_time: string;
  organization_name: string;
  organization_id: number;
}

interface ShiftData {
  location?: string;
  flyers?: string;
  organization?: string;
  location_type?: string;
  location_details?: string;
}

interface ScheduleDayCardProps {
  day: DaySchedule;
  dayIndex: number;
  workShifts: WorkShift[];
  // workComments: { shiftTime: ShiftData } — данные по каждой смене отдельно
  workComments: Record<string, ShiftData>;
  onToggleSlot: (dayIndex: number, slotIndex: number) => void;
  isUkrainian: boolean;
}

export default function ScheduleDayCard({
  day,
  dayIndex,
  workShifts,
  workComments,
  onToggleSlot,
  isUkrainian
}: ScheduleDayCardProps) {
  const dayShifts = workShifts.filter(shift => shift.date === day.date);
  const hasSelectedSlots = day.slots.some(slot => slot.selected);
  const accentColor = day.isWeekend ? 'bg-orange-500' : 'bg-[#001f54]';

  // Получить данные о месте работы для конкретного слота
  const getSlotComment = (slotLabel: string): ShiftData | null => {
    // Ищем точное совпадение по времени смены
    if (workComments[slotLabel]) return workComments[slotLabel];
    // Fallback: legacy данные без привязки к смене (старые записи)
    const legacyKeys = Object.keys(workComments).filter(k => !k.includes(':'));
    if (legacyKeys.length === 0 && workComments.organization) {
      return workComments as unknown as ShiftData;
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sm:pb-3">
        <div className={`w-11 h-11 rounded-xl ${accentColor} text-white flex flex-col items-center justify-center font-bold flex-shrink-0`}>
          <span className="text-[9px] leading-none opacity-80">{day.dayName}</span>
          <span className="text-sm font-bold leading-tight">
            {new Date(day.date).getDate()}.{(new Date(day.date).getMonth() + 1).toString().padStart(2, '0')}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{day.dayNameFull}</p>
          <p className="text-xs text-gray-400">{day.date}</p>
        </div>
      </div>

      <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2">
        {day.slots.map((slot, slotIndex) => {
          const slotComment = getSlotComment(slot.label);
          const hasLocation = slotComment && (slotComment.organization || slotComment.location_type || slotComment.location_details || slotComment.flyers);

          return (
            <div key={slot.time}>
              <button
                onClick={() => onToggleSlot(dayIndex, slotIndex)}
                className={`w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 touch-manipulation active:scale-95 ${
                  slot.selected
                    ? day.isWeekend
                      ? 'bg-orange-500 text-white'
                      : 'bg-[#001f54] text-white'
                    : 'bg-gray-50 text-gray-500 border border-gray-200 active:bg-gray-100'
                }`}
              >
                <Icon name="Clock" size={13} className="opacity-70 flex-shrink-0" />
                <span>{slot.label}</span>
              </button>

              {/* Место работы для этой конкретной смены */}
              {hasLocation && (
                <div className="mt-1.5 space-y-1">
                  {slotComment.organization && (
                    <div className="flex items-center gap-2 bg-purple-50 rounded-xl px-3 py-2">
                      <Icon name="Building2" size={13} className="text-purple-500 flex-shrink-0" />
                      <span className="text-xs text-purple-800 font-medium truncate">{slotComment.organization}</span>
                    </div>
                  )}
                  {slotComment.location_type && (
                    <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2">
                      <Icon name="MapPin" size={13} className="text-blue-500 flex-shrink-0" />
                      <span className="text-xs text-blue-800 font-medium truncate">{slotComment.location_type}</span>
                    </div>
                  )}
                  {slotComment.location_details && (
                    <div className="flex items-center gap-2 bg-indigo-50 rounded-xl px-3 py-2">
                      <Icon name="Navigation" size={13} className="text-indigo-500 flex-shrink-0" />
                      <span className="text-xs text-indigo-800 font-medium truncate">{slotComment.location_details}</span>
                    </div>
                  )}
                  {slotComment.flyers && (
                    <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2">
                      <Icon name="FileText" size={13} className="text-amber-500 flex-shrink-0" />
                      <span className="text-xs text-amber-800 font-medium truncate">{slotComment.flyers}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {dayShifts.length > 0 && hasSelectedSlots && (
        <div className="px-4 pb-4 space-y-2">
          {dayShifts.map((shift, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2.5">
              <Icon name="Briefcase" size={14} className="text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-green-800 truncate">{shift.organization_name}</p>
                <p className="text-[10px] text-green-600">
                  {new Date(shift.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  {' — '}
                  {new Date(shift.end_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-full flex-shrink-0">
                {isUkrainian ? 'Адмін' : 'Админ'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
