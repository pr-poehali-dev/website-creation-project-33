import { useEffect, useState } from 'react';

interface TodayApproachesCounterProps {
  sessionToken: string;
}

export default function TodayApproachesCounter({ sessionToken }: TodayApproachesCounterProps) {
  const [todayApproaches, setTodayApproaches] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    loadTodayApproaches();
  }, [sessionToken]);

  const loadTodayApproaches = async () => {
    try {
      const functionUrl = 'https://functions.poehali.dev/78eb7cbb-8b7c-4a62-aaa3-74d7b1e8f257';
      
      const response = await fetch(`${functionUrl}?user_id=all`, {
        headers: {
          'X-Session-Token': sessionToken
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Approaches data:', data);
        const newValue = data.today_approaches || 0;
        console.log('📊 Today approaches:', newValue);
        if (newValue !== todayApproaches) {
          setIsFlipping(true);
          setTimeout(() => {
            setTodayApproaches(newValue);
            setIsFlipping(false);
          }, 300);
        } else {
          setTodayApproaches(newValue);
        }
      } else {
        console.error('Failed to load approaches, status:', response.status);
      }
    } catch (error) {
      console.error('Failed to load approaches:', error);
    }
    
    setLoading(false);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return null;
  }

  return (
    <div className="inline-block bg-green-500/20 border border-green-400/30 rounded-xl px-2 py-1 md:px-3 md:py-2 transition-all">
      <div className="text-[8px] md:text-[10px] text-green-100 font-medium uppercase tracking-wide">Подходы</div>
      <div className={`text-sm md:text-lg font-bold text-white leading-tight transition-transform duration-300 ${
        isFlipping ? 'scale-110' : 'scale-100'
      }`}>
        {formatNumber(todayApproaches)}
      </div>
      <div className="text-[8px] md:text-[10px] text-green-100">сегодня</div>
    </div>
  );
}