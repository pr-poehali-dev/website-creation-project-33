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

interface TaskInfo {
  count: number;
  times: string[];
}

export default function TodayTasksCounter() {
  const [taskInfo, setTaskInfo] = useState<TaskInfo>({ count: 0, times: [] });

  useEffect(() => {
    const updateCount = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
          setTaskInfo({ count: 0, times: [] });
          return;
        }

        const plans: PlannedOrganization[] = JSON.parse(saved);
        const todayDate = getMoscowDate();
        const todayPlans = plans.filter(p => p.date === todayDate);
        
        const times: string[] = [];
        todayPlans.forEach(plan => {
          if (plan.hourlyNotes) {
            plan.hourlyNotes.forEach(note => {
              if (note.note.trim()) {
                times.push(note.hour);
              }
            });
          }
        });

        setTaskInfo({ count: times.length, times: times.sort() });
      } catch (error) {
        console.error('Failed to count tasks:', error);
        setTaskInfo({ count: 0, times: [] });
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

  if (taskInfo.count === 0) return null;

  const { count, times } = taskInfo;

  return (
    <div className="bg-white/20 backdrop-blur-sm rounded px-2 py-1 text-white text-xs md:text-sm font-semibold">
      <div>{count} {count === 1 ? 'задача' : count < 5 ? 'задачи' : 'задач'}</div>
      <div className="text-[10px] md:text-xs opacity-90 mt-0.5">
        {times.join(', ')}
      </div>
    </div>
  );
}