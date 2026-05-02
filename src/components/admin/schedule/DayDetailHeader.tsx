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
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-bold text-gray-800 capitalize">{fmtDate(date)}</h3>
        {totalSlots !== null && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
            usedSlots >= totalSlots && totalSlots > 0
              ? 'bg-emerald-100 text-emerald-600'
              : usedSlots > 0
                ? 'bg-amber-100 text-amber-600'
                : 'bg-gray-100 text-gray-500'
          }`}>
            <Icon name="Users" size={11} />
            <span>{usedSlots} / {totalSlots}</span>
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
      >
        <Icon name="X" size={16} />
      </button>
    </div>
  );
}
