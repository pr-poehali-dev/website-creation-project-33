import React, { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface MultiSelectHeaderProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
}

export default function MultiSelectHeader({ 
  label, 
  options, 
  selectedValues, 
  onSelectionChange 
}: MultiSelectHeaderProps) {
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

  const toggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      onSelectionChange(selectedValues.filter(v => v !== option));
    } else {
      onSelectionChange([...selectedValues, option]);
    }
  };

  const selectAll = () => {
    onSelectionChange([]);
  };

  const hasFilter = selectedValues.length > 0 && selectedValues.length < options.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 hover:bg-gray-200 px-1 py-0.5 rounded transition-colors w-full justify-center"
      >
        <span>{label}</span>
        <Icon 
          name={hasFilter ? 'Filter' : 'ChevronDown'} 
          size={14} 
          className={hasFilter ? 'text-blue-600' : 'text-gray-400'}
        />
        {hasFilter && (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-blue-600 text-white rounded-full">
            {selectedValues.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[180px] max-h-[300px] overflow-y-auto">
          <button
            onClick={() => {
              selectAll();
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-xs border-b border-gray-200 sticky top-0 bg-white"
          >
            <Icon 
              name={selectedValues.length === 0 ? 'CheckCircle2' : 'Circle'} 
              size={16} 
              className={selectedValues.length === 0 ? 'text-blue-600' : 'text-gray-300'}
            />
            <span className="font-medium">Все ({options.length})</span>
          </button>
          
          {options.map(option => (
            <button
              key={option}
              onClick={() => toggleOption(option)}
              className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-xs"
            >
              <Icon 
                name={selectedValues.includes(option) || selectedValues.length === 0 ? 'CheckCircle2' : 'Circle'} 
                size={16} 
                className={selectedValues.includes(option) || selectedValues.length === 0 ? 'text-blue-600' : 'text-gray-300'}
              />
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
