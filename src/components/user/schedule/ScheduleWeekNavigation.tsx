import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface ScheduleWeekNavigationProps {
  currentWeekIndex: number;
  weeks: Array<{ start: string; label: string }>;
  onPrevious: () => void;
  onNext: () => void;
  loading: boolean;
  isUkrainian: boolean;
}

export default function ScheduleWeekNavigation({
  currentWeekIndex,
  weeks,
  onPrevious,
  onNext,
  loading,
  isUkrainian
}: ScheduleWeekNavigationProps) {
  return (
    <div className="flex items-center justify-between gap-3 bg-gray-50 p-3 rounded-lg border-2 border-gray-200">
      <Button
        onClick={onPrevious}
        disabled={currentWeekIndex === 0 || loading}
        variant="outline"
        size="sm"
        className="border-[#001f54] text-[#001f54] hover:bg-[#001f54] hover:text-white"
      >
        <Icon name="ChevronLeft" size={16} className="md:mr-1" />
        <span className="hidden md:inline">{isUkrainian ? 'Попередній' : 'Предыдущая'}</span>
      </Button>
      
      <div className="text-center">
        <p className="text-sm md:text-base font-bold text-[#001f54]">{weeks[currentWeekIndex].label}</p>
        <p className="text-[10px] md:text-xs text-gray-500">{isUkrainian ? 'Тиждень' : 'Неделя'} {currentWeekIndex + 1} {isUkrainian ? 'з' : 'из'} {weeks.length}</p>
      </div>
      
      <Button
        onClick={onNext}
        disabled={currentWeekIndex === weeks.length - 1 || loading}
        variant="outline"
        size="sm"
        className="border-[#001f54] text-[#001f54] hover:bg-[#001f54] hover:text-white"
      >
        <span className="hidden md:inline">{isUkrainian ? 'Наступний' : 'Следующая'}</span>
        <Icon name="ChevronRight" size={16} className="md:ml-1" />
      </Button>
    </div>
  );
}
