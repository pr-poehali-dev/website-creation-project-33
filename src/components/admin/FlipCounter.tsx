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

  const digits = displayValue.toString().padStart(3, '0').split('');

  return (
    <div className="flex gap-1.5">
      {digits.map((digit, index) => (
        <div
          key={index}
          className={`relative w-12 h-14 bg-white/95 rounded-lg shadow-md overflow-hidden transition-transform duration-300 ${
            isFlipping ? 'scale-105' : 'scale-100'
          } backdrop-blur-sm`}
        >
          <div
            className={`absolute inset-0 flex items-center justify-center text-3xl font-bold text-green-700 transition-all duration-300 ${
              isFlipping ? 'translate-y-[-100%] opacity-0' : 'translate-y-0 opacity-100'
            }`}
          >
            {digit}
          </div>
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-green-200/30"></div>
        </div>
      ))}
    </div>
  );
}