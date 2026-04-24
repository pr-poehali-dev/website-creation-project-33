import Icon from '@/components/ui/icon';
import { fmtDate } from './dayDetailUtils';

interface DayDetailHeaderProps {
  date: string;
  usedSlots: number;
  totalSlots: number | null;
  onClose: () => void;
}

export default function DayDetailHeader({ date, usedSlots, totalSlots, onClose }: DayDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-bold text-slate-100 capitalize">{fmtDate(date)}</h3>
        {totalSlots !== null && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
            usedSlots >= totalSlots && totalSlots > 0
              ? 'bg-emerald-500/20 text-emerald-300'
              : usedSlots > 0
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-slate-700/60 text-slate-400'
          }`}>
            <Icon name="Users" size={11} />
            <span>{usedSlots} / {totalSlots}</span>
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 transition-all"
      >
        <Icon name="X" size={16} />
      </button>
    </div>
  );
}
