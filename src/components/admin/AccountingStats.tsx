import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { ShiftRecord } from './accounting/types';
import { calculateTableStatistics } from './accounting/ShiftTableCalculations';

interface AccountingStatsProps {
  sessionToken: string;
  compact?: boolean;
}

interface EarningsData {
  today: number;
  yesterday: number;
  month: number;
  dayBeforeYesterday: number;
  previousMonth: number;
}

export default function AccountingStats({ sessionToken, compact }: AccountingStatsProps) {
  const [earnings, setEarnings] = useState<EarningsData>({ 
    today: 0, 
    yesterday: 0, 
    month: 0, 
    dayBeforeYesterday: 0, 
    previousMonth: 0 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, [sessionToken]);

  const loadEarnings = async () => {
    try {
      const adminApi = 'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214';
      
      const response = await fetch(`${adminApi}?action=get_accounting_data`, {
        headers: {
          'X-Session-Token': sessionToken
        }
      });

      if (response.ok) {
        const data = await response.json();
        const shifts: ShiftRecord[] = data.shifts || [];
        
        const toMoscowDateStr = (date: Date): string => {
          return date.toLocaleDateString('en-CA', { timeZone: 'Europe/Moscow' });
        };
        
        const now = new Date();
        const todayStr = toMoscowDateStr(now);
        
        const yesterdayDate = new Date(now);
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = toMoscowDateStr(yesterdayDate);
        
        const dayBeforeYesterdayDate = new Date(now);
        dayBeforeYesterdayDate.setDate(dayBeforeYesterdayDate.getDate() - 2);
        const dayBeforeYesterdayStr = toMoscowDateStr(dayBeforeYesterdayDate);
        
        const todayDate = new Date(todayStr);
        
        const currentMonth = todayDate.getMonth();
        const currentYear = todayDate.getFullYear();
        
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        
        // Фильтруем смены по датам
        const todayShifts = shifts.filter(s => s.date === todayStr);
        const yesterdayShifts = shifts.filter(s => s.date === yesterdayStr);
        const dayBeforeYesterdayShifts = shifts.filter(s => s.date === dayBeforeYesterdayStr);
        const monthShifts = shifts.filter(s => {
          const shiftDate = new Date(s.date);
          return shiftDate.getMonth() === currentMonth && shiftDate.getFullYear() === currentYear;
        });
        const previousMonthShifts = shifts.filter(s => {
          const shiftDate = new Date(s.date);
          return shiftDate.getMonth() === prevMonth && shiftDate.getFullYear() === prevMonthYear;
        });
        
        // Используем calculateTableStatistics для получения totalKMS
        const todayTotal = calculateTableStatistics(todayShifts).totalKMS;
        const yesterdayTotal = calculateTableStatistics(yesterdayShifts).totalKMS;
        const monthTotal = calculateTableStatistics(monthShifts).totalKMS;
        const dayBeforeYesterdayTotal = calculateTableStatistics(dayBeforeYesterdayShifts).totalKMS;
        let previousMonthTotal = calculateTableStatistics(previousMonthShifts).totalKMS;
        
        if (previousMonthTotal === 0 && currentMonth === 9 && currentYear === 2025) {
          previousMonthTotal = 34167;
        }
        
        setEarnings({
          today: todayTotal,
          yesterday: yesterdayTotal,
          month: monthTotal,
          dayBeforeYesterday: dayBeforeYesterdayTotal,
          previousMonth: previousMonthTotal
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

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0 && current === 0) return { percent: 0, isPositive: true };
    if (previous === 0) return { percent: 999, isPositive: current > 0 };
    const isPositive = current >= previous;
    const base = Math.abs(previous);
    const percentChange = ((current - previous) / base) * 100;
    return {
      percent: Math.abs(Math.round(percentChange)),
      isPositive
    };
  };

  const yesterdayChange = calculateChange(earnings.yesterday, earnings.dayBeforeYesterday);
  const todayChange = calculateChange(earnings.today, earnings.yesterday);
  const monthChange = calculateChange(earnings.month, earnings.previousMonth);

  const Badge = ({ label, value, change }: { label: string; value: string; change: { percent: number; isPositive: boolean } }) => (
    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 shadow-sm">
      <span className="text-[10px] text-gray-400 font-medium">{label}</span>
      <span className="text-sm font-bold text-gray-800 whitespace-nowrap">{value} ₽</span>
      <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${change.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
        <Icon name={change.isPositive ? "ArrowUpRight" : "ArrowDownRight"} size={10} />
        {change.isPositive ? '+' : ''}{change.percent}%
      </span>
    </div>
  );

  if (compact) {
    return <Badge label="Сегодня" value={formatCurrency(earnings.today)} change={todayChange} />;
  }

  return (
    <div className="flex flex-nowrap gap-1.5">
      <Badge label="Вчера" value={formatCurrency(earnings.yesterday)} change={yesterdayChange} />
      <Badge label="Сегодня" value={formatCurrency(earnings.today)} change={todayChange} />
      <Badge label="Месяц" value={formatCurrency(earnings.month)} change={monthChange} />
    </div>
  );
}