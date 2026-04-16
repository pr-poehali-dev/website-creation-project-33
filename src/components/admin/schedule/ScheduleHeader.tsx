import Icon from '@/components/ui/icon';
import { Week } from './types';

interface ScheduleHeaderProps {
  view: 'team' | 'individual';
  setView: (view: 'team' | 'individual') => void;
  currentWeekIndex: number;
  setCurrentWeekIndex: (index: number) => void;
  weeks: Week[];
  loading: boolean;
  weekDaysCalendar?: React.ReactNode;
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
  weekDaysCalendar,
  onOpenAddShift,
  onOpenAddTraining,
}: ScheduleHeaderProps) {
  return (
    <div className="flex flex-col gap-3 mb-6">

      {/* 1. Заголовок */}
      <h2 className="text-lg md:text-xl font-bold text-slate-100 tracking-tight">
        График работы
      </h2>

      {/* 2. Навигация по неделям */}
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

      {/* 3. Мини-календарь */}
      {weekDaysCalendar && (
        <div>{weekDaysCalendar}</div>
      )}

      {/* 4. Переключатель вида + кнопки действий */}
      <div className="flex items-center justify-between gap-2">
        {/* View toggle */}
        <div className="flex gap-1 bg-slate-900/60 ring-1 ring-slate-700/40 rounded-xl p-1">
          <button
            onClick={() => setView('team')}
            title="Общий"
            className={`flex items-center gap-1.5 rounded-lg text-xs font-semibold transition-all duration-200 px-2 py-1.5 md:px-4 ${
              view === 'team'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Icon name="Users" size={13} />
            <span className="hidden md:inline">Общий</span>
          </button>
          <button
            onClick={() => setView('individual')}
            title="Индивидуально"
            className={`flex items-center gap-1.5 rounded-lg text-xs font-semibold transition-all duration-200 px-2 py-1.5 md:px-4 ${
              view === 'individual'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Icon name="User" size={13} />
            <span className="hidden md:inline">Индивидуально</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1.5 flex-shrink-0">
          {onOpenAddShift && (
            <button
              onClick={onOpenAddShift}
              title="Добавить смену"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-900/30 px-2 py-1.5 md:px-3"
            >
              <Icon name="CalendarPlus" size={13} />
              <span className="hidden md:inline">Добавить смену</span>
            </button>
          )}
          {onOpenAddTraining && (
            <button
              onClick={onOpenAddTraining}
              title="Добавить обучение"
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all shadow-md shadow-violet-900/30 px-2 py-1.5 md:px-3"
            >
              <Icon name="GraduationCap" size={13} />
              <span className="hidden md:inline">Добавить обучение</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}