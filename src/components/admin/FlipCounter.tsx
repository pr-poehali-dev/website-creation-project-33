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
    <div className="inline-block bg-gradient-to-br from-emerald-500/90 to-green-600/90 backdrop-blur-sm rounded-md md:rounded-lg shadow-md px-2 py-1 md:px-3 md:py-2 hover:shadow-lg transition-all border border-emerald-400/20">
      <div className="text-[8px] md:text-[10px] text-emerald-100/80 font-medium uppercase tracking-wide">Контакты</div>
      <div className={`text-sm md:text-lg font-bold text-white leading-tight transition-transform duration-300 ${
        isFlipping ? 'scale-110' : 'scale-100'
      }`}>
        {formatNumber(displayValue)}
      </div>
      <div className="text-[8px] md:text-[10px] text-emerald-100/70">сегодня</div>
    </div>
  );
}