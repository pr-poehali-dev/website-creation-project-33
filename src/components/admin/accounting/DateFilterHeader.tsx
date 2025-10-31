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
  const [tempFrom, setTempFrom] = useState(dateFrom);
  const [tempTo, setTempTo] = useState(dateTo);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempFrom(dateFrom);
    setTempTo(dateTo);
  }, [dateFrom, dateTo]);

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

  const handleApply = () => {
    onDateChange(tempFrom, tempTo);
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempFrom('');
    setTempTo('');
    onDateChange('', '');
    setIsOpen(false);
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-[999] md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
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
          <div className="fixed md:absolute top-1/2 left-1/2 md:top-full md:left-0 -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0 md:mt-1 bg-white border border-gray-300 rounded-lg shadow-2xl md:shadow-lg p-4 z-[1000] w-[90vw] max-w-[320px] md:w-auto md:min-w-[280px]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm md:text-xs text-gray-700 md:text-gray-600 mb-2 font-medium">От</label>
              <input
                type="date"
                value={tempFrom}
                onChange={(e) => setTempFrom(e.target.value)}
                className="w-full px-3 py-2.5 md:py-1.5 text-sm md:text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm md:text-xs text-gray-700 md:text-gray-600 mb-2 font-medium">До</label>
              <input
                type="date"
                value={tempTo}
                onChange={(e) => setTempTo(e.target.value)}
                className="w-full px-3 py-2.5 md:py-1.5 text-sm md:text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleApply}
                className="flex-1 px-4 py-2.5 md:py-2 text-sm md:text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Применить
              </button>
              {hasFilter && (
                <button
                  onClick={handleClear}
                  className="flex-1 px-4 py-2.5 md:py-2 text-sm md:text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Сбросить
                </button>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </>
  );
}