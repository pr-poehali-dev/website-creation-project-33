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

  const getStatusMessage = () => {
    if (displayValue < 15) return { text: 'КОНЧЕНЫЕ', bg: 'from-red-800 to-red-900' };
    if (displayValue < 30) return { text: 'НЕПЛОХО', bg: 'from-yellow-700 to-yellow-800' };
    return { text: 'НИХУЯСЕБЕ', bg: 'from-green-700 to-green-800' };
  };

  const status = getStatusMessage();
  const letters = status.text.split('');

  return (
    <div className="flex flex-col items-center gap-3 mb-6">
      <div className="flex gap-1">
        {letters.map((letter, index) => (
          <div
            key={index}
            className={`relative w-10 h-14 bg-gradient-to-b ${status.bg} rounded-lg shadow-lg overflow-hidden transition-all duration-500`}
          >
            <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">
              {letter}
            </div>
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white opacity-20"></div>
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-center gap-2">
        <div className="flex gap-1">
          {digits.map((digit, index) => (
            <div
              key={index}
              className={`relative w-12 h-16 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg shadow-lg overflow-hidden transition-transform duration-300 ${
                isFlipping ? 'scale-105' : 'scale-100'
              }`}
            >
              <div
                className={`absolute inset-0 flex items-center justify-center text-4xl font-bold text-white transition-all duration-300 ${
                  isFlipping ? 'translate-y-[-100%] opacity-0' : 'translate-y-0 opacity-100'
                }`}
              >
                {digit}
              </div>
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gray-700"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}