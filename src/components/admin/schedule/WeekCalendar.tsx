import { DaySchedule } from './types';

interface WeekCalendarProps {
  weekDays: DaySchedule[];
}

export default function WeekCalendar({ weekDays }: WeekCalendarProps) {
  return (
    <div className="grid grid-cols-7 gap-1 md:gap-2">
      {weekDays.map(day => (
        <div key={day.date} className={`p-2 md:p-3 rounded-lg text-center border-2 ${day.isWeekend ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
          <div className={`text-[10px] md:text-xs font-semibold mb-1 ${day.isWeekend ? 'text-orange-600' : 'text-blue-600'}`}>
            {day.dayName}
          </div>
          <div className="text-xs md:text-lg font-bold text-gray-900">
            {new Date(day.date).getDate()}.{(new Date(day.date).getMonth() + 1).toString().padStart(2, '0')}
          </div>
        </div>
      ))}
    </div>
  );
}