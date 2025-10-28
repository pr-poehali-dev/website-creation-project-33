import React, { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface PaymentTypeHeaderProps {
  label: string;
  selectedTypes: ('cash' | 'cashless')[];
  onSelectionChange: (types: ('cash' | 'cashless')[]) => void;
}

export default function PaymentTypeHeader({ 
  label, 
  selectedTypes, 
  onSelectionChange 
}: PaymentTypeHeaderProps) {
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

  const toggleType = (type: 'cash' | 'cashless') => {
    if (selectedTypes.includes(type)) {
      onSelectionChange(selectedTypes.filter(t => t !== type));
    } else {
      onSelectionChange([...selectedTypes, type]);
    }
  };

  const selectAll = () => {
    onSelectionChange([]);
  };

  const hasFilter = selectedTypes.length > 0 && selectedTypes.length < 2;

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
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[140px]">
          <button
            onClick={() => {
              selectAll();
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-xs border-b border-gray-200"
          >
            <Icon 
              name={selectedTypes.length === 0 ? 'CheckCircle2' : 'Circle'} 
              size={16} 
              className={selectedTypes.length === 0 ? 'text-blue-600' : 'text-gray-300'}
            />
            Все
          </button>
          
          <button
            onClick={() => toggleType('cash')}
            className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-xs"
          >
            <Icon 
              name={selectedTypes.includes('cash') || selectedTypes.length === 0 ? 'CheckCircle2' : 'Circle'} 
              size={16} 
              className={selectedTypes.includes('cash') || selectedTypes.length === 0 ? 'text-blue-600' : 'text-gray-300'}
            />
            💵 Нал
          </button>
          
          <button
            onClick={() => toggleType('cashless')}
            className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-xs"
          >
            <Icon 
              name={selectedTypes.includes('cashless') || selectedTypes.length === 0 ? 'CheckCircle2' : 'Circle'} 
              size={16} 
              className={selectedTypes.includes('cashless') || selectedTypes.length === 0 ? 'text-blue-600' : 'text-gray-300'}
            />
            💳 Безнал
          </button>
        </div>
      )}
    </div>
  );
}
