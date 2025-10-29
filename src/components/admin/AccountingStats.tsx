import { useEffect, useState } from 'react';

interface AccountingStatsProps {
  sessionToken: string;
}

interface EarningsData {
  today: number;
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
  const [earnings, setEarnings] = useState<EarningsData>({ today: 0, month: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, [sessionToken]);

  const calculateKMS = (shift: ShiftRecord): number => {
    const contacts = shift.contacts_count || 0;
    const rate = shift.contact_rate || 0;
    const revenue = contacts * rate;
    
    const tax = shift.payment_type === 'cashless' ? Math.round(revenue * 0.07) : 0;
    const afterTax = revenue - tax;
    
    const workerSalary = contacts >= 10 ? contacts * 300 : contacts * 200;
    const expense = shift.expense_amount || 0;
    const netProfit = afterTax - workerSalary - expense;
    
    const kms = Math.round(netProfit / 2);
    return kms;
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
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        let todayTotal = 0;
        let monthTotal = 0;
        
        shifts.forEach(shift => {
          const kms = calculateKMS(shift);
          const shiftDate = new Date(shift.date);
          
          if (shift.date === todayStr) {
            todayTotal += kms;
          }
          
          if (shiftDate.getMonth() === currentMonth && shiftDate.getFullYear() === currentYear) {
            monthTotal += kms;
          }
        });
        
        setEarnings({
          today: todayTotal,
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
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
      <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-lg shadow-xl px-4 py-3 min-w-[110px] hover:shadow-2xl transition-shadow">
        <div className="text-xs text-white/90 font-medium uppercase tracking-wider mb-1">Сегодня</div>
        <div className="text-2xl font-bold text-white leading-tight">{formatCurrency(earnings.today)}</div>
        <div className="text-xs text-white/80 font-medium">рублей</div>
      </div>
      
      <div className="bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg shadow-xl px-4 py-3 min-w-[110px] hover:shadow-2xl transition-shadow">
        <div className="text-xs text-white/90 font-medium uppercase tracking-wider mb-1">За месяц</div>
        <div className="text-2xl font-bold text-white leading-tight">{formatCurrency(earnings.month)}</div>
        <div className="text-xs text-white/80 font-medium">рублей</div>
      </div>
    </div>
  );
}