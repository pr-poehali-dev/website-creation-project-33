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
    <div className="bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg shadow-xl px-4 py-3 min-w-[110px] hover:shadow-2xl transition-shadow">
      <div className="text-xs text-white/90 font-medium uppercase tracking-wider mb-1">Контакты</div>
      <div className={`text-2xl font-bold text-white leading-tight transition-transform duration-300 ${
        isFlipping ? 'scale-110' : 'scale-100'
      }`}>
        {formatNumber(displayValue)}
      </div>
      <div className="text-xs text-white/80 font-medium">сегодня</div>
    </div>
  );
}