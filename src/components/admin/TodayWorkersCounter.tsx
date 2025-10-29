import { useEffect, useState } from 'react';

interface TodayWorkersCounterProps {
  sessionToken: string;
}

export default function TodayWorkersCounter({ sessionToken }: TodayWorkersCounterProps) {
  const [workersCount, setWorkersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayWorkers();
  }, [sessionToken]);

  const loadTodayWorkers = async () => {
    try {
      const schedulesUrl = 'https://functions.poehali.dev/a55bc69c-bde9-4ffc-a63a-c6bb56a2838d';
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(schedulesUrl, {
        headers: {
          'X-Session-Token': sessionToken
        }
      });

      if (response.ok) {
        const data = await response.json();
        const schedules = data.schedules || [];
        
        const uniqueWorkers = new Set<number>();
        
        console.log('Today:', today);
        console.log('Schedules:', schedules);
        
        schedules.forEach((schedule: any) => {
          if (schedule.schedule && schedule.schedule[today]) {
            const todaySlots = schedule.schedule[today];
            console.log(`User ${schedule.user_name} (${schedule.user_id}) slots:`, todaySlots);
            
            const hasSlots = Object.keys(todaySlots).length > 0 && 
                           Object.values(todaySlots).some((val: any) => val === true || val === 1 || val === '1');
            
            if (hasSlots) {
              console.log(`Adding user ${schedule.user_name}`);
              uniqueWorkers.add(schedule.user_id);
            }
          }
        });
        
        console.log('Total workers today:', uniqueWorkers.size);
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
    <div className="bg-gradient-to-br from-purple-400 to-violet-500 rounded-lg shadow-xl px-4 py-3 min-w-[110px] hover:shadow-2xl transition-shadow">
      <div className="text-xs text-white/90 font-medium uppercase tracking-wider mb-1">Работают</div>
      <div className="text-2xl font-bold text-white leading-tight">
        {formatNumber(workersCount)}
      </div>
      <div className="text-xs text-white/80 font-medium">сегодня</div>
    </div>
  );
}