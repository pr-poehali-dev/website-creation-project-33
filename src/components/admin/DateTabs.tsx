import React from 'react';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface DateTabsProps {
  dates: string[];
  selectedDate: string | null;
  leadsCounts: Record<string, number>;
  datesWithDuplicates: Record<string, boolean>;
  onDateSelect: (date: string) => void;
  onDeleteDate?: (date: string) => void;
}

export default function DateTabs({ dates, selectedDate, leadsCounts, datesWithDuplicates, onDateSelect, onDeleteDate }: DateTabsProps) {
  const handleDelete = (e: React.MouseEvent, date: string) => {
    e.stopPropagation();
    if (onDeleteDate) {
      onDeleteDate(date);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {dates.map(date => {
        const leadsCount = leadsCounts[date];
        const hasDuplicates = datesWithDuplicates[date];
        return (
          <div key={date} className="relative group">
            <button
              onClick={() => onDateSelect(date)}
              className={`px-3 md:px-4 py-2 rounded-lg border-2 transition-all duration-300 text-sm md:text-base font-medium ${
                selectedDate === date
                  ? hasDuplicates
                    ? 'bg-red-600 text-white border-red-600 shadow-lg scale-105'
                    : 'bg-[#001f54] text-white border-[#001f54] shadow-lg scale-105'
                  : hasDuplicates
                    ? 'bg-red-50 text-red-700 border-red-500 hover:bg-red-100'
                    : 'bg-white text-[#001f54] border-[#001f54]/20 hover:border-[#001f54]/40 hover:bg-[#001f54]/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon name="Calendar" size={14} className="md:w-4 md:h-4" />
                <span>{date}</span>
                <Badge className={`ml-1 px-1.5 py-0.5 text-xs ${
                  selectedDate === date
                    ? 'bg-white/20 text-white border-white/30'
                    : hasDuplicates
                      ? 'bg-red-600 text-white border-red-700'
                      : 'bg-[#001f54]/10 text-[#001f54] border-[#001f54]/20'
                }`}>
                  {leadsCount}
                </Badge>
              </div>
            </button>
            {onDeleteDate && (
              <button
                onClick={(e) => handleDelete(e, date)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-red-700 shadow-lg"
                title="Удалить все лиды за этот день"
              >
                <Icon name="Trash2" size={12} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}