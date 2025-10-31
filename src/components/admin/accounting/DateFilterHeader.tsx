import React, { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface DateFilterHeaderProps {
  label: string;
  dateFrom: string;
  dateTo: string;
  onDateChange: (from: string, to: string) => void;
}

export default function DateFilterHeader({
  label,
  dateFrom,
  dateTo,
  onDateChange
}: DateFilterHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasFilter = dateFrom || dateTo;

  const handleClear = () => {
    onDateChange('', '');
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
      >
        <span>{label}</span>
        <Icon 
          name={hasFilter ? "FilterX" : "Filter"} 
          size={14} 
          className={hasFilter ? "text-blue-600" : "text-gray-400"}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50 min-w-[280px]">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">От</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateChange(e.target.value, dateTo)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">До</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => onDateChange(dateFrom, e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {hasFilter && (
              <button
                onClick={handleClear}
                className="w-full px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
              >
                Сбросить
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
