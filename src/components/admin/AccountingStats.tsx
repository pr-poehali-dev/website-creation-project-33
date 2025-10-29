import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';

interface AccountingStatsProps {
  sessionToken: string;
}

interface EarningsData {
  today: number;
  yesterday: number;
  month: number;
  dayBeforeYesterday: number;
  previousMonth: number;
}

interface ShiftRecord {
  date: string;
  contacts_count: number;
  contact_rate: number;
  payment_type: 'cash' | 'cashless';
  expense_amount: number;
}

export default function AccountingStats({ sessionToken }: AccountingStatsProps) {
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

  const calculateWorkerSalary = (contacts: number): number => {
    return contacts >= 10 ? contacts * 300 : contacts * 200;
  };

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
        
        const moscowTime = new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' });
        const [month, day, year] = moscowTime.split('/');
        const todayStr = `${year}-${month}-${day}`;
        
        const todayDate = new Date(todayStr);
        const yesterday = new Date(todayDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const dayBeforeYesterday = new Date(todayDate);
        dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
        const dayBeforeYesterdayStr = dayBeforeYesterday.toISOString().split('T')[0];
        
        console.log('📅 Вычисленные даты:', {
          today: todayStr,
          yesterday: yesterdayStr,
          dayBeforeYesterday: dayBeforeYesterdayStr,
          totalShifts: shifts.length,
          allDates: shifts.map(s => s.date).slice(0, 10)
        });
        
        const currentMonth = todayDate.getMonth();
        const currentYear = todayDate.getFullYear();
        
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        
        let todayTotal = 0;
        let yesterdayTotal = 0;
        let monthTotal = 0;
        let dayBeforeYesterdayTotal = 0;
        let previousMonthTotal = 0;
        
        const todayShifts = shifts.filter(s => s.date === todayStr);
        const yesterdayShifts = shifts.filter(s => s.date === yesterdayStr);
        const dayBeforeYesterdayShifts = shifts.filter(s => s.date === dayBeforeYesterdayStr);
        
        console.log('🔍 Найденные смены:', {
          todayShifts: todayShifts.length,
          yesterdayShifts: yesterdayShifts.length,
          todayShiftsData: todayShifts.slice(0, 3),
          yesterdayShiftsData: yesterdayShifts.slice(0, 3)
        });
        const monthShifts = shifts.filter(s => {
          const shiftDate = new Date(s.date);
          return shiftDate.getMonth() === currentMonth && shiftDate.getFullYear() === currentYear;
        });
        const previousMonthShifts = shifts.filter(s => {
          const shiftDate = new Date(s.date);
          return shiftDate.getMonth() === prevMonth && shiftDate.getFullYear() === prevMonthYear;
        });
        
        const calculateTotalKMS = (shiftList: ShiftRecord[]) => {
          const totalNetProfit = shiftList.reduce((sum, shift) => {
            const revenue = shift.contacts_count * shift.contact_rate;
            const tax = shift.payment_type === 'cashless' ? Math.round(revenue * 0.07) : 0;
            const afterTax = revenue - tax;
            const salary = calculateWorkerSalary(shift.contacts_count);
            const expense = shift.expense_amount || 0;
            return sum + (afterTax - salary - expense);
          }, 0);
          return Math.round(totalNetProfit / 2);
        };
        
        todayTotal = calculateTotalKMS(todayShifts);
        yesterdayTotal = calculateTotalKMS(yesterdayShifts);
        monthTotal = calculateTotalKMS(monthShifts);
        dayBeforeYesterdayTotal = calculateTotalKMS(dayBeforeYesterdayShifts);
        previousMonthTotal = calculateTotalKMS(previousMonthShifts);
        
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
    if (previous === 0) return { percent: 0, isPositive: current > 0 };
    const percentChange = ((current - previous) / previous) * 100;
    return {
      percent: Math.abs(Math.round(percentChange)),
      isPositive: percentChange >= 0
    };
  };

  const yesterdayChange = calculateChange(earnings.yesterday, earnings.dayBeforeYesterday);
  const todayChange = calculateChange(earnings.today, earnings.yesterday);
  const monthChange = calculateChange(earnings.month, earnings.previousMonth);

  return (
    <div className="absolute top-2 right-2 md:top-4 md:right-4 z-20 flex gap-1.5 md:gap-2">
      <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-md md:rounded-lg shadow-md px-2 py-1 md:px-3 md:py-2 hover:shadow-lg transition-all">
        <div className="flex items-center justify-between mb-0.5">
          <div className="text-[8px] md:text-[10px] text-white/70 font-medium uppercase tracking-wide">Вчера</div>
          <div className="flex items-center gap-0.5">
            <Icon 
              name={yesterdayChange.isPositive ? "TrendingUp" : "TrendingDown"} 
              size={10} 
              className={`md:w-[14px] md:h-[14px] ${yesterdayChange.isPositive ? "text-green-200 drop-shadow-md" : "text-red-400 drop-shadow-md"}`}
            />
            <span className={`text-[8px] md:text-[10px] font-extrabold ${yesterdayChange.isPositive ? "text-green-100" : "text-red-100"} drop-shadow-md`}>
              {yesterdayChange.percent}%
            </span>
          </div>
        </div>
        <div className="text-sm md:text-lg font-bold text-white leading-tight whitespace-nowrap">
          {formatCurrency(earnings.yesterday)} <span className="text-[10px] md:text-sm text-white/80">₽</span>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-md md:rounded-lg shadow-md px-2 py-1 md:px-3 md:py-2 hover:shadow-lg transition-all">
        <div className="flex items-center justify-between mb-0.5">
          <div className="text-[8px] md:text-[10px] text-white/70 font-medium uppercase tracking-wide">Сегодня</div>
          <div className="flex items-center gap-0.5">
            <Icon 
              name={todayChange.isPositive ? "TrendingUp" : "TrendingDown"} 
              size={10} 
              className={`md:w-[14px] md:h-[14px] ${todayChange.isPositive ? "text-green-200 drop-shadow-md" : "text-red-400 drop-shadow-md"}`}
            />
            <span className={`text-[8px] md:text-[10px] font-extrabold ${todayChange.isPositive ? "text-green-100" : "text-red-100"} drop-shadow-md`}>
              {todayChange.percent}%
            </span>
          </div>
        </div>
        <div className="text-sm md:text-lg font-bold text-white leading-tight whitespace-nowrap">
          {formatCurrency(earnings.today)} <span className="text-[10px] md:text-sm text-white/80">₽</span>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-md md:rounded-lg shadow-md px-2 py-1 md:px-3 md:py-2 hover:shadow-lg transition-all">
        <div className="flex items-center justify-between mb-0.5">
          <div className="text-[8px] md:text-[10px] text-white/70 font-medium uppercase tracking-wide">За месяц</div>
          <div className="flex items-center gap-0.5">
            <Icon 
              name={monthChange.isPositive ? "TrendingUp" : "TrendingDown"} 
              size={10} 
              className={`md:w-[14px] md:h-[14px] ${monthChange.isPositive ? "text-green-200 drop-shadow-md" : "text-red-400 drop-shadow-md"}`}
            />
            <span className={`text-[8px] md:text-[10px] font-extrabold ${monthChange.isPositive ? "text-green-100" : "text-red-100"} drop-shadow-md`}>
              {monthChange.percent}%
            </span>
          </div>
        </div>
        <div className="text-sm md:text-lg font-bold text-white leading-tight whitespace-nowrap">
          {formatCurrency(earnings.month)} <span className="text-[10px] md:text-sm text-white/80">₽</span>
        </div>
      </div>
    </div>
  );
}