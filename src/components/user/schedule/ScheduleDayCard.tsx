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

interface WorkComment {
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
  workComment?: WorkComment;
  onToggleSlot: (dayIndex: number, slotIndex: number) => void;
  isUkrainian: boolean;
}

export default function ScheduleDayCard({
  day,
  dayIndex,
  workShifts,
  workComment,
  onToggleSlot,
  isUkrainian
}: ScheduleDayCardProps) {
  const dayShifts = workShifts.filter(shift => shift.date === day.date);
  const hasSelectedSlots = day.slots.some(slot => slot.selected);
  const accentColor = day.isWeekend ? 'bg-orange-500' : 'bg-[#001f54]';

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
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

      <div className="grid grid-cols-2 gap-2 px-4 pb-4">
        {day.slots.map((slot, slotIndex) => (
          <button
            key={slot.time}
            onClick={() => onToggleSlot(dayIndex, slotIndex)}
            className={`flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 touch-manipulation ${
              slot.selected
                ? day.isWeekend
                  ? 'bg-orange-500 text-white'
                  : 'bg-[#001f54] text-white'
                : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-[#001f54]/30 hover:text-[#001f54]'
            }`}
          >
            <Icon name="Clock" size={13} className="opacity-70" />
            {slot.label}
          </button>
        ))}
      </div>

      {dayShifts.length > 0 && (
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

      {workComment && hasSelectedSlots && (
        <div className="px-4 pb-4 space-y-1.5">
          {workComment.organization && (
            <div className="flex items-center gap-2 bg-purple-50 rounded-xl px-3 py-2">
              <Icon name="Building2" size={13} className="text-purple-500 flex-shrink-0" />
              <span className="text-xs text-purple-800 font-medium truncate">{workComment.organization}</span>
            </div>
          )}
          {workComment.location_type && (
            <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2">
              <Icon name="MapPin" size={13} className="text-blue-500 flex-shrink-0" />
              <span className="text-xs text-blue-800 font-medium truncate">{workComment.location_type}</span>
            </div>
          )}
          {workComment.location_details && (
            <div className="flex items-center gap-2 bg-indigo-50 rounded-xl px-3 py-2">
              <Icon name="Navigation" size={13} className="text-indigo-500 flex-shrink-0" />
              <span className="text-xs text-indigo-800 font-medium truncate">{workComment.location_details}</span>
            </div>
          )}
          {workComment.flyers && (
            <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2">
              <Icon name="FileText" size={13} className="text-amber-500 flex-shrink-0" />
              <span className="text-xs text-amber-800 font-medium truncate">{workComment.flyers}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
