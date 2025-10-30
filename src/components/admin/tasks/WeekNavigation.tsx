import Icon from '@/components/ui/icon';

interface WeekNavigationProps {
  weekOffset: number;
  weekLabel: string;
  onPrevious: () => void;
  onNext: () => void;
}

export default function WeekNavigation({ weekOffset, weekLabel, onPrevious, onNext }: WeekNavigationProps) {
  return (
    <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3 md:p-4">
      <button
        onClick={onPrevious}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
      >
        <Icon name="ChevronLeft" size={24} className="text-gray-600" />
      </button>
      
      <div className="text-center">
        <div className="text-base md:text-lg font-semibold text-gray-800">
          {weekLabel}
        </div>
        {weekOffset === 0 && (
          <div className="text-xs md:text-sm text-blue-600 font-medium">Текущая неделя</div>
        )}
      </div>
      
      <button
        onClick={onNext}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
      >
        <Icon name="ChevronRight" size={24} className="text-gray-600" />
      </button>
    </div>
  );
}
