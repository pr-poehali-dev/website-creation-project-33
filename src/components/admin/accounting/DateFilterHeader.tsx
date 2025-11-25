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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] md:hidden animate-in fade-in duration-200" 
          onClick={() => setIsOpen(false)}
        />
      )}
      <div className="relative inline-block" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 hover:bg-slate-700/50 px-1 py-0.5 rounded transition-colors w-full justify-center text-slate-200"
        >
          <span>{label}</span>
          <Icon 
            name={hasFilter ? "FilterX" : "Filter"} 
            size={14} 
            className={hasFilter ? "text-cyan-400" : "text-slate-400"}
          />
        </button>

        {isOpen && (
          <div className="fixed md:absolute top-1/2 left-1/2 md:top-full md:left-0 -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0 md:mt-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl md:shadow-xl py-6 pl-6 pr-10 z-[1000] w-[85vw] max-w-[280px] md:w-auto md:min-w-[280px] animate-in zoom-in-95 duration-200 mx-4 scrollbar-dark">
            <div className="space-y-5">
              <div className="text-center mb-4 md:hidden">
                <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-3"></div>
                <h3 className="text-lg font-semibold text-slate-100">Фильтр по дате</h3>
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-2">
                  <Icon name="Calendar" size={16} className="text-cyan-400" />
                  От
                </label>
                <input
                  type="date"
                  value={tempFrom}
                  onChange={(e) => setTempFrom(e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-700 rounded-lg bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-2">
                  <Icon name="Calendar" size={16} className="text-cyan-400" />
                  До
                </label>
                <input
                  type="date"
                  value={tempTo}
                  onChange={(e) => setTempTo(e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-700 rounded-lg bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div className="flex gap-3 pt-3">
                <button
                  onClick={handleApply}
                  className="flex-1 px-5 py-3 md:py-2.5 text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl shadow-lg shadow-cyan-500/30 transition-all duration-200 active:scale-95"
                >
                  Применить
                </button>
                {hasFilter && (
                  <button
                    onClick={handleClear}
                    className="flex-1 px-5 py-3 md:py-2.5 text-sm font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition-all duration-200 active:scale-95"
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