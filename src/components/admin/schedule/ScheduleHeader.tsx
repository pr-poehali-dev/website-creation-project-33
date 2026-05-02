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
  onGoHome?: () => void;
}

export default function ScheduleHeader({
  view, setView,
  currentWeekIndex, setCurrentWeekIndex,
  weeks, loading,
  weekDaysCalendar,
  onOpenAddShift, onOpenAddTraining, onGoHome,
}: ScheduleHeaderProps) {
  return (
    <div className="flex flex-col gap-3 mb-5">

      {/* Заголовок + кнопки */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <Icon name="CalendarDays" size={18} className="text-blue-500" />
          </div>
          <h2 className="text-base font-semibold text-gray-800">График работы</h2>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {onGoHome && (
            <>
              <button
                onClick={onGoHome}
                title="Домой"
                className="md:hidden flex items-center justify-center rounded-lg transition-all duration-200 w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-white"
              >
                <Icon name="Home" size={14} />
              </button>
              <div className="md:hidden w-px h-5 bg-gray-200 mx-0.5" />
            </>
          )}
          <button
            onClick={() => setView('team')}
            title="Общий"
            className={`flex items-center justify-center rounded-lg transition-all duration-200 w-8 h-8 ${
              view === 'team' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-white'
            }`}
          >
            <Icon name="Users" size={14} />
          </button>
          <button
            onClick={() => setView('individual')}
            title="Индивидуально"
            className={`flex items-center justify-center rounded-lg transition-all duration-200 w-8 h-8 ${
              view === 'individual' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-white'
            }`}
          >
            <Icon name="User" size={14} />
          </button>

          <div className="w-px h-5 bg-gray-200 mx-0.5" />

          {onOpenAddShift && (
            <button
              onClick={onOpenAddShift}
              title="Добавить смену"
              className="flex items-center justify-center rounded-lg transition-all duration-200 w-8 h-8 text-emerald-500 hover:bg-emerald-50"
            >
              <Icon name="CalendarPlus" size={14} />
            </button>
          )}
          {onOpenAddTraining && (
            <button
              onClick={onOpenAddTraining}
              title="Добавить обучение"
              className="flex items-center justify-center rounded-lg transition-all duration-200 w-8 h-8 text-violet-500 hover:bg-violet-50"
            >
              <Icon name="GraduationCap" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Навигация по неделям */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentWeekIndex(Math.max(0, currentWeekIndex - 1))}
          disabled={currentWeekIndex === 0 || loading}
          className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all flex-shrink-0"
        >
          <Icon name="ChevronLeft" size={16} />
        </button>

        <div className="flex-1 text-center">
          <p className="text-sm font-semibold text-gray-700">{weeks[currentWeekIndex]?.label}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Неделя {currentWeekIndex + 1} из {weeks.length}</p>
        </div>

        <button
          onClick={() => setCurrentWeekIndex(Math.min(weeks.length - 1, currentWeekIndex + 1))}
          disabled={currentWeekIndex === weeks.length - 1 || loading}
          className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all flex-shrink-0"
        >
          <Icon name="ChevronRight" size={16} />
        </button>
      </div>

      {/* Мини-календарь */}
      {weekDaysCalendar && <div>{weekDaysCalendar}</div>}
    </div>
  );
}