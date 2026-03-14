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
    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 shadow-sm">
      <span className="text-[10px] text-gray-400 font-medium">{monthLabel}</span>
      <span className="text-sm font-bold text-gray-800">{isPositive ? '+' : ''}{difference}</span>
      <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
        <Icon name={isPositive ? "ArrowUpRight" : "ArrowDownRight"} size={10} />
        {percentageChange > 0 ? '+' : ''}{percentageChange}%
      </span>
    </div>
  );
}