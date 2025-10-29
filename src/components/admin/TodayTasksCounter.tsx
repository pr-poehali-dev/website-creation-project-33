import { useEffect, useState } from 'react';

interface HourlyNote {
  hour: string;
  note: string;
}

interface PlannedOrganization {
  id: number;
  organization: string;
  date: string;
  notes?: string;
  hourlyNotes?: HourlyNote[];
}

const STORAGE_KEY = 'planned_organizations';

const getMoscowDate = () => {
  const moscowTime = new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' });
  const [month, day, year] = moscowTime.split('/');
  return `${year}-${month}-${day}`;
};

export default function TodayTasksCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
          setCount(0);
          return;
        }

        const plans: PlannedOrganization[] = JSON.parse(saved);
        const todayDate = getMoscowDate();
        const todayPlans = plans.filter(p => p.date === todayDate);
        
        let totalTasks = 0;
        todayPlans.forEach(plan => {
          if (plan.hourlyNotes) {
            const tasksCount = plan.hourlyNotes.filter(n => n.note.trim()).length;
            totalTasks += tasksCount;
          }
        });

        setCount(totalTasks);
      } catch (error) {
        console.error('Failed to count tasks:', error);
        setCount(0);
      }
    };

    updateCount();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        updateCount();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(updateCount, 3000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  if (count === 0) return null;

  return (
    <div className="bg-white/20 backdrop-blur-sm rounded px-2 py-1 text-white text-xs md:text-sm font-semibold">
      {count} {count === 1 ? 'задача' : count < 5 ? 'задачи' : 'задач'}
    </div>
  );
}
