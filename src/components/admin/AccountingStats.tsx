import { useEffect, useState } from 'react';

interface AccountingStatsProps {
  sessionToken: string;
}

interface EarningsData {
  today: number;
  month: number;
}

export default function AccountingStats({ sessionToken }: AccountingStatsProps) {
  const [earnings, setEarnings] = useState<EarningsData>({ today: 0, month: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, [sessionToken]);

  const loadEarnings = async () => {
    try {
      const functionUrl = 'https://functions.poehali.dev/bae23e3c-2f48-40e6-a97e-b3f71e0b96bb';
      
      const response = await fetch(functionUrl, {
        headers: {
          'X-Session-Token': sessionToken
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEarnings({
          today: data.today || 0,
          month: data.month || 0
        });
      }
    } catch (error) {
      console.error('Failed to load earnings:', error);
    }
    
    setLoading(false);
  };

  if (loading) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
      <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md">
        <div className="text-xs text-yellow-700 font-medium">Сегодня</div>
        <div className="text-lg font-bold text-yellow-800">{formatCurrency(earnings.today)} ₽</div>
      </div>
      <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md">
        <div className="text-xs text-yellow-700 font-medium">За месяц</div>
        <div className="text-lg font-bold text-yellow-800">{formatCurrency(earnings.month)} ₽</div>
      </div>
    </div>
  );
}
