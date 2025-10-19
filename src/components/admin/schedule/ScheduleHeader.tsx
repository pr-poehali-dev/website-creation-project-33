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
}

export default function ScheduleHeader({
  view,
  setView,
  currentWeekIndex,
  setCurrentWeekIndex,
  weeks,
  loading
}: ScheduleHeaderProps) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Icon name="Calendar" size={24} className="text-blue-600 md:w-7 md:h-7" />
          График работы отдела
        </h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setView('team')}
            variant={view === 'team' ? 'default' : 'outline'}
            className={`text-xs md:text-sm ${view === 'team' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white hover:bg-gray-50 border border-gray-300 text-gray-700'}`}
            size="sm"
          >
            <Icon name="Users" size={16} className="mr-1 md:mr-2" />
            Общий
          </Button>
          <Button
            onClick={() => setView('individual')}
            variant={view === 'individual' ? 'default' : 'outline'}
            className={`text-xs md:text-sm ${view === 'individual' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white hover:bg-gray-50 border border-gray-300 text-gray-700'}`}
            size="sm"
          >
            <Icon name="User" size={16} className="mr-1 md:mr-2" />
            Индивидуально
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 bg-gray-50 p-3 rounded-lg border-2 border-gray-200">
        <Button
          onClick={() => setCurrentWeekIndex(prev => Math.max(0, prev - 1))}
          disabled={currentWeekIndex === 0 || loading}
          variant="outline"
          size="sm"
          className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 disabled:opacity-50"
        >
          <Icon name="ChevronLeft" size={16} />
        </Button>

        <div className="text-center">
          <p className="text-sm md:text-base font-semibold text-gray-900">
            {weeks[currentWeekIndex].label}
          </p>
          <p className="text-xs text-gray-600">
            Неделя {currentWeekIndex + 1} из {weeks.length}
          </p>
        </div>

        <Button
          onClick={() => setCurrentWeekIndex(prev => Math.min(weeks.length - 1, prev + 1))}
          disabled={currentWeekIndex === weeks.length - 1 || loading}
          variant="outline"
          size="sm"
          className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 disabled:opacity-50"
        >
          <Icon name="ChevronRight" size={16} />
        </Button>
      </div>
    </div>
  );
}
