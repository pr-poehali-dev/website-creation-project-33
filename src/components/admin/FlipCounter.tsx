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
    <div className="inline-block bg-green-500/20 border border-green-400/30 rounded-xl px-2 py-1 md:px-3 md:py-2 transition-all">
      <div className="text-[8px] md:text-[10px] text-green-100 font-medium uppercase tracking-wide">Контакты</div>
      <div className={`text-sm md:text-lg font-bold text-white leading-tight transition-transform duration-300 ${
        isFlipping ? 'scale-110' : 'scale-100'
      }`}>
        {formatNumber(displayValue)}
      </div>
      <div className="text-[8px] md:text-[10px] text-green-100">сегодня</div>
    </div>
  );
}