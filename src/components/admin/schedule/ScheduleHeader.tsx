import Icon from '@/components/ui/icon';
import { Week } from './types';

interface ScheduleHeaderProps {
  view: 'team' | 'individual';
  setView: (view: 'team' | 'individual') => void;
  currentWeekIndex: number;
  setCurrentWeekIndex: (index: number) => void;
  weeks: Week[];
  loading: boolean;
  onOpenAddShift?: () => void;
  onOpenAddTraining?: () => void;
}

export default function ScheduleHeader({
  view,
  setView,
  currentWeekIndex,
  setCurrentWeekIndex,
  weeks,
  loading,
  onOpenAddShift,
  onOpenAddTraining,
}: ScheduleHeaderProps) {
  return (
    <div className="flex flex-col gap-4 mb-6">

      {/* Top row: title + action buttons */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-100 tracking-tight">
            График работы
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">отдел промо</p>
        </div>

        <div className="flex flex-col gap-1.5 flex-shrink-0">
          {onOpenAddShift && (
            <button
              onClick={onOpenAddShift}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-900/30"
            >
              <Icon name="CalendarPlus" size={13} />
              Добавить смену
            </button>
          )}
          {onOpenAddTraining && (
            <button
              onClick={onOpenAddTraining}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all shadow-md shadow-violet-900/30"
            >
              <Icon name="GraduationCap" size={13} />
              Добавить обучение
            </button>
          )}
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 bg-slate-900/60 ring-1 ring-slate-700/40 rounded-xl p-1 self-start">
        <button
          onClick={() => setView('team')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            view === 'team'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Icon name="Users" size={13} />
          Общий
        </button>
        <button
          onClick={() => setView('individual')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            view === 'individual'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Icon name="User" size={13} />
          Индивидуально
        </button>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentWeekIndex(Math.max(0, currentWeekIndex - 1))}
          disabled={currentWeekIndex === 0 || loading}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900/60 ring-1 ring-slate-700/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 disabled:opacity-25 transition-all flex-shrink-0"
        >
          <Icon name="ChevronLeft" size={16} />
        </button>

        <div className="flex-1 text-center">
          <p className="text-sm font-semibold text-slate-100">
            {weeks[currentWeekIndex]?.label}
          </p>
          <p className="text-[10px] text-slate-600 mt-0.5">
            Неделя {currentWeekIndex + 1} из {weeks.length}
          </p>
        </div>

        <button
          onClick={() => setCurrentWeekIndex(Math.min(weeks.length - 1, currentWeekIndex + 1))}
          disabled={currentWeekIndex === weeks.length - 1 || loading}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900/60 ring-1 ring-slate-700/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 disabled:opacity-25 transition-all flex-shrink-0"
        >
          <Icon name="ChevronRight" size={16} />
        </button>
      </div>
    </div>
  );
}
