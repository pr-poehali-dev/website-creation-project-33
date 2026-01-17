import { useEffect, useState } from 'react';

interface TodayApproachesCounterProps {
  sessionToken: string;
}

export default function TodayApproachesCounter({ sessionToken }: TodayApproachesCounterProps) {
  const [todayApproaches, setTodayApproaches] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayApproaches();
  }, [sessionToken]);

  const loadTodayApproaches = async () => {
    try {
      const functionUrl = 'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214';
      
      const response = await fetch(`${functionUrl}?action=daily_stats`, {
        headers: {
          'X-Session-Token': sessionToken
        }
      });

      if (response.ok) {
        const data = await response.json();
        const today = data.daily_stats?.[0];
        setTodayApproaches(today?.approaches || 0);
      }
    } catch (error) {
      console.error('Failed to load approaches:', error);
    }
    
    setLoading(false);
  };

  if (loading) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 md:px-2.5 md:py-1 rounded-lg bg-orange-500/20 backdrop-blur-sm border border-orange-400/30 shadow-sm">
      <span className="text-xs md:text-sm font-bold text-white">{todayApproaches}</span>
      <span className="text-[9px] md:text-[10px] text-orange-100 uppercase tracking-wide">подходы</span>
    </div>
  );
}
