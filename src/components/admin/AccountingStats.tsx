import { useEffect, useState } from 'react';

interface AccountingStatsProps {
  sessionToken: string;
}

interface EarningsData {
  today: number;
  yesterday: number;
  month: number;
}

interface ShiftRecord {
  date: string;
  contacts_count: number;
  contact_rate: number;
  payment_type: 'cash' | 'cashless';
  expense_amount: number;
}

export default function AccountingStats({ sessionToken }: AccountingStatsProps) {
  const [earnings, setEarnings] = useState<EarningsData>({ today: 0, yesterday: 0, month: 0 });
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
        
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        let todayTotal = 0;
        let yesterdayTotal = 0;
        let monthTotal = 0;
        
        const todayShifts = shifts.filter(s => s.date === todayStr);
        const yesterdayShifts = shifts.filter(s => s.date === yesterdayStr);
        const monthShifts = shifts.filter(s => {
          const shiftDate = new Date(s.date);
          return shiftDate.getMonth() === currentMonth && shiftDate.getFullYear() === currentYear;
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
        
        setEarnings({
          today: todayTotal,
          yesterday: yesterdayTotal,
          month: monthTotal
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
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-3">
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg px-5 py-3.5 min-w-[130px] hover:shadow-xl transition-all hover:scale-105">
        <div className="text-xs text-white/80 font-medium uppercase tracking-wide mb-1">Вчера</div>
        <div className="text-2xl font-bold text-white">{formatCurrency(earnings.yesterday)}</div>
        <div className="text-xs text-white/70 mt-0.5">₽</div>
      </div>
      
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg px-5 py-3.5 min-w-[130px] hover:shadow-xl transition-all hover:scale-105">
        <div className="text-xs text-white/80 font-medium uppercase tracking-wide mb-1">Сегодня</div>
        <div className="text-2xl font-bold text-white">{formatCurrency(earnings.today)}</div>
        <div className="text-xs text-white/70 mt-0.5">₽</div>
      </div>
      
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg px-5 py-3.5 min-w-[130px] hover:shadow-xl transition-all hover:scale-105">
        <div className="text-xs text-white/80 font-medium uppercase tracking-wide mb-1">За месяц</div>
        <div className="text-2xl font-bold text-white">{formatCurrency(earnings.month)}</div>
        <div className="text-xs text-white/70 mt-0.5">₽</div>
      </div>
    </div>
  );
}