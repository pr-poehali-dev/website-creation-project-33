import { DaySchedule } from './types';

interface WeekCalendarProps {
  weekDays: DaySchedule[];
}

const TODAY = new Date().toISOString().slice(0, 10);

export default function WeekCalendar({ weekDays }: WeekCalendarProps) {
  return (
    <div className="grid grid-cols-7 gap-1 md:gap-1.5">
      {weekDays.map(day => {
        const isToday = day.date === TODAY;
        const dayNum = new Date(day.date).getDate();
        const month = (new Date(day.date).getMonth() + 1).toString().padStart(2, '0');

        return (
          <div
            key={day.date}
            className={`relative flex flex-col items-center py-2 md:py-3 rounded-2xl transition-all ${
              isToday
                ? 'bg-cyan-500 shadow-lg shadow-cyan-500/25'
                : day.isWeekend
                  ? 'bg-slate-800/60 ring-1 ring-orange-500/20'
                  : 'bg-slate-800/60 ring-1 ring-slate-700/30'
            }`}
          >
            <span className={`text-[9px] md:text-[10px] font-semibold uppercase tracking-widest mb-1 ${
              isToday ? 'text-cyan-100' : day.isWeekend ? 'text-orange-400/70' : 'text-slate-500'
            }`}>
              {day.dayName}
            </span>
            <span className={`text-sm md:text-xl font-bold leading-none ${
              isToday ? 'text-white' : day.isWeekend ? 'text-orange-300' : 'text-slate-200'
            }`}>
              {dayNum}
            </span>
            <span className={`text-[9px] md:text-[10px] mt-0.5 ${
              isToday ? 'text-cyan-200' : 'text-slate-600'
            }`}>
              .{month}
            </span>

            {isToday && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-300" />
            )}
          </div>
        );
      })}
    </div>
  );
}
