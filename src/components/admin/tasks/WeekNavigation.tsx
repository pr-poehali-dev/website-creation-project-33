import Icon from '@/components/ui/icon';

interface WeekNavigationProps {
  weekOffset: number;
  weekLabel: string;
  onPrevious: () => void;
  onNext: () => void;
}

export default function WeekNavigation({ weekOffset, weekLabel, onPrevious, onNext }: WeekNavigationProps) {
  return (
    <div className="flex items-center justify-between bg-slate-800/40 ring-1 ring-slate-700/40 rounded-xl px-3 py-2.5">
      <button
        onClick={onPrevious}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-700/60 transition-all"
      >
        <Icon name="ChevronLeft" size={18} />
      </button>

      <div className="text-center">
        <div className="text-sm font-semibold text-slate-200">{weekLabel}</div>
        {weekOffset === 0 && (
          <div className="text-[10px] text-cyan-400 font-medium mt-0.5">Текущая неделя</div>
        )}
      </div>

      <button
        onClick={onNext}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-700/60 transition-all"
      >
        <Icon name="ChevronRight" size={18} />
      </button>
    </div>
  );
}
