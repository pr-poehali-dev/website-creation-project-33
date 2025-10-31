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
          className="fixed inset-0 bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-sm z-[999] md:hidden animate-in fade-in duration-200" 
          onClick={() => setIsOpen(false)}
        />
      )}
      <div className="relative inline-block" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 hover:text-blue-600 transition-all duration-200"
        >
          <span>{label}</span>
          <Icon 
            name={hasFilter ? "FilterX" : "Filter"} 
            size={14} 
            className={hasFilter ? "text-blue-600" : "text-gray-400"}
          />
        </button>

        {isOpen && (
          <div className="fixed md:absolute top-1/2 left-1/2 md:top-full md:left-0 -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0 md:mt-2 bg-white border-0 rounded-2xl shadow-2xl md:shadow-xl p-6 z-[1000] w-[85vw] max-w-[280px] md:w-auto md:min-w-[280px] animate-in zoom-in-95 duration-200 mx-4">
            <div className="space-y-5">
              <div className="text-center mb-4 md:hidden">
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-3"></div>
                <h3 className="text-lg font-semibold text-gray-900">Фильтр по дате</h3>
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Icon name="Calendar" size={16} className="text-blue-600" />
                  От
                </label>
                <input
                  type="date"
                  value={tempFrom}
                  onChange={(e) => setTempFrom(e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Icon name="Calendar" size={16} className="text-blue-600" />
                  До
                </label>
                <input
                  type="date"
                  value={tempTo}
                  onChange={(e) => setTempTo(e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div className="flex gap-3 pt-3">
                <button
                  onClick={handleApply}
                  className="flex-1 px-5 py-3 md:py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-200 active:scale-95"
                >
                  Применить
                </button>
                {hasFilter && (
                  <button
                    onClick={handleClear}
                    className="flex-1 px-5 py-3 md:py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 active:scale-95"
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