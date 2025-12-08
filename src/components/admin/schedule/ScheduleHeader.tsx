import { Button } from '@/components/ui/button';
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
}

export default function ScheduleHeader({
  view,
  setView,
  currentWeekIndex,
  setCurrentWeekIndex,
  weeks,
  loading,
  onOpenAddShift
}: ScheduleHeaderProps) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Icon name="Calendar" size={24} className="text-cyan-400 md:w-7 md:h-7" />
          График работы отдела
        </h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setView('team')}
            variant={view === 'team' ? 'default' : 'outline'}
            className={`text-xs md:text-sm ${view === 'team' ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'bg-slate-800/50 hover:bg-slate-700/50 border-slate-600 text-slate-200'}`}
            size="sm"
          >
            <Icon name="Users" size={16} className="mr-1 md:mr-2" />
            Общий
          </Button>
          <Button
            onClick={() => setView('individual')}
            variant={view === 'individual' ? 'default' : 'outline'}
            className={`text-xs md:text-sm ${view === 'individual' ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'bg-slate-800/50 hover:bg-slate-700/50 border-slate-600 text-slate-200'}`}
            size="sm"
          >
            <Icon name="User" size={16} className="mr-1 md:mr-2" />
            Индивидуально
          </Button>
          {onOpenAddShift && (
            <Button
              onClick={onOpenAddShift}
              className="bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm"
              size="sm"
            >
              <Icon name="CalendarPlus" size={16} className="mr-1 md:mr-2" />
              Добавить смену
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 bg-slate-800/50 p-3 rounded-lg border-2 border-slate-700/50">
        <Button
          onClick={() => setCurrentWeekIndex(prev => Math.max(0, prev - 1))}
          disabled={currentWeekIndex === 0 || loading}
          variant="outline"
          size="sm"
          className="bg-slate-800/50 hover:bg-slate-700/50 border-slate-600 text-slate-200 disabled:opacity-30"
        >
          <Icon name="ChevronLeft" size={16} />
        </Button>

        <div className="text-center">
          <p className="text-sm md:text-base font-semibold text-slate-100">
            {weeks[currentWeekIndex].label}
          </p>
          <p className="text-xs text-slate-400">
            Неделя {currentWeekIndex + 1} из {weeks.length}
          </p>
        </div>

        <Button
          onClick={() => setCurrentWeekIndex(prev => Math.min(weeks.length - 1, prev + 1))}
          disabled={currentWeekIndex === weeks.length - 1 || loading}
          variant="outline"
          size="sm"
          className="bg-slate-800/50 hover:bg-slate-700/50 border-slate-600 text-slate-200 disabled:opacity-30"
        >
          <Icon name="ChevronRight" size={16} />
        </Button>
      </div>
    </div>
  );
}