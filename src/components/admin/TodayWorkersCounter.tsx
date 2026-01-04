import { useEffect, useState } from 'react';

interface TodayWorkersCounterProps {
  sessionToken: string;
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export default function TodayWorkersCounter({ sessionToken }: TodayWorkersCounterProps) {
  const [workersCount, setWorkersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayWorkers();
  }, [sessionToken]);

  const loadTodayWorkers = async () => {
    try {
      const moscowTime = new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' });
      const [month, day, year] = moscowTime.split('/');
      const today = `${year}-${month}-${day}`;
      const moscowDate = new Date(today);
      const weekStart = getWeekStart(moscowDate);
      
      const response = await fetch('https://functions.poehali.dev/13a21013-236c-4e06-a825-ee3679b130c2', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify({
          week_start_date: weekStart
        })
      });

      if (response.ok) {
        const data = await response.json();
        const schedules = data.schedules || [];
        
        const uniqueWorkers = new Set<number>();
        
        schedules.forEach((schedule: any) => {
          if (schedule.schedule && schedule.schedule[today]) {
            const todaySlots = schedule.schedule[today];
            const hasSlots = Object.keys(todaySlots).length > 0 && 
                           Object.values(todaySlots).some((val: any) => val === true || val === 1 || val === '1' || val);
            
            if (hasSlots) {
              uniqueWorkers.add(schedule.user_id);
            }
          }
        });
        
        setWorkersCount(uniqueWorkers.size);
      }
    } catch (error) {
      console.error('Failed to load workers:', error);
    }
    
    setLoading(false);
  };

  if (loading) {
    return null;
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="inline-block bg-indigo-500/20 border border-indigo-400/30 rounded-xl px-2 py-1 md:px-3 md:py-2 transition-all">
      <div className="text-[8px] md:text-[10px] text-indigo-100 font-medium uppercase tracking-wide">Работают</div>
      <div className="text-sm md:text-lg font-bold text-white leading-tight">
        {formatNumber(workersCount)}
      </div>
      <div className="text-[8px] md:text-[10px] text-indigo-100">сегодня</div>
    </div>
  );
}