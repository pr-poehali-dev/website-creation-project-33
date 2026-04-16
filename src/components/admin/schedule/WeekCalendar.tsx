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
            className={`relative flex flex-col items-center py-2.5 md:py-3.5 rounded-2xl transition-all ${
              day.isWeekend
                ? 'bg-slate-800/60 ring-1 ring-orange-500/20'
                : 'bg-slate-800/60 ring-1 ring-slate-700/30'
            }`}
          >
            <span className={`text-[9px] md:text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${
              isToday ? 'text-cyan-400' : day.isWeekend ? 'text-orange-400/70' : 'text-slate-500'
            }`}>
              {day.dayName}
            </span>
            <span className="text-sm md:text-2xl font-bold leading-none">
              <span className={isToday
                ? 'text-cyan-400'
                : day.isWeekend ? 'text-orange-300' : 'text-slate-200'
              }>{dayNum}</span><span className={`text-[10px] md:text-sm font-normal ml-0.5 ${
                isToday ? 'text-cyan-500' : 'text-slate-600'
              }`}>.{month}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}