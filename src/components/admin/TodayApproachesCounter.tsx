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
    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 shadow-sm">
      <span className="text-[10px] text-gray-400 font-medium">Подходы</span>
      <span className={`text-sm font-bold text-gray-800 transition-transform duration-300 ${isFlipping ? 'scale-110' : 'scale-100'}`}>
        {formatNumber(todayApproaches)}
      </span>
      <span className="text-[10px] text-gray-400">сег.</span>
    </div>
  );
}