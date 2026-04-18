import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { getAllWeeksUntilEndOfYear, getCurrentWeekIndex } from './schedule/scheduleUtils';
import ScheduleWeekNavigation from './schedule/ScheduleWeekNavigation';
import ScheduleDayCard from './schedule/ScheduleDayCard';

interface TimeSlot {
  label: string;
  time: string;
  selected: boolean;
}

interface DaySchedule {
  date: string;
  dayName: string;
  dayNameFull: string;
  isWeekend: boolean;
  slots: TimeSlot[];
}

interface WorkShift {
  date: string;
  start_time: string;
  end_time: string;
  organization_name: string;
  organization_id: number;
}

export default function ScheduleTab() {
  const { user } = useAuth();
  const weeks = getAllWeeksUntilEndOfYear();
  const [currentWeekIndex, setCurrentWeekIndex] = useState(getCurrentWeekIndex());
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const isUkrainian = user?.name === 'Виктор Кобыляцкий';
  const [workComments, setWorkComments] = useState<Record<string, {
    location?: string;
    flyers?: string;
    organization?: string;
    location_type?: string;
    location_details?: string;
  }>>({});
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);

  // Сброс на текущую неделю при монтировании компонента
  useEffect(() => {
    setCurrentWeekIndex(getCurrentWeekIndex());
  }, []);

  useEffect(() => {
    initializeSchedule();
    loadSchedule();
    loadWorkComments();
  }, [currentWeekIndex]);

  const initializeSchedule = () => {
    const days: DaySchedule[] = [];
    const startDate = new Date(weeks[currentWeekIndex].start);
    const dayNames = isUkrainian ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'] : ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const dayNamesFull = isUkrainian ? ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота', 'Неділя'] : ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const isWeekend = i >= 5; // Saturday and Sunday
      
      days.push({
        date: dateStr,
        dayName: dayNames[i],
        dayNameFull: dayNamesFull[i],
        isWeekend,
        slots: isWeekend ? [
          { label: '11:00-15:00', time: 'slot1', selected: false },
          { label: '15:00-19:00', time: 'slot2', selected: false }
        ] : [
          { label: '12:00-16:00', time: 'slot1', selected: false },
          { label: '16:00-20:00', time: 'slot2', selected: false }
        ]
      });
    }
    
    setSchedule(days);
  };

  const loadSchedule = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://functions.poehali.dev/13a21013-236c-4e06-a825-ee3679b130c2?user_id=${user.id}&week_start=${weeks[currentWeekIndex].start}&get_shifts=true`,
        {
          headers: {
            'X-Session-Token': localStorage.getItem('session_token') || '',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.schedule) {
          updateScheduleFromData(data.schedule);
        }
        if (data.work_shifts) {
          setWorkShifts(data.work_shifts);
        }
        setIsLocked(data.is_locked || false);
        setSubmittedAt(data.submitted_at || null);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkComments = async () => {
    if (!user?.name) return;
    
    try {
      const startDate = new Date(weeks[currentWeekIndex].start);
      const comments: Record<string, {
        location?: string;
        flyers?: string;
        organization?: string;
        location_type?: string;
        location_details?: string;
      }> = {};
      
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        const response = await fetch(
          `https://functions.poehali.dev/1b7f0423-384e-417f-8aea-767e5a1c32b2?work_date=${dateStr}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.comments && data.comments[user.name]) {
            comments[dateStr] = data.comments[user.name];
          }
        }
      }
      
      setWorkComments(comments);
    } catch (error) {
      console.error('Error loading work comments:', error);
    }
  };

  const updateScheduleFromData = (scheduleData: Record<string, Record<string, boolean>>) => {
    setSchedule(prev => prev.map(day => {
      const dayData = scheduleData[day.date];
      if (dayData) {
        return {
          ...day,
          slots: day.slots.map(slot => ({
            ...slot,
            selected: dayData[slot.time] || false
          }))
        };
      }
      return day;
    }));
  };

  const toggleSlot = (dayIndex: number, slotIndex: number) => {
    if (isLocked) return;
    setSchedule(prev => prev.map((day, dIdx) => {
      if (dIdx === dayIndex) {
        return {
          ...day,
          slots: day.slots.map((slot, sIdx) => 
            sIdx === slotIndex ? { ...slot, selected: !slot.selected } : slot
          )
        };
      }
      return day;
    }));
    setSaved(false);
  };

  const saveSchedule = async () => {
    if (!user?.id || isLocked) return;
    
    setSaving(true);
    try {
      const scheduleData: Record<string, Record<string, boolean>> = {};
      schedule.forEach(day => {
        scheduleData[day.date] = {
          slot1: day.slots[0].selected,
          slot2: day.slots[1].selected
        };
      });

      const response = await fetch('https://functions.poehali.dev/13a21013-236c-4e06-a825-ee3679b130c2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': localStorage.getItem('session_token') || '',
        },
        body: JSON.stringify({
          user_id: user.id,
          week_start_date: weeks[currentWeekIndex].start,
          schedule: scheduleData
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIsLocked(true);
        setSubmittedAt(data.submitted_at || null);
        setSaved(true);
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
    } finally {
      setSaving(false);
    }
  };

  const getSelectedCount = () => {
    return schedule.reduce((total, day) => 
      total + day.slots.filter(slot => slot.selected).length, 0
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" size={32} className="animate-spin text-[#001f54]" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <ScheduleWeekNavigation
            currentWeekIndex={currentWeekIndex}
            weeks={weeks}
            onPrevious={() => setCurrentWeekIndex(prev => Math.max(0, prev - 1))}
            onNext={() => setCurrentWeekIndex(prev => Math.min(weeks.length - 1, prev + 1))}
            loading={loading}
            isUkrainian={isUkrainian}
          />
        </div>
        <div className="bg-[#001f54] text-white px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 text-center leading-tight">
          <span className="text-base font-bold block">{getSelectedCount()}</span>
          <span className="opacity-70">{isUkrainian ? 'змін' : 'смен'}</span>
        </div>
      </div>

      <div className="space-y-2">
        {schedule.map((day, dayIndex) => (
          <ScheduleDayCard
            key={day.date}
            day={day}
            dayIndex={dayIndex}
            workShifts={workShifts}
            workComment={workComments[day.date]}
            onToggleSlot={toggleSlot}
            isUkrainian={isUkrainian}
          />
        ))}
      </div>

      <div className="pt-1 space-y-2">
        {isLocked && submittedAt ? (
          <div className="w-full h-12 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center gap-2">
            <Icon name="LockKeyhole" size={15} className="text-green-600" />
            <span className="text-sm font-medium text-green-700">
              График сохранён{' '}
              {new Date(submittedAt).toLocaleString('ru-RU', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </span>
          </div>
        ) : (
          <Button
            onClick={saveSchedule}
            disabled={saving || getSelectedCount() === 0}
            className="w-full h-12 bg-[#001f54] hover:bg-[#002b6b] text-white rounded-xl font-semibold text-base transition-all duration-200 touch-manipulation"
          >
            {saving ? (
              <><Icon name="Loader2" size={16} className="mr-2 animate-spin" />{isUkrainian ? 'Збереження...' : 'Сохранение...'}</>
            ) : saved ? (
              <><Icon name="Check" size={16} className="mr-2" />{isUkrainian ? 'Збережено!' : 'Сохранено!'}</>
            ) : (
              <><Icon name="Save" size={16} className="mr-2" />{isUkrainian ? 'Зберегти графік' : 'Сохранить график'}</>
            )}
          </Button>
        )}
        {!isLocked && !saved && getSelectedCount() === 0 && (
          <p className="text-center text-xs text-gray-400">Выберите хотя бы одну смену</p>
        )}
      </div>


    </div>
  );
}