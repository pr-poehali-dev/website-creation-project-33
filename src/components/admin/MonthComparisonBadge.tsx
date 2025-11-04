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

  const isPositive = difference > 0;
  const bgColor = isPositive ? 'bg-green-500/20' : 'bg-red-500/20';
  const textColor = isPositive ? 'text-green-700' : 'text-red-700';
  const icon = isPositive ? 'TrendingUp' : 'TrendingDown';

  return (
    <div className={`${bgColor} ${textColor} px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold backdrop-blur-sm`}>
      <Icon name={icon} size={16} />
      <span>
        {isPositive ? '+' : ''}{difference} ({percentageChange > 0 ? '+' : ''}{percentageChange}%)
      </span>
    </div>
  );
}
