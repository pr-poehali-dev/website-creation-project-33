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
  onAddContact?: (date: string) => void;
}

export default function DateTabs({ dates, selectedDate, leadsCounts, datesWithDuplicates, onDateSelect, onDeleteDate, onAddContact }: DateTabsProps) {
  const handleDelete = (e: React.MouseEvent, date: string) => {
    e.stopPropagation();
    if (onDeleteDate) {
      onDeleteDate(date);
    }
  };

  const handleAddContact = (e: React.MouseEvent, date: string) => {
    e.stopPropagation();
    if (onAddContact) {
      onAddContact(date);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {dates.map(date => {
        const leadsCount = leadsCounts[date];
        const hasDuplicates = datesWithDuplicates[date];
        return (
          <div key={date} className="relative group flex items-center gap-1">
            <button
              onClick={() => onDateSelect(date)}
              className={`px-3 md:px-4 py-2 rounded-xl border transition-all duration-200 text-sm md:text-base font-medium ${
                selectedDate === date
                  ? hasDuplicates
                    ? 'bg-red-500 text-white border-red-500 shadow-sm'
                    : 'bg-blue-500 text-white border-blue-500 shadow-sm'
                  : hasDuplicates
                    ? 'bg-red-50 text-red-500 border-red-100 hover:bg-red-100'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon name="Calendar" size={14} className="md:w-4 md:h-4" />
                <span>{date}</span>
                <Badge className={`ml-1 px-1.5 py-0.5 text-xs ${
                  selectedDate === date
                    ? 'bg-white/20 text-white border-white/30'
                    : hasDuplicates
                      ? 'bg-red-100 text-red-600 border-red-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}>
                  {leadsCount}
                </Badge>
              </div>
            </button>
            {onAddContact && (
              <button
                onClick={(e) => handleAddContact(e, date)}
                className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-500 active:bg-green-700 shadow transition-colors flex-shrink-0"
                title="Добавить контакт за этот день"
              >
                <Icon name="Plus" size={12} />
              </button>
            )}
            {onDeleteDate && (
              <button
                onClick={(e) => handleDelete(e, date)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity duration-200 items-center justify-center hover:bg-red-700 shadow-lg"
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