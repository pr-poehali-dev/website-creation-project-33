import React, { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface FilterableHeaderProps {
  label: string;
  filterValue: boolean | null;
  onFilterChange: () => void;
}

export default function FilterableHeader({ label, filterValue, onFilterChange }: FilterableHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getFilterIcon = () => {
    if (filterValue === null) return 'Filter';
    if (filterValue === true) return 'CheckCircle2';
    return 'XCircle';
  };

  const getFilterColor = () => {
    if (filterValue === null) return 'text-slate-400';
    if (filterValue === true) return 'text-emerald-400';
    return 'text-red-400';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 hover:bg-slate-700/50 px-1 py-0.5 rounded transition-colors w-full justify-center"
      >
        <span>{label}</span>
        <Icon name={getFilterIcon()} size={14} className={getFilterColor()} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50 min-w-[140px]">
          <button
            onClick={() => {
              onFilterChange();
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-xs"
          >
            <Icon 
              name={filterValue === null ? 'CheckCircle2' : 'Circle'} 
              size={16} 
              className={filterValue === null ? 'text-cyan-400' : 'text-slate-500'}
            />
            Все
          </button>
          <button
            onClick={() => {
              if (filterValue !== true) onFilterChange();
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left hover:bg-slate-700/50 flex items-center gap-2 text-xs text-slate-200"
          >
            <Icon 
              name={filterValue === true ? 'CheckCircle2' : 'Circle'} 
              size={16} 
              className={filterValue === true ? 'text-emerald-400' : 'text-slate-500'}
            />
            Да
          </button>
          <button
            onClick={() => {
              if (filterValue !== false) onFilterChange();
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left hover:bg-slate-700/50 flex items-center gap-2 text-xs border-t border-slate-700 text-slate-200"
          >
            <Icon 
              name={filterValue === false ? 'CheckCircle2' : 'Circle'} 
              size={16} 
              className={filterValue === false ? 'text-red-400' : 'text-slate-500'}
            />
            Нет
          </button>
        </div>
      )}
    </div>
  );
}