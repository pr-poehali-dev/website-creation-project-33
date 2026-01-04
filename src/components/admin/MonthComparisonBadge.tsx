import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';

interface MonthComparisonBadgeProps {
  sessionToken: string;
}

export default function MonthComparisonBadge({ sessionToken }: MonthComparisonBadgeProps) {
  const [difference, setDifference] = useState<number | null>(null);
  const [percentageChange, setPercentageChange] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComparison();
  }, [sessionToken]);

  const loadComparison = async () => {
    try {
      const functionUrl = 'https://functions.poehali.dev/fb8b60e8-9d84-4e3b-87c6-d5c3fafea739';
      
      const response = await fetch(functionUrl, {
        headers: {
          'X-Session-Token': sessionToken
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDifference(data.difference);
        setPercentageChange(data.percentage_change);
      }
    } catch (error) {
      console.error('Failed to load month comparison:', error);
    }
    
    setLoading(false);
  };

  if (loading || difference === null) {
    return null;
  }

  const isPositive = difference >= 0;
  const textColor = isPositive ? 'text-green-300' : 'text-red-300';
  const icon = isPositive ? 'TrendingUp' : 'TrendingDown';
  
  const now = new Date();
  const currentMonth = now.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '');
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '');
  
  const monthLabel = `${prevMonth}/${currentMonth}`.toUpperCase();

  return (
    <div className="inline-block bg-green-500/20 border border-green-400/30 rounded-xl px-2 py-1 md:px-3 md:py-2 transition-all">
      <div className="text-[8px] md:text-[10px] text-green-100 font-medium uppercase tracking-wide">
        {monthLabel}
      </div>
      <div className="text-sm md:text-lg font-bold text-white leading-tight">
        {isPositive ? '+' : ''}{difference}
      </div>
      <div className="flex items-center gap-0.5 text-[8px] md:text-[10px]">
        <Icon name={icon} size={10} className={`md:w-[14px] md:h-[14px] ${isPositive ? 'text-green-200' : 'text-red-300'}`} />
        <span className={isPositive ? 'text-green-200' : 'text-red-300'}>
          {percentageChange > 0 ? '+' : ''}{percentageChange}%
        </span>
      </div>
    </div>
  );
}