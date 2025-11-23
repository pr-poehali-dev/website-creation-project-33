import { DaySchedule } from './types';

interface WeekCalendarProps {
  weekDays: DaySchedule[];
}

export default function WeekCalendar({ weekDays }: WeekCalendarProps) {
  return (
    <div className="grid grid-cols-7 gap-1 md:gap-2">
      {weekDays.map(day => (
        <div key={day.date} className={`p-2 md:p-3 rounded-lg text-center border-2 ${day.isWeekend ? 'bg-orange-500/10 border-orange-500/50' : 'bg-cyan-500/10 border-cyan-500/50'}`}>
          <div className={`text-[10px] md:text-xs font-semibold mb-1 ${day.isWeekend ? 'text-orange-400' : 'text-cyan-400'}`}>
            {day.dayName}
          </div>
          <div className="text-xs md:text-lg font-bold text-slate-100">
            {new Date(day.date).getDate()}.{(new Date(day.date).getMonth() + 1).toString().padStart(2, '0')}
          </div>
        </div>
      ))}
    </div>
  );
}