import { useEffect, useState } from 'react';

interface FlipCounterProps {
  value: number;
}

export default function FlipCounter({ value }: FlipCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsFlipping(true);
      const timeout = setTimeout(() => {
        setDisplayValue(value);
        setIsFlipping(false);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [value, displayValue]);

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 shadow-sm">
      <span className="text-[10px] text-gray-400 font-medium">Контакты</span>
      <span className={`text-sm font-bold text-gray-800 transition-transform duration-300 ${isFlipping ? 'scale-110' : 'scale-100'}`}>
        {formatNumber(displayValue)}
      </span>
      <span className="text-[10px] text-gray-400">сег.</span>
    </div>
  );
}