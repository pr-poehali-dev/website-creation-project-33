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
    <div className="flex items-center justify-between gap-3">
      <button
        onClick={onPrevious}
        disabled={currentWeekIndex === 0 || loading}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-[#001f54] hover:border-[#001f54]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium touch-manipulation"
      >
        <Icon name="ChevronLeft" size={16} />
        <span className="hidden sm:inline">{isUkrainian ? 'Попередній' : 'Назад'}</span>
      </button>

      <div className="text-center">
        <p className="text-sm font-bold text-[#001f54]">{weeks[currentWeekIndex].label}</p>
        <p className="text-xs text-gray-400">
          {isUkrainian ? 'Тиждень' : 'Неделя'} {currentWeekIndex + 1} {isUkrainian ? 'з' : 'из'} {weeks.length}
        </p>
      </div>

      <button
        onClick={onNext}
        disabled={currentWeekIndex === weeks.length - 1 || loading}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-[#001f54] hover:border-[#001f54]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium touch-manipulation"
      >
        <span className="hidden sm:inline">{isUkrainian ? 'Наступний' : 'Вперёд'}</span>
        <Icon name="ChevronRight" size={16} />
      </button>
    </div>
  );
}
