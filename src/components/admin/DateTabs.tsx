import React from 'react';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface DateTabsProps {
  dates: string[];
  selectedDate: string | null;
  leadsCounts: Record<string, number>;
  onDateSelect: (date: string) => void;
}

export default function DateTabs({ dates, selectedDate, leadsCounts, onDateSelect }: DateTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {dates.map(date => {
        const leadsCount = leadsCounts[date];
        return (
          <button
            key={date}
            onClick={() => onDateSelect(date)}
            className={`px-3 md:px-4 py-2 rounded-lg border-2 transition-all duration-300 text-sm md:text-base font-medium ${
              selectedDate === date
                ? 'bg-[#001f54] text-white border-[#001f54] shadow-lg scale-105'
                : 'bg-white text-[#001f54] border-[#001f54]/20 hover:border-[#001f54]/40 hover:bg-[#001f54]/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon name="Calendar" size={14} className="md:w-4 md:h-4" />
              <span>{date}</span>
              <Badge className={`ml-1 px-1.5 py-0.5 text-xs ${
                selectedDate === date
                  ? 'bg-white/20 text-white border-white/30'
                  : 'bg-[#001f54]/10 text-[#001f54] border-[#001f54]/20'
              }`}>
                {leadsCount}
              </Badge>
            </div>
          </button>
        );
      })}
    </div>
  );
}